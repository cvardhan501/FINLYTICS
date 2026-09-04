'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  User,
  Lock,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function RestoreAccountPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1 State: Verification
  const [oldUsername, setOldUsername] = useState('vishnu123');
  const [oldPassword, setOldPassword] = useState('oldpass123');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [migrationToken, setMigrationToken] = useState('');

  // Step 2 State: Restore Preview Data
  const [preview, setPreview] = useState<any>(null);

  // Step 3 State: Upgrade Form
  const [name, setName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [upgradeError, setUpgradeError] = useState('');
  const [migrating, setMigrating] = useState(false);

  // Step 4 State: Progress Steps
  const [progressStage, setProgressStage] = useState(0);

  // Step 1: Verify Old Credentials
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyError('');

    try {
      const res = await fetch('/api/auth/legacy/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: oldUsername, password: oldPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Credential verification failed');
      }

      setMigrationToken(data.migrationToken);

      // Fetch Preview Data
      const previewRes = await fetch('/api/auth/legacy/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ migrationToken: data.migrationToken }),
      });
      const previewData = await previewRes.json();

      setPreview(previewData);
      setStep(2); // Go to Preview
    } catch (err: any) {
      setVerifyError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  // Step 3: Complete Migration with New Email & Password
  const handleCompleteUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setUpgradeError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setUpgradeError('Password must be at least 6 characters');
      return;
    }

    setMigrating(true);
    setUpgradeError('');
    setStep(4); // Show progress

    // Animated progress stages
    const stages = [
      'Account verified',
      'Categories restored',
      'Transactions restored',
      'Loans & Payments restored',
      'Budgets & Log Book restored',
      'Finalizing account...',
    ];

    for (let i = 0; i < stages.length; i++) {
      setProgressStage(i);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    try {
      const res = await fetch('/api/auth/legacy/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          migrationToken,
          name: name || oldUsername,
          email: newEmail,
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStep(3);
        throw new Error(data.error || 'Migration failed');
      }

      setStep(5); // Show Success Screen
    } catch (err: any) {
      setStep(3);
      setUpgradeError(err.message);
      setMigrating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto overflow-hidden shadow-md border border-gray-100 dark:border-slate-800">
            <img src="/logo.png" alt="FINLYTICS Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white pt-2">
            Restore Previous Account
          </h1>
          <p className="text-xs text-[#187A4E] dark:text-emerald-400 font-semibold tracking-wide">
            FINLYTICS Data Migration
          </p>
        </div>

        {/* STEP 1: Verify Old Credentials */}
        {step === 1 && (
          <form onSubmit={handleVerify} className="space-y-4 text-xs">
            <div>
              <p className="text-gray-500 mb-3 text-center">
                Enter your previous account username and password to verify your financial data.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Old Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. vishnu123"
                  value={oldUsername}
                  onChange={(e) => setOldUsername(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Old Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
                />
              </div>
            </div>

            {verifyError && (
              <div className="p-3 bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-lg font-medium">
                {verifyError}
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 bg-[#187A4E] hover:bg-[#13633F] text-white font-bold text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {verifying ? (
                <span>Verifying Account...</span>
              ) : (
                <>
                  <span>Verify Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link href="/auth/login" className="text-gray-500 hover:text-gray-800 font-medium">
                Already have a new account? <strong className="text-[#187A4E]">Sign In</strong>
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: Restore Preview */}
        {step === 2 && preview && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center font-bold">
              ✓ Previous Account Found ({preview.username})
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl border border-gray-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider mb-2">
                Historical Data Found
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between py-1 border-b border-gray-200 dark:border-slate-700">
                  <span className="text-gray-500">Transactions</span>
                  <span className="font-bold text-gray-900 dark:text-white">{preview.counts.transactions}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200 dark:border-slate-700">
                  <span className="text-gray-500">Loans & Debt</span>
                  <span className="font-bold text-gray-900 dark:text-white">{preview.counts.loans}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200 dark:border-slate-700">
                  <span className="text-gray-500">Loan Payments</span>
                  <span className="font-bold text-gray-900 dark:text-white">{preview.counts.loanPayments}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200 dark:border-slate-700">
                  <span className="text-gray-500">Budgets</span>
                  <span className="font-bold text-gray-900 dark:text-white">{preview.counts.budgets}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Log Book</span>
                  <span className="font-bold text-gray-900 dark:text-white">{preview.counts.logs}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Categories</span>
                  <span className="font-bold text-gray-900 dark:text-white">{preview.counts.categories}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 pt-2 italic">Last activity: {preview.lastActivityDate}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-2/3 py-2.5 bg-[#187A4E] text-white font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Continue Upgrade</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Email & New Password Setup */}
        {step === 3 && (
          <form onSubmit={handleCompleteUpgrade} className="space-y-4 text-xs">
            <div className="space-y-1">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Secure Your Account</h3>
              <p className="text-gray-500">
                Add an email address and new password so you can reset your password and receive notifications.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Vishnu Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                New Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="vishnu@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Min 6 chars"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Re-type"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
            </div>

            {upgradeError && (
              <div className="p-3 bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-lg font-medium">
                {upgradeError}
              </div>
            )}

            <button
              type="submit"
              disabled={migrating}
              className="w-full py-3 bg-[#187A4E] hover:bg-[#13633F] text-white font-bold text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Restore & Upgrade Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 4: Live Progress Indicator */}
        {step === 4 && (
          <div className="space-y-4 text-xs text-center py-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Restoring Your Account...</h3>
            <div className="space-y-2 text-left bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
              {[
                'Account verified',
                'Categories restored',
                'Transactions restored',
                'Loans & Payments restored',
                'Budgets & Log Book restored',
                'Finalizing account...',
              ].map((stageLabel, idx) => (
                <div key={stageLabel} className="flex items-center gap-2">
                  {idx <= progressStage ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                  )}
                  <span
                    className={
                      idx <= progressStage
                        ? 'font-bold text-gray-900 dark:text-white'
                        : 'text-gray-400'
                    }
                  >
                    {stageLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Success Screen */}
        {step === 5 && (
          <div className="space-y-4 text-xs text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#187A4E] dark:bg-emerald-950 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                Your Account Is Ready 🎉
              </h2>
              <p className="text-gray-500 mt-1">
                Your previous FINLYTICS financial data has been fully restored and linked.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-xl text-left space-y-1 font-semibold">
              <p>✓ Secured with email ({newEmail})</p>
              <p>✓ Resend password recovery active</p>
              <p>✓ Modern FINLYTICS session initialized</p>
            </div>

            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-[#187A4E] hover:bg-[#13633F] text-white font-bold text-sm rounded-lg shadow-xs"
            >
              Continue to FINLYTICS Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
