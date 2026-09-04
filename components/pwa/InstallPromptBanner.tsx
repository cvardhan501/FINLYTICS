'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export const InstallPromptBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Don't show if already installed in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem('finlytics_pwa_dismissed');
    if (dismissed) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (iosDevice) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('finlytics_pwa_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-40 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-xs border border-slate-800">
            <img src="/logo.png" alt="FINLYTICS Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Install FINLYTICS App</h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Get faster access to your finances directly from your home screen.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg"
          aria-label="Close install prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 mt-3 text-xs font-bold">
        {deferredPrompt ? (
          <button
            onClick={handleInstallClick}
            className="flex-1 py-2 px-3 bg-[#187A4E] hover:bg-[#13633F] text-white rounded-lg flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Install Now</span>
          </button>
        ) : isIOS ? (
          <div className="text-[11px] bg-slate-800 p-2 rounded-lg text-slate-300 w-full">
            To install on iOS: Tap <strong>Share</strong> icon, then select <strong>Add to Home Screen</strong>.
          </div>
        ) : null}

        <button
          onClick={handleDismiss}
          className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
        >
          Not now
        </button>
      </div>
    </div>
  );
};
