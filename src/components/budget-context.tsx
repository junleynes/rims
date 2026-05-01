
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BudgetEntry } from '@/lib/types';
import { getBudgets, saveBudgets } from '@/app/actions/db-actions';

interface BudgetContextType {
  budgets: BudgetEntry[];
  addBudget: (entry: Omit<BudgetEntry, 'id' | 'createdAt'>) => void;
  importBudgets: (entries: Omit<BudgetEntry, 'id' | 'createdAt'>[]) => void;
  updateBudget: (id: string, entry: Partial<BudgetEntry>) => void;
  deleteBudget: (id: string) => void;
  isLoading: boolean;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getBudgets();
      setBudgets(data || []);
      setIsLoading(false);
    }
    load();
  }, []);

  const addBudget = async (entry: Omit<BudgetEntry, 'id' | 'createdAt'>) => {
    const newEntry: BudgetEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...budgets];
    setBudgets(updated);
    await saveBudgets(updated);
  };

  const importBudgets = async (entries: Omit<BudgetEntry, 'id' | 'createdAt'>[]) => {
    const newEntries: BudgetEntry[] = entries.map(entry => ({
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    }));
    const updated = [...newEntries, ...budgets];
    setBudgets(updated);
    await saveBudgets(updated);
  };

  const updateBudget = async (id: string, entry: Partial<BudgetEntry>) => {
    const updated = budgets.map(b => b.id === id ? { ...b, ...entry } : b);
    setBudgets(updated);
    await saveBudgets(updated);
  };

  const deleteBudget = async (id: string) => {
    const updated = budgets.filter(b => b.id !== id);
    setBudgets(updated);
    await saveBudgets(updated);
  };

  return (
    <BudgetContext.Provider value={{ budgets, addBudget, importBudgets, updateBudget, deleteBudget, isLoading }}>
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
