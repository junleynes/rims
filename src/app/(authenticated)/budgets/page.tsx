
"use client";

import React from 'react';
import { BudgetTableView } from '@/components/budget/budget-table-view';
import { useBudgets } from '@/components/budget-context';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function BudgetsPage() {
  const { budgets, deleteBudget } = useBudgets();

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Budget Items</h1>
          <p className="text-muted-foreground">Manage and track your section's expenditures.</p>
        </div>
        <Button asChild className="gap-2 bg-primary hover:bg-primary/90 shadow-lg">
          <Link href="/budgets/new">
            <Plus className="h-4 w-4" /> Encode New Item
          </Link>
        </Button>
      </div>

      <BudgetTableView budgets={budgets} onDelete={deleteBudget} />
    </div>
  );
}
