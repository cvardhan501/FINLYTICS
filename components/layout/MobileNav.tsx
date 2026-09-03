'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowRightLeft, HandCoins, BarChart3, Plus } from 'lucide-react';

interface MobileNavProps {
  onOpenAddModal: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenAddModal }) => {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 pb-safe shadow-lg">
      <div className="flex items-center justify-around h-16 px-2 relative">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors ${
            pathname === '/'
              ? 'text-[#187A4E] dark:text-emerald-400 font-semibold'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>

        <Link
          href="/transactions"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors ${
            pathname === '/transactions'
              ? 'text-[#187A4E] dark:text-emerald-400 font-semibold'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-5 h-5 mb-0.5" />
          <span>Transactions</span>
        </Link>

        {/* Floating Quick Add '+' Button */}
        <div className="flex justify-center items-center flex-1 relative -top-3">
          <button
            onClick={onOpenAddModal}
            className="w-12 h-12 rounded-full bg-[#187A4E] hover:bg-[#13633F] text-white shadow-md flex items-center justify-center transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
            aria-label="Add Transaction"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        <Link
          href="/loans"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors ${
            pathname === '/loans'
              ? 'text-[#187A4E] dark:text-emerald-400 font-semibold'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          <HandCoins className="w-5 h-5 mb-0.5" />
          <span>Loans</span>
        </Link>

        <Link
          href="/analytics"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors ${
            pathname === '/analytics'
              ? 'text-[#187A4E] dark:text-emerald-400 font-semibold'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span>Analytics</span>
        </Link>
      </div>
    </nav>
  );
};
