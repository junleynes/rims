
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { useCollection, useFirestore, useAuth as useFirebaseAuth } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';

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
  const db = useFirestore();

  useEffect(() => {
    const savedUser = localStorage.getItem('rims_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string) => {
    if (!db) return;
    
    // In a real app with Firebase Auth, we would use signInWithEmailAndPassword.
    // Here, we simulate login by querying the users collection.
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username), limit(1));
    
    // Note: useCollection is for real-time, but for one-off login we might use getDocs.
    // However, since we must stick to client hooks, we simulate it.
    // For the prototype, we rely on the registry we built.
    const savedUsersStr = localStorage.getItem('rims_users_cache');
    const allUsers: User[] = savedUsersStr ? JSON.parse(savedUsersStr) : [];
    
    const foundUser = allUsers.find(u => u.username === username);
    
    if (foundUser) {
      if (foundUser.twoFactorEnabled) {
        setPendingUser(foundUser);
      } else {
        setUser(foundUser);
        localStorage.setItem('rims_user', JSON.stringify(foundUser));
      }
    } else {
      // Fallback for demo admin
      if (username === 'admin') {
        const adminUser: User = {
          id: 'admin-id',
          username: 'admin',
          name: 'System Administrator',
          role: 'Admin',
          twoFactorEnabled: true
        };
        setPendingUser(adminUser);
      } else {
        throw new Error('User not found');
      }
    }
  };

  const verify2FA = (code: string) => {
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
