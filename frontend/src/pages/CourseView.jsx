import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  BookOpen,
  Play,
  CheckCircle,
  FileText,
  HelpCircle,
  MessageSquare,
  Award,
  Plus,
  Send,
  Trash,
  Pin,
  Clock,
  Download,
  AlertCircle,
  X
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CourseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useNotifications();

  // Core State
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  // Enrollment / Progress State
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState(null);
  const [certificate, setCertificate] = useState(null);

  // Tabs Management: 'notes' | 'assignments' | 'quiz' | 'discussion'
  const [activeTab, setActiveTab] = useState('notes');

  // Notes/Curriculum State
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonYt, setLessonYt] = useState('');
  const [lessonDur, setLessonDur] = useState('');
  const [lessonFile, setLessonFile] = useState(null);

  // Assignments State
  const [assignments, setAssignments] = useState([]);
  const [submissionFiles, setSubmissionFiles] = useState({}); // assignmentId -> File
  const [mySubmissions, setMySubmissions] = useState([]);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignMarks, setAssignMarks] = useState('');
  const [assignFile, setAssignFile] = useState(null);

  // Quiz State
  const [quiz, setQuiz] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAttemptScore, setQuizAttemptScore] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  
  // Active Quiz taker session
  const [quizRunning, setQuizRunning] = useState(false);
  const [quizTimer, setQuizTimer] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);

  // Quiz Creator Form
  const [qLimit, setQLimit] = useState('');
  const [qMarks, setQMarks] = useState('');
  const [qList, setQList] = useState([]); // [{ questionText, options: ['', '', ''], correctOptionIndex }]
  const [newQText, setNewQText] = useState('');
  const [newQOpts, setNewQOpts] = useState(['', '', '', '']);
  const [newQCorrect, setNewQCorrect] = useState(0);

  // Discussions State
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTextMap, setReplyTextMap] = useState({}); // commentId -> string

  // Certificate Modal State
  const [certModal, setCertModal] = useState(false);

  // Load Course and User State details
  const loadCourseData = async () => {
    try {
      const resCourse = await API.get(`/courses/${id}`);
      if (resCourse.data.success) {
        setCourse(resCourse.data.data);
        setLessons(resCourse.data.data.lessons || []);
        if (resCourse.data.data.lessons?.length > 0) {
          setActiveLesson(resCourse.data.data.lessons[0]);
        }
      }

      // Check enrollment
      if (user?.role === 'student') {
        const resProgress = await API.get(`/progress/course/${id}`);
        if (resProgress.data.success && resProgress.data.data) {
          setEnrolled(true);
          setProgress(resProgress.data.data);
          setCertificate(resProgress.data.certificate);
        }
      } else {
        // Teacher/Admin has auto-enrollment access
        setEnrolled(true);
      }

      // Load Modules items
      loadAssignments();
      loadQuiz();
      loadDiscussions();
    } catch (err) {
      console.error('Error loading course details:', err);
      addToast('Error', 'Failed to load course details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [id, user]);

  useEffect(() => {
    if (activeLesson) {
      loadDiscussions();
    }
  }, [activeLesson]);

  // Quiz timer decrements
  useEffect(() => {
    let interval;
    if (quizRunning && quizTimer > 0) {
      interval = setInterval(() => {
        setQuizTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleQuizSubmit(true); // Auto submit on timeout
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizRunning, quizTimer]);

  // ==========================================
  // API Fetch Helpers
  // ==========================================
  const loadAssignments = async () => {
    try {
      const res = await API.get(`/assignments/course/${id}`);
      if (res.data.success) setAssignments(res.data.data);

      if (user?.role === 'student') {
        const resSub = await API.get('/assignments/my-submissions');
        if (resSub.data.success) setMySubmissions(resSub.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadQuiz = async () => {
    try {
      const res = await API.get(`/quizzes/course/${id}`);
      if (res.data.success && res.data.data) {
        setQuiz(res.data.data);
        setQuizQuestions(res.data.data.questions || []);
        
        // Fetch past attempts if student
        if (user?.role === 'student') {
          const resAttempts = await API.get(`/quizzes/${res.data.data._id}/attempts`);
          if (resAttempts.data.success) {
            setQuizAttempts(resAttempts.data.data);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadDiscussions = async () => {
    if (!activeLesson) return;
    try {
      const res = await API.get(`/discussions/lesson/${activeLesson._id}`);
      if (res.data.success) setComments(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // Publish / Unpublish Flow
  // ==========================================
  const handleTogglePublish = async () => {
    try {
      const res = await API.put(`/courses/${id}`, { published: !course.published });
      if (res.data.success) {
        addToast('Success', `Course ${res.data.data.published ? 'published' : 'unpublished'} successfully!`, 'success');
        setCourse(prev => ({ ...prev, published: res.data.data.published }));
      }
    } catch (err) {
      addToast('Error', 'Failed to update course status', 'error');
    }
  };

  // ==========================================
  // Enroll Flow
  // ==========================================
  const handleEnroll = async () => {
    try {
      const res = await API.post(`/courses/${id}/enroll`);
      if (res.data.success) {
        addToast('Success', 'Enrolled successfully!', 'success');
        loadCourseData();
      }
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Failed to enroll', 'error');
    }
  };

  // ==========================================
  // Lesson Completion Check hooks
  // ==========================================
  const handleToggleLessonComplete = async (lessonId) => {
    if (user?.role !== 'student') return;
    try {
      // Toggle lesson complete increments watch time by 15 mins for mock
      const res = await API.post(`/progress/course/${id}/complete-lesson/${lessonId}`, {
        watchTime: 15
      });
      if (res.data.success) {
        setProgress(res.data.data);
        if (res.data.certificateEarned) {
          setCertificate(res.data.certificate);
          addToast('Congratulations!', 'You have earned your course completion certificate!', 'success');
        }
        addToast('Progress Updated', 'Lesson completion toggled successfully', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // Lesson Management (Teachers only)
  // ==========================================
  const handleAddLesson = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', lessonTitle);
    formData.append('description', lessonDesc);
    formData.append('youtubeId', lessonYt);
    formData.append('duration', lessonDur);
    if (lessonFile) formData.append('notesPdf', lessonFile);

    try {
      const res = await API.post(`/courses/${id}/lessons`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        addToast('Success', 'Lesson added to curriculum', 'success');
        setLessonTitle('');
        setLessonDesc('');
        setLessonYt('');
        setLessonDur('');
        setLessonFile(null);
        loadCourseData();
      }
    } catch (err) {
      addToast('Error', 'Failed to add lesson', 'error');
    }
  };

  // ==========================================
  // Assignment Management
  // ==========================================
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', assignTitle);
    formData.append('description', assignDesc);
    formData.append('dueDate', assignDueDate);
    formData.append('totalMarks', Number(assignMarks));
    if (assignFile) formData.append('referenceMaterial', assignFile);

    try {
      const res = await API.post(`/assignments/course/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        addToast('Success', 'Assignment configured', 'success');
        setAssignTitle('');
        setAssignDesc('');
        setAssignDueDate('');
        setAssignMarks('');
        setAssignFile(null);
        loadAssignments();
      }
    } catch (err) {
      addToast('Error', 'Failed to configure assignment', 'error');
    }
  };

  const handleAssignmentSubmit = async (assignId) => {
    const file = submissionFiles[assignId];
    if (!file) {
      addToast('Error', 'Please select a file to submit', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('submission', file);

    try {
      const res = await API.post(`/assignments/${assignId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        addToast('Success', 'Assignment submitted!', 'success');
        // Clear files selection state
        setSubmissionFiles(prev => ({ ...prev, [assignId]: null }));
        loadAssignments();
        
        // Refresh certificates checks
        if (res.data.certificateEarned) {
          setCertificate(res.data.certificate);
        }
      }
    } catch (err) {
      addToast('Error', 'Failed to submit file', 'error');
    }
  };

  // ==========================================
  // Quiz Module logic
  // ==========================================
  const handleAddQuizQuestion = () => {
    if (!newQText || newQOpts.some(o => !o)) {
      addToast('Error', 'Please fill in question and all options', 'error');
      return;
    }
    setQList(prev => [
      ...prev,
      {
        questionText: newQText,
        options: [...newQOpts],
        correctOptionIndex: Number(newQCorrect)
      }
    ]);
    setNewQText('');
    setNewQOpts(['', '', '', '']);
    setNewQCorrect(0);
  };

  const handleConfigureQuiz = async (e) => {
    e.preventDefault();
    if (qList.length === 0) {
      addToast('Error', 'Please add at least one question', 'error');
      return;
    }

    try {
      const res = await API.post(`/quizzes/course/${id}`, {
        timeLimit: Number(qLimit),
        totalMarks: Number(qMarks),
        questions: qList
      });

      if (res.data.success) {
        addToast('Success', 'Quiz configured successfully', 'success');
        setQLimit('');
        setQMarks('');
        setQList([]);
        loadQuiz();
      }
    } catch (err) {
      addToast('Error', 'Failed to configure quiz', 'error');
    }
  };

  const startQuizAttempt = () => {
    if (!quiz) return;
    setQuizAnswers(new Array(quiz.questions.length).fill(-1));
    setQuizTimer(quiz.timeLimit * 60);
    setQuizRunning(true);
    setQuizResult(null);
  };

  const handleQuizSubmit = async (isTimeout = false) => {
    if (!quizRunning) return;
    setQuizRunning(false);

    // Filter un-answered questions with -1 index
    const formattedAnswers = quizAnswers.map(ans => (ans === -1 ? 0 : ans));

    try {
      const res = await API.post(`/quizzes/${quiz._id}/submit`, {
        answers: formattedAnswers
      });

      if (res.data.success) {
        setQuizResult(res.data.data);
        addToast('Quiz Completed', isTimeout ? 'Time is up! Quiz submitted.' : 'Quiz graded successfully!', 'info');
        loadQuiz();
        if (res.data.certificateEarned) {
          setCertificate(res.data.certificate);
        }
      }
    } catch (err) {
      addToast('Error', 'Failed to submit quiz grading request', 'error');
    }
  };

  // ==========================================
  // Discussion Forums API logic
  // ==========================================
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newCommentText) return;

    try {
      const res = await API.post(`/discussions/lesson/${activeLesson._id}`, {
        text: newCommentText
      });
      if (res.data.success) {
        setComments(prev => [...prev, res.data.data]);
        setNewCommentText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplySubmit = async (commentId) => {
    const text = replyTextMap[commentId];
    if (!text) return;

    try {
      const res = await API.post(`/discussions/lesson/${activeLesson._id}`, {
        text,
        parentCommentId: commentId
      });
      if (res.data.success) {
        setComments(prev => [...prev, res.data.data]);
        setReplyTextMap(prev => ({ ...prev, [commentId]: '' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePinComment = async (commentId) => {
    try {
      const res = await API.put(`/discussions/${commentId}/pin`);
      if (res.data.success) {
        addToast('Success', 'Comment pin state updated', 'success');
        loadDiscussions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await API.delete(`/discussions/${commentId}`);
      if (res.data.success) {
        setComments(prev => prev.filter(c => c._id !== commentId && c.parentCommentId !== commentId));
        addToast('Success', 'Comment deleted', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // PDF Download Certificate Generator
  // ==========================================
  const handleDownloadCertificatePDF = () => {
    const input = document.getElementById('certificate-render-source');
    html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape format matching templates
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`Completion-Certificate-${id}.pdf`);
    });
  };

  // Loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not enrolled student landing preview page layout
  if (!enrolled) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-slide-in">
        <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-8 rounded-3xl border dark:border-slate-800 text-center space-y-4">
          <BookOpen className="w-16 h-16 text-indigo-500 mx-auto mb-2" />
          <h1 className="text-3xl font-extrabold tracking-tight">{course?.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            {course?.description}
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-400">
            <span>Category: {course?.category}</span>
            <span>•</span>
            <span>Lessons count: {lessons.length}</span>
          </div>
          {user?.role === 'student' && (
            <button
              onClick={handleEnroll}
              className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 text-sm"
            >
              Enroll in Lecture Series
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-in">
      
      {/* Dynamic Progress Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 glass-panel rounded-2xl border dark:border-slate-800">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Course Syllabus</span>
          <h2 className="text-lg font-bold truncate max-w-md">{course?.title}</h2>
        </div>
        
        {/* Certificate Button */}
        {certificate && (
          <button
            onClick={() => setCertModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-tr from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md"
          >
            <Award className="w-4 h-4" /> View Certificate
          </button>
        )}

        {/* Teacher Publish Status controls */}
        {user?.role !== 'student' && course && (
          <div className="flex items-center gap-3">
            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${
              course.published ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20'
            }`}>
              {course.published ? 'Published' : 'Draft Mode (Hidden)'}
            </span>
            <button
              onClick={handleTogglePublish}
              className={`px-4 py-2 text-white rounded-xl text-xs font-bold shadow-md transition-all ${
                course.published
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              {course.published ? 'Unpublish Course' : 'Publish Course'}
            </button>
          </div>
        )}
      </div>

      {/* Classroom study view grid */}
      {lessons.length === 0 ? (
        <div className="text-center py-20 border border-dashed dark:border-slate-800 rounded-3xl">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">No lessons published in this course curriculum yet.</p>
          {user?.role !== 'student' && (
            <div className="max-w-md mx-auto mt-8">
              <form onSubmit={handleAddLesson} className="glass-card p-6 text-left space-y-4 text-xs">
                <h4 className="font-bold text-sm">Add First Lesson</h4>
                <input
                  type="text"
                  required
                  placeholder="Lesson Title"
                  className="w-full px-3 py-2 border dark:border-slate-800 rounded-lg bg-transparent text-xs"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                />
                <input
                  type="text"
                  required
                  placeholder="YouTube Video ID (e.g. dQw4w9WgXcQ)"
                  className="w-full px-3 py-2 border dark:border-slate-800 rounded-lg bg-transparent text-xs"
                  value={lessonYt}
                  onChange={(e) => setLessonYt(e.target.value)}
                />
                <input
                  type="text"
                  required
                  placeholder="Duration (e.g. 15 mins)"
                  className="w-full px-3 py-2 border dark:border-slate-800 rounded-lg bg-transparent text-xs"
                  value={lessonDur}
                  onChange={(e) => setLessonDur(e.target.value)}
                />
                <button type="submit" className="w-full py-2 bg-indigo-500 text-white rounded-lg font-bold">
                  Publish Lesson
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active video player & tab details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* YouTube Embed Player */}
            {activeLesson && (
              <div className="space-y-4">
                <div className="video-container shadow-xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${activeLesson.youtubeId}`}
                    title={activeLesson.title}
                    allowFullScreen
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">{activeLesson.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{activeLesson.description}</p>
                </div>
              </div>
            )}

            {/* Tab Selectors */}
            <div className="flex border-b dark:border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('notes')}
                className={`pb-3 px-4 transition-all border-b-2 ${
                  activeTab === 'notes' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400'
                }`}
              >
                Notes & PDFs
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`pb-3 px-4 transition-all border-b-2 ${
                  activeTab === 'assignments' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400'
                }`}
              >
                Assignments
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`pb-3 px-4 transition-all border-b-2 ${
                  activeTab === 'quiz' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400'
                }`}
              >
                Quiz Module
              </button>
              <button
                onClick={() => setActiveTab('discussion')}
                className={`pb-3 px-4 transition-all border-b-2 ${
                  activeTab === 'discussion' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400'
                }`}
              >
                Discussion Forum
              </button>
            </div>

            {/* Tab Contents */}
            <div className="glass-card p-6 text-xs min-h-[300px]">
              
              {/* Tab 1: Notes & PDF resources */}
              {activeTab === 'notes' && (
                <div className="space-y-6">
                  {activeLesson?.notesPdf ? (
                    <div className="flex items-center justify-between p-4 border dark:border-slate-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-rose-500" />
                        <div>
                          <h5 className="font-semibold text-sm">Lecture Resource Material</h5>
                          <span className="text-[10px] text-slate-400">Course Notes (PDF)</span>
                        </div>
                      </div>
                      <a
                        href={`http://localhost:5000${activeLesson.notesPdf}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg font-bold"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Notes
                      </a>
                    </div>
                  ) : (
                    <p className="text-slate-400 py-10 text-center">No PDF attachments linked to this lesson.</p>
                  )}

                  {/* Teacher Lesson Upload Tools */}
                  {user?.role !== 'student' && (
                    <div className="border-t dark:border-slate-800 pt-6">
                      <h4 className="font-bold text-sm mb-4">Curriculum Builder (Append Lesson)</h4>
                      <form onSubmit={handleAddLesson} className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          required
                          placeholder="Lesson Title"
                          className="px-3 py-2 border dark:border-slate-800 bg-transparent rounded-lg"
                          value={lessonTitle}
                          onChange={(e) => setLessonTitle(e.target.value)}
                        />
                        <input
                          type="text"
                          required
                          placeholder="YouTube Video ID"
                          className="px-3 py-2 border dark:border-slate-800 bg-transparent rounded-lg"
                          value={lessonYt}
                          onChange={(e) => setLessonYt(e.target.value)}
                        />
                        <input
                          type="text"
                          required
                          placeholder="Duration (e.g. 20 mins)"
                          className="px-3 py-2 border dark:border-slate-800 bg-transparent rounded-lg"
                          value={lessonDur}
                          onChange={(e) => setLessonDur(e.target.value)}
                        />
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="px-3 py-1.5 border dark:border-slate-800 bg-transparent rounded-lg"
                          onChange={(e) => setLessonFile(e.target.files[0])}
                        />
                        <textarea
                          placeholder="Short description summary..."
                          className="col-span-2 px-3 py-2 border dark:border-slate-800 bg-transparent rounded-lg"
                          rows="2"
                          value={lessonDesc}
                          onChange={(e) => setLessonDesc(e.target.value)}
                        />
                        <button type="submit" className="col-span-2 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold">
                          Add Lesson
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Assignments submissions widget */}
              {activeTab === 'assignments' && (
                <div className="space-y-6">
                  {assignments.length === 0 ? (
                    <p className="text-slate-400 py-10 text-center">No assignments configured for this course yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {assignments.map(assign => {
                        const sub = mySubmissions.find(s => s.assignmentId?._id === assign._id);
                        return (
                          <div key={assign._id} className="p-4 border dark:border-slate-800 rounded-xl space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-bold text-sm">{assign.title}</h5>
                                <p className="text-slate-400 mt-1 leading-relaxed">{assign.description}</p>
                              </div>
                              <span className="font-bold text-[10px] tracking-wider uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                Score: {assign.totalMarks} Marks
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-[10px] text-slate-400">
                              <span>Due: {new Date(assign.dueDate).toLocaleDateString()}</span>
                              {assign.referenceMaterial && (
                                <a
                                  href={`http://localhost:5000${assign.referenceMaterial}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-500 hover:underline flex items-center gap-0.5"
                                >
                                  <Download className="w-3 h-3" /> Reference Sheet
                                </a>
                              )}
                            </div>

                            {/* Student Submission Form */}
                            {user?.role === 'student' && (
                              <div className="border-t dark:border-slate-800 pt-3 flex items-center justify-between gap-4">
                                {sub ? (
                                  <div className="text-xs">
                                    <span className="font-semibold">Status: </span>
                                    <span className={`font-bold ${sub.status === 'graded' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                      {sub.status.toUpperCase()}
                                    </span>
                                    {sub.status === 'graded' && (
                                      <span className="block text-[10px] text-slate-400 mt-0.5">
                                        Score: {sub.marks}/{assign.totalMarks} | Feedback: {sub.feedback || 'None'}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 w-full max-w-sm">
                                    <input
                                      type="file"
                                      accept=".pdf,.doc,.docx"
                                      className="border dark:border-slate-800 bg-transparent rounded-lg px-2 py-1 text-[11px] w-full"
                                      onChange={(e) => setSubmissionFiles(prev => ({ ...prev, [assign._id]: e.target.files[0] }))}
                                    />
                                    <button
                                      onClick={() => handleAssignmentSubmit(assign._id)}
                                      className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg font-bold text-[11px]"
                                    >
                                      Submit
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Teacher Assignment Creator */}
                  {user?.role !== 'student' && (
                    <div className="border-t dark:border-slate-800 pt-6">
                      <h4 className="font-bold text-sm mb-4">Add Assignment</h4>
                      <form onSubmit={handleCreateAssignment} className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          required
                          placeholder="Assignment Title"
                          className="px-3 py-2 border dark:border-slate-800 bg-transparent rounded-lg"
                          value={assignTitle}
                          onChange={(e) => setAssignTitle(e.target.value)}
                        />
                        <input
                          type="date"
                          required
                          className="px-3 py-2 border dark:border-slate-800 bg-transparent rounded-lg text-slate-500"
                          value={assignDueDate}
                          onChange={(e) => setAssignDueDate(e.target.value)}
                        />
                        <input
                          type="number"
                          required
                          placeholder="Total Marks"
                          className="px-3 py-2 border dark:border-slate-800 bg-transparent rounded-lg"
                          value={assignMarks}
                          onChange={(e) => setAssignMarks(e.target.value)}
                        />
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="px-3 py-1.5 border dark:border-slate-800 bg-transparent rounded-lg"
                          onChange={(e) => setAssignFile(e.target.files[0])}
                        />
                        <textarea
                          placeholder="Task descriptions and instructions..."
                          required
                          className="col-span-2 px-3 py-2 border dark:border-slate-800 bg-transparent rounded-lg"
                          rows="2"
                          value={assignDesc}
                          onChange={(e) => setAssignDesc(e.target.value)}
                        />
                        <button type="submit" className="col-span-2 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold">
                          Configure Assignment
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Quiz taker widget */}
              {activeTab === 'quiz' && (
                <div className="space-y-6">
                  {quiz ? (
                    <div>
                      {/* Active Session */}
                      {quizRunning ? (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                            <span className="font-bold text-indigo-500">Quiz Active</span>
                            <span className="font-mono font-bold text-sm text-slate-700 dark:text-slate-300">
                              Time remaining: {Math.floor(quizTimer / 60)}:{(quizTimer % 60).toString().padStart(2, '0')}
                            </span>
                          </div>

                          <div className="space-y-6">
                            {quiz.questions.map((q, qIdx) => (
                              <div key={qIdx} className="space-y-2 border dark:border-slate-800 p-4 rounded-xl">
                                <h5 className="font-semibold text-sm">
                                  {qIdx + 1}. {q.questionText}
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                  {q.options.map((opt, oIdx) => (
                                    <button
                                      key={oIdx}
                                      onClick={() => {
                                        setQuizAnswers(prev => {
                                          const copy = [...prev];
                                          copy[qIdx] = oIdx;
                                          return copy;
                                        });
                                      }}
                                      className={`p-3 rounded-xl text-left border transition-all text-xs font-semibold ${
                                        quizAnswers[qIdx] === oIdx
                                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => handleQuizSubmit(false)}
                            className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-bold shadow-md"
                          >
                            Submit Answers
                          </button>
                        </div>
                      ) : (
                        // Not Running Preview Panel
                        <div className="space-y-6">
                          <div className="p-4 bg-indigo-500/5 rounded-xl border dark:border-slate-800 space-y-2 text-center">
                            <HelpCircle className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                            <h4 className="font-bold text-sm">Course Evaluation Quiz</h4>
                            <p className="text-slate-400 text-[11px] max-w-sm mx-auto">
                              Answer all questions within the {quiz.timeLimit} minutes limit. A passing score of 50% or above is required for certification.
                            </p>
                            
                            {user?.role === 'student' && (
                              <button
                                onClick={startQuizAttempt}
                                className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold mt-4"
                              >
                                Begin Attempt
                              </button>
                            )}
                          </div>

                          {/* Show results if submitted */}
                          {quizResult && (
                            <div className="p-4 border border-emerald-500/20 bg-emerald-500/10 rounded-xl text-center space-y-2">
                              <h5 className="font-bold text-emerald-600">Attempt Finished</h5>
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Score: {quizResult.score} / {quizResult.totalMarks} Marks
                              </p>
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                quizResult.passed ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'
                              }`}>
                                {quizResult.passed ? 'Passed' : 'Failed'}
                              </span>
                            </div>
                          )}

                          {/* Attempt History */}
                          {quizAttempts.length > 0 && (
                            <div className="space-y-3">
                              <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Attempt History</h5>
                              {quizAttempts.map((att, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 border dark:border-slate-800 rounded-xl">
                                  <div>
                                    <span className="font-bold">Attempt #{quizAttempts.length - idx}</span>
                                    <span className="block text-[10px] text-slate-400">{new Date(att.attemptedAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-bold block">{att.score} Marks</span>
                                    <span className={`text-[10px] font-bold ${att.passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {att.passed ? 'PASSED' : 'FAILED'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-slate-400 py-10 text-center">No evaluations configured for this course yet.</p>

                      {/* Instructor Quiz Creator Widget */}
                      {user?.role !== 'student' && (
                        <div className="border-t dark:border-slate-800 pt-6 space-y-4">
                          <h4 className="font-bold text-sm">Configure Evaluation Quiz</h4>
                          <form onSubmit={handleConfigureQuiz} className="grid grid-cols-2 gap-4">
                            <input
                              type="number"
                              required
                              placeholder="Time Limit (Minutes)"
                              className="px-3 py-2 border dark:border-slate-800 bg-transparent rounded-lg"
                              value={qLimit}
                              onChange={(e) => setQLimit(e.target.value)}
                            />
                            <input
                              type="number"
                              required
                              placeholder="Total Quiz Marks"
                              className="px-3 py-2 border dark:border-slate-800 bg-transparent rounded-lg"
                              value={qMarks}
                              onChange={(e) => setQMarks(e.target.value)}
                            />

                            {/* Sub-form to add questions */}
                            <div className="col-span-2 border dark:border-slate-800 p-4 rounded-xl space-y-3">
                              <h5 className="font-semibold text-slate-400">Add MCQ Question</h5>
                              <input
                                type="text"
                                placeholder="Question Text"
                                className="w-full px-3 py-2 border dark:border-slate-800 bg-transparent rounded-lg"
                                value={newQText}
                                onChange={(e) => setNewQText(e.target.value)}
                              />
                              <div className="grid grid-cols-2 gap-3">
                                {newQOpts.map((opt, oIdx) => (
                                  <input
                                    key={oIdx}
                                    type="text"
                                    placeholder={`Option ${oIdx + 1}`}
                                    className="px-3 py-1.5 border dark:border-slate-800 bg-transparent rounded-lg"
                                    value={opt}
                                    onChange={(e) => {
                                      const copy = [...newQOpts];
                                      copy[oIdx] = e.target.value;
                                      setNewQOpts(copy);
                                    }}
                                  />
                                ))}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-400 font-semibold">Correct Choice:</span>
                                <select
                                  className="px-3 py-1.5 border dark:border-slate-800 bg-transparent rounded-lg text-slate-500"
                                  value={newQCorrect}
                                  onChange={(e) => setNewQCorrect(Number(e.target.value))}
                                >
                                  <option value={0}>Option 1</option>
                                  <option value={1}>Option 2</option>
                                  <option value={2}>Option 3</option>
                                  <option value={3}>Option 4</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={handleAddQuizQuestion}
                                  className="ml-auto px-4 py-1.5 bg-indigo-500 text-white rounded-lg font-bold"
                                >
                                  Add Question
                                </button>
                              </div>
                            </div>

                            {/* Added list */}
                            {qList.length > 0 && (
                              <div className="col-span-2 space-y-2">
                                <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                                  Added Questions ({qList.length})
                                </h5>
                                {qList.map((q, idx) => (
                                  <div key={idx} className="flex justify-between items-center p-2 border dark:border-slate-800 rounded-lg">
                                    <span className="font-semibold truncate max-w-xs">{idx + 1}. {q.questionText}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Correct: Option {q.correctOptionIndex + 1}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <button type="submit" className="col-span-2 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold">
                              Save & Publish Quiz
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Lesson discussions threads */}
              {activeTab === 'discussion' && (
                <div className="space-y-6">
                  {/* Discussions Header */}
                  <form onSubmit={handleCommentSubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ask a question or comment on this lesson..."
                      required
                      className="w-full px-4 py-2 border dark:border-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                    />
                    <button type="submit" className="px-4 bg-indigo-500 text-white rounded-xl flex items-center justify-center font-bold">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>

                  {comments.length === 0 ? (
                    <p className="text-slate-400 py-10 text-center">No discussions on this lesson yet. Be the first!</p>
                  ) : (
                    <div className="space-y-6 pt-4">
                      {/* Filter parents */}
                      {comments.filter(c => !c.parentCommentId).map(comment => (
                        <div key={comment._id} className="space-y-4">
                          <div className={`p-4 border dark:border-slate-800 rounded-xl space-y-2 relative ${
                            comment.isPinned ? 'border-indigo-500 bg-indigo-500/5' : ''
                          }`}>
                            
                            {/* Pinned tags */}
                            {comment.isPinned && (
                              <div className="absolute right-4 top-4 flex items-center gap-1 text-[9px] font-bold text-indigo-500 uppercase">
                                <Pin className="w-3.5 h-3.5 fill-indigo-500" /> Pinned
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <img
                                src={comment.userId?.avatar ? `http://localhost:5000${comment.userId.avatar}` : 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix'}
                                alt="Avatar"
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <div>
                                <span className="font-bold">{comment.userId?.name}</span>
                                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 ml-2">
                                  {comment.userId?.role}
                                </span>
                              </div>
                            </div>

                            <p className="text-slate-700 dark:text-slate-300 pl-8 leading-relaxed">{comment.text}</p>
                            
                            {/* Controls */}
                            <div className="flex items-center gap-4 pl-8 pt-2 text-[10px] text-slate-400">
                              <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                              
                              {user?.role !== 'student' && (
                                <button
                                  onClick={() => handleTogglePinComment(comment._id)}
                                  className="text-indigo-500 hover:underline flex items-center gap-0.5"
                                >
                                  <Pin className="w-3 h-3" /> Pin
                                </button>
                              )}

                              {(comment.userId?._id === user?.id || user?.role !== 'student') && (
                                <button
                                  onClick={() => handleDeleteComment(comment._id)}
                                  className="text-rose-500 hover:underline flex items-center gap-0.5"
                                >
                                  <Trash className="w-3 h-3" /> Delete
                                </button>
                              )}
                            </div>

                            {/* Replies Thread Sub-List */}
                            <div className="pl-8 pt-4 space-y-3 border-t dark:border-slate-800/80 mt-3">
                              {comments.filter(r => r.parentCommentId === comment._id).map(reply => (
                                <div key={reply._id} className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={reply.userId?.avatar ? `http://localhost:5000${reply.userId.avatar}` : 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix'}
                                      alt="Avatar"
                                      className="w-5 h-5 rounded-full object-cover"
                                    />
                                    <span className="font-bold text-[11px]">{reply.userId?.name}</span>
                                    <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">
                                      {reply.userId?.role}
                                    </span>
                                  </div>
                                  <p className="text-slate-600 dark:text-slate-400 pl-7 leading-relaxed">{reply.text}</p>
                                </div>
                              ))}

                              {/* Write Reply form */}
                              <div className="flex gap-2 pt-2">
                                <input
                                  type="text"
                                  placeholder="Write a reply..."
                                  className="w-full px-3 py-1 border dark:border-slate-800 bg-transparent rounded-lg text-[11px]"
                                  value={replyTextMap[comment._id] || ''}
                                  onChange={(e) => setReplyTextMap(prev => ({ ...prev, [comment._id]: e.target.value }))}
                                />
                                <button
                                  onClick={() => handleReplySubmit(comment._id)}
                                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg font-bold text-[10px]"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Right side: Lesson curriculum playlist */}
          <div className="glass-card p-6 h-fit space-y-6">
            <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Curriculum Playlist</h4>
            
            <div className="space-y-3">
              {lessons.map((les, idx) => {
                const isCompleted = progress?.lessonsCompleted?.includes(les._id);
                const isActive = activeLesson?._id === les._id;
                return (
                  <div
                    key={les._id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                    }`}
                  >
                    <button
                      onClick={() => setActiveLesson(les)}
                      className="flex-1 flex items-center gap-3 text-left overflow-hidden"
                    >
                      <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg flex items-center justify-center shrink-0">
                        <Play className="w-3.5 h-3.5" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="font-bold block text-xs truncate">{les.title}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{les.duration}</span>
                      </div>
                    </button>


                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Certificate Modal Viewer */}
      {certModal && certificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-slide-in">
          <div className="max-w-3xl w-full space-y-4">
            
            {/* Download and Close Buttons */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xl">
              <span className="font-bold text-xs">Print Ready PDF Completion Certificate</span>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadCertificatePDF}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button
                  onClick={() => setCertModal(false)}
                  className="p-2 border dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Certificate Template Render block */}
            <div
              id="certificate-render-source"
              className="w-[800px] h-[565px] bg-white text-slate-800 border-[16px] border-double border-indigo-950 p-12 flex flex-col justify-between items-center text-center shadow-2xl mx-auto relative overflow-hidden"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {/* Filigrees and badges badges */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-4 w-full">
                <h4 className="text-[10px] tracking-[6px] uppercase font-bold text-indigo-950">
                  Certificate of Completion
                </h4>
                <div className="w-20 h-0.5 bg-indigo-950 mx-auto" />
              </div>

              <div className="space-y-6">
                <p className="text-xs italic text-slate-500">This is proudly presented to</p>
                <h2 className="text-3xl font-bold italic tracking-wide text-indigo-950">
                  {user?.name}
                </h2>
                <p className="text-[11px] leading-relaxed text-slate-500 max-w-md mx-auto">
                  for successfully finishing and passing all quizzes, assignments evaluations, and curriculum study requirements for the online course:
                </p>
                <h3 className="text-xl font-bold text-indigo-950 tracking-wider">
                  "{course?.title}"
                </h3>
              </div>

              <div className="w-full flex justify-between items-end pt-8 text-left text-[10px] border-t border-slate-200">
                <div className="space-y-1">
                  <span className="text-slate-400 block uppercase tracking-wider font-semibold">Issued Date</span>
                  <span className="font-bold text-slate-700">{new Date(certificate.issueDate).toLocaleDateString()}</span>
                </div>

                {/* QR Code Validation Mock badge */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-16 h-16 bg-slate-100 p-1 border rounded-lg flex items-center justify-center">
                    {/* Simulated pixel QR code layout */}
                    <div className="grid grid-cols-5 gap-0.5 w-full h-full">
                      {new Array(25).fill(0).map((_, i) => (
                        <div
                          key={i}
                          className={`w-full h-full rounded-[1px] ${
                            (i + 3) % 4 === 0 || (i * 2) % 3 === 0 || i < 5 || i % 5 === 0 ? 'bg-indigo-950' : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[8px] font-mono tracking-widest text-slate-400 uppercase">Verify QR</span>
                </div>

                <div className="space-y-1 text-right">
                  <span className="text-slate-400 block uppercase tracking-wider font-semibold">Certificate ID</span>
                  <span className="font-mono text-slate-700 font-bold">{certificate.certificateId}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CourseView;
