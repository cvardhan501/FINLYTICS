'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { AddSavingsModal } from '@/components/savings/AddSavingsModal';
import { CreateGoalModal } from '@/components/savings/CreateGoalModal';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  PiggyBank,
  Plus,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Calendar,
  CreditCard,
  CheckCircle2,
  Laptop,
  Shield,
  Home,
  Car,
  Plane,
  GraduationCap,
  Gift,
  Heart,
} from 'lucide-react';
import { formatCurrency } from '@/lib/finance/calculations';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function SavingsPage() {
  const { user } = useAuth();
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [isAddSavingsModalOpen, setIsAddSavingsModalOpen] = useState(false);
  const [isCreateGoalModalOpen, setIsCreateGoalModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Summary state
  const [summary, setSummary] = useState({
    totalSavings: 0,
    savedThisMonth: 0,
    totalWithdrawn: 0,
    goalsProgress: 0,
    goalsCount: 0,
  });

  // Chart data state
  const [monthlyTrend, setMonthlyTrend] = useState<Array<{ month: string; deposits: number; withdrawals: number }>>([]);

  // Goals state
  const [goals, setGoals] = useState<any[]>([]);

  // Transactions state & filters
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [goalFilter, setGoalFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  const fetchSavingsData = async (signal?: AbortSignal) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const [sumRes, goalsRes, txRes] = await Promise.all([
        fetch('/api/savings', { signal }),
        fetch('/api/savings/goals', { signal }),
        fetch(
          `/api/savings/transactions?type=${typeFilter}&goalId=${goalFilter}&sortBy=${sortBy}&search=${encodeURIComponent(
            searchQuery
          )}`,
          { signal }
        ),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        if (sumData.summary) setSummary(sumData.summary);
        if (sumData.monthlyTrend) setMonthlyTrend(sumData.monthlyTrend);
      } else {
        setErrorMsg('Failed to load savings summary.');
      }

      if (goalsRes.ok) {
        const gData = await goalsRes.json();
        setGoals(gData.goals || []);
      }

      if (txRes.ok) {
        const tData = await txRes.json();
        setTransactions(tData.transactions || []);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('Fetch savings data error:', e);
        setErrorMsg('Unable to load savings data right now.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchSavingsData(controller.signal);
    return () => controller.abort();
  }, [typeFilter, goalFilter, sortBy, searchQuery]);

  const renderGoalIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Laptop':
        return <Laptop className="w-4 h-4 text-[#187A4E]" />;
      case 'Shield':
        return <Shield className="w-4 h-4 text-[#187A4E]" />;
      case 'Home':
        return <Home className="w-4 h-4 text-[#187A4E]" />;
      case 'Car':
        return <Car className="w-4 h-4 text-[#187A4E]" />;
      case 'Plane':
        return <Plane className="w-4 h-4 text-[#187A4E]" />;
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4 text-[#187A4E]" />;
      case 'Gift':
        return <Gift className="w-4 h-4 text-[#187A4E]" />;
      case 'Heart':
        return <Heart className="w-4 h-4 text-[#187A4E]" />;
      default:
        return <Target className="w-4 h-4 text-[#187A4E]" />;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      <Header userName={user?.name} currency={user?.currency || 'INR'} />

      <div className="flex-1 max-w-6xl w-full mx-auto flex overflow-hidden">
        {/* Desktop Sidebar */}
        <DesktopSidebar onOpenAddModal={() => setIsAddTransactionModalOpen(true)} />

        {/* Main Content Area - Confined Viewport Scroll */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-4xl pb-24 md:pb-6">
          {errorMsg && (
            <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 p-4 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={() => fetchSavingsData()}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Section 4: Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Savings</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Track your savings and every movement
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreateGoalModalOpen(true)}
                className="px-3 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Target className="w-4 h-4 text-[#187A4E]" />
                <span className="hidden sm:inline">+ Create Goal</span>
                <span className="sm:hidden">+ Goal</span>
              </button>

              <button
                onClick={() => setIsAddSavingsModalOpen(true)}
                className="px-3.5 py-2 bg-[#187A4E] hover:bg-[#13633F] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Add Savings</span>
              </button>
            </div>
          </div>

          {/* Section 5: Savings Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                Total Savings
              </span>
              <p className="text-lg font-extrabold text-[#187A4E] dark:text-emerald-400 mt-1">
                {formatCurrency(summary.totalSavings, user?.currency)}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                Saved This Month
              </span>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-300 mt-1">
                {formatCurrency(summary.savedThisMonth, user?.currency)}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                Total Withdrawn
              </span>
              <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {formatCurrency(summary.totalWithdrawn, user?.currency)}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                Goals Progress
              </span>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-1">
                {summary.goalsProgress}%
              </p>
            </div>
          </div>

          {/* Section 6: Savings Balance Card & Subtle Recharts Trend */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 block">
                  Savings Balance
                </span>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">
                  {formatCurrency(summary.totalSavings, user?.currency)}
                </h2>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Deposits</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Withdrawals</span>
                </div>
              </div>
            </div>

            {/* Subtle Line Chart */}
            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#187A4E" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#187A4E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWithdrawals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D97706" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="deposits"
                    name="Deposits"
                    stroke="#187A4E"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDeposits)"
                  />
                  <Area
                    type="monotone"
                    dataKey="withdrawals"
                    name="Withdrawals"
                    stroke="#D97706"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWithdrawals)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Section 7: Savings Goals */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-[#187A4E]" />
                <span>Savings Goals ({goals.length})</span>
              </h2>

              <button
                onClick={() => setIsCreateGoalModalOpen(true)}
                className="text-xs font-bold text-[#187A4E] dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                + Create Goal
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-8 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#187A4E] dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <PiggyBank className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white">No savings goals yet</h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Create your first target for emergency funds, tech purchases, or long-term growth.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateGoalModalOpen(true)}
                  className="px-4 py-2 bg-[#187A4E] hover:bg-[#13633F] text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ Create Goal</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {goals.map((g: any) => {
                  const targetFormattedDate = g.targetDate
                    ? new Date(g.targetDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                      })
                    : 'No target date';

                  return (
                    <div
                      key={g.id || g._id}
                      className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                            {renderGoalIcon(g.icon)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-xs leading-tight">
                              {g.name}
                            </h3>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500">
                              Target: {targetFormattedDate}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#187A4E] dark:bg-emerald-950/60 dark:text-emerald-400">
                          {g.percentage}%
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {formatCurrency(g.currentAmount, user?.currency)}
                          </span>
                          <span className="text-gray-400">
                            / {formatCurrency(g.targetAmount, user?.currency)}
                          </span>
                        </div>

                        <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#187A4E] dark:bg-emerald-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, g.percentage)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 8 & 9: Savings Transactions History */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">
                Savings Movements ({transactions.length})
              </h2>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
                />
              </div>
            </div>

            {/* Filter Pills & Sort Options */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800 pb-3 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                    typeFilter === 'all'
                      ? 'bg-[#187A4E] text-white'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTypeFilter('deposit')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                    typeFilter === 'deposit'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900'
                  }`}
                >
                  Deposits
                </button>
                <button
                  onClick={() => setTypeFilter('withdrawal')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                    typeFilter === 'withdrawal'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900'
                  }`}
                >
                  Withdrawals
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Goal Selector */}
                <select
                  value={goalFilter}
                  onChange={(e) => setGoalFilter(e.target.value)}
                  className="px-2.5 py-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none"
                >
                  <option value="all">All Goals</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>

                {/* Sort selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Amount</option>
                  <option value="lowest">Lowest Amount</option>
                </select>
              </div>
            </div>

            {/* Transactions List / Table */}
            {transactions.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-xs text-gray-400 dark:text-slate-500">
                <PiggyBank className="w-8 h-8 mx-auto opacity-40 mb-1" />
                <p className="font-semibold">No savings transactions yet</p>
                <p className="text-[11px]">Add your first deposit to start building your savings balance.</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-800 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        <th className="pb-2 pl-2">Date</th>
                        <th className="pb-2">Description</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Goal</th>
                        <th className="pb-2">Payment Method</th>
                        <th className="pb-2 pr-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 font-medium">
                      {transactions.map((tx) => {
                        const formattedDate = new Date(tx.date).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });
                        const isDeposit = tx.type === 'deposit';

                        return (
                          <tr key={tx.id || tx._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 pl-2 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                              {formattedDate}
                            </td>
                            <td className="py-2.5 font-semibold text-gray-900 dark:text-white">
                              {tx.note || (isDeposit ? 'Savings Deposit' : 'Savings Withdrawal')}
                            </td>
                            <td className="py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 ${
                                  isDeposit
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                }`}
                              >
                                {isDeposit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                {isDeposit ? 'Deposit' : 'Withdrawal'}
                              </span>
                            </td>
                            <td className="py-2.5 text-gray-600 dark:text-slate-400">
                              {tx.goalName ? (
                                <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-[10px] font-semibold text-gray-700 dark:text-slate-300">
                                  {tx.goalName}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-2.5 text-gray-500 dark:text-slate-400">
                              {tx.paymentMethod || 'UPI'}
                            </td>
                            <td className={`py-2.5 pr-2 text-right font-extrabold text-sm ${
                              isDeposit ? 'text-[#187A4E] dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                            }`}>
                              {isDeposit ? '+ ' : '- '}
                              {formatCurrency(tx.amount, user?.currency)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Compact Cards View */}
                <div className="md:hidden space-y-2">
                  {transactions.map((tx) => {
                    const formattedDate = new Date(tx.date).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    });
                    const isDeposit = tx.type === 'deposit';

                    return (
                      <div
                        key={tx.id || tx._id}
                        className="p-3 bg-gray-50/70 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isDeposit
                                ? 'bg-emerald-100 text-[#187A4E] dark:bg-emerald-950 dark:text-emerald-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            }`}
                          >
                            {isDeposit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>

                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">
                              {tx.note || (isDeposit ? 'Savings Deposit' : 'Savings Withdrawal')}
                            </h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {formattedDate} • {tx.paymentMethod || 'UPI'}
                              {tx.goalName ? ` • ${tx.goalName}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className={`text-right font-extrabold text-sm ${
                          isDeposit ? 'text-[#187A4E] dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {isDeposit ? '+ ' : '- '}
                          {formatCurrency(tx.amount, user?.currency)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Strictly unchanged 5 items) */}
      <MobileNav onOpenAddModal={() => setIsAddTransactionModalOpen(true)} />

      {/* Global Quick Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={() => setIsAddTransactionModalOpen(false)}
      />

      {/* Add Savings Transaction Modal */}
      <AddSavingsModal
        isOpen={isAddSavingsModalOpen}
        onClose={() => setIsAddSavingsModalOpen(false)}
        onSuccess={() => fetchSavingsData()}
        currentTotalSavings={summary.totalSavings}
        currency={user?.currency}
        goals={goals}
      />

      {/* Create Savings Goal Modal */}
      <CreateGoalModal
        isOpen={isCreateGoalModalOpen}
        onClose={() => setIsCreateGoalModalOpen(false)}
        onSuccess={() => fetchSavingsData()}
        currency={user?.currency}
      />
    </div>
  );
}
