'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  Search,
  Plus,
  Trash2,
  Utensils,
  Car,
  ShoppingBag,
  Briefcase,
  HeartPulse,
  Film,
  Tag,
  Gift,
  Laptop,
} from 'lucide-react';
import { formatCurrency } from '@/lib/finance/calculations';

export default function TransactionsPage() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterType !== 'all') query.append('type', filterType);
      if (filterCategory !== 'all') query.append('category', filterCategory);
      if (searchQuery) query.append('search', searchQuery);

      const res = await fetch(`/api/transactions?${query.toString()}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filterType, filterCategory, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      fetchTransactions();
    } catch (e) {
      console.error(e);
    }
  };

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food':
        return <Utensils className="w-4 h-4" />;
      case 'Transport':
        return <Car className="w-4 h-4" />;
      case 'Shopping':
        return <ShoppingBag className="w-4 h-4" />;
      case 'Health':
        return <HeartPulse className="w-4 h-4" />;
      case 'Entertainment':
        return <Film className="w-4 h-4" />;
      case 'Freelance':
        return <Laptop className="w-4 h-4" />;
      case 'Gift':
        return <Gift className="w-4 h-4" />;
      case 'Salary':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100 pb-20 md:pb-6">
      <Header userName={user?.name} currency={user?.currency || 'INR'} />

      <div className="max-w-6xl mx-auto flex">
        <DesktopSidebar onOpenAddModal={() => setIsAddModalOpen(true)} />

        <main className="flex-1 p-4 md:p-6 space-y-4 max-w-4xl overflow-x-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Transactions</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Complete record of your income & expenses
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-[#187A4E] hover:bg-[#13633F] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by description, category, or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {['all', 'expense', 'income'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-full capitalize font-semibold transition-colors whitespace-nowrap ${
                  filterType === t
                    ? 'bg-[#187A4E] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900'
                }`}
              >
                {t}
              </button>
            ))}

            <div className="h-4 w-px bg-gray-200 dark:bg-slate-800 mx-1 shrink-0" />

            {['all', 'Food', 'Transport', 'Shopping', 'Bills', 'Salary', 'Freelance'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                  filterCategory === cat
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Transaction Key Frame Container (Exact Same Frame as Home Page) */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  No transactions found
                </p>
                <p className="text-xs text-gray-500">
                  Start tracking your money by adding your first transaction.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {transactions.map((tx) => (
                  <div
                    key={tx.id || tx._id}
                    className="py-3 flex items-center justify-between text-xs hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                          tx.type === 'income'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {renderCategoryIcon(tx.category)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {tx.description}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                          {tx.category} • {tx.paymentMethod || 'UPI'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right shrink-0">
                      <div>
                        <p
                          className={`font-bold text-sm ${
                            tx.type === 'income'
                              ? 'text-[#187A4E] dark:text-emerald-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount, user?.currency)}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {tx.date
                            ? new Date(tx.date).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Today'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDelete(tx.id || tx._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <MobileNav onOpenAddModal={() => setIsAddModalOpen(true)} />
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
