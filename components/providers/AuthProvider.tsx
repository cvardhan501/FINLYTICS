'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  currency?: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: UserSession | null;
  authStatus: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, currency?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authStatus: 'loading',
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/restore-account',
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserSession | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setAuthStatus('authenticated');
          return;
        }
      }
      setUser(null);
      setAuthStatus('unauthenticated');
    } catch (e) {
      setUser(null);
      setAuthStatus('unauthenticated');
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Protect client routes
  useEffect(() => {
    if (authStatus === 'unauthenticated' && !isPublicRoute) {
      router.replace('/auth/login');
    }
  }, [authStatus, isPublicRoute, pathname, router]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials');
    }

    // Update state immediately without browser refresh
    setUser(data.user);
    setAuthStatus('authenticated');

    // Instant replace navigation
    router.replace('/');
  };

  const register = async (name: string, email: string, password: string, currency: string = 'INR') => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, currency }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    // Update state immediately without browser refresh
    setUser(data.user);
    setAuthStatus('authenticated');

    // Instant replace navigation
    router.replace('/');
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore
    } finally {
      // Clear user-specific client state & caches
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (err) {
          // Ignore
        }
      }

      setUser(null);
      setAuthStatus('unauthenticated');
      router.replace('/auth/login');
    }
  };

  // Render Splash Screen during initial session check
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="space-y-4 animate-pulse">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto overflow-hidden shadow-lg border border-gray-100 dark:border-slate-800">
            <img src="/logo.png" alt="FINLYTICS Logo" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              FINLYTICS
            </h1>
            <p className="text-xs font-semibold text-[#187A4E] dark:text-emerald-400">
              Track • Plan • Save • Grow
            </p>
          </div>
          <div className="pt-4">
            <div className="w-6 h-6 border-2 border-[#187A4E] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Prevent rendering protected routes when unauthenticated
  if (authStatus === 'unauthenticated' && !isPublicRoute) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{ user, authStatus, login, register, logout, refreshUser: fetchSession }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
