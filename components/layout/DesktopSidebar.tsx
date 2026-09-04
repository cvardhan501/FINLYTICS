'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ArrowRightLeft,
  HandCoins,
  BarChart3,
  Target,
  Repeat,
  FileCheck2,
  BookOpen,
  PieChart,
  ShieldCheck,
  Settings,
  Plus,
  PiggyBank,
} from 'lucide-react';

interface DesktopSidebarProps {
  onOpenAddModal: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ onOpenAddModal }) => {
  const pathname = usePathname();

  const mainLinks = [
    { href: '/', label: 'Home Dashboard', icon: Home },
    { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
    { href: '/savings', label: 'Savings', icon: PiggyBank },
    { href: '/loans', label: 'Loans & Interest', icon: HandCoins },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/more/budgets', label: 'Budgets', icon: PieChart },
  ];

  const secondaryLinks = [
    { href: '/more/savings-goals', label: 'Savings Goals', icon: Target },
    { href: '/more/recurring', label: 'Recurring Transactions', icon: Repeat },
    { href: '/more/bills', label: 'Bills & Subscriptions', icon: FileCheck2 },
    { href: '/more/logbook', label: 'Financial Log Book', icon: BookOpen },
    { href: '/more/net-worth', label: 'Net Worth', icon: ShieldCheck },
    { href: '/more/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[calc(100vh-61px)] p-4 space-y-6">
      {/* Quick Add Button */}
      <button
        onClick={onOpenAddModal}
        className="w-full py-2.5 px-4 bg-[#187A4E] hover:bg-[#13633F] text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        <span>Add Transaction</span>
      </button>

      {/* Primary navigation section */}
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Main Menu
        </p>
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#187A4E] dark:text-emerald-400 font-semibold'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Secondary features */}
      <div className="space-y-1 pt-4 border-t border-gray-100 dark:border-slate-800">
        <p className="px-3 text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Features
        </p>
        {secondaryLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#187A4E] dark:text-emerald-400 font-semibold'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
};
