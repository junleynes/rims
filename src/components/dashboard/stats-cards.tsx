
"use client";

import { 
  CreditCard, 
  Layers, 
  Wallet, 
  FileText,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { BudgetEntry } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  budgets: BudgetEntry[];
  section?: string;
}

export function StatsCards({ budgets, section }: StatsCardsProps) {
  const totalBudget = budgets.reduce((acc, b) => acc + b.totalCostBudget, 0);
  const totalActual = budgets.reduce((acc, b) => acc + (b.totalCostActual || 0), 0);
  const totalCapex = budgets.filter(b => b.category === 'CAPEX').reduce((acc, b) => acc + b.totalCostBudget, 0);
  const totalEntries = budgets.length;

  const stats = [
    {
      title: section ? `${section} Budget` : "Total Budget (Projected)",
      value: `₱${totalBudget.toLocaleString()}`,
      icon: Wallet,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Actual Expenditure",
      value: `₱${totalActual.toLocaleString()}`,
      icon: CreditCard,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      title: "Total CAPEX",
      value: `₱${totalCapex.toLocaleString()}`,
      icon: Layers,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: "Total Entries",
      value: totalEntries.toString(),
      icon: FileText,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
              </div>
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-accent" />
              <span>Current Year Summary</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
