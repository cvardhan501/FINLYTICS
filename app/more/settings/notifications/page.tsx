'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { Bell, Check, Clock, ShieldCheck, Sparkles } from 'lucide-react';

export default function NotificationSettingsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // Preferences toggles
  const [loanReminders, setLoanReminders] = useState(true);
  const [billReminders, setBillReminders] = useState(true);
  const [subscriptionReminders, setSubscriptionReminders] = useState(true);
  const [recurringAlerts, setRecurringAlerts] = useState(true);
  const [incomeReminders, setIncomeReminders] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [overdueAlerts, setOverdueAlerts] = useState(true);
  const [smartSpendingAlerts, setSmartSpendingAlerts] = useState(true);
  const [aiInsights, setAiInsights] = useState(true);

  const [preferredTime, setPreferredTime] = useState('09:00 AM');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg('Notification settings saved successfully.');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const toggles = [
    { label: 'Loan reminders (Given & Borrowed)', state: loanReminders, set: setLoanReminders, desc: 'Receive reminders 7, 3 & 1 day before due dates' },
    { label: 'Bill reminders', state: billReminders, set: setBillReminders, desc: 'Electricity, fiber & utility bill alerts' },
    { label: 'Subscription renewal reminders', state: subscriptionReminders, set: setSubscriptionReminders, desc: 'Netflix, Spotify & software renewals' },
    { label: 'Recurring transaction alerts', state: recurringAlerts, set: setRecurringAlerts, desc: 'Rent & automated monthly charges' },
    { label: 'Expected income reminders', state: incomeReminders, set: setIncomeReminders, desc: 'Expected salary credit notifications' },
    { label: 'Budget threshold alerts', state: budgetAlerts, set: setBudgetAlerts, desc: 'Notify at 50%, 75%, 80%, 90% & 100% budget limits' },
    { label: 'Overdue payment alerts', state: overdueAlerts, set: setOverdueAlerts, desc: '1, 3, 7 days overdue notifications' },
    { label: 'Smart unusual spending alerts', state: smartSpendingAlerts, set: setSmartSpendingAlerts, desc: 'Notify when weekly spending exceeds 30-day average' },
    { label: 'AI financial insights', state: aiInsights, set: setAiInsights, desc: 'Personalized natural wording explanations' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100 pb-20 md:pb-6">
      <Header userName="Vishnu" currency="INR" />

      <div className="max-w-6xl mx-auto flex">
        <DesktopSidebar onOpenAddModal={() => setIsAddModalOpen(true)} />

        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">
              Notification Preferences
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Customize reminder categories, timing & preferred dispatch hour
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Preferred Time Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 space-y-3 shadow-xs text-xs">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#187A4E]" />
                <span>Preferred Dispatch Time</span>
              </h3>
              <p className="text-gray-500">
                Routine reminders will be dispatched at your preferred local time.
              </p>

              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg font-semibold text-xs"
              >
                <option value="08:00 AM">08:00 AM (Morning)</option>
                <option value="09:00 AM">09:00 AM (Default)</option>
                <option value="12:00 PM">12:00 PM (Noon)</option>
                <option value="06:00 PM">06:00 PM (Evening)</option>
              </select>
            </div>

            {/* Category Toggles List */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800 shadow-xs">
              {toggles.map((item) => (
                <div key={item.label} className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">{item.label}</h4>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">{item.desc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => item.set(!item.state)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      item.state ? 'bg-[#187A4E]' : 'bg-gray-200 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        item.state ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {savedMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-[#187A4E]" />
                <span>{savedMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="py-2.5 px-5 bg-[#187A4E] hover:bg-[#13633F] text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
            >
              Save Notification Preferences
            </button>
          </form>
        </main>
      </div>

      <MobileNav onOpenAddModal={() => setIsAddModalOpen(true)} />
      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
