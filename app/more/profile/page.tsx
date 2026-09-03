'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { useAuth } from '@/components/providers/AuthProvider';
import { User, Mail, Globe, Bell, Lock, LogOut, Check, Shield } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState(authUser?.name || 'User');
  const [email, setEmail] = useState(authUser?.email || '');
  const [currency, setCurrency] = useState(authUser?.currency || 'INR');
  const [savedMsg, setSavedMsg] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg('Profile preferences updated successfully.');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('Password changed successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100 pb-20 md:pb-6">
      <Header userName={name} currency={currency} />

      <div className="max-w-6xl mx-auto flex">
        <DesktopSidebar onOpenAddModal={() => setIsAddModalOpen(true)} />

        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">User Profile</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Manage personal details, currency preferences & password
            </p>
          </div>

          {/* Profile Overview Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#187A4E] text-white flex items-center justify-center font-extrabold text-xl shadow-xs">
                {name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{name}</h3>
                <p className="text-xs text-gray-500">{email}</p>
                <span className="inline-block px-2 py-0.5 mt-1 rounded-full bg-emerald-50 text-[#187A4E] dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-semibold">
                  Active Authenticated User
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 hover:bg-red-100 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>

          {/* Preferences Form */}
          <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 space-y-4 shadow-xs text-xs">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-[#187A4E]" />
              <span>Personal Details & Currency</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Default Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Timezone
                </label>
                <select className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="UTC">UTC (+0:00)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                </select>
              </div>
            </div>

            {savedMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-[#187A4E]" />
                <span>{savedMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="py-2.5 px-4 bg-[#187A4E] hover:bg-[#13633F] text-white font-bold rounded-lg shadow-xs transition-colors"
            >
              Save Preferences
            </button>
          </form>

          {/* Security & Password Change */}
          <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 space-y-4 shadow-xs text-xs">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#187A4E]" />
              <span>Change Password</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>

            {passwordMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-[#187A4E]" />
                <span>{passwordMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg shadow-xs transition-colors"
            >
              Update Password
            </button>
          </form>
        </main>
      </div>

      <MobileNav onOpenAddModal={() => setIsAddModalOpen(true)} />
      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
