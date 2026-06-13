import express from 'express';
import {
  getUsers,
  toggleUserStatus
} from '../controllers/admin.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin')); // Secure entire admin routes sub-tree for admin role

router.get('/users', getUsers);
router.put('/users/:id/status', toggleUserStatus);

export default router;
