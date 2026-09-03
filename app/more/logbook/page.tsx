'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { useAuth } from '@/components/providers/AuthProvider';
import { BookOpen, Plus, Search, Calendar, Lock, Tag, Trash2, PlusCircle } from 'lucide-react';

export default function LogBookPage() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNewLogModalOpen, setIsNewLogModalOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // New Log Form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('financial');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/logbook?search=${searchQuery}&category=${selectedCategory}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchQuery, selectedCategory]);

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      const res = await fetch('/api/logbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category,
          date: new Date().toISOString(),
          isPrivate: true,
        }),
      });

      if (res.ok) {
        setIsNewLogModalOpen(false);
        setTitle('');
        setContent('');
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100 pb-20 md:pb-6">
      <Header userName={user?.name} currency={user?.currency || 'INR'} />

      <div className="max-w-6xl mx-auto flex">
        <DesktopSidebar onOpenAddModal={() => setIsAddModalOpen(true)} />

        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">
                Financial Log Book
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Personal encrypted diary for notes, monthly reviews & financial thoughts
              </p>
            </div>

            <button
              onClick={() => setIsNewLogModalOpen(true)}
              className="px-3 py-2 bg-[#187A4E] hover:bg-[#13633F] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search log entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-xs"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-xs font-semibold"
            >
              <option value="all">All Categories</option>
              <option value="financial">Financial Review</option>
              <option value="personal">Personal Notes</option>
              <option value="loan">Loan Notes</option>
            </select>
          </div>

          {/* Log Entries */}
          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading log book...</div>
            ) : logs.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-8 text-center space-y-2 shadow-xs">
                <BookOpen className="w-8 h-8 text-[#187A4E] mx-auto" />
                <p className="text-sm font-bold text-gray-800 dark:text-slate-200">
                  Your financial log is empty
                </p>
                <p className="text-xs text-gray-500">
                  Write down financial goals, monthly reviews, or loan reminders.
                </p>
                <button
                  onClick={() => setIsNewLogModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3.5 py-2 bg-[#187A4E] text-white font-bold rounded-lg text-xs mt-2"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create First Entry</span>
                </button>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id || log._id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {log.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#187A4E] dark:text-emerald-400 text-[10px] font-semibold capitalize">
                        {log.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                      <Lock className="w-3 h-3" />
                      <span>
                        {new Date(log.date).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                    "{log.content}"
                  </p>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      <MobileNav onOpenAddModal={() => setIsAddModalOpen(true)} />
      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* New Log Dialog */}
      {isNewLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              Write New Log Entry
            </h3>

            <form onSubmit={handleCreateLog} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Entry Title</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Expense Reflection"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs font-medium"
                >
                  <option value="financial">Financial Planning</option>
                  <option value="personal">Personal Budget Note</option>
                  <option value="loan">Loan / Borrower Note</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Log Content</label>
                <textarea
                  rows={4}
                  placeholder="Write your thoughts..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewLogModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#187A4E] text-white font-bold rounded-lg shadow-xs"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
