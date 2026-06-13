import Progress from '../models/Progress.js';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Certificate from '../models/Certificate.js';
import User from '../models/User.js';
import { sendNotification } from '../services/notificationService.js';

// Helper: Check and generate certificate if eligible
export const checkAndGenerateCertificate = async (studentId, courseId) => {
  try {
    // 1. Check if certificate already exists
    const existingCert = await Certificate.findOne({ studentId, courseId });
    if (existingCert) return existingCert;

    // 2. Check lesson completion (must be 100%)
    const totalLessons = await Lesson.countDocuments({ courseId });
    if (totalLessons === 0) return null;

    const progress = await Progress.findOne({ studentId, courseId });
    if (!progress || progress.lessonsCompleted.length < totalLessons) {
      return null;
    }

    // 3. Check assignments (all course assignments must have submissions)
    const totalAssignments = await Assignment.countDocuments({ courseId });
    if (totalAssignments > 0) {
      const courseAssignments = await Assignment.find({ courseId }).select('_id');
      const assignmentIds = courseAssignments.map(a => a._id);
      
      const submittedCount = await Submission.countDocuments({
        studentId,
        assignmentId: { $in: assignmentIds }
      });

      if (submittedCount < totalAssignments) {
        return null;
      }
    }

    // 4. Check quiz (must have at least one passed quiz attempt if quiz exists)
    const quiz = await Quiz.findOne({ courseId });
    if (quiz) {
      const passedAttempt = await QuizAttempt.findOne({
        studentId,
        quizId: quiz._id,
        passed: true
      });

      if (!passedAttempt) {
        return null;
      }
    }

    // If all checks pass, generate certificate!
    const certificateId = 'CERT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const certificate = await Certificate.create({
      studentId,
      courseId,
      certificateId,
      issueDate: new Date()
    });

    const course = await Course.findById(courseId);

    // Notify Student
    await sendNotification(
      studentId,
      'Certificate Earned! 🎉',
      `Congratulations! You have completed all requirements for "${course.title}" and earned your completion certificate.`,
      'certificate'
    );

    return certificate;
  } catch (error) {
    console.error('Error checking/generating certificate:', error);
    return null;
  }
};

