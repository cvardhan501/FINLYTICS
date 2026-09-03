'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { useAuth } from '@/components/providers/AuthProvider';
import { ShieldCheck, TrendingUp, TrendingDown, History } from 'lucide-react';
import { formatCurrency } from '@/lib/finance/calculations';

export default function NetWorthPage() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [data, setData] = useState<any>({
    netWorth: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    assets: [],
    liabilities: [],
  });

  useEffect(() => {
    fetch('/api/net-worth')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(console.error);
  }, []);

  const hasData = (data.assets?.length || 0) > 0 || (data.liabilities?.length || 0) > 0;

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100 pb-20 md:pb-6">
      <Header userName={user?.name} currency={user?.currency || 'INR'} />

      <div className="max-w-6xl mx-auto flex">
        <DesktopSidebar onOpenAddModal={() => setIsAddModalOpen(true)} />

        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">
              Net Worth Statement
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Net Worth = Total Assets - Total Liabilities
            </p>
          </div>

          <div className="bg-[#187A4E] text-white p-6 rounded-2xl shadow-md text-center">
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wide">
              Estimated Total Net Worth
            </span>
            <h2 className="text-4xl font-extrabold mt-1">
              {formatCurrency(data.netWorth || 0, user?.currency)}
            </h2>
          </div>

          {!hasData ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-8 text-center space-y-2 shadow-xs">
              <ShieldCheck className="w-10 h-10 text-[#187A4E] mx-auto" />
              <p className="text-sm font-bold text-gray-800 dark:text-slate-200">
                No financial data yet
              </p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Start adding accounts, transactions, and loans to automatically calculate your net worth position.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> Assets
                </h3>
                <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                  {formatCurrency(data.totalAssets || 0, user?.currency)}
                </p>
                <div className="space-y-1.5 text-xs pt-2 border-t border-gray-100 dark:border-slate-800">
                  {data.assets?.length === 0 ? (
                    <p className="text-gray-400 text-[11px]">No asset records</p>
                  ) : (
                    data.assets?.map((a: any) => (
                      <div key={a.name} className="flex justify-between">
                        <span className="text-gray-600 dark:text-slate-400">{a.name}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(a.amount, user?.currency)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" /> Liabilities
                </h3>
                <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                  {formatCurrency(data.totalLiabilities || 0, user?.currency)}
                </p>
                <div className="space-y-1.5 text-xs pt-2 border-t border-gray-100 dark:border-slate-800">
                  {data.liabilities?.length === 0 ? (
                    <p className="text-gray-400 text-[11px]">No liability records</p>
                  ) : (
                    data.liabilities?.map((l: any) => (
                      <div key={l.name} className="flex justify-between">
                        <span className="text-gray-600 dark:text-slate-400">{l.name}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(l.amount, user?.currency)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Historical Net Worth Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <History className="w-4 h-4 text-[#187A4E]" /> Net Worth History
            </h3>
            <p className="text-xs text-gray-400 italic text-center py-4">
              No net worth history yet.
            </p>
          </div>
        </main>
      </div>

      <MobileNav onOpenAddModal={() => setIsAddModalOpen(true)} />
      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
