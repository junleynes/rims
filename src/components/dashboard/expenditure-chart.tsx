
"use client";

import React, { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BudgetEntry } from '@/lib/types';

interface ExpenditureChartProps {
  budgets: BudgetEntry[];
}

export function ExpenditureChart({ budgets }: ExpenditureChartProps) {
  const chartData = useMemo(() => {
    const summary = budgets.reduce((acc, b) => {
      const cat = b.category;
      if (acc[cat]) {
        acc[cat].budget += b.totalCostBudget;
        acc[cat].actual += b.totalCostActual || 0;
      }
      return acc;
    }, {
      CAPEX: { budget: 0, actual: 0 },
      OPEX: { budget: 0, actual: 0 }
    });

    return [
      { name: 'CAPEX', budget: summary.CAPEX.budget, actual: summary.CAPEX.actual },
      { name: 'OPEX', budget: summary.OPEX.budget, actual: summary.OPEX.actual }
    ];
  }, [budgets]);

  return (
    <Card className="border-none shadow-lg bg-white h-full">
      <CardHeader>
        <CardTitle className="text-lg">Expenditure Summary</CardTitle>
        <CardDescription>Comparison of CAPEX vs OPEX (Allocated vs Actual)</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₱${(val / 1000000).toFixed(1)}M`} />
            <Tooltip 
              formatter={(value: number) => `₱${value.toLocaleString()}`}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
            />
            <Legend />
            <Bar dataKey="budget" name="Allocated Budget" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" name="Actual Expenditure" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
