
"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { BudgetEntry } from '@/lib/types';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

interface BudgetContextType {
  budgets: BudgetEntry[];
  addBudget: (entry: Omit<BudgetEntry, 'id' | 'createdAt'>) => void;
  updateBudget: (id: string, entry: Partial<BudgetEntry>) => void;
  deleteBudget: (id: string) => void;
  isLoading: boolean;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const db = useFirestore();
  const { user } = useUser();

  const budgetsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: budgetsData, loading: isLoading } = useCollection<BudgetEntry>(budgetsQuery);

  const budgets = useMemo(() => {
    return budgetsData || [];
  }, [budgetsData]);

  const addBudget = (entry: Omit<BudgetEntry, 'id' | 'createdAt'>) => {
    if (!db) return;
    const newDocRef = doc(collection(db, 'resources'));
    const data = {
      ...entry,
      id: newDocRef.id,
      createdAt: serverTimestamp(),
    };

    setDoc(newDocRef, data)
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: newDocRef.path,
          operation: 'create',
          requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const updateBudget = (id: string, entry: Partial<BudgetEntry>) => {
    if (!db) return;
    const docRef = doc(db, 'resources', id);
    setDoc(docRef, entry, { merge: true })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: entry,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const deleteBudget = (id: string) => {
    if (!db) return;
    const docRef = doc(db, 'resources', id);
    deleteDoc(docRef)
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  return (
    <BudgetContext.Provider value={{ budgets, addBudget, updateBudget, deleteBudget, isLoading }}>
      {children}
    </BudgetContext.Provider>
  );
}

export const useBudgets = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudgets must be used within a BudgetProvider');
  }
  return context;
};
