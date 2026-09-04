'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { AnimatedMoney } from '@/components/common/AnimatedMoney';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ChevronRight,
  Utensils,
  Car,
  ShoppingBag,
  Briefcase,
  AlertTriangle,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  PlusCircle,
  Trash2,
  X,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@/lib/finance/calculations';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dashboard summary state
  const [summary, setSummary] = useState<any>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    netWorth: 0,
    overallBudget: null,
    recentTransactions: [],
    notifications: [],
    upcomingObligations: [],
  });

  const fetchDashboardSummary = async (signal?: AbortSignal) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/dashboard/summary', { signal });
      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      if (res.status === 503) {
        setErrorMsg('Unable to connect to database service. Please retry.');
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          setSummary(data.summary);
        }
      } else {
        setErrorMsg('Unable to load your financial data right now.');
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('Error loading dashboard summary:', e);
        setErrorMsg('Unable to load your financial data right now.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboardSummary(controller.signal);
    return () => controller.abort();
  }, []);

  const handleClearSmartAlerts = async () => {
    setSummary((prev: any) => ({ ...prev, notifications: [] }));
    try {
      await fetch('/api/notifications', { method: 'DELETE' });
    } catch (e) {
      console.error('Clear alerts error:', e);
    }
  };

  const handleDismissSingleAlert = async (id: string) => {
    setSummary((prev: any) => ({
      ...prev,
      notifications: (prev.notifications || []).filter(
        (n: any) => (n.id || n._id) !== id
      ),
    }));
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Dismiss alert error:', e);
    }
  };

  const totalBalance = summary.totalBalance || 0;
  const totalIncome = summary.totalIncome || 0;
  const totalExpense = summary.totalExpense || 0;
  const overallBudget = summary.overallBudget;
  const transactions = summary.recentTransactions || [];
  const notifications = summary.notifications || [];
  const upcomingObligations = summary.upcomingObligations || [];

  const activeAlerts = notifications.filter(
    (n: any) => n.priority === 'urgent' || n.priority === 'warning'
  );

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100 pb-20 md:pb-6">
        <Header
          userName={user?.name}
          currency={user?.currency || 'INR'}
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
        />

        <div className="max-w-6xl mx-auto flex">
          {/* Desktop Sidebar */}
          <DesktopSidebar onOpenAddModal={() => setIsAddModalOpen(true)} />

          {/* Main Dashboard Content */}
          <main className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl">
            {errorMsg && (
              <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 p-4 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button
                  onClick={() => fetchDashboardSummary()}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Top Greeting & Balance Card */}
            <section className="bg-[#187A4E] text-white rounded-2xl p-5 md:p-6 shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-emerald-100 uppercase tracking-wide">
                    Welcome back, {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-emerald-200 mt-0.5">Manage your money with confidence</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white/10 text-emerald-100 text-xs font-medium border border-white/15">
                  FINLYTICS Protected
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-emerald-200">Total Balance</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
                  <AnimatedMoney value={totalBalance} currency={user?.currency} />
                </h2>
              </div>

              {/* Income vs Expenses Summary */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-emerald-600/60 text-xs">
                <div className="flex items-center gap-2.5 bg-black/10 rounded-xl p-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                    <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-emerald-200 block text-[11px]">Income</span>
                    <span className="font-bold text-sm text-white">
                      <AnimatedMoney value={totalIncome} currency={user?.currency} />
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-black/10 rounded-xl p-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-300">
                    <TrendingDown className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-emerald-200 block text-[11px]">Expenses</span>
                    <span className="font-bold text-sm text-white">
                      <AnimatedMoney value={totalExpense} currency={user?.currency} />
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Smart Alerts Section with Clear & Dismiss Actions */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#187A4E] dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Smart Alerts
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearSmartAlerts}
                      className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                      title="Clear All Alerts"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear Alerts</span>
                    </button>
                  )}

                  <Link
                    href="/more/notifications"
                    className="text-xs font-semibold text-[#187A4E] dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    View All ({notifications.length}) <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {activeAlerts.length === 0 ? (
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-[#187A4E]" />
                  <span className="font-medium">No financial alerts yet. You're all caught up.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeAlerts.slice(0, 3).map((alert: any) => {
                    const alertId = alert.id || alert._id;
                    return (
                      <div
                        key={alertId}
                        className={`p-3 rounded-lg flex items-start gap-2.5 border transition-colors group ${
                          alert.priority === 'urgent'
                            ? 'bg-red-50/60 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-200'
                            : 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <Link
                          href={alert.linkUrl || '/more/notifications'}
                          className="text-xs flex-1 hover:underline"
                        >
                          <p className="font-bold">{alert.title}</p>
                          <p className="text-[11px] opacity-90 mt-0.5">{alert.message}</p>
                        </Link>

                        <button
                          onClick={() => handleDismissSingleAlert(alertId)}
                          className="p-1 opacity-60 hover:opacity-100 hover:text-red-700 dark:hover:text-red-300 transition-opacity"
                          title="Dismiss Alert"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Upcoming Obligations Section */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#187A4E] dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Upcoming Commitments
                  </h3>
                </div>
                <Link
                  href="/more/bills"
                  className="text-xs font-semibold text-[#187A4E] dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {upcomingObligations.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 dark:bg-slate-800/40 rounded-lg">
                  No upcoming commitments.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {upcomingObligations.map((item: any) => (
                    <Link
                      key={item.id}
                      href={item.link}
                      className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 hover:border-emerald-500 transition-colors"
                    >
                      <div className="flex justify-between items-start text-xs mb-1">
                        <span className="text-[10px] font-bold text-[#187A4E] dark:text-emerald-400 uppercase">
                          {item.subtitle}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(item.date).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-sm font-extrabold text-gray-900 dark:text-white mt-1">
                        {formatCurrency(item.amount, user?.currency)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Monthly Budget Progress Card */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-[#187A4E] dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Monthly Budget Progress
                  </h3>
                </div>
                <Link
                  href="/more/budgets"
                  className="text-xs font-semibold text-[#187A4E] dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                >
                  Manage <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {!overallBudget || overallBudget.budgetAmount === 0 ? (
                <div className="p-4 text-center text-xs space-y-2 bg-gray-50 dark:bg-slate-800/40 rounded-lg">
                  <p className="text-gray-500">No monthly budget set.</p>
                  <Link
                    href="/more/budgets"
                    className="inline-flex items-center gap-1 font-bold text-[#187A4E] hover:underline"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create Budget</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-600 dark:text-slate-400">
                      Spent:{' '}
                      <strong className="text-gray-900 dark:text-white">
                        {formatCurrency(overallBudget.spent, user?.currency)}
                      </strong>
                    </span>
                    <span className="text-gray-600 dark:text-slate-400">
                      Budget:{' '}
                      <strong className="text-gray-900 dark:text-white">
                        {formatCurrency(overallBudget.budgetAmount, user?.currency)}
                      </strong>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        overallBudget.percentage > 100 ? 'bg-red-500' : 'bg-[#187A4E]'
                      }`}
                      style={{ width: `${Math.min(100, overallBudget.percentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500 dark:text-slate-400">
                    <span>
                      Remaining:{' '}
                      {formatCurrency(
                        Math.max(0, overallBudget.budgetAmount - overallBudget.spent),
                        user?.currency
                      )}
                    </span>
                    <span className="font-semibold">{overallBudget.percentage}% Used</span>
                  </div>
                </div>
              )}
            </section>

            {/* Quick Actions Bar */}
            <section className="grid grid-cols-4 gap-2">
              <Link
                href="/loans"
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:border-emerald-500 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-[#187A4E] dark:text-emerald-400 flex items-center justify-center mb-1.5">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-gray-800 dark:text-slate-200">
                  Loans
                </span>
              </Link>

              <Link
                href="/analytics"
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:border-emerald-500 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-gray-800 dark:text-slate-200">
                  Analytics
                </span>
              </Link>

              <Link
                href="/more/bills"
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:border-emerald-500 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-gray-800 dark:text-slate-200">
                  Bills
                </span>
              </Link>

              <Link
                href="/more/logbook"
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:border-emerald-500 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5">
                  <PiggyBank className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-gray-800 dark:text-slate-200">
                  Log Book
                </span>
              </Link>
            </section>

            {/* Recent Transactions List */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Recent Transactions
                </h3>
                <Link
                  href="/transactions"
                  className="text-xs font-semibold text-[#187A4E] dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                >
                  See All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {transactions.length === 0 ? (
                <div className="p-6 text-center text-xs space-y-2">
                  <p className="text-gray-500 font-medium">No transactions yet.</p>
                  <p className="text-gray-400 text-[11px]">
                    Start tracking your money by adding your first transaction.
                  </p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#187A4E] text-white font-bold rounded-lg text-xs mt-2"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Transaction</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {transactions.slice(0, 5).map((tx: any) => (
                    <div key={tx.id || tx._id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ${
                            tx.type === 'income'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {tx.category === 'Food' ? (
                            <Utensils className="w-4 h-4" />
                          ) : tx.category === 'Transport' ? (
                            <Car className="w-4 h-4" />
                          ) : tx.category === 'Shopping' ? (
                            <ShoppingBag className="w-4 h-4" />
                          ) : (
                            <Briefcase className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{tx.description}</p>
                          <p className="text-[11px] text-gray-500 dark:text-slate-400">
                            {tx.category} • {tx.paymentMethod || 'UPI'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
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
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>

        {/* Mobile Navigation */}
        <MobileNav onOpenAddModal={() => setIsAddModalOpen(true)} />

        {/* Add Transaction Dialog */}
        <AddTransactionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={fetchDashboardSummary}
        />
      </div>
    </div>
  );
}
