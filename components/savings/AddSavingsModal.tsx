'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Calendar, CreditCard, Tag, FileText, Paperclip, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/finance/calculations';

interface SavingsGoalOption {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
}

interface AddSavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentTotalSavings: number;
  currency?: string;
  goals?: SavingsGoalOption[];
}

export const AddSavingsModal: React.FC<AddSavingsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentTotalSavings,
  currency = 'INR',
  goals = [],
}) => {
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [goalId, setGoalId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [note, setNote] = useState<string>('');
  const [attachment, setAttachment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setType('deposit');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setGoalId('');
      setPaymentMethod('UPI');
      setNote('');
      setAttachment('');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    if (type === 'withdrawal' && numAmount > currentTotalSavings + 0.01) {
      setErrorMsg(
        `Cannot withdraw ${formatCurrency(numAmount, currency)}. Total available savings is ${formatCurrency(
          currentTotalSavings,
          currency
        )}.`
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/savings/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: numAmount,
          date,
          goalId: goalId || null,
          paymentMethod,
          note: note.trim(),
          attachment: attachment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to record transaction');
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              Add Savings Transaction
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
              Record a deposit or withdrawal from your savings
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 p-3 rounded-xl flex items-start gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Type Toggle: Deposit vs Withdrawal */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setType('deposit')}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                type === 'deposit'
                  ? 'bg-[#187A4E] text-white shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Deposit</span>
            </button>

            <button
              type="button"
              onClick={() => setType('withdrawal')}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                type === 'withdrawal'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdrawal</span>
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Amount ({currency === 'INR' ? '₹' : currency}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
            />
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
              >
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Credit/Debit Card">Credit/Debit Card</option>
                <option value="NetBanking">NetBanking</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Savings Goal (Optional) */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Link to Savings Goal (Optional)
            </label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
            >
              <option value="">— None (General Savings) —</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({formatCurrency(g.currentAmount, currency)} / {formatCurrency(g.targetAmount, currency)})
                </option>
              ))}
            </select>
          </div>

          {/* Note / Description */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Note / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly savings contribution or Laptop purchase"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
            />
          </div>

          {/* Optional Attachment URL or Reference */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Attachment Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="Receipt / Reference URL"
              value={attachment}
              onChange={(e) => setAttachment(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#187A4E] hover:bg-[#13633F] text-white font-bold rounded-xl shadow-sm transition-colors text-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? 'Recording...' : type === 'deposit' ? 'Record Deposit' : 'Record Withdrawal'}
          </button>
        </form>
      </div>
    </div>
  );
};
