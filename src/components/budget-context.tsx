
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BudgetEntry } from '@/lib/types';
import { MOCK_BUDGETS } from '@/lib/mock-data';

interface BudgetContextType {
  budgets: BudgetEntry[];
  addBudget: (entry: Omit<BudgetEntry, 'id' | 'createdAt'>) => void;
  deleteBudget: (id: string) => void;
  isLoading: boolean;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedBudgets = localStorage.getItem('budgetguard_data');
    if (savedBudgets) {
      setBudgets(JSON.parse(savedBudgets));
    } else {
      setBudgets(MOCK_BUDGETS);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('budgetguard_data', JSON.stringify(budgets));
    }
  }, [budgets, isLoading]);

  const addBudget = (entry: Omit<BudgetEntry, 'id' | 'createdAt'>) => {
    const newEntry: BudgetEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setBudgets(prev => [newEntry, ...prev]);
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  return (
    <BudgetContext.Provider value={{ budgets, addBudget, deleteBudget, isLoading }}>
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
