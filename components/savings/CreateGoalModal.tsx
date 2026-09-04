'use client';

import React, { useState, useEffect } from 'react';
import { X, Target, Laptop, Shield, Home, Car, Gift, Plane, GraduationCap, PiggyBank, Heart, AlertTriangle } from 'lucide-react';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currency?: string;
}

const AVAILABLE_ICONS = [
  { name: 'Target', icon: Target },
  { name: 'Laptop', icon: Laptop },
  { name: 'Shield', icon: Shield },
  { name: 'Home', icon: Home },
  { name: 'Car', icon: Car },
  { name: 'Plane', icon: Plane },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Gift', icon: Gift },
  { name: 'PiggyBank', icon: PiggyBank },
  { name: 'Heart', icon: Heart },
];

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currency = 'INR',
}) => {
  const [name, setName] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [initialAmount, setInitialAmount] = useState<string>('0');
  const [targetDate, setTargetDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [icon, setIcon] = useState<string>('Target');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTargetAmount('');
      setInitialAmount('0');
      // Default target date: 1 year from today
      const defaultDate = new Date();
      defaultDate.setFullYear(defaultDate.getFullYear() + 1);
      setTargetDate(defaultDate.toISOString().split('T')[0]);
      setDescription('');
      setIcon('Target');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetNum = parseFloat(targetAmount);
    const initialNum = parseFloat(initialAmount || '0');

    if (!name.trim()) {
      setErrorMsg('Please enter a goal name.');
      return;
    }

    if (isNaN(targetNum) || targetNum <= 0) {
      setErrorMsg('Please enter a valid target amount.');
      return;
    }

    if (isNaN(initialNum) || initialNum < 0) {
      setErrorMsg('Initial amount cannot be negative.');
      return;
    }

    if (!targetDate) {
      setErrorMsg('Please select a target date.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/savings/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          targetAmount: targetNum,
          currentAmount: initialNum,
          targetDate,
          description: description.trim(),
          icon,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create savings goal.');
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
              Create Savings Goal
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
              Set a target for a specific purchase, emergency fund, or milestone
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
          {/* Goal Name */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Goal Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Laptop, Emergency Fund, Vacation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
            />
          </div>

          {/* Target Amount & Initial Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Target Amount ({currency === 'INR' ? '₹' : currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="e.g. 50000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Initial Saved (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
              />
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Target Date *
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add details about this savings target..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Goal Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ICONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    className={`p-2 rounded-xl border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-[#187A4E] text-white border-[#187A4E]'
                        : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100'
                    }`}
                    title={item.name}
                  >
                    <IconComponent className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#187A4E] hover:bg-[#13633F] text-white font-bold rounded-xl shadow-sm transition-colors text-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating Goal...' : 'Create Savings Goal'}
          </button>
        </form>
      </div>
    </div>
  );
};
