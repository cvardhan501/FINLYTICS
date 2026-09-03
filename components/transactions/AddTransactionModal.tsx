'use client';

import React, { useState } from 'react';
import { X, Check, Calendar, Tag, CreditCard, FileText, WifiOff } from 'lucide-react';
import { addOfflineTransaction } from '@/lib/pwa/indexedDB';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Food');
  const [account, setAccount] = useState<string>('Bank Account');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');

  if (!isOpen) return null;

  const expenseCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Education', 'Health', 'Entertainment', 'Other'];
  const incomeCategories = ['Salary', 'Freelance', 'Business', 'Gift', 'Interest', 'Other'];
  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setFeedback('Please enter a valid amount');
      return;
    }
    if (!description.trim()) {
      setFeedback('Please enter a description');
      return;
    }

    setLoading(true);
    setFeedback('');

    const numAmount = parseFloat(amount);

    // If device is offline, queue transaction in IndexedDB
    if (typeof window !== 'undefined' && !navigator.onLine) {
      try {
        await addOfflineTransaction({
          type,
          amount: numAmount,
          category,
          account,
          paymentMethod,
          date,
          description,
          notes,
        });

        setFeedback('Saved offline. Will sync automatically when back online!');
        setTimeout(() => {
          setLoading(false);
          setAmount('');
          setDescription('');
          setNotes('');
          onClose();
          if (onSuccess) onSuccess();
        }, 800);
        return;
      } catch (err) {
        console.error('Offline save error:', err);
      }
    }

    // Online API request
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: numAmount,
          category,
          account,
          paymentMethod,
          date,
          description,
          notes,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save transaction');
      }

      setFeedback('Transaction added successfully!');
      setTimeout(() => {
        setLoading(false);
        setAmount('');
        setDescription('');
        setNotes('');
        onClose();
        if (onSuccess) onSuccess();
      }, 500);
    } catch (err: any) {
      setFeedback(err.message || 'Error saving transaction');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Add Transaction</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Expense / Income Toggle */}
          <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('Food');
              }}
              className={`py-2 rounded-md transition-all ${
                type === 'expense'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('Salary');
              }}
              className={`py-2 rounded-md transition-all ${
                type === 'income'
                  ? 'bg-[#187A4E] text-white shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-500 text-lg">
                ₹
              </span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
                className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg font-bold text-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. Dinner with friends, Grocery shopping"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#187A4E] appearance-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Account & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Account
              </label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
              >
                <option value="Bank Account">Bank Account</option>
                <option value="Cash">Cash</option>
                <option value="UPI Wallet">UPI Wallet</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
              >
                <option value="UPI">UPI</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="NetBanking">NetBanking</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
              />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Additional notes or context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
            />
          </div>

          {feedback && (
            <div
              className={`p-2.5 rounded-lg text-xs font-medium ${
                feedback.includes('offline')
                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : feedback.includes('success')
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
              }`}
            >
              {feedback}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-[#187A4E] hover:bg-[#13633F] text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save Transaction</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
