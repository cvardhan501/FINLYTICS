'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  Target,
  Plus,
  CheckCircle2,
  AlertTriangle,
  History,
  Trash2,
  Filter,
  PlusCircle,
  X,
  CreditCard,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '@/lib/finance/calculations';

export default function SavingsGoalsPage() {
  const { user } = useAuth();
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);

  const [goals, setGoals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalSaved: 0,
    totalTarget: 0,
    activeGoalsCount: 0,
    completedGoalsCount: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Create Goal Modal State
  const [isCreateGoalModalOpen, setIsCreateGoalModalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialSavedAmount, setInitialSavedAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');

  // Add Money Modal State
  const [addMoneyGoal, setAddMoneyGoal] = useState<any>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [contributionNote, setContributionNote] = useState('');
  const [contributionError, setContributionError] = useState('');
  const [isSubmittingContribution, setIsSubmittingContribution] = useState(false);

  // Goal Detail & Savings History Modal State
  const [selectedGoal, setSelectedGoal] = useState<any>(null);

  const fetchGoalsData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/savings-goals?status=${statusFilter}`);
      const data = await res.json();
      setGoals(data.goals || []);
      if (data.summary) setSummary(data.summary);

      // Refresh selectedGoal reference if modal is open
      if (selectedGoal) {
        const updated = (data.goals || []).find(
          (g: any) => (g.id || g._id) === (selectedGoal.id || selectedGoal._id)
        );
        if (updated) setSelectedGoal(updated);
      }
    } catch (e) {
      console.error('Fetch savings goals error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalsData();
  }, [statusFilter]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !targetAmount || !targetDate) return;

    try {
      const res = await fetch('/api/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: goalName,
          targetAmount: parseFloat(targetAmount),
          currentAmount: parseFloat(initialSavedAmount) || 0,
          targetDate,
          category,
          priority,
          notes,
        }),
      });

      if (res.ok) {
        setIsCreateGoalModalOpen(false);
        setGoalName('');
        setTargetAmount('');
        setInitialSavedAmount('0');
        setTargetDate('');
        setNotes('');
        fetchGoalsData();
      }
    } catch (e) {
      console.error('Create goal error:', e);
    }
  };

  const openAddMoneyModal = (goal: any) => {
    setAddMoneyGoal(goal);
    setContributionAmount('');
    setPaymentMethod('UPI');
    setContributionNote('');
    setContributionError('');
  };

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMoneyGoal || !contributionAmount) return;

    const amt = parseFloat(contributionAmount);
    const remaining = addMoneyGoal.remainingAmount;

    if (amt > remaining + 0.01 && remaining > 0) {
      setContributionError(
        `Amount exceeds the remaining goal amount of ${formatCurrency(remaining, user?.currency)}.`
      );
      return;
    }

    setIsSubmittingContribution(true);
    setContributionError('');

    try {
      const res = await fetch(
        `/api/savings-goals/${addMoneyGoal.id || addMoneyGoal._id}/contributions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amt,
            date: new Date().toISOString(),
            paymentMethod,
            note: contributionNote,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setContributionError(data.error || 'Failed to add money towards goal');
        setIsSubmittingContribution(false);
        return;
      }

      setAddMoneyGoal(null);
      fetchGoalsData();
    } catch (e: any) {
      setContributionError(e.message || 'Contribution processing failed');
    } finally {
      setIsSubmittingContribution(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Delete this goal? This will remove the goal and its complete savings history.'))
      return;
    try {
      await fetch(`/api/savings-goals/${goalId}`, { method: 'DELETE' });
      setSelectedGoal(null);
      fetchGoalsData();
    } catch (e) {
      console.error('Delete goal error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100 pb-20 md:pb-6">
      <Header userName={user?.name} currency={user?.currency || 'INR'} />

      <div className="max-w-6xl mx-auto flex">
        <DesktopSidebar onOpenAddModal={() => setIsAddTransactionModalOpen(true)} />

        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Savings Goals</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Turn your plans into achievable financial goals
              </p>
            </div>

            <button
              onClick={() => setIsCreateGoalModalOpen(true)}
              className="px-3.5 py-2 bg-[#187A4E] hover:bg-[#13633F] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Goal</span>
            </button>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Total Saved
              </span>
              <p className="text-lg font-extrabold text-[#187A4E] dark:text-emerald-400 mt-1">
                {formatCurrency(summary.totalSaved || 0, user?.currency)}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Total Target
              </span>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-1">
                {formatCurrency(summary.totalTarget || 0, user?.currency)}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Completed Goals
              </span>
              <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                {summary.completedGoalsCount || 0} / {goals.length}
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'completed', label: 'Completed' },
              { key: 'overdue', label: 'Overdue' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1 rounded-full font-medium transition-colors whitespace-nowrap ${
                  statusFilter === f.key
                    ? 'bg-[#187A4E] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Savings Goals List */}
          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading goals...</div>
            ) : goals.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-8 text-center space-y-3 shadow-xs">
                <Target className="w-10 h-10 text-[#187A4E] mx-auto" />
                <p className="text-sm font-bold text-gray-800 dark:text-slate-200">
                  No savings goals yet
                </p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Turn your plans into achievable goals. Set target milestones for major upcoming purchases.
                </p>
                <button
                  onClick={() => setIsCreateGoalModalOpen(true)}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-[#187A4E] text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Goal</span>
                </button>
              </div>
            ) : (
              goals.map((g) => {
                const isCompleted = g.status === 'completed';
                const isOverdue = g.status === 'overdue';

                return (
                  <div
                    key={g.id || g._id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs space-y-3 hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        onClick={() => setSelectedGoal(g)}
                        className="space-y-1 cursor-pointer flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                            {g.name}
                          </h3>

                          {isCompleted ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Goal Completed
                            </span>
                          ) : isOverdue ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Overdue
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              Active
                            </span>
                          )}

                          {g.category && (
                            <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium">
                              {g.category}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          Target Date:{' '}
                          <strong className="text-gray-700 dark:text-slate-300">
                            {new Date(g.targetDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isCompleted && (
                          <button
                            onClick={() => openAddMoneyModal(g)}
                            className="px-3 py-1.5 bg-[#187A4E] hover:bg-[#13633F] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Add Money</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedGoal(g)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                          title="View History & Details"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Amount Math */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-900 dark:text-white">
                          {formatCurrency(g.currentAmount || 0, user?.currency)} saved of{' '}
                          {formatCurrency(g.targetAmount, user?.currency)}
                        </span>
                        <span className="text-[#187A4E] dark:text-emerald-400 font-extrabold">
                          {g.percentage}% complete
                        </span>
                      </div>

                      <div className="w-full bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-[#187A4E]'
                          }`}
                          style={{ width: `${g.percentage}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[11px] text-gray-500 dark:text-slate-400">
                        <span>
                          {isCompleted
                            ? 'Goal Fully Achieved!'
                            : `${formatCurrency(g.remainingAmount || 0, user?.currency)} remaining`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      <MobileNav onOpenAddModal={() => setIsAddTransactionModalOpen(true)} />
      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={() => setIsAddTransactionModalOpen(false)}
      />

      {/* Create Goal Modal */}
      {isCreateGoalModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                Create Savings Goal
              </h3>
              <button
                onClick={() => setIsCreateGoalModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g. New Laptop, Travel & Vacation"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">
                    Target Amount ({user?.currency || 'INR'})
                  </label>
                  <input
                    type="number"
                    placeholder="80000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Initial Saved (Default ₹0)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={initialSavedAmount}
                    onChange={(e) => setInitialSavedAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                  >
                    <option value="Tech">Tech / Electronics</option>
                    <option value="Travel">Travel & Vacation</option>
                    <option value="Emergency">Emergency Fund</option>
                    <option value="Vehicle">Vehicle / Car</option>
                    <option value="Education">Education</option>
                    <option value="General">General Savings</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. MacBook Pro purchase"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateGoalModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#187A4E] text-white font-bold rounded-lg shadow-xs"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      {addMoneyGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                Add Money to "{addMoneyGoal.name}"
              </h3>
              <button
                onClick={() => setAddMoneyGoal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pre-payment preview calculation */}
            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl space-y-1.5 border border-gray-100 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Currently Saved:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(addMoneyGoal.currentAmount || 0, user?.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">New Deposit:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {contributionAmount
                    ? formatCurrency(parseFloat(contributionAmount) || 0, user?.currency)
                    : '₹0'}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-gray-200 dark:border-slate-700">
                <span className="font-semibold text-gray-700 dark:text-slate-300">Remaining Goal Balance:</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400">
                  {formatCurrency(
                    Math.max(
                      0,
                      (addMoneyGoal.remainingAmount || addMoneyGoal.targetAmount) -
                        (parseFloat(contributionAmount) || 0)
                    ),
                    user?.currency
                  )}
                </span>
              </div>
            </div>

            <form onSubmit={handleAddMoney} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">
                  Deposit Amount ({user?.currency || 'INR'})
                </label>
                <input
                  type="number"
                  placeholder="5000"
                  value={contributionAmount}
                  onChange={(e) => {
                    setContributionAmount(e.target.value);
                    setContributionError('');
                  }}
                  required
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Payment Method / Source</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Salary Deposit">Salary Deposit</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly savings contribution"
                  value={contributionNote}
                  onChange={(e) => setContributionNote(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                />
              </div>

              {contributionError && (
                <div className="p-3 bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-lg font-medium">
                  {contributionError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddMoneyGoal(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingContribution}
                  className="px-4 py-2 bg-[#187A4E] text-white font-bold rounded-lg shadow-xs"
                >
                  {isSubmittingContribution ? 'Saving...' : 'Add Money'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal Detail & Savings History Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  {selectedGoal.name}
                </h3>
                <p className="text-xs text-gray-500">
                  Target Date:{' '}
                  {new Date(selectedGoal.targetDate).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteGoal(selectedGoal.id || selectedGoal._id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg"
                  title="Delete Goal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedGoal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metric Summary Grid */}
            <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-slate-800 p-3 rounded-xl">
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Target Amount</span>
                <span className="font-extrabold text-gray-900 dark:text-white text-xs">
                  {formatCurrency(selectedGoal.targetAmount, user?.currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Total Saved</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                  {formatCurrency(selectedGoal.currentAmount || 0, user?.currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Remaining</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400 text-xs">
                  {formatCurrency(selectedGoal.remainingAmount || 0, user?.currency)}
                </span>
              </div>
            </div>

            {/* Complete Savings History Timeline */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#187A4E]" />
                  <span>Savings History ({selectedGoal.contributions?.length || 0})</span>
                </h4>

                {selectedGoal.status !== 'completed' && (
                  <button
                    onClick={() => {
                      const g = selectedGoal;
                      setSelectedGoal(null);
                      openAddMoneyModal(g);
                    }}
                    className="px-2.5 py-1 bg-[#187A4E] text-white text-[11px] font-bold rounded-lg shadow-xs"
                  >
                    + Add Money
                  </button>
                )}
              </div>

              {!selectedGoal.contributions || selectedGoal.contributions.length === 0 ? (
                <p className="text-gray-400 text-center py-4 italic">No savings history recorded yet.</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
                  {selectedGoal.contributions.map((c: any) => (
                    <div key={c.id || c._id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#187A4E] dark:text-emerald-400">
                          +{formatCurrency(c.amount, user?.currency)}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {c.paymentMethod || 'UPI'} •{' '}
                          {new Date(c.date).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        {c.note && (
                          <p className="text-[11px] text-gray-500 italic mt-0.5">"{c.note}"</p>
                        )}
                      </div>

                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        Deposited
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
