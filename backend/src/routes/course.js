import express from 'express';
import {
  getCourses,
  getAllCreatedCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  addLesson,
  editLesson,
  deleteLesson
} from '../controllers/course.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public / Semi-Public Routes
router.get('/', getCourses);
router.get('/:id', getCourse);

// Private Routes
router.get('/all/created', protect, authorize('teacher', 'admin'), getAllCreatedCourses);
router.post('/', protect, authorize('teacher', 'admin'), createCourse);
router.put('/:id', protect, authorize('teacher', 'admin'), upload.single('thumbnail'), updateCourse);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteCourse);
router.post('/:id/enroll', protect, authorize('student'), enrollCourse);

// Lessons administration inside a course
router.post('/:id/lessons', protect, authorize('teacher', 'admin'), upload.single('notesPdf'), addLesson);
router.put('/:id/lessons/:lessonId', protect, authorize('teacher', 'admin'), upload.single('notesPdf'), editLesson);
router.delete('/:id/lessons/:lessonId', protect, authorize('teacher', 'admin'), deleteLesson);

export default router;
