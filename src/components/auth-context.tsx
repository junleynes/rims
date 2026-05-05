
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { verifyUserCredentials } from '@/app/actions/db-actions';
import { useToast } from '@/hooks/use-toast';

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
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
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
        // Generate a random 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);
        setPendingUser(authenticatedUser);
        
        // Simulation: In a real app, this would be sent via SMS/Email.
        // For the prototype, we show it in a toast for the tester.
        toast({
          title: "2FA Code Sent (Simulated)",
          description: `Your verification code is: ${code}`,
          duration: 10000,
        });
        
        console.log(`[2FA Simulation] Code for ${username}: ${code}`);
      } else {
        setUser(authenticatedUser);
        localStorage.setItem('rims_user', JSON.stringify(authenticatedUser));
      }
    } else {
      throw new Error('Authentication failed. Invalid username or password.');
    }
  };

  const verify2FA = (code: string) => {
    // Check against the generated code for this session
    if (generatedCode && code === generatedCode && pendingUser) {
      setUser(pendingUser);
      localStorage.setItem('rims_user', JSON.stringify(pendingUser));
      setPendingUser(null);
      setGeneratedCode(null);
      return true;
    }
    return false;
  };

  const cancel2FA = () => {
    setPendingUser(null);
    setGeneratedCode(null);
  };

  const logout = () => {
    setUser(null);
    setPendingUser(null);
    setGeneratedCode(null);
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
