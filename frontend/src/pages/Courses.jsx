import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, BookOpen, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const Courses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Enrollments check list
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/courses?search=${search}&category=${category}&page=${page}&limit=6`);
      if (res.data.success) {
        setCourses(res.data.data);
        setTotalPages(res.data.pagination.pages);
      }

      // Check current user enrollments if student
      if (user && user.role === 'student') {
        const resAnalytics = await API.get('/progress/student-analytics');
        if (resAnalytics.data.success && resAnalytics.data.data.progressChartData) {
          const ids = resAnalytics.data.data.progressChartData.map(p => p.id).filter(Boolean);
          setEnrolledCourseIds(ids);
        }
      }
    } catch (err) {
      console.error('Error fetching courses list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [search, category, page]);

  // Load unique categories list
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await API.get('/courses?limit=100');
        if (res.data.success) {
          const uniqueCats = [...new Set(res.data.data.map(c => c.category))];
          setCategories(uniqueCats);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleEnroll = async (courseId) => {
    if (user?.role !== 'student') {
      addToast('Error', 'Only students can enroll in courses', 'error');
      return;
    }

    try {
      const res = await API.post(`/courses/${courseId}/enroll`);
      if (res.data.success) {
        addToast('Success', 'Enrolled successfully!', 'success');
        navigate(`/courses/${courseId}`);
      }
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Failed to enroll', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-slide-in">
      
      {/* Directory Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Browse and enroll in lectures and tutorials matching your syllabus
          </p>
        </div>

        {/* Search & Filter box */}
        <div className="flex gap-3 text-xs">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search lectures..."
              className="pl-9 pr-4 py-2 rounded-xl border dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full sm:w-60"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="relative flex items-center">
            <Filter className="absolute left-3 w-4 h-4 text-slate-400" />
            <select
              className="pl-9 pr-8 py-2 rounded-xl border dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="py-16 text-center border border-dashed dark:border-slate-800 rounded-3xl">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">No courses matching your search criteria were found</p>
        </div>
      ) : (
        <>
          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div key={course._id} className="glass-card overflow-hidden flex flex-col justify-between h-96">
                <div>
                  {/* Thumbnail Banner Placeholder/Mockup */}
                  <div className="h-40 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center border-b dark:border-slate-800 relative">
                    {course.thumbnail ? (
                      <img
                        src={`http://localhost:5000${course.thumbnail}`}
                        alt="Course Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-10 h-10 text-indigo-400 opacity-60" />
                    )}
                    <span className="absolute bottom-3 right-3 text-[10px] uppercase font-bold tracking-wider bg-white/95 text-slate-800 dark:bg-slate-900/95 dark:text-slate-200 px-2 py-0.5 rounded-lg shadow-sm">
                      {course.category}
                    </span>
                  </div>

                  {/* Body details */}
                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-sm leading-tight text-slate-800 dark:text-slate-200 line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                </div>

                {/* Card footer / Actions */}
                <div className="p-5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/10">
                  <div className="flex items-center gap-2">
                    <img
                      src={course.instructorId?.avatar ? `http://localhost:5000${course.instructorId.avatar}` : 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix'}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-[10px] text-slate-400 truncate max-w-[90px]">
                      {course.instructorId?.name || 'Instructor'}
                    </span>
                  </div>

                  {user?.role === 'student' ? (
                    enrolledCourseIds.includes(course._id) ? (
                      <button
                        onClick={() => navigate(`/courses/${course._id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
                      >
                        View Classroom <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
                      >
                        Enroll <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => navigate(`/courses/${course._id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-500 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-lg font-semibold text-xs transition-colors"
                    >
                      View Classroom <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 text-xs pt-4">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-2 border dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="font-semibold text-slate-400">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2 border dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default Courses;
