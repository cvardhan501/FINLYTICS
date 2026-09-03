'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  Bell,
  Check,
  HandCoins,
  FileCheck2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Trash2,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?category=${selectedCategory}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [selectedCategory]);

  const handleMarkAllRead = async () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    setIsClearConfirmOpen(false);
    try {
      await fetch('/api/notifications', { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteIndividual = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => (n.id || n._id) !== id));
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => ((n.id || n._id) === id ? { ...n, isRead: true } : n))
    );
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      const data = await res.json();
      if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
    } catch (e) {
      console.error(e);
    }
  };

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'loans', label: 'Loans' },
    { key: 'bills', label: 'Bills' },
    { key: 'budgets', label: 'Budgets' },
    { key: 'recurring', label: 'Recurring' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100 pb-20 md:pb-6">
      <Header userName={user?.name} currency={user?.currency || 'INR'} />

      <div className="max-w-6xl mx-auto flex">
        <DesktopSidebar onOpenAddModal={() => setIsAddModalOpen(true)} />

        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#187A4E]" />
                <span>Smart Financial Notifications</span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Proactive alerts for loans, bills, budget limits & recurring expenses
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-4 h-4 text-[#187A4E]" />
                  <span>Mark All Read</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={() => setIsClearConfirmOpen(true)}
                  className="px-3 py-1.5 bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 hover:bg-red-100 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key)}
                className={`px-3 py-1.5 rounded-full font-semibold transition-colors whitespace-nowrap ${
                  selectedCategory === c.key
                    ? 'bg-[#187A4E] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800 shadow-xs">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-gray-800 dark:text-slate-200">
                  No notifications yet.
                </p>
                <p className="text-xs text-gray-500">You're all caught up.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const notifId = n.id || n._id;
                const isUrgent = n.priority === 'urgent';
                const isWarning = n.priority === 'warning';

                return (
                  <div
                    key={notifId}
                    className={`p-4 flex items-start gap-3 transition-colors group ${
                      !n.isRead ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isUrgent
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                          : isWarning
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                          : 'bg-emerald-50 text-[#187A4E] dark:bg-emerald-950/60 dark:text-emerald-400'
                      }`}
                    >
                      {n.category === 'loans' ? (
                        <HandCoins className="w-4 h-4" />
                      ) : n.category === 'bills' ? (
                        <FileCheck2 className="w-4 h-4" />
                      ) : n.category === 'budgets' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">{n.title}</h4>
                          {!n.isRead && (
                            <button
                              onClick={() => handleMarkSingleRead(notifId)}
                              className="text-[10px] font-semibold text-[#187A4E] dark:text-emerald-400 hover:underline"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Just now'}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
                        {n.message}
                      </p>
                      {n.linkUrl && (
                        <Link
                          href={n.linkUrl}
                          className="inline-flex items-center gap-1 font-bold text-[#187A4E] dark:text-emerald-400 hover:underline pt-1"
                        >
                          <span>Take Action</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteIndividual(notifId)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      <MobileNav onOpenAddModal={() => setIsAddModalOpen(true)} />
      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Clear All Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                Clear all notifications?
              </h3>
              <button
                onClick={() => setIsClearConfirmOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-slate-300 text-xs">
              This will remove all notifications from your notification center.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg shadow-xs hover:bg-red-700"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
