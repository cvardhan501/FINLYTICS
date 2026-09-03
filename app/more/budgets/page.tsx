'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { useAuth } from '@/components/providers/AuthProvider';
import { PieChart, Plus, AlertTriangle, CheckCircle2, ChevronRight, PlusCircle, Trash2, X } from 'lucide-react';
import { formatCurrency } from '@/lib/finance/calculations';

export default function BudgetsPage() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddBudgetModalOpen, setIsAddBudgetModalOpen] = useState(false);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Overall');

  // Delete budget confirmation state
  const [deletingBudget, setDeletingBudget] = useState<any>(null);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/budgets');
      const data = await res.json();
      setBudgets(data.budgets || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          amount: parseFloat(amount),
          category: category !== 'Overall' ? category : '',
        }),
      });

      if (res.ok) {
        setIsAddBudgetModalOpen(false);
        setName('');
        setAmount('');
        fetchBudgets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBudget = async () => {
    if (!deletingBudget) return;
    const budgetId = deletingBudget.id || deletingBudget._id;

    setBudgets((prev) => prev.filter((b) => (b.id || b._id) !== budgetId));
    setDeletingBudget(null);

    try {
      await fetch(`/api/budgets/${budgetId}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Delete budget error:', e);
      fetchBudgets();
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
                Monthly Budgets
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Track monthly spending limits & threshold warnings
              </p>
            </div>

            <button
              onClick={() => setIsAddBudgetModalOpen(true)}
              className="px-3 py-2 bg-[#187A4E] hover:bg-[#13633F] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4 font-bold" />
              <span>Add Budget</span>
            </button>
          </div>

          {/* Budget List Cards */}
          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading budgets...</div>
            ) : budgets.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-8 text-center space-y-2 shadow-xs">
                <PieChart className="w-8 h-8 text-[#187A4E] mx-auto" />
                <p className="text-sm font-bold text-gray-800 dark:text-slate-200">
                  No budgets set.
                </p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Create a budget to start planning your spending limits.
                </p>
                <button
                  onClick={() => setIsAddBudgetModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3.5 py-2 bg-[#187A4E] text-white font-bold rounded-lg text-xs mt-2"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create Budget</span>
                </button>
              </div>
            ) : (
              budgets.map((b) => (
                <div
                  key={b.id || b._id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs space-y-2.5 hover:border-emerald-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-[#187A4E]" />
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white">{b.name}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {b.isOverBudget ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-950/60 dark:text-red-400 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Over budget
                        </span>
                      ) : b.isWarning ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Warning (80%+)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#187A4E] bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> On Track
                        </span>
                      )}

                      <button
                        onClick={() => setDeletingBudget(b)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-600 dark:text-slate-400">
                      Spent: {formatCurrency(b.spent, user?.currency)} of{' '}
                      {formatCurrency(b.amount, user?.currency)}
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">{b.percentage}% used</span>
                  </div>

                  <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        b.isOverBudget ? 'bg-red-500' : b.isWarning ? 'bg-amber-500' : 'bg-[#187A4E]'
                      }`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      <MobileNav onOpenAddModal={() => setIsAddModalOpen(true)} />
      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Add Budget Modal */}
      {isAddBudgetModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-xs">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Create Monthly Budget</h3>
            <form onSubmit={handleCreateBudget} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Budget Name</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Overall or Dining Out"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Budget Amount ({user?.currency || 'INR'})</label>
                <input
                  type="number"
                  placeholder="10000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Category (Optional)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                >
                  <option value="Overall">Overall Monthly Budget</option>
                  <option value="Food">Food & Dining</option>
                  <option value="Transport">Transport & Travel</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Bills">Bills & Utilities</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBudgetModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#187A4E] text-white font-bold rounded-lg shadow-xs"
                >
                  Create Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Budget Confirmation Modal */}
      {deletingBudget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                Delete this budget?
              </h3>
              <button
                onClick={() => setDeletingBudget(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-slate-300 text-xs leading-relaxed">
              This will remove this budget from FINLYTICS. Your transactions and transaction history will not be deleted.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingBudget(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBudget}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg shadow-xs hover:bg-red-700"
              >
                Delete Budget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
