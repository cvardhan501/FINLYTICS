'use client';

import React, { useState } from 'react';
import { X, Calculator, RotateCcw } from 'lucide-react';
import { calculateInterest, InterestType, CompoundingFrequency } from '@/lib/finance/calculations';

interface InterestCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InterestCalculatorModal: React.FC<InterestCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [interestType, setInterestType] = useState<InterestType>('simple');
  const [principal, setPrincipal] = useState<string>('50000');
  const [rate, setRate] = useState<string>('12');
  const [durationYears, setDurationYears] = useState<string>('2');
  const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>('annual');

  if (!isOpen) return null;

  const numPrincipal = parseFloat(principal) || 0;
  const numRate = parseFloat(rate) || 0;
  const numDuration = parseFloat(durationYears) || 0;

  const result = calculateInterest({
    principal: numPrincipal,
    rate: numRate,
    durationYears: numDuration,
    interestType,
    compoundingFrequency,
  });

  const handleReset = () => {
    setPrincipal('50000');
    setRate('12');
    setDurationYears('2');
    setInterestType('simple');
    setCompoundingFrequency('annual');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#187A4E] dark:text-emerald-400" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Interest Calculator</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Interest Type Toggle */}
          <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setInterestType('simple')}
              className={`py-2 rounded-md transition-all ${
                interestType === 'simple'
                  ? 'bg-[#187A4E] text-white shadow-xs'
                  : 'text-gray-600 dark:text-slate-400'
              }`}
            >
              Simple Interest
            </button>
            <button
              type="button"
              onClick={() => setInterestType('compound')}
              className={`py-2 rounded-md transition-all ${
                interestType === 'compound'
                  ? 'bg-[#187A4E] text-white shadow-xs'
                  : 'text-gray-600 dark:text-slate-400'
              }`}
            >
              Compound Interest
            </button>
          </div>

          {/* Principal */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Principal Amount (₹)
            </label>
            <input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
            />
          </div>

          {/* Rate & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Rate of Interest (% p.a.)
              </label>
              <input
                type="number"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="12"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Duration (Years)
              </label>
              <input
                type="number"
                step="0.5"
                value={durationYears}
                onChange={(e) => setDurationYears(e.target.value)}
                placeholder="2"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
              />
            </div>
          </div>

          {/* Compounding Frequency (only if Compound Interest) */}
          {interestType === 'compound' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Compounding Frequency
              </label>
              <select
                value={compoundingFrequency}
                onChange={(e) => setCompoundingFrequency(e.target.value as CompoundingFrequency)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#187A4E]"
              >
                <option value="annual">Yearly (Annual)</option>
                <option value="half_yearly">Half-Yearly (2x per year)</option>
                <option value="quarterly">Quarterly (4x per year)</option>
                <option value="monthly">Monthly (12x per year)</option>
              </select>
            </div>
          )}

          {/* Output summary box */}
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
            <h3 className="text-xs font-bold text-[#187A4E] dark:text-emerald-400 uppercase tracking-wider">
              Calculation Summary
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500 dark:text-slate-400 block">Principal</span>
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                  ₹{result.principal.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-slate-400 block">Interest Amount</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  +₹{result.interestAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                Total Payable / Receivable:
              </span>
              <span className="text-base font-extrabold text-[#187A4E] dark:text-emerald-400">
                ₹{result.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="py-2.5 px-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-[#187A4E] hover:bg-[#13633F] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
