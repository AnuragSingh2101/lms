import express from 'express';
import {
  getProgress,
  completeLesson,
  getStudentAnalytics,
  getTeacherAnalytics,
  getAdminAnalytics
} from '../controllers/progress.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All progress routes require login

router.get('/course/:courseId', getProgress);
router.post('/course/:courseId/complete-lesson/:lessonId', authorize('student'), completeLesson);

// Analytics endpoints
router.get('/student-analytics', authorize('student'), getStudentAnalytics);
router.get('/teacher-analytics', authorize('teacher'), getTeacherAnalytics);
router.get('/admin-analytics', authorize('admin'), getAdminAnalytics);

export default router;
