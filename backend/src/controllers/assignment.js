import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Course from '../models/Course.js';
import { checkAndGenerateCertificate } from './progress.js';
import { sendNotification } from '../services/notificationService.js';
import Progress from '../models/Progress.js';

// @desc    Get assignments for a course
// @route   GET /api/assignments/course/:courseId
// @access  Private
export const getCourseAssignments = async (req, res, next) => {
  try {
    const assignments = await Assignment.find({ courseId: req.params.courseId });
    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
};

// @desc    Create an assignment
// @route   POST /api/assignments/course/:courseId
// @access  Private (Teacher only)
export const createAssignment = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check ownership
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to create assignments' });
    }

    const { title, description, dueDate, totalMarks } = req.body;
    let referenceMaterial = '';

    if (req.file) {
      referenceMaterial = `/uploads/${req.file.filename}`;
    }

    const assignment = await Assignment.create({
      courseId: course._id,
      title,
      description,
      dueDate,
      totalMarks,
      referenceMaterial
    });

    // Notify enrolled students
    const enrolledStudents = await Progress.find({ courseId: course._id }).select('studentId');
    for (const enrollment of enrolledStudents) {
      await sendNotification(
        enrollment.studentId,
        'New Assignment Published',
        `A new assignment "${title}" has been published in "${course.title}". Due on ${new Date(dueDate).toLocaleDateString()}.`,
        'assignment'
      );
    }

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit an assignment
// @route   POST /api/assignments/:id/submit
// @access  Private (Student only)
export const submitAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file submission' });
    }

    // Check if already submitted
    let submission = await Submission.findOne({
      assignmentId: assignment._id,
      studentId: req.user.id
    });

    if (submission) {
      // Overwrite submission with new file
      submission.fileUrl = `/uploads/${req.file.filename}`;
      submission.submittedAt = new Date();
      submission.status = 'pending'; // Reset status if resubmitted
      await submission.save();
    } else {
      submission = await Submission.create({
        assignmentId: assignment._id,
        studentId: req.user.id,
        fileUrl: `/uploads/${req.file.filename}`,
        status: 'pending'
      });
    }

    // Notify instructor
    const course = await Course.findById(assignment.courseId);
    await sendNotification(
      course.instructorId,
      'Assignment Submission',
      `Student ${req.user.name} submitted assignment "${assignment.title}" for "${course.title}".`,
      'assignment'
    );

    // Check certificate eligibility (all assignments submitted condition might be met now!)
    const certificate = await checkAndGenerateCertificate(req.user.id, assignment.courseId);

    res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: submission,
      certificateEarned: !!certificate,
      certificate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get submissions for a single assignment
// @route   GET /api/assignments/:id/submissions
// @access  Private (Teacher only)
export const getAssignmentSubmissions = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Check ownership
    const course = await Course.findById(assignment.courseId);
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view submissions' });
    }

    const submissions = await Submission.find({ assignmentId: assignment._id })
      .populate('studentId', 'name email avatar')
      .sort('-submittedAt');

    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    next(error);
  }
};

// @desc    Grade submission
// @route   POST /api/assignments/submissions/:submissionId/grade
// @access  Private (Teacher only)
export const gradeSubmission = async (req, res, next) => {
  try {
    const { marks, feedback } = req.body;

    const submission = await Submission.findById(req.params.submissionId).populate('assignmentId');
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const course = await Course.findById(submission.assignmentId.courseId);
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to grade submissions' });
    }

    submission.marks = marks;
    submission.feedback = feedback || '';
    submission.status = 'graded';
    await submission.save();

    // Notify Student
    await sendNotification(
      submission.studentId,
      'Assignment Graded',
      `Your submission for "${submission.assignmentId.title}" has been graded: ${marks}/${submission.assignmentId.totalMarks} marks.`,
      'assignment'
    );

    // Check certificate eligibility (passing scores / graded condition might change eligibility)
    const certificate = await checkAndGenerateCertificate(submission.studentId, course._id);

    res.status(200).json({
      success: true,
      message: 'Graded successfully',
      data: submission,
      certificateEarned: !!certificate,
      certificate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student's own submissions
// @route   GET /api/assignments/my-submissions
// @access  Private (Student only)
export const getMySubmissions = async (req, res, next) => {
  try {
    const submissions = await Submission.find({ studentId: req.user.id })
      .populate({
        path: 'assignmentId',
        select: 'title totalMarks courseId dueDate'
      })
      .sort('-submittedAt');

    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    next(error);
  }
};
