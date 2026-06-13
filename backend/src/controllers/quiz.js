import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Course from '../models/Course.js';
import { checkAndGenerateCertificate } from './progress.js';
import { sendNotification } from '../services/notificationService.js';

// @desc    Get quiz for a course
// @route   GET /api/quizzes/course/:courseId
// @access  Private
export const getCourseQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ courseId: req.params.courseId });
    if (!quiz) {
      return res.status(200).json({ success: true, data: null });
    }

    // Strip correct answers if user is a student
    const quizResponse = quiz.toObject();
    if (req.user.role === 'student') {
      quizResponse.questions = quizResponse.questions.map(q => {
        const { correctOptionIndex, ...rest } = q;
        return rest;
      });
    }

    res.status(200).json({ success: true, data: quizResponse });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or Update quiz for a course
// @route   POST /api/quizzes/course/:courseId
// @access  Private (Teacher only)
export const createOrUpdateQuiz = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check ownership
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to manage quizzes for this course' });
    }

    const { timeLimit, totalMarks, questions } = req.body;

    if (!questions || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'A quiz must contain at least one question' });
    }

    let quiz = await Quiz.findOne({ courseId: course._id });

    if (quiz) {
      quiz.timeLimit = timeLimit;
      quiz.totalMarks = totalMarks;
      quiz.questions = questions;
      await quiz.save();
    } else {
      quiz = await Quiz.create({
        courseId: course._id,
        timeLimit,
        totalMarks,
        questions
      });
    }

    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz attempt
// @route   POST /api/quizzes/:id/submit
// @access  Private (Student only)
export const submitQuizAttempt = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const { answers } = req.body; // Array of selected option indices

    if (!answers || answers.length !== quiz.questions.length) {
      return res.status(400).json({ success: false, message: 'Please answer all questions' });
    }

    // Grade quiz
    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / quiz.questions.length) * quiz.totalMarks);
    // Let's configure passing grade as 50% or more
    const passed = (correctCount / quiz.questions.length) >= 0.5;

    const attempt = await QuizAttempt.create({
      quizId: quiz._id,
      studentId: req.user.id,
      score,
      passed,
      answers
    });

    // Notify user of result
    const course = await Course.findById(quiz.courseId);
    await sendNotification(
      req.user.id,
      passed ? 'Quiz Passed! 🎓' : 'Quiz Attempt Finished',
      `You scored ${score}/${quiz.totalMarks} in the quiz for "${course.title}". Status: ${passed ? 'PASSED' : 'FAILED'}.`,
      'quiz'
    );

    // Check certificate eligibility (quiz pass condition might trigger certification!)
    const certificate = await checkAndGenerateCertificate(req.user.id, quiz.courseId);

    res.status(200).json({
      success: true,
      data: {
        attempt,
        score,
        totalMarks: quiz.totalMarks,
        correctCount,
        totalQuestions: quiz.questions.length,
        passed,
        correctAnswers: quiz.questions.map(q => q.correctOptionIndex) // Share correct answers to student after grading
      },
      certificateEarned: !!certificate,
      certificate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student attempts for a quiz
// @route   GET /api/quizzes/:id/attempts
// @access  Private
export const getQuizAttempts = async (req, res, next) => {
  try {
    const attempts = await QuizAttempt.find({
      quizId: req.params.id,
      studentId: req.user.id
    }).sort('-attemptedAt');

    res.status(200).json({ success: true, data: attempts });
  } catch (error) {
    next(error);
  }
};
