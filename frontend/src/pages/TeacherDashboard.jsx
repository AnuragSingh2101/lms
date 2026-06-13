import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, Clock, AlertCircle, Plus, Edit, Trash, ArrowRight, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { addToast } = useNotifications();
  const [analytics, setAnalytics] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  
  // Grading state
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  // Course Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  // Submissions lists to grade
  const [submissionsQueue, setSubmissionsQueue] = useState([]);

  const fetchTeacherData = async () => {
    try {
      const resAnalytics = await API.get('/progress/teacher-analytics');
      if (resAnalytics.data.success) {
        setAnalytics(resAnalytics.data.data);
      }

      const resCourses = await API.get('/courses/all/created');
      if (resCourses.data.success) {
        setCourses(resCourses.data.data);
      }

      // Fetch pending submissions queue
      // Since our submissions are course-bound, we retrieve them for the course IDs
      if (resCourses.data.data.length > 0) {
        const queue = [];
        for (const course of resCourses.data.data) {
          const resAssignments = await API.get(`/assignments/course/${course._id}`);
          if (resAssignments.data.success && resAssignments.data.data.length > 0) {
            for (const assign of resAssignments.data.data) {
              const resSubs = await API.get(`/assignments/${assign._id}/submissions`);
              if (resSubs.data.success) {
                const pendings = resSubs.data.data.filter(s => s.status === 'pending');
                pendings.forEach(p => {
                  queue.push({
                    ...p,
                    assignmentTitle: assign.title,
                    courseTitle: course.title,
                    totalMarks: assign.totalMarks
                  });
                });
              }
            }
          }
        }
        setSubmissionsQueue(queue);
      }
    } catch (err) {
      console.error('Error fetching teacher dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!title || !description || !category) {
      addToast('Error', 'Please fill in all course details', 'error');
      return;
    }

    try {
      const res = await API.post('/courses', { title, description, category });
      if (res.data.success) {
        addToast('Success', 'Course created successfully!', 'success');
        setCreateModal(false);
        setTitle('');
        setDescription('');
        setCategory('');
        fetchTeacherData(); // Refresh data
      }
    } catch (err) {
      addToast('Error', 'Failed to create course', 'error');
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course and all its lessons? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await API.delete(`/courses/${id}`);
      if (res.data.success) {
        addToast('Success', 'Course deleted successfully', 'success');
        fetchTeacherData();
      }
    } catch (err) {
      addToast('Error', 'Failed to delete course', 'error');
    }
  };

  const handleTogglePublish = async (courseId, currentPublished) => {
    try {
      const res = await API.put(`/courses/${courseId}`, { published: !currentPublished });
      if (res.data.success) {
        addToast('Success', `Course ${res.data.data.published ? 'published' : 'unpublished'} successfully!`, 'success');
        fetchTeacherData();
      }
    } catch (err) {
      addToast('Error', 'Failed to update course status', 'error');
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!gradeMarks || isNaN(gradeMarks)) {
      addToast('Error', 'Please enter a numeric score value', 'error');
      return;
    }

    if (Number(gradeMarks) > gradingSubmission.totalMarks) {
      addToast('Error', `Marks cannot exceed total marks (${gradingSubmission.totalMarks})`, 'error');
      return;
    }

    try {
      const res = await API.post(`/assignments/submissions/${gradingSubmission._id}/grade`, {
        marks: Number(gradeMarks),
        feedback: gradeFeedback
      });

      if (res.data.success) {
        addToast('Success', 'Submission graded successfully', 'success');
        setGradingSubmission(null);
        setGradeMarks('');
        setGradeFeedback('');
        fetchTeacherData();
      }
    } catch (err) {
      addToast('Error', 'Failed to submit grade', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = analytics?.stats || {
    totalStudents: 0,
    totalCourses: 0,
    avgCompletion: 0,
    pendingGradingCount: 0
  };

  const chartData = analytics?.courseStats || [];

  return (
    <div className="space-y-8 animate-slide-in">
      
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Instructor Space</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Build lectures, edit quizzes, and review student grades
          </p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> Create Course
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Learners</span>
            <h3 className="text-3xl font-extrabold">{stats.totalStudents}</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Lectures</span>
            <h3 className="text-3xl font-extrabold">{stats.totalCourses}</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completion rate</span>
            <h3 className="text-3xl font-extrabold">{stats.avgCompletion}%</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ungraded tasks</span>
            <h3 className="text-3xl font-extrabold">{submissionsQueue.length}</h3>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Created Course Inventory */}
        <div className="lg:col-span-2 glass-card p-6">
          <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-6">Course Curriculum Manager</h4>
          
          {courses.length === 0 ? (
            <div className="p-8 text-center border border-dashed dark:border-slate-800 rounded-2xl">
              <p className="text-sm text-slate-400">No courses designed yet. Click the button above to begin.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-4">
              {courses.map((course) => (
                <div key={course._id} className="pt-4 first:pt-0 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-semibold text-sm">{course.title}</h5>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        course.published ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {course.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm">{course.description}</p>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                      {course.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePublish(course._id, course.published)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        course.published
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600'
                      }`}
                    >
                      {course.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => navigate(`/courses/${course._id}`)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                      title="Manage lessons/curriculum"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course._id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors"
                      title="Delete Course"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grading Queue Side Pane */}
        <div className="glass-card p-6">
          <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-6">Submissions Grading Queue</h4>
          
          {submissionsQueue.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">All student submissions are graded!</p>
          ) : (
            <div className="space-y-4">
              {submissionsQueue.map((sub) => (
                <div key={sub._id} className="p-3 border dark:border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-semibold">{sub.studentId?.name}</h5>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                        {sub.courseTitle} - {sub.assignmentTitle}
                      </span>
                    </div>
                    <span className="bg-amber-500/10 text-amber-600 text-[9px] px-1.5 py-0.5 rounded font-bold">
                      Pending
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <a
                      href={`http://localhost:5000${sub.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-500 hover:underline text-[11px]"
                    >
                      Download PDF
                    </a>
                    <button
                      onClick={() => setGradingSubmission(sub)}
                      className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold text-[10px]"
                    >
                      Grade Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Course Creation Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-slide-in">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border dark:border-slate-800 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setCreateModal(false)}
              className="absolute right-4 top-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-bold">Add Course Draft</h3>
            
            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Intro to Node.js"
                  className="w-full px-3 py-2 rounded-xl border dark:border-slate-800 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500/50"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Category</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Web Development"
                  className="w-full px-3 py-2 rounded-xl border dark:border-slate-800 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500/50"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Outline course materials and lectures scope..."
                  className="w-full px-3 py-2 rounded-xl border dark:border-slate-800 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500/50"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-bold shadow-md"
              >
                Create Draft
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Grading Evaluation Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-slide-in">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border dark:border-slate-800 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setGradingSubmission(null)}
              className="absolute right-4 top-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold">Grade Task Submission</h3>
            <p className="text-xs text-slate-500">
              Student: <span className="font-semibold text-slate-700 dark:text-slate-300">{gradingSubmission.studentId?.name}</span>
            </p>
            <p className="text-xs text-slate-500">
              Assignment: <span className="font-semibold text-slate-700 dark:text-slate-300">{gradingSubmission.assignmentTitle}</span> (Out of {gradingSubmission.totalMarks} marks)
            </p>

            <form onSubmit={handleGradeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Score / Awarded Marks</label>
                <input
                  type="number"
                  required
                  placeholder={`0 - ${gradingSubmission.totalMarks}`}
                  className="w-full px-3 py-2 rounded-xl border dark:border-slate-800 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500/50 font-semibold"
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Feedback</label>
                <textarea
                  rows="3"
                  placeholder="Provide learning feedback here..."
                  className="w-full px-3 py-2 rounded-xl border dark:border-slate-800 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500/50"
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-bold"
              >
                Grade & Notify Student
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherDashboard;
