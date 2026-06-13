import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, Users, BookOpen, UserMinus, UserCheck, Trash } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const COLORS = ['#6366f1', '#10b981', '#f59e0b'];

const AdminDashboard = () => {
  const { addToast } = useNotifications();
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchAdminData = async () => {
    try {
      const resAnalytics = await API.get('/progress/admin-analytics');
      if (resAnalytics.data.success) {
        setAnalytics(resAnalytics.data.data);
      }

      // Fetch users list
      const resUsers = await API.get(`/admin/users?search=${searchQuery}&role=${roleFilter}`);
      if (resUsers.data.success) {
        setUsers(resUsers.data.data);
      }

      // Fetch courses (all courses)
      const resCourses = await API.get('/courses/all/created');
      if (resCourses.data.success) {
        setCourses(resCourses.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [searchQuery, roleFilter]);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await API.put(`/admin/users/${id}/status`);
      if (res.data.success) {
        addToast(
          'Success',
          `User account has been ${currentStatus ? 'suspended' : 'activated'} successfully.`,
          'success'
        );
        fetchAdminData();
      }
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Failed to toggle account status', 'error');
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course as admin? This overrides course files completely.')) {
      return;
    }

    try {
      const res = await API.delete(`/courses/${id}`);
      if (res.data.success) {
        addToast('Success', 'Inappropriate course deleted successfully', 'success');
        fetchAdminData();
      }
    } catch (err) {
      addToast('Error', 'Failed to delete course', 'error');
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
    totalUsers: 0,
    activeStudents: 0,
    activeTeachers: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalEnrollments: 0
  };

  const userDistribution = analytics?.userRoleCounts || [];

  return (
    <div className="space-y-8 animate-slide-in">
      
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Control Console</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Review metrics, manage registrations, suspend accounts, and purge contents
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Members</span>
            <h3 className="text-3xl font-extrabold">{stats.totalUsers}</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Teachers</span>
            <h3 className="text-3xl font-extrabold">{stats.activeTeachers}</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform Lectures</span>
            <h3 className="text-3xl font-extrabold">{stats.totalCourses}</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">User Enrollments</span>
            <h3 className="text-3xl font-extrabold">{stats.totalEnrollments}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User Directory Management Console */}
        <div className="lg:col-span-2 glass-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider">User Directory</h4>
            
            {/* Filter controls */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search name or email..."
                className="px-3 py-1.5 rounded-lg border dark:border-slate-800 bg-transparent text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="px-3 py-1.5 rounded-lg border dark:border-slate-800 bg-transparent text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="" className="text-slate-800 dark:text-slate-200">All Roles</option>
                <option value="student" className="text-slate-800 dark:text-slate-200">Student</option>
                <option value="teacher" className="text-slate-800 dark:text-slate-200">Teacher</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b dark:border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-100/10 transition-colors">
                    <td className="py-3 flex items-center gap-2">
                      <img
                        src={u.avatar ? `http://localhost:5000${u.avatar}` : 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix'}
                        alt="Avatar"
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <span className="font-semibold">{u.name}</span>
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="py-3 uppercase font-bold tracking-wider text-[10px] text-slate-400">{u.role}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleToggleStatus(u._id, u.isActive)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          u.isActive
                            ? 'border-rose-500/20 text-rose-500 hover:bg-rose-500/10'
                            : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'
                        }`}
                        title={u.isActive ? 'Suspend User' : 'Activate User'}
                      >
                        {u.isActive ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Distribution Chart Card */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-6">User Distribution</h4>
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs pt-4 border-t dark:border-slate-800 mt-4">
            {userDistribution.map((dist, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span>{dist.name}</span>
                </div>
                <span className="font-bold">{dist.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Audit Manager */}
      <div className="glass-card p-6">
        <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-6">Platform Courses Moderation</h4>
        
        {courses.length === 0 ? (
          <p className="text-xs text-slate-400">No courses published on the platform yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course._id} className="p-4 border dark:border-slate-800 rounded-2xl flex flex-col justify-between gap-4 text-xs">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h5 className="font-bold truncate">{course.title}</h5>
                    <button
                      onClick={() => handleDeleteCourse(course._id)}
                      className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                      title="Purge Course"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                    {course.description}
                  </p>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-medium">
                    {course.category}
                  </span>
                </div>

                <div className="border-t dark:border-slate-800 pt-3 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Instructor: {course.instructorId?.name || 'Anonymous'}</span>
                  <span>{course.published ? 'Published' : 'Draft'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;
