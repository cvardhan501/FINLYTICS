'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { useAuth } from '@/components/providers/AuthProvider';
import { AnimatedMoney } from '@/components/common/AnimatedMoney';
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/finance/calculations';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly'>('monthly');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalyticsData() {
      setLoading(true);
      try {
        const res = await fetch('/api/transactions');
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalyticsData();
  }, []);

  // Calculate real metrics from user's database transactions
  const expenses = transactions.filter((t) => t.type === 'expense');
  const incomeTxs = transactions.filter((t) => t.type === 'income');

  const totalExpense = expenses.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const totalIncome = incomeTxs.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const savingsRate =
    totalIncome > 0
      ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
      : 0;

  // Aggregate category breakdown
  const categoryMap: Record<string, number> = {};
  expenses.forEach((t) => {
    const cat = t.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + (Number(t.amount) || 0);
  });

  const COLORS = ['#187A4E', '#D97706', '#0284C7', '#DC2626', '#8B5CF6', '#EC4899', '#6B7280'];
  const categoryData = Object.keys(categoryMap).map((cat, idx) => ({
    name: cat,
    value: categoryMap[cat],
    color: COLORS[idx % COLORS.length],
  }));

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100 pb-20 md:pb-6">
      <Header userName={user?.name} currency={user?.currency || 'INR'} />

      <div className="max-w-6xl mx-auto flex">
        <DesktopSidebar onOpenAddModal={() => setIsAddModalOpen(true)} />

        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Analytics</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Visual breakdown of spending, income & savings rate
              </p>
            </div>

            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setTimeframe('monthly')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  timeframe === 'monthly' ? 'bg-[#187A4E] text-white shadow-xs' : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimeframe('yearly')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  timeframe === 'yearly' ? 'bg-[#187A4E] text-white shadow-xs' : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>

          {/* Key Metrics Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Total Expenses
              </span>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-1">
                <AnimatedMoney value={totalExpense} currency={user?.currency} />
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Total Income
              </span>
              <p className="text-lg font-extrabold text-[#187A4E] dark:text-emerald-400 mt-1">
                <AnimatedMoney value={totalIncome} currency={user?.currency} />
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Savings Rate
              </span>
              <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                {savingsRate}%
              </p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-8 text-center space-y-2 shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-[#187A4E] mx-auto" />
              <p className="text-sm font-bold text-gray-800 dark:text-slate-200">
                No transaction data yet
              </p>
              <p className="text-xs text-gray-500">
                Add transactions to see your spending analytics and category breakdown.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                Expense Category Breakdown
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => formatCurrency(Number(val), user?.currency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                {categoryData.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-gray-600 dark:text-slate-400 truncate">{c.name}</span>
                    <span className="font-bold text-gray-900 dark:text-white ml-auto">
                      {formatCurrency(c.value, user?.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <MobileNav onOpenAddModal={() => setIsAddModalOpen(true)} />
      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
