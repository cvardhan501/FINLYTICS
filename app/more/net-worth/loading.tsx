import React from 'react';

export default function NetWorthLoading() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      <div className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="w-32 h-6 bg-gray-200 dark:bg-slate-800 rounded-md animate-pulse" />
        <div className="w-20 h-6 bg-gray-200 dark:bg-slate-800 rounded-md animate-pulse" />
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto flex overflow-hidden">
        <div className="hidden md:block w-64 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
          <div className="w-full h-10 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="space-y-2 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-full h-8 bg-gray-100 dark:bg-slate-800/60 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>

        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl overflow-y-auto">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="w-40 h-6 bg-gray-200 dark:bg-slate-800 rounded-md animate-pulse" />
              <div className="w-64 h-4 bg-gray-100 dark:bg-slate-800/60 rounded-md animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="w-24 h-9 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="w-28 h-9 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse" />
            </div>
          </div>

          <div className="bg-[#187A4E]/80 p-6 rounded-2xl h-36 animate-pulse" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 h-48 animate-pulse" />
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 h-48 animate-pulse" />
          </div>
        </main>
      </div>
    </div>
  );
}
