import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Award, Mail } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetCode('');
    setLoading(true);

    try {
      const res = await API.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setMessage('Reset code generated successfully! Under production email setups this code is mailed, but for evaluation, your code is displayed below:');
        setResetCode(res.data.resetCode);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-200">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-800/80">
        
        {/* Brand logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg mb-3">
            <Award className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Recover Password</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Input your email to receive a password recovery code
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-medium space-y-3">
            <p>{message}</p>
            {resetCode && (
              <div className="bg-emerald-500/20 text-emerald-900 dark:text-emerald-100 font-mono text-center py-2 text-lg font-bold rounded-lg tracking-widest">
                {resetCode}
              </div>
            )}
            <button
              onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}&code=${resetCode}`)}
              className="w-full text-center block bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 rounded-xl text-xs"
            >
              Proceed to Reset Password
            </button>
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Generate Reset Code'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-xs">
          <span className="text-slate-400">Remember password? </span>
          <Link to="/login" className="font-semibold text-indigo-500 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
