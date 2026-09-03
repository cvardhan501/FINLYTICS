'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import {
  User,
  PieChart,
  Target,
  Repeat,
  FileCheck2,
  BookOpen,
  ShieldCheck,
  Download,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Wallet,
  Tag,
  CreditCard,
} from 'lucide-react';

export default function MorePage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const menuSections = [
    {
      title: 'Financial Planning',
      items: [
        { href: '/more/budgets', label: 'Budgets & Limits', icon: PieChart, desc: 'Manage monthly category budgets' },
        { href: '/more/savings-goals', label: 'Savings Goals', icon: Target, desc: 'Track progress toward financial targets' },
        { href: '/more/net-worth', label: 'Net Worth Statement', icon: ShieldCheck, desc: 'Assets vs Liabilities summary' },
      ],
    },
    {
      title: 'Automation & Subscriptions',
      items: [
        { href: '/more/recurring', label: 'Recurring Transactions', icon: Repeat, desc: 'Automate regular salary & rent' },
        { href: '/more/bills', label: 'Bills & Subscriptions', icon: FileCheck2, desc: 'Upcoming bills & due dates' },
      ],
    },
    {
      title: 'Journal & Records',
      items: [
        { href: '/more/logbook', label: 'Financial Log Book', icon: BookOpen, desc: 'Personal private financial diary' },
      ],
    },
    {
      title: 'App Settings & Security',
      items: [
        { href: '/more/settings', label: 'Account & Security Settings', icon: Settings, desc: 'Passwords, preferences & backup' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100 pb-20 md:pb-6">
      <Header userName="Vishnu" currency="INR" />

      <div className="max-w-6xl mx-auto flex">
        <DesktopSidebar onOpenAddModal={() => setIsAddModalOpen(true)} />

        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">More Options</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Access all secondary financial tools & settings
            </p>
          </div>

          {/* User profile banner */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#187A4E] text-white flex items-center justify-center font-bold text-lg">
                VI
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Vishnu</h3>
                <p className="text-xs text-gray-500">vishnu@expensetracker.com</p>
              </div>
            </div>
            <Link
              href="/auth/login"
              className="px-3 py-1.5 bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </Link>
          </div>

          {/* Sections List */}
          <div className="space-y-4">
            {menuSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-1">
                  {section.title}
                </p>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800 shadow-xs">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="p-3.5 flex items-center justify-between hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#187A4E] dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                              {item.label}
                            </h4>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <MobileNav onOpenAddModal={() => setIsAddModalOpen(true)} />
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
