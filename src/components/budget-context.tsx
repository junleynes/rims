
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BudgetEntry } from '@/lib/types';
import { getBudgets, saveBudgets, addBudgetEntry, updateBudgetEntry, deleteBudgetEntry, importBudgetEntries, clearYearData } from '@/app/actions/db-actions';

interface BudgetContextType {
  budgets: BudgetEntry[];
  addBudget: (entry: Omit<BudgetEntry, 'id' | 'createdAt'>) => void;
  importBudgets: (entries: Omit<BudgetEntry, 'id' | 'createdAt'>[]) => void;
  updateBudget: (id: string, entry: Partial<BudgetEntry>) => void;
  deleteBudget: (id: string) => void;
  clearYearResources: (year: number) => Promise<void>;
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
    const newEntry = await addBudgetEntry(entry);
    setBudgets(prev => [newEntry, ...prev]);
  };

  const importBudgets = async (entries: Omit<BudgetEntry, 'id' | 'createdAt'>[]) => {
    const newEntries = await importBudgetEntries(entries);
    setBudgets(prev => [...newEntries, ...prev]);
  };

  const updateBudget = async (id: string, entry: Partial<BudgetEntry>) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...entry } : b));
    await updateBudgetEntry(id, entry);
  };

  const deleteBudget = async (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
    await deleteBudgetEntry(id);
  };

  const clearYearResources = async (year: number) => {
    const updated = budgets.filter(b => b.year !== year);
    setBudgets(updated);
    await clearYearData(year);
  };

  return (
    <BudgetContext.Provider value={{ budgets, addBudget, importBudgets, updateBudget, deleteBudget, clearYearResources, isLoading }}>
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
