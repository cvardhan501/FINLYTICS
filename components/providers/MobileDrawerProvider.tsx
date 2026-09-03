'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  ArrowRightLeft,
  HandCoins,
  BarChart3,
  PieChart,
  Target,
  Repeat,
  FileCheck2,
  BookOpen,
  ShieldCheck,
  Bell,
  User,
  Settings,
  X,
  ChevronRight,
} from 'lucide-react';

interface MobileDrawerContextType {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const MobileDrawerContext = createContext<MobileDrawerContextType>({
  isDrawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
});

export const useMobileDrawer = () => useContext(MobileDrawerContext);

export const MobileDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const openDrawer = () => {
    window.history.pushState({ drawerOpen: true }, '');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const toggleDrawer = () => {
    if (isDrawerOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  };

  // Keyboard Escape & Browser Back Button (popstate) handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };

    const handlePopState = () => {
      if (isDrawerOpen) {
        closeDrawer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDrawerOpen]);

  const handleNavigate = (href: string) => {
    closeDrawer();
    router.push(href);
  };

  const drawerSections = [
    {
      title: 'MAIN MENU',
      items: [
        { href: '/', label: 'Home Dashboard', icon: Home },
        { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
        { href: '/loans', label: 'Loans & Interest', icon: HandCoins },
        { href: '/analytics', label: 'Analytics', icon: BarChart3 },
        { href: '/more/budgets', label: 'Monthly Budgets', icon: PieChart },
      ],
    },
    {
      title: 'SAVINGS & PLANNING',
      items: [
        { href: '/more/savings-goals', label: 'Savings Goals', icon: Target },
        { href: '/more/recurring', label: 'Recurring Transactions', icon: Repeat },
      ],
    },
    {
      title: 'AUTOMATION & SUBSCRIPTIONS',
      items: [{ href: '/more/bills', label: 'Bills & Subscriptions', icon: FileCheck2 }],
    },
    {
      title: 'JOURNAL & RECORDS',
      items: [
        { href: '/more/logbook', label: 'Financial Log Book', icon: BookOpen },
        { href: '/more/net-worth', label: 'Net Worth', icon: ShieldCheck },
      ],
    },
    {
      title: 'ACCOUNT & SETTINGS',
      items: [
        { href: '/more/notifications', label: 'Notifications', icon: Bell },
        { href: '/more/profile', label: 'My Profile', icon: User },
        { href: '/more/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <MobileDrawerContext.Provider value={{ isDrawerOpen, openDrawer, closeDrawer, toggleDrawer }}>
      {children}

      {/* Backdrop Overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black/30 backdrop-blur-xs z-50 transition-opacity duration-300 pointer-events-auto ${
          isDrawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Left-Side Slide-In Navigation Drawer (Slides LEFT -> RIGHT) */}
      <aside
        id="mobile-hamburger-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="FINLYTICS Mobile Navigation Drawer"
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-[85vw] max-w-[360px] bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              <img src="/logo.svg" alt="FINLYTICS" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white leading-none">
                FINLYTICS
              </h2>
              <p className="text-[9px] font-semibold text-[#187A4E] dark:text-emerald-400 mt-0.5">
                Track • Plan • Save • Grow
              </p>
            </div>
          </div>

          <button
            onClick={closeDrawer}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close navigation drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Navigation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {drawerSections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <h3 className="text-[10px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-1">
                {section.title}
              </h3>

              <div className="bg-gray-50/70 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800 overflow-hidden">
                {section.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isItemActive =
                    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNavigate(item.href)}
                      className={`w-full p-2.5 flex items-center justify-between text-left transition-colors ${
                        isItemActive
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-[#187A4E] dark:text-emerald-400 font-bold'
                          : 'hover:bg-white dark:hover:bg-slate-800 text-gray-800 dark:text-slate-200 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center ${
                            isItemActive
                              ? 'bg-[#187A4E] text-white'
                              : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200/60 dark:border-slate-700'
                          }`}
                        >
                          <ItemIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs">{item.label}</span>
                      </div>

                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </MobileDrawerContext.Provider>
  );
};
