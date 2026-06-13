import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// Middleware Imports
import errorHandler from './middleware/error.js';

// Route Imports
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/course.js';
import progressRoutes from './routes/progress.js';
import assignmentRoutes from './routes/assignment.js';
import quizRoutes from './routes/quiz.js';
import discussionRoutes from './routes/discussion.js';
import notificationRoutes from './routes/notification.js';
import adminRoutes from './routes/admin.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dev logging middleware
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use(morgan('dev'));
}

// Serve uploaded static files
// Expose the contents of backend/public/uploads at the '/uploads' route
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Test Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'up', message: 'LMS API is running' });
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
