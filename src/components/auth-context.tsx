"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  actionLogin,
  actionLogout,
  actionVerify2FA,
  actionConfirmSetup2FA,
  actionGetSession,
} from '@/app/actions/auth-actions';
import type { SessionUser } from '@/lib/session';

interface PendingState {
  needs2FASetup?: boolean;
  setupData?: { secret: string; qrCodeUrl: string };
}

interface AuthContextType {
  user: SessionUser | null;
  pending: PendingState | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<
    | { status: 'locked'; remainingSeconds: number }
    | { status: 'invalid' }
    | { status: 'maintenance' }
    | { status: 'needs_2fa_setup'; qrCodeUrl: string; secret: string }
    | { status: 'needs_2fa_verify' }
    | { status: 'ok' }
  >;
  verify2FA: (code: string) => Promise<{ success: boolean; error?: string }>;
  confirmSetup2FA: (code: string, secret: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  cancelPending: () => void;
  updateCurrentUser: (partial: Partial<SessionUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children, initialUser }: { children: React.ReactNode; initialUser?: SessionUser }) {
  const [user, setUser] = useState<SessionUser | null>(initialUser ?? null);
  const [pending, setPending] = useState<PendingState | null>(null);
  // If initialUser was provided by the server layout, skip the async bootstrap
  const [isLoading, setIsLoading] = useState(!initialUser);

  // Only bootstrap from server if no initialUser was passed (i.e. login page)
  useEffect(() => {
    if (initialUser) return;
    actionGetSession().then((u) => {
      setUser(u);
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await actionLogin(username, password);
    if (result.status === 'ok') {
      setUser(result.user);
      setPending(null);
    } else if (result.status === 'needs_2fa_verify') {
      setPending({});
    } else if (result.status === 'needs_2fa_setup') {
      setPending({ needs2FASetup: true, setupData: { secret: result.secret, qrCodeUrl: result.qrCodeUrl } });
    }
    return result;
  }, []);

  const verify2FA = useCallback(async (code: string) => {
    const result = await actionVerify2FA(code);
    if (result.success && result.user) {
      setUser(result.user);
      setPending(null);
    }
    return result;
  }, []);

  const confirmSetup2FA = useCallback(async (code: string, secret: string) => {
    const result = await actionConfirmSetup2FA(code, secret);
    if (result.success && result.user) {
      setUser(result.user);
      setPending(null);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await actionLogout();
    setUser(null);
    setPending(null);
  }, []);

  const cancelPending = useCallback(() => setPending(null), []);

  const updateCurrentUser = useCallback((partial: Partial<SessionUser>) => {
    setUser(prev => prev ? { ...prev, ...partial } : prev);
  }, []);

  return (
    <AuthContext.Provider value={{ user, pending, isLoading, login, verify2FA, confirmSetup2FA, logout, cancelPending, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
