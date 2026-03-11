
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
      color: "text-white",
      bg: "bg-blue-500",
    },
    {
      title: "Actual Expenditure",
      value: `₱${totalActual.toLocaleString()}`,
      icon: CreditCard,
      color: "text-white",
      bg: "bg-purple-500",
    },
    {
      title: "Total CAPEX",
      value: `₱${totalCapex.toLocaleString()}`,
      icon: Layers,
      color: "text-white",
      bg: "bg-emerald-500",
    },
    {
      title: "Total Entries",
      value: totalEntries.toString(),
      icon: FileText,
      color: "text-white",
      bg: "bg-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">{stat.title}</p>
                <h3 className="text-2xl font-black tracking-tight text-primary leading-none">{stat.value}</h3>
              </div>
              <div className={cn(
                "flex items-center justify-center h-12 w-12 rounded-2xl shadow-sm transition-transform group-hover:scale-110 shrink-0",
                stat.bg,
                stat.color
              )}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2">
               <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", stat.bg)} />
               <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Live Financial Overview</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
