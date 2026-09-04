'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Sun, Moon, Menu } from 'lucide-react';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { useMobileDrawer } from '@/components/providers/MobileDrawerProvider';

interface HeaderProps {
  userName?: string;
  currency?: string;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName: initialUserName,
  currency: initialCurrency = 'INR',
  isDark = false,
  onToggleTheme,
}) => {
  const { toggleDrawer } = useMobileDrawer();
  const [currentUser, setCurrentUser] = useState<string>(initialUserName || '');
  const [currentCurrency, setCurrentCurrency] = useState<string>(initialCurrency);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.name) {
            setCurrentUser(data.user.name);
          }
          if (data.user?.currency) {
            setCurrentCurrency(data.user.currency);
          }
        }
      } catch (e) {
        // Fallback
      }
    }
    fetchMe();
  }, []);

  const displayName = currentUser || initialUserName || 'User';

  return (
    <>
      <OfflineBanner />
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-30 px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Mobile Hamburger + Official FINLYTICS Branding & Tagline */}
          <div className="flex items-center gap-2.5">
            {/* Hamburger Button (Mobile Only: TOP LEFT beside logo) */}
            <button
              onClick={toggleDrawer}
              className="md:hidden w-10 h-10 flex items-center justify-center text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6 stroke-[2.2]" />
            </button>

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-xs border border-gray-100 dark:border-slate-800">
                <img
                  src="/logo.png"
                  alt="FINLYTICS Logo"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
                  FINLYTICS
                </h1>
                <p className="text-[10px] font-semibold tracking-wider text-[#187A4E] dark:text-emerald-400">
                  Track • Plan • Save • Grow
                </p>
              </div>
            </Link>
          </div>

          {/* Right header controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-[#187A4E] dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
              {currentCurrency} (₹)
            </span>

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            <Link
              href="/more/notifications"
              className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            </Link>

            <Link
              href="/more/profile"
              className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-slate-800"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#187A4E] dark:bg-emerald-950 dark:text-emerald-300 font-bold flex items-center justify-center text-xs border border-emerald-200 dark:border-emerald-800">
                {displayName.substring(0, 2).toUpperCase()}
              </div>
              <span className="hidden md:inline-block text-xs font-semibold text-gray-700 dark:text-slate-300">
                {displayName}
              </span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};
