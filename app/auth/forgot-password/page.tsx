'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send password reset email.');
      }

      setSuccessMsg(data.message || 'Password reset link sent to your email successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process password reset request.');
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
            Enter your registered email address to receive a secure password reset link.
          </p>
        </div>

        {/* Animated Green Tick Checkmark Banner when Email Sent Successfully */}
        {successMsg ? (
          <div className="p-6 bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center space-y-3 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md animate-bounce">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
              Email Sent Successfully!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed font-medium">
              {successMsg}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
              Check your inbox & spam folder. The link is valid for 15 minutes.
            </p>
            <div className="pt-2">
              <Link
                href="/auth/login"
                className="inline-block px-4 py-2 bg-[#187A4E] text-white font-bold text-xs rounded-lg shadow-xs hover:bg-[#13633F] transition-colors"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
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

            {/* Error / Failure Message Banner */}
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-800 dark:bg-red-950/70 dark:text-red-300 border border-red-200 dark:border-red-900 rounded-lg font-medium flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
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
        )}
      </div>
    </div>
  );
}
