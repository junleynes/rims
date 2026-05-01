
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { getSystemData } from '@/app/actions/db-actions';

interface AuthContextType {
  user: User | null;
  pendingUser: User | null;
  login: (username: string, password?: string) => Promise<void>;
  verify2FA: (code: string) => boolean;
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
    const { users } = await getSystemData();
    const foundUser = users.find(u => u.username === username);
    
    // Simple simulation: Check if user exists. 
    // In this local setup, any password will be accepted if the user exists.
    if (foundUser) {
      if (foundUser.twoFactorEnabled) {
        setPendingUser(foundUser);
      } else {
        setUser(foundUser);
        localStorage.setItem('rims_user', JSON.stringify(foundUser));
      }
    } else {
      throw new Error('User not found');
    }
  };

  const verify2FA = (code: string) => {
    // Default system-wide 2FA code for simulation
    if (code === '123456' && pendingUser) {
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
