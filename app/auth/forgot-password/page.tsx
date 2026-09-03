'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      setMessage('Failed to process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-slate-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Forgot Password</h1>
          <p className="text-xs text-gray-500 mt-1">
            Enter your registered email address to receive a secure password reset link via Resend.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
              />
            </div>
          </div>

          {message && (
            <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg font-medium">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#187A4E] hover:bg-[#13633F] text-white font-bold text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Sending Email...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Reset Link</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
