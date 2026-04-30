
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { MOCK_USERS } from '@/lib/mock-data';

interface AuthContextType {
  user: User | null;
  pendingUser: User | null;
  login: (username: string) => void;
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
    const savedUser = localStorage.getItem('budgetguard_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (username: string) => {
    const savedUsersStr = localStorage.getItem('rims_users');
    const allUsers: User[] = savedUsersStr ? JSON.parse(savedUsersStr) : MOCK_USERS;
    
    const foundUser = allUsers.find(u => u.username === username);
    
    if (foundUser) {
      if (foundUser.twoFactorEnabled) {
        setPendingUser(foundUser);
      } else {
        setUser(foundUser);
        localStorage.setItem('budgetguard_user', JSON.stringify(foundUser));
      }
    } else {
      throw new Error('User not found');
    }
  };

  const verify2FA = (code: string) => {
    if (code === '123456' && pendingUser) {
      setUser(pendingUser);
      localStorage.setItem('budgetguard_user', JSON.stringify(pendingUser));
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
    localStorage.removeItem('budgetguard_user');
  };

  const updateCurrentUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('budgetguard_user', JSON.stringify(updatedUser));
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
