
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { verifyUserCredentials, verifyLogin2FA } from '@/app/actions/db-actions';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  pendingUser: User | null;
  login: (username: string, password?: string) => Promise<void>;
  verify2FA: (code: string) => Promise<boolean>;
  cancel2FA: () => void;
  logout: () => void;
  updateCurrentUser: (updatedUser: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const savedUser = localStorage.getItem('rims_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('rims_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password?: string) => {
    // Call server action to verify credentials securely
    const authenticatedUser = await verifyUserCredentials(username, password);
    
    if (authenticatedUser) {
      if (authenticatedUser.twoFactorEnabled) {
        setPendingUser(authenticatedUser);
      } else {
        setUser(authenticatedUser);
        localStorage.setItem('rims_user', JSON.stringify(authenticatedUser));
      }
    } else {
      throw new Error('Authentication failed. Invalid username or password.');
    }
  };

  const verify2FA = async (code: string) => {
    if (!pendingUser) return false;

    // Call server action to verify standard TOTP code
    const isValid = await verifyLogin2FA(pendingUser.id, code);
    
    if (isValid) {
      setUser(pendingUser);
      localStorage.setItem('rims_user', JSON.stringify(pendingUser));
      setPendingUser(null);
      return true;
    }
    return false;
  };

  const cancel2FA = () => {
    setPendingUser(null);
  };

  const logout = () => {
    setUser(null);
    setPendingUser(null);
    localStorage.removeItem('rims_user');
  };

  const updateCurrentUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('rims_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, pendingUser, login, verify2FA, cancel2FA, logout, updateCurrentUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
