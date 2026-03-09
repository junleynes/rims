
"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBudgets } from '@/components/budget-context';
import { BudgetForm } from '@/components/budget/budget-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function EditBudgetPage() {
  const params = useParams();
  const router = useRouter();
  const { budgets, isLoading } = useBudgets();
  
  const id = params.id as string;
  const budget = budgets.find(b => b.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-primary mb-4">Entry Not Found</h2>
        <p className="text-muted-foreground mb-8">The budget entry you are trying to edit does not exist.</p>
        <Button onClick={() => router.push('/budgets')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Budgets
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-right-4 duration-500">
      <div className="max-w-4xl mx-auto mb-6 px-4">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
      <BudgetForm initialData={budget} />
    </div>
  );
}
