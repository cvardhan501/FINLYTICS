'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { assetSchema } from '@/schemas';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assetToEdit?: any;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  assetToEdit,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [attachment, setAttachment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (assetToEdit) {
      setName(assetToEdit.name || '');
      setType(assetToEdit.type || 'bank');
      setAmount(assetToEdit.amount ? String(assetToEdit.amount) : '');
      setDate(
        assetToEdit.date
          ? new Date(assetToEdit.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setNotes(assetToEdit.notes || '');
      setAttachment(assetToEdit.attachment || '');
    } else {
      setName('');
      setType('bank');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setAttachment('');
    }
    setError('');
  }, [assetToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount);
    const parseResult = assetSchema.safeParse({
      name: name.trim(),
      type,
      amount: numericAmount,
      date,
      notes: notes.trim(),
      attachment: attachment.trim(),
    });

    if (!parseResult.success) {
      const firstError = Object.values(parseResult.error.flatten().fieldErrors)[0]?.[0];
      setError(firstError || 'Validation failed. Check inputs.');
      return;
    }

    setLoading(true);

    try {
      const url = assetToEdit?.id
        ? `/api/net-worth/assets/${assetToEdit.id}`
        : '/api/net-worth/assets';
      const method = assetToEdit?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parseResult.data),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save asset');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const assetTypeOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank', label: 'Bank Account' },
    { value: 'upi', label: 'UPI Wallet' },
    { value: 'investment', label: 'Investment' },
    { value: 'gold', label: 'Gold' },
    { value: 'property', label: 'Property' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'money_given', label: 'Money Given / Receivable' },
    { value: 'other', label: 'Other Asset' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/80 dark:bg-slate-900/80">
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
            {assetToEdit ? 'Edit Asset' : '+ Add New Asset'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-lg flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Asset Category / Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#187A4E]"
            >
              {assetTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Asset Name
            </label>
            <input
              type="text"
              placeholder="e.g. HDFC Savings, Mutual Fund, Mutual Gold, Car"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#187A4E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Current Value / Amount (₹)
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#187A4E]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Acquired / As Of Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#187A4E]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              placeholder="Additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#187A4E]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#187A4E] hover:bg-[#13633F] text-white font-bold rounded-lg shadow-xs transition-colors"
            >
              {loading ? 'Saving...' : assetToEdit ? 'Update Asset' : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
