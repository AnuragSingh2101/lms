import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { BookOpen, CheckCircle, Clock, Award, FileText, ArrowRight } from 'lucide-react';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch analytics
        const resAnalytics = await API.get('/progress/student-analytics');
        if (resAnalytics.data.success) {
          setAnalytics(resAnalytics.data.data);
        }

        // Fetch courses list to see enrollment
        const resCourses = await API.get('/courses');
        if (resCourses.data.success) {
          setCourses(resCourses.data.data);
        }
      } catch (err) {
        console.error('Error loading student dashboard details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = analytics?.stats || {
    coursesEnrolled: 0,
    coursesCompleted: 0,
    totalHoursLearned: 0,
    averageScore: 0
  };

  const progressData = analytics?.progressChartData || [];
  const gradesData = analytics?.gradeAnalytics || [];
  const activity = analytics?.recentActivity || [];

  return (
    <div className="space-y-8 animate-slide-in">
      
      {/* Dashboard Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Workspace</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Monitor your course completions, watch durations, and assignment scores
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1 */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Enrolled Courses
            </span>
            <h3 className="text-3xl font-extrabold">{stats.coursesEnrolled}</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Completions
            </span>
            <h3 className="text-3xl font-extrabold">{stats.coursesCompleted}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Watch Hours
            </span>
            <h3 className="text-3xl font-extrabold">{stats.totalHoursLearned}h</h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Average Grade
            </span>
            <h3 className="text-3xl font-extrabold">{stats.averageScore}%</h3>
          </div>
          <div className="p-3 bg-violet-500/10 text-violet-500 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Panel */}
      <div className="grid grid-cols-1 gap-8">
        {/* Quiz & Assignment Grades Chart */}
        <div className="glass-card p-6">
          <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-6">
            Assignments Performance
          </h4>
          {gradesData.length === 0 ? (
            <div className="h-64 flex items-center justify-center border-2 border-dashed dark:border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-400">Submit assignments to track graded stats</span>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gradesData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} name="Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Enrolled Courses / Quick Entry */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider">
            My Subscribed Lectures
          </h4>
          <button
            onClick={() => navigate('/courses')}
            className="text-xs font-semibold text-indigo-500 hover:underline flex items-center gap-1"
          >
            Explore Catalog <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {progressData.length === 0 ? (
          <div className="p-8 text-center border border-dashed dark:border-slate-800 rounded-2xl">
            <p className="text-sm text-slate-400 mb-4">You are not enrolled in any courses yet</p>
            <button
              onClick={() => navigate('/courses')}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold"
            >
              Browse Catalog
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {progressListToRender(progressData, courses, navigate)}
          </div>
        )}
      </div>
    </div>
  );
};

// Quick mapper helper to match Progress keys with course models
const progressListToRender = (progressData, courses, navigate) => {
  return progressData.map((prog, idx) => {
    return (
      <div
        key={idx}
        onClick={() => prog.id && navigate(`/courses/${prog.id}`)}
        className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100/30 dark:hover:bg-slate-900/30 transition-colors flex items-center justify-between cursor-pointer"
      >
        <div className="space-y-1.5 flex-1 pr-4">
          <h5 className="font-semibold text-sm">{prog.name}</h5>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400" />
      </div>
    );
  });
};

export default StudentDashboard;
