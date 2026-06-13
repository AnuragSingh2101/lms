import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  FileText,
  Bell,
  User,
  Users,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Award,
  ChevronRight
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Navigation Links based on user roles
  const getNavLinks = () => {
    const common = [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/courses', label: 'Browse Courses', icon: BookOpen },
    ];

    if (user?.role === 'student') {
      return [
        ...common,
        { path: '/profile', label: 'My Profile', icon: User }
      ];
    }

    if (user?.role === 'teacher') {
      return [
        ...common,
        { path: '/profile', label: 'My Profile', icon: User }
      ];
    }

    if (user?.role === 'admin') {
      return [
        ...common,
        { path: '/admin/users', label: 'Manage Users', icon: Users },
        { path: '/profile', label: 'System Profile', icon: User }
      ];
    }

    return common;
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 glass-panel border-r border-slate-200/60 dark:border-slate-800/80 z-50 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-slate-800/60">
          <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
              <Award className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              OpenCourse
            </span>
          </Link>
          <button className="lg:hidden p-1 text-slate-500 hover:text-slate-700" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar User Details Card */}
        <div className="px-4 py-6 border-b border-slate-200/30 dark:border-slate-800/40">
          <div className="flex items-center gap-3 bg-slate-100/50 dark:bg-slate-900/50 p-3 rounded-xl">
            <img
              src={user?.avatar ? `http://localhost:5000${user.avatar}` : 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix'}
              alt="Avatar"
              className="w-10 h-10 rounded-lg object-cover ring-2 ring-indigo-500/20"
            />
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm truncate">{user?.name}</h4>
              <span className="inline-block text-[10px] font-bold tracking-wider uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-400 px-2 py-0.5 rounded">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/5 border-l-4 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout Bottom Trigger */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/60">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-500/10 transition-all dark:text-rose-400"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/60 relative z-30">
          <button className="lg:hidden p-1.5 rounded-lg border text-slate-500" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          <div className="ml-auto flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Notifications Panel Trigger */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Overlay list */}
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-20 p-2 animate-slide-in">
                    <div className="flex items-center justify-between p-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                      <h5 className="font-bold text-xs">Notifications</h5>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] font-semibold text-indigo-500 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-400">No notifications yet</p>
                    ) : (
                      <div className="space-y-1">
                        {notifications.map(notif => (
                          <div
                            key={notif._id}
                            onClick={() => {
                              if (!notif.read) markAsRead(notif._id);
                            }}
                            className={`p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                              notif.read ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'bg-indigo-500/5 hover:bg-indigo-500/10 font-medium'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-0.5">
                              <span className="font-semibold">{notif.title}</span>
                              {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1"></span>}
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 leading-tight">{notif.message}</p>
                            <span className="text-[9px] text-slate-400 block mt-1">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Nested Page Views */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
