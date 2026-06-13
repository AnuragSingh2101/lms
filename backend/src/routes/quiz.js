import express from 'express';
import {
  getCourseQuiz,
  createOrUpdateQuiz,
  submitQuizAttempt,
  getQuizAttempts
} from '../controllers/quiz.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All quiz routes require login

router.get('/course/:courseId', getCourseQuiz);
router.post('/course/:courseId', authorize('teacher', 'admin'), createOrUpdateQuiz);

router.post('/:id/submit', authorize('student'), submitQuizAttempt);
router.get('/:id/attempts', getQuizAttempts);

export default router;
