import express from 'express';
import {
  getLessonDiscussions,
  createComment,
  pinComment,
  deleteComment
} from '../controllers/discussion.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All discussion routes require authentication

router.get('/lesson/:lessonId', getLessonDiscussions);
router.post('/lesson/:lessonId', createComment);
router.put('/:id/pin', authorize('teacher', 'admin'), pinComment);
router.delete('/:id', deleteComment);

export default router;
