
"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBudgets } from '@/components/budget-context';
import { useAuth } from '@/components/auth-context';
import { useSystemData } from '@/components/system-data-context';
import { BudgetForm } from '@/components/budget/budget-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EditBudgetPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { budgets, isLoading } = useBudgets();
  const { lockedYears } = useSystemData();
  const { toast } = useToast();
  
  const id = params.id as string;
  const budget = budgets.find(b => b.id === id);

  const isAdminOrVP = user?.role === 'Admin' || user?.role === 'VP';
  const isLocked = budget ? lockedYears.some(ly => ly.year === budget.year) : false;

  useEffect(() => {
    if (!isLoading && budget && isLocked && !isAdminOrVP) {
      toast({
        title: "Year Locked",
        description: "Editing for this fiscal year has been restricted by an administrator.",
        variant: "destructive"
      });
      router.push('/budgets');
    }
  }, [isLoading, budget, isLocked, isAdminOrVP, router, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="w-full py-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-primary mb-4">Entry Not Found</h2>
        <p className="text-muted-foreground mb-8">The budget entry you are trying to edit does not exist.</p>
        <Button onClick={() => router.push('/budgets')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Budgets
        </Button>
      </div>
    );
  }

  if (isLocked && !isAdminOrVP) {
    return null; // Will be handled by useEffect redirect
  }

  return (
    <div className="animate-in slide-in-from-right-4 duration-500">
      <div className="w-full mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {isLocked && isAdminOrVP && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-bold">
            <Lock className="h-3.5 w-3.5" /> Administrative Lock Override Active
          </div>
        )}
      </div>
      <BudgetForm initialData={budget} />
    </div>
  );
}
