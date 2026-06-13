import Discussion from '../models/Discussion.js';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';

// @desc    Get comments for a lesson
// @route   GET /api/discussions/lesson/:lessonId
// @access  Private
export const getLessonDiscussions = async (req, res, next) => {
  try {
    const discussions = await Discussion.find({ lessonId: req.params.lessonId })
      .populate('userId', 'name avatar role')
      .sort({ isPinned: -1, createdAt: 1 }); // Pinned posts at the top, then chronological

    res.status(200).json({ success: true, data: discussions });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment / post a question
// @route   POST /api/discussions/lesson/:lessonId
// @access  Private
export const createComment = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const { text, parentCommentId } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const discussion = await Discussion.create({
      courseId: lesson.courseId,
      lessonId: lesson._id,
      userId: req.user.id,
      text,
      parentCommentId: parentCommentId || null
    });

    const populated = await discussion.populate('userId', 'name avatar role');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle pin a comment
// @route   PUT /api/discussions/:id/pin
// @access  Private (Teacher only)
export const pinComment = async (req, res, next) => {
  try {
    const comment = await Discussion.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check ownership of the course to verify if req.user is the instructor
    const course = await Course.findById(comment.courseId);
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to pin comments in this course' });
    }

    comment.isPinned = !comment.isPinned;
    await comment.save();

    res.status(200).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/discussions/:id
// @access  Private
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Discussion.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Author, Teacher of the course, or Admin can delete
    const course = await Course.findById(comment.courseId);
    const isAuthor = comment.userId.toString() === req.user.id;
    const isInstructor = course.instructorId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isInstructor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    // If deleting a parent comment, delete replies as well
    if (!comment.parentCommentId) {
      await Discussion.deleteMany({ parentCommentId: comment._id });
    }

    await comment.deleteOne();

    res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};
