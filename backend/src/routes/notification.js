import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead
} from '../controllers/notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes require login

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead); // Must be defined before :id/read
router.put('/:id/read', markAsRead);

export default router;
