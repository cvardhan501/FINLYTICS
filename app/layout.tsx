import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { InstallPromptBanner } from '@/components/pwa/InstallPromptBanner';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { MobileDrawerProvider } from '@/components/providers/MobileDrawerProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FINLYTICS — Track • Plan • Save • Grow',
  description: 'A professional personal finance manager for tracking expenses, income, budgets, loans, savings and financial goals.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FINLYTICS',
  },
};

export const viewport: Viewport = {
  themeColor: '#187A4E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100`}
      >
        <ServiceWorkerRegister />
        <AuthProvider>
          <MobileDrawerProvider>{children}</MobileDrawerProvider>
        </AuthProvider>
        <InstallPromptBanner />
      </body>
    </html>
  );
}
