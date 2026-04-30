
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BudgetEntry } from '@/lib/types';
import { getResources, saveResources } from '@/app/actions/db-actions';

interface BudgetContextType {
  budgets: BudgetEntry[];
  addBudget: (entry: Omit<BudgetEntry, 'id' | 'createdAt'>) => void;
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
      try {
        const data = await getResources();
        setBudgets(data);
      } catch (e) {
        console.error("Failed to load resources from server", e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const addBudget = async (entry: Omit<BudgetEntry, 'id' | 'createdAt'>) => {
    const newEntry: BudgetEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    } as BudgetEntry;
    
    const newBudgets = [newEntry, ...budgets];
    setBudgets(newBudgets);
    await saveResources(newBudgets);
  };

  const updateBudget = async (id: string, entry: Partial<BudgetEntry>) => {
    const newBudgets = budgets.map(b => b.id === id ? { ...b, ...entry } : b);
    setBudgets(newBudgets);
    await saveResources(newBudgets);
  };

  const deleteBudget = async (id: string) => {
    const newBudgets = budgets.filter(b => b.id !== id);
    setBudgets(newBudgets);
    await saveResources(newBudgets);
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
