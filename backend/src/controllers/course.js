import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Progress from '../models/Progress.js';
import { sendNotification } from '../services/notificationService.js';
import User from '../models/User.js';

// @desc    Get all courses (with pagination, search, category filter)
// @route   GET /api/courses
// @access  Public
export const getCourses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6;
    const skipIndex = (page - 1) * limit;

    const query = { published: true };

    // Search query by title
    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: 'i' };
    }

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .populate('instructorId', 'name avatar')
      .skip(skipIndex)
      .limit(limit)
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: courses.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get courses created by teacher or all courses for admin
// @route   GET /api/courses/all-courses
// @access  Private (Teacher/Admin only)
export const getAllCreatedCourses = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'teacher') {
      query.instructorId = req.user.id;
    }

    const courses = await Course.find(query).populate('instructorId', 'name email');
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course details (with lessons populated)
// @route   GET /api/courses/:id
// @access  Public / Private
export const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructorId', 'name avatar email');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Find lessons associated with course
    const lessons = await Lesson.find({ courseId: course._id }).sort('order');

    res.status(200).json({
      success: true,
      data: {
        ...course.toJSON(),
        lessons
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private (Teacher only)
export const createCourse = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;

    const course = await Course.create({
      title,
      description,
      category,
      instructorId: req.user.id
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Teacher only)
export const updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check ownership
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this course' });
    }

    const fieldsToUpdate = {
      title: req.body.title || course.title,
      description: req.body.description || course.description,
      category: req.body.category || course.category,
      published: req.body.published !== undefined ? req.body.published : course.published
    };

    if (req.file) {
      fieldsToUpdate.thumbnail = `/uploads/${req.file.filename}`;
    }

    course = await Course.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    // Notify users if course gets published
    if (req.body.published === true && !course.published) {
      const students = await User.find({ role: 'student' });
      for (const student of students) {
        await sendNotification(
          student._id,
          'New Course Available!',
          `Teacher ${req.user.name} published a new course: "${course.title}". Check it out!`,
          'course'
        );
      }
    }

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Teacher/Admin only)
export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check ownership
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this course' });
    }

    // Delete associated lessons
    await Lesson.deleteMany({ courseId: course._id });

    // Delete course
    await course.deleteOne();

    res.status(200).json({ success: true, message: 'Course and lessons deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Enroll in a course
// @route   POST /api/courses/:id/enroll
// @access  Private (Student only)
export const enrollCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if progress already exists
    let progress = await Progress.findOne({
      studentId: req.user.id,
      courseId: course._id
    });

    if (progress) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
    }

    // Create empty progress card
    progress = await Progress.create({
      studentId: req.user.id,
      courseId: course._id,
      lessonsCompleted: [],
      completionPercentage: 0
    });

    // Notify instructor
    await sendNotification(
      course.instructorId,
      'New Student Enrolled',
      `Student ${req.user.name} has enrolled in your course: "${course.title}".`,
      'course'
    );

    res.status(201).json({ success: true, message: 'Enrolled successfully', data: progress });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Lessons Logic
// ==========================================

// @desc    Add a lesson to a course
// @route   POST /api/courses/:id/lessons
// @access  Private (Teacher only)
export const addLesson = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check ownership
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to add lessons to this course' });
    }

    const { title, description, youtubeId, duration, order } = req.body;
    let notesPdf = '';

    if (req.file) {
      notesPdf = `/uploads/${req.file.filename}`;
    }

    const lesson = await Lesson.create({
      courseId: course._id,
      title,
      description,
      youtubeId,
      duration,
      order: order || 0,
      notesPdf
    });

    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit a lesson in a course
// @route   PUT /api/courses/:id/lessons/:lessonId
// @access  Private (Teacher only)
export const editLesson = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check ownership
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this course' });
    }

    let lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const fieldsToUpdate = {
      title: req.body.title || lesson.title,
      description: req.body.description || lesson.description,
      youtubeId: req.body.youtubeId || lesson.youtubeId,
      duration: req.body.duration || lesson.duration,
      order: req.body.order !== undefined ? req.body.order : lesson.order
    };

    if (req.file) {
      fieldsToUpdate.notesPdf = `/uploads/${req.file.filename}`;
    }

    lesson = await Lesson.findByIdAndUpdate(req.params.lessonId, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a lesson from a course
// @route   DELETE /api/courses/:id/lessons/:lessonId
// @access  Private (Teacher only)
export const deleteLesson = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check ownership
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this course' });
    }

    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    await lesson.deleteOne();

    // Pull completed lesson links from students' progress if any
    await Progress.updateMany(
      { courseId: course._id },
      { $pull: { lessonsCompleted: lesson._id } }
    );

    res.status(200).json({ success: true, message: 'Lesson deleted successfully' });
  } catch (error) {
    next(error);
  }
};