// @desc    Get progress details for a course
// @route   GET /api/progress/course/:courseId
// @access  Private (Student/Teacher/Admin)
export const getProgress = async (req, res, next) => {
  try {
    let progress = await Progress.findOne({
      studentId: req.user.id,
      courseId: req.params.courseId
    });

    if (!progress) {
      return res.status(200).json({
        success: true,
        data: {
          lessonsCompleted: [],
          completionPercentage: 0,
          totalWatchTime: 0
        }
      });
    }

    // Check if certificate is generated
    const certificate = await Certificate.findOne({
      studentId: req.user.id,
      courseId: req.params.courseId
    });

    res.status(200).json({
      success: true,
      data: progress,
      certificate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a lesson as completed
// @route   POST /api/progress/course/:courseId/complete-lesson/:lessonId
// @access  Private (Student only)
export const completeLesson = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;
    const { watchTime } = req.body; // Watch time increment in minutes

    let progress = await Progress.findOne({
      studentId: req.user.id,
      courseId
    });

    if (!progress) {
      progress = await Progress.create({
        studentId: req.user.id,
        courseId,
        lessonsCompleted: [],
        completionPercentage: 0
      });
    }

    // Add lesson if not already completed
    if (!progress.lessonsCompleted.includes(lessonId)) {
      progress.lessonsCompleted.push(lessonId);
    }

    if (watchTime) {
      progress.totalWatchTime += Number(watchTime);
    }

    // Calculate percentage
    const totalLessons = await Lesson.countDocuments({ courseId });
    progress.completionPercentage = totalLessons > 0 
      ? Math.round((progress.lessonsCompleted.length / totalLessons) * 100)
      : 100;

    await progress.save();

    // Check certificate eligibility
    const certificate = await checkAndGenerateCertificate(req.user.id, courseId);

    res.status(200).json({
      success: true,
      data: progress,
      certificateEarned: !!certificate,
      certificate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Student Dashboard Analytics
// @route   GET /api/progress/student-analytics
// @access  Private (Student only)
export const getStudentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // 1. Enrolled courses counts & items
    const progressList = await Progress.find({ studentId }).populate('courseId');
    const coursesEnrolled = progressList.length;

    // 2. Completed courses count (completion = 100)
    const coursesCompleted = progressList.filter(p => p.completionPercentage === 100).length;

    // 3. Total learning watch time
    const totalHoursLearned = Math.round(progressList.reduce((acc, p) => acc + (p.totalWatchTime || 0), 0) / 60 * 10) / 10;

    // 4. Assignment scores average
    const submissions = await Submission.find({ studentId, status: 'graded' });
    const averageScore = submissions.length > 0
      ? Math.round(submissions.reduce((acc, s) => acc + ((s.marks / 100) * 100), 0) / submissions.length) // placeholder logic, lets return absolute avg percentage:
      : 0;

    // Let's get real submission grades list for charts
    const assignmentGrades = await Submission.find({ studentId, status: 'graded' })
      .populate({
        path: 'assignmentId',
        select: 'title totalMarks'
      });

    const gradeAnalytics = assignmentGrades.map(g => ({
      name: g.assignmentId?.title || 'Assignment',
      score: g.marks,
      total: g.assignmentId?.totalMarks || 100
    }));

    // 5. Build recent activity log
    const recentSubmissions = await Submission.find({ studentId })
      .populate('assignmentId', 'title')
      .sort('-submittedAt')
      .limit(3);

    const recentCertificates = await Certificate.find({ studentId })
      .populate('courseId', 'title')
      .sort('-issueDate')
      .limit(3);

    const recentActivity = [
      ...recentSubmissions.map(s => ({
        type: 'assignment',
        text: `Submitted assignment "${s.assignmentId?.title || 'Task'}"`,
        date: s.submittedAt
      })),
      ...recentCertificates.map(c => ({
        type: 'certificate',
        text: `Earned Certificate in course "${c.courseId?.title}"`,
        date: c.issueDate
      }))
    ].sort((a, b) => b.date - a.date).slice(0, 5);

    // 6. Enrolled courses progress values for charts
    const progressChartData = progressList.map(p => ({
      id: p.courseId?._id,
      name: p.courseId?.title || 'Course',
      progress: p.completionPercentage
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          coursesEnrolled,
          coursesCompleted,
          totalHoursLearned,
          averageScore,
        },
        progressChartData,
        gradeAnalytics,
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Teacher Dashboard Analytics
// @route   GET /api/progress/teacher-analytics
// @access  Private (Teacher only)
export const getTeacherAnalytics = async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    // 1. Total Courses Created
    const myCourses = await Course.find({ instructorId: teacherId });
    const totalCourses = myCourses.length;
    const myCourseIds = myCourses.map(c => c._id);

    // 2. Total Enrolled Students (Count unique studentIds in Progress for my courses)
    const enrollments = await Progress.find({ courseId: { $in: myCourseIds } });
    const uniqueStudents = new Set(enrollments.map(e => e.studentId.toString()));
    const totalStudents = uniqueStudents.size;

    // 3. Courses Completion rates
    const completedEnrollments = enrollments.filter(e => e.completionPercentage === 100).length;
    const avgCompletion = enrollments.length > 0
      ? Math.round(enrollments.reduce((acc, e) => acc + e.completionPercentage, 0) / enrollments.length)
      : 0;

    // 4. Assignment Submissions Grading Queue (pending submissions)
    const assignments = await Assignment.find({ courseId: { $in: myCourseIds } });
    const assignmentIds = assignments.map(a => a._id);
    const pendingGradingCount = await Submission.countDocuments({
      assignmentId: { $in: assignmentIds },
      status: 'pending'
    });

    // 5. Course analytics chart dataset (Student enrollments per course)
    const courseStats = await Promise.all(
      myCourses.map(async (course) => {
        const studentCount = await Progress.countDocuments({ courseId: course._id });
        const completions = await Progress.countDocuments({ courseId: course._id, completionPercentage: 100 });
        return {
          name: course.title,
          students: studentCount,
          completions: completions
        };
      })
    );

    // 6. Recent Student Activity
    const recentActivityRaw = await Progress.find({ courseId: { $in: myCourseIds } })
      .populate('studentId', 'name email avatar')
      .populate('courseId', 'title')
      .limit(5);

    const recentActivity = recentActivityRaw.map(e => ({
      studentName: e.studentId?.name || 'Anonymous',
      studentEmail: e.studentId?.email,
      courseTitle: e.courseId?.title,
      progress: e.completionPercentage,
      avatar: e.studentId?.avatar
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalCourses,
          avgCompletion,
          pendingGradingCount
        },
        courseStats,
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Admin Dashboard Analytics
// @route   GET /api/progress/admin-analytics
// @access  Private (Admin only)
export const getAdminAnalytics = async (req, res, next) => {
  try {
    // 1. General Metrics
    const totalUsers = await User.countDocuments();
    const activeStudents = await User.countDocuments({ role: 'student', isActive: true });
    const activeTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ published: true });

    // 2. Platform activity / Enrolls count
    const totalEnrollments = await Progress.countDocuments();

    // 3. User distribution (Students vs Teachers vs Admins)
    const userRoleCounts = [
      { name: 'Students', value: await User.countDocuments({ role: 'student' }) },
      { name: 'Teachers', value: await User.countDocuments({ role: 'teacher' }) },
      { name: 'Admins', value: await User.countDocuments({ role: 'admin' }) }
    ];

    // 4. Course Categories distributions
    const categoriesData = await Course.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } }
    ]);

    // 5. System stats summary
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeStudents,
          activeTeachers,
          totalCourses,
          publishedCourses,
          totalEnrollments
        },
        userRoleCounts,
        categoriesData
      }
    });
  } catch (error) {
    next(error);
  }
};
