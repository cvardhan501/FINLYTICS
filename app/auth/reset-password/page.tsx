'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Check } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      setStatusMsg(data.message);
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Reset Password</h1>
        <p className="text-xs text-gray-500 mt-1">
          Enter your new account password below.
        </p>
      </div>

      <form onSubmit={handleReset} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
            />
          </div>
        </div>

        {statusMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg font-medium flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-lg font-medium">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#187A4E] hover:bg-[#13633F] text-white font-bold text-sm rounded-lg shadow-xs transition-colors"
        >
          {loading ? 'Updating Password...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      <Suspense fallback={<div className="text-xs text-gray-400">Loading reset form...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
