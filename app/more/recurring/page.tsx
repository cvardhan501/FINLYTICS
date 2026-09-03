'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { useAuth } from '@/components/providers/AuthProvider';
import { Repeat } from 'lucide-react';
import { formatCurrency } from '@/lib/finance/calculations';

export default function RecurringPage() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/recurring')
      .then((res) => res.json())
      .then((data) => setItems(data.recurring || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100 pb-20 md:pb-6">
      <Header userName={user?.name} currency={user?.currency || 'INR'} />

      <div className="max-w-6xl mx-auto flex">
        <DesktopSidebar onOpenAddModal={() => setIsAddModalOpen(true)} />

        <main className="flex-1 p-4 md:p-6 space-y-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">
                Recurring Transactions
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Automated monthly salary, rent, Netflix & gym fees
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800 shadow-xs">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading recurring entries...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Repeat className="w-8 h-8 text-[#187A4E] mx-auto" />
                <p className="text-sm font-bold text-gray-800 dark:text-slate-200">
                  No recurring transactions
                </p>
                <p className="text-xs text-gray-500">
                  Set up automated salary credits or monthly bill reminders.
                </p>
              </div>
            ) : (
              items.map((rec) => (
                <div key={rec.id || rec._id} className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">{rec.name}</h4>
                    <p className="text-[11px] text-gray-500 capitalize">
                      Every {rec.frequency || 'Month'} • Next:{' '}
                      {rec.nextRunDate
                        ? new Date(rec.nextRunDate).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Scheduled'}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      rec.type === 'income' ? 'text-[#187A4E]' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {rec.type === 'income' ? '+' : '-'}
                    {formatCurrency(rec.amount, user?.currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      <MobileNav onOpenAddModal={() => setIsAddModalOpen(true)} />
      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
