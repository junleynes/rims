
"use client";

import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BudgetEntry } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface OpexChartProps {
  budgets: BudgetEntry[];
}

export function OpexChart({ budgets }: OpexChartProps) {
  const opexBudgets = budgets.filter(b => b.category === 'OPEX');
  
  const breakdown = opexBudgets.reduce((acc, b) => {
    acc[b.subcategory] = (acc[b.subcategory] || 0) + b.totalCost;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(breakdown).map(([name, value]) => ({
    name,
    value,
  })).sort((a, b) => b.value - a.value);

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    '#3b82f6',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#10b981',
  ];

  if (data.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center border-none shadow-sm">
        <p className="text-muted-foreground">No OPEX data found for selected filters.</p>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>OPEX Breakdown</CardTitle>
        <CardDescription>Distribution by Subcategory</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 pt-6">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip 
                formatter={(value: number) => `₱${value.toLocaleString()}`}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
