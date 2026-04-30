
"use client";

import { 
  CreditCard, 
  Layers, 
  Wallet, 
  FileText,
  Receipt
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
  const totalOpex = budgets.filter(b => b.category === 'OPEX').reduce((acc, b) => acc + b.totalCostBudget, 0);
  const totalEntries = budgets.length;

  const stats = [
    {
      title: section ? `${section} Budget` : "Total Budget (Projected)",
      value: `₱${totalBudget.toLocaleString()}`,
      icon: Wallet,
      color: "text-white",
      bg: "bg-blue-600",
    },
    {
      title: "Total CAPEX",
      value: `₱${totalCapex.toLocaleString()}`,
      icon: Layers,
      color: "text-white",
      bg: "bg-emerald-600",
    },
    {
      title: "Total OPEX",
      value: `₱${totalOpex.toLocaleString()}`,
      icon: Receipt,
      color: "text-white",
      bg: "bg-amber-600",
    },
    {
      title: "Actual Expenditure",
      value: `₱${totalActual.toLocaleString()}`,
      icon: CreditCard,
      color: "text-white",
      bg: "bg-purple-600",
    },
    {
      title: "Total Entries",
      value: totalEntries.toString(),
      icon: FileText,
      color: "text-white",
      bg: "bg-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {stats.map((stat, i) => (
        <Card key={i} className="border-none shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">{stat.title}</p>
                <h3 className="text-2xl font-black tracking-tight text-primary leading-none">{stat.value}</h3>
              </div>
              <div className={cn(
                "flex items-center justify-center h-16 w-16 rounded-2xl shadow-lg transition-transform group-hover:scale-110 shrink-0",
                stat.bg,
                stat.color
              )}>
                <stat.icon className="h-8 w-8" />
              </div>
            </div>
            <div className="mt-8 flex items-center gap-2">
               <div className={cn("h-2 w-2 rounded-full animate-pulse", stat.bg)} />
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Live Financial Overview</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
