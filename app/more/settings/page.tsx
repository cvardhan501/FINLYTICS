'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { useAuth } from '@/components/providers/AuthProvider';
import { Settings, Download, ShieldCheck, DownloadCloud, Check, Smartphone } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [exportedMsg, setExportedMsg] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      const txs: any[] = data.transactions || [];

      let csvText = 'Type,Amount,Category,Account,Date,Description\n';
      txs.forEach((t) => {
        const d = t.date ? new Date(t.date).toISOString().substring(0, 10) : '';
        csvText += `${t.type},${t.amount},${t.category || ''},${t.account || ''},${d},"${t.description || ''}"\n`;
      });

      const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvText);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `finlytics_${user?.name || 'export'}_transactions.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportedMsg(`Exported ${txs.length} financial record(s) as CSV file.`);
      setTimeout(() => setExportedMsg(''), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100 pb-20 md:pb-6">
      <Header userName={user?.name} currency={user?.currency || 'INR'} />

      <div className="max-w-6xl mx-auto flex">
        <DesktopSidebar onOpenAddModal={() => setIsAddModalOpen(true)} />

        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">
              Settings & Data Security
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Manage PWA installation, data exports & security settings
            </p>
          </div>

          {/* PWA Install Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#187A4E]" />
              <span>Install FINLYTICS PWA</span>
            </h3>
            <p className="text-xs text-gray-500">
              Install FINLYTICS on your phone or desktop for an app-like experience with offline draft support.
            </p>

            {isInstalled ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-[#187A4E]" />
                <span>FINLYTICS is installed and running in standalone mode.</span>
              </div>
            ) : deferredPrompt ? (
              <button
                onClick={handleInstallClick}
                className="py-2.5 px-4 bg-[#187A4E] hover:bg-[#13633F] text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Install FINLYTICS App</span>
              </button>
            ) : (
              <p className="text-xs text-gray-400 italic">
                To install on iOS: Tap Share → Add to Home Screen.
              </p>
            )}
          </div>

          {/* Export Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-[#187A4E]" />
              <span>Export Financial Data</span>
            </h3>
            <p className="text-xs text-gray-500">
              Export your transactions into an Excel-compatible CSV spreadsheet.
            </p>

            <button
              onClick={handleExportCSV}
              className="py-2.5 px-4 bg-[#187A4E] hover:bg-[#13633F] text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Spreadsheet</span>
            </button>

            {exportedMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{exportedMsg}</span>
              </div>
            )}
          </div>

          {/* Security Status */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#187A4E]" />
              <span>Application Security & Data Isolation</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-600 dark:text-slate-400">Database Ownership Filter</span>
                <span className="font-bold text-emerald-600">Strict userId Scoping</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-600 dark:text-slate-400">API Cache Strategy</span>
                <span className="font-bold text-emerald-600">Network-First (No Stale Data)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-600 dark:text-slate-400">Password Encryption</span>
                <span className="font-bold text-emerald-600">Bcrypt Salt 12</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600 dark:text-slate-400">Session Strategy</span>
                <span className="font-bold text-emerald-600">HTTP-Only JWT Cookie</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <MobileNav onOpenAddModal={() => setIsAddModalOpen(true)} />
      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
