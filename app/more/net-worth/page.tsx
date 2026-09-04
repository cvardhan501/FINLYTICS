'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { AddAssetModal } from '@/components/net-worth/AddAssetModal';
import { AddLiabilityModal } from '@/components/net-worth/AddLiabilityModal';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  History,
  Plus,
  Trash2,
  Edit2,
  Landmark,
  Wallet,
  Coins,
  Building,
  Car,
  HandCoins,
  CreditCard,
  Briefcase,
  Layers,
} from 'lucide-react';
import { formatCurrency } from '@/lib/finance/calculations';

export default function NetWorthPage() {
  const { user } = useAuth();
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isAddLiabilityModalOpen, setIsAddLiabilityModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<any>(null);
  const [liabilityToEdit, setLiabilityToEdit] = useState<any>(null);

  const [data, setData] = useState<any>({
    netWorth: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    assets: [],
    liabilities: [],
    history: [],
  });

  const [loading, setLoading] = useState(true);

  const fetchNetWorth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/net-worth');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (e) {
      console.error('Failed to fetch net worth', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNetWorth();
  }, [fetchNetWorth]);

  const handleDeleteAsset = async (asset: any) => {
    if (!asset.isManual || !asset.id) return;
    if (confirm(`Are you sure you want to delete asset "${asset.name}"?`)) {
      try {
        const res = await fetch(`/api/net-worth/assets/${asset.id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchNetWorth();
        }
      } catch (e) {
        console.error('Failed to delete asset', e);
      }
    }
  };

  const handleDeleteLiability = async (liability: any) => {
    if (!liability.isManual || !liability.id) return;
    if (confirm(`Are you sure you want to delete liability "${liability.name}"?`)) {
      try {
        const res = await fetch(`/api/net-worth/liabilities/${liability.id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchNetWorth();
        }
      } catch (e) {
        console.error('Failed to delete liability', e);
      }
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return Coins;
      case 'bank':
        return Landmark;
      case 'upi':
        return Wallet;
      case 'investment':
        return TrendingUp;
      case 'gold':
        return Coins;
      case 'property':
        return Building;
      case 'vehicle':
        return Car;
      case 'money_given':
        return HandCoins;
      default:
        return Layers;
    }
  };

  const getLiabilityIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
        return CreditCard;
      case 'personal_loan':
      case 'vehicle_loan':
      case 'education_loan':
        return Briefcase;
      case 'money_borrowed':
        return HandCoins;
      default:
        return TrendingDown;
    }
  };

  const hasAssets = (data.assets?.length || 0) > 0;
  const hasLiabilities = (data.liabilities?.length || 0) > 0;
  const hasHistory = (data.history?.length || 0) > 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      <Header userName={user?.name} currency={user?.currency || 'INR'} />

      <div className="flex-1 max-w-6xl w-full mx-auto flex overflow-hidden">
        <DesktopSidebar onOpenAddModal={() => setIsAddTxModalOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-4xl pb-24 md:pb-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">
                Net Worth Statement
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Calculated strictly as Total Assets minus Total Liabilities
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAssetToEdit(null);
                  setIsAddAssetModalOpen(true);
                }}
                className="py-2 px-3 bg-[#187A4E] hover:bg-[#13633F] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Asset</span>
              </button>

              <button
                onClick={() => {
                  setLiabilityToEdit(null);
                  setIsAddLiabilityModalOpen(true);
                }}
                className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Liability</span>
              </button>
            </div>
          </div>

          {/* Green FINLYTICS Net Worth Hero Card */}
          <div className="bg-[#187A4E] text-white p-6 rounded-2xl shadow-md text-center space-y-1">
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
              ESTIMATED TOTAL NET WORTH
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight">
              {formatCurrency(data.netWorth || 0, user?.currency)}
            </h2>
            <div className="flex items-center justify-center gap-4 text-xs font-medium text-emerald-100 pt-2 border-t border-emerald-600/40 max-w-sm mx-auto">
              <span>Assets: {formatCurrency(data.totalAssets || 0, user?.currency)}</span>
              <span>•</span>
              <span>Liabilities: {formatCurrency(data.totalLiabilities || 0, user?.currency)}</span>
            </div>
          </div>

          {/* Assets & Liabilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* ASSETS SECTION */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Assets
                </h3>
                <button
                  onClick={() => {
                    setAssetToEdit(null);
                    setIsAddAssetModalOpen(true);
                  }}
                  className="text-xs font-bold text-[#187A4E] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Asset
                </button>
              </div>

              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {formatCurrency(data.totalAssets || 0, user?.currency)}
              </p>

              {!hasAssets ? (
                <div className="p-6 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-xl space-y-1">
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400">
                    No assets added yet
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Add investments, gold, property, cash, or bank balances.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                  {data.assets.map((asset: any, idx: number) => {
                    const IconComp = getAssetIcon(asset.type);
                    return (
                      <div
                        key={asset.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors border border-gray-100 dark:border-slate-800/80"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#187A4E] dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                              {asset.name}
                            </p>
                            <span className="text-[10px] text-gray-400 capitalize">
                              {asset.type?.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-xs text-gray-900 dark:text-white">
                            {formatCurrency(asset.amount, user?.currency)}
                          </span>

                          {asset.isManual && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setAssetToEdit(asset);
                                  setIsAddAssetModalOpen(true);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"
                                title="Edit Asset"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAsset(asset)}
                                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                title="Delete Asset"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* LIABILITIES SECTION */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4" /> Liabilities
                </h3>
                <button
                  onClick={() => {
                    setLiabilityToEdit(null);
                    setIsAddLiabilityModalOpen(true);
                  }}
                  className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Liability
                </button>
              </div>

              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {formatCurrency(data.totalLiabilities || 0, user?.currency)}
              </p>

              {!hasLiabilities ? (
                <div className="p-6 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-xl space-y-1">
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400">
                    No liabilities added yet
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Add credit cards, loans, or money borrowed.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                  {data.liabilities.map((liability: any, idx: number) => {
                    const IconComp = getLiabilityIcon(liability.type);
                    return (
                      <div
                        key={liability.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors border border-gray-100 dark:border-slate-800/80"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                              {liability.name}
                            </p>
                            <span className="text-[10px] text-gray-400 capitalize">
                              {liability.type?.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-xs text-red-600 dark:text-red-400">
                            {formatCurrency(liability.amount, user?.currency)}
                          </span>

                          {liability.isManual && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setLiabilityToEdit(liability);
                                  setIsAddLiabilityModalOpen(true);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"
                                title="Edit Liability"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteLiability(liability)}
                                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                title="Delete Liability"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* NET WORTH HISTORY SECTION */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-[#187A4E]" /> Net Worth History
            </h3>

            {!hasHistory ? (
              <p className="text-xs text-gray-400 italic text-center py-6">
                No net worth history yet.
              </p>
            ) : (
              <div className="space-y-2">
                {data.history.map((h: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-800/50 rounded-xl text-xs"
                  >
                    <span className="font-semibold text-gray-600 dark:text-slate-300">
                      {h.date}
                    </span>
                    <span className="font-extrabold text-gray-900 dark:text-white">
                      {formatCurrency(h.netWorth, user?.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals & Navigation */}
      <MobileNav onOpenAddModal={() => setIsAddTxModalOpen(true)} />
      <AddTransactionModal isOpen={isAddTxModalOpen} onClose={() => setIsAddTxModalOpen(false)} />

      <AddAssetModal
        isOpen={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
        onSuccess={fetchNetWorth}
        assetToEdit={assetToEdit}
      />

      <AddLiabilityModal
        isOpen={isAddLiabilityModalOpen}
        onClose={() => setIsAddLiabilityModalOpen(false)}
        onSuccess={fetchNetWorth}
        liabilityToEdit={liabilityToEdit}
      />
    </div>
  );
}
