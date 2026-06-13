import express from 'express';
import {
  getCourseAssignments,
  createAssignment,
  submitAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  getMySubmissions
} from '../controllers/assignment.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(protect); // All routes require login

// Student submissions list
router.get('/my-submissions', authorize('student'), getMySubmissions);

// Assignments by course
router.get('/course/:courseId', getCourseAssignments);
router.post('/course/:courseId', authorize('teacher', 'admin'), upload.single('referenceMaterial'), createAssignment);

// Submitting a single assignment
router.post('/:id/submit', authorize('student'), upload.single('submission'), submitAssignment);

// Reviewing submissions of an assignment
router.get('/:id/submissions', authorize('teacher', 'admin'), getAssignmentSubmissions);

// Grading submissions
router.post('/submissions/:submissionId/grade', authorize('teacher', 'admin'), gradeSubmission);

export default router;
