
"use client";

import React, { useState, useMemo } from 'react';
import { useBudgets } from '@/components/budget-context';
import { useSystemData } from '@/components/system-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Printer, 
  Download, 
  FileBarChart, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, CartesianGrid, Bar as RechartsBar } from 'recharts';
import { cn } from '@/lib/utils';
import { BudgetEntry } from '@/lib/types';

type SortConfig = {
  key: keyof BudgetEntry | 'variance';
  direction: 'asc' | 'desc';
} | null;

export default function ReportsPage() {
  const { budgets } = useBudgets();
  const { divisions } = useSystemData();
  const [yearFilter, setYearFilter] = useState('2026');
  const [divisionFilter, setDivisionFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const handleSort = (key: keyof BudgetEntry | 'variance') => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: keyof BudgetEntry | 'variance') => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-3 w-3 text-primary" /> : <ArrowDown className="ml-2 h-3 w-3 text-primary" />;
  };

  const reportData = useMemo(() => {
    let filtered = budgets.filter(b => b.year.toString() === yearFilter);
    if (divisionFilter !== 'All') {
      filtered = filtered.filter(b => b.division === divisionFilter);
    }

    const summary = filtered.reduce((acc, b) => {
      const cat = b.category;
      acc[cat].budget += b.totalCostBudget;
      acc[cat].actual += b.totalCostActual || 0;
      acc[cat].count += 1;
      return acc;
    }, {
      CAPEX: { budget: 0, actual: 0, count: 0 },
      OPEX: { budget: 0, actual: 0, count: 0 }
    });

    const chartData = [
      { name: 'CAPEX', budget: summary.CAPEX.budget, actual: summary.CAPEX.actual },
      { name: 'OPEX', budget: summary.OPEX.budget, actual: summary.OPEX.actual }
    ];

    // Sorting logic
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortConfig.key === 'variance') {
          valA = a.totalCostBudget - (a.totalCostActual || 0);
          valB = b.totalCostBudget - (b.totalCostActual || 0);
        } else {
          valA = a[sortConfig.key as keyof BudgetEntry];
          valB = b[sortConfig.key as keyof BudgetEntry];
        }

        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        const comparison = valA < valB ? -1 : 1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return { summary, chartData, filtered };
  }, [budgets, yearFilter, divisionFilter, sortConfig]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Financial Reports</h1>
          <p className="text-muted-foreground">Generate and export comprehensive resource expenditure summaries.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handlePrint} className="gap-2 font-bold h-10 border-primary/20 hover:bg-primary/5">
            <Printer className="h-4 w-4" /> Print Report
          </Button>
          <Button variant="outline" className="gap-2 font-bold h-10 border-primary/20 hover:bg-primary/5">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm print:hidden">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Fiscal Year</label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">FY 2025</SelectItem>
                  <SelectItem value="2026">FY 2026</SelectItem>
                  <SelectItem value="2027">FY 2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filter by Division</label>
              <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="All Divisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Divisions</SelectItem>
                  {divisions.map(d => (
                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Budget Allocation Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₱${(val / 1000000).toFixed(1)}M`} />
                <RechartsTooltip 
                  formatter={(value: number) => `₱${value.toLocaleString()}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend />
                <RechartsBar dataKey="budget" name="Allocated Budget" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <RechartsBar dataKey="actual" name="Actual Expenditure" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <FileBarChart className="h-32 w-32 rotate-12" />
            </div>
            <CardContent className="p-8">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Total CAPEX Allocated</p>
              <h2 className="text-4xl font-black">₱{reportData.summary.CAPEX.budget.toLocaleString()}</h2>
              <div className="mt-4 flex items-center gap-4 text-xs font-bold">
                <span className="bg-white/20 px-2 py-1 rounded">{reportData.summary.CAPEX.count} Items Encoded</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-accent text-accent-foreground border-none shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Layers className="h-32 w-32 rotate-12" />
            </div>
            <CardContent className="p-8">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Total OPEX Allocated</p>
              <h2 className="text-4xl font-black">₱{reportData.summary.OPEX.budget.toLocaleString()}</h2>
              <div className="mt-4 flex items-center gap-4 text-xs font-bold">
                <span className="bg-black/10 px-2 py-1 rounded">{reportData.summary.OPEX.count} Items Encoded</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Resource Summary Table</CardTitle>
            <CardDescription>Fiscal Year {yearFilter} - {divisionFilter}</CardDescription>
          </div>
          <FileBarChart className="h-6 w-6 text-muted-foreground/50" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead 
                  className="font-bold cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort('projectTitle')}
                >
                  <div className="flex items-center">Project / Item Title {getSortIcon('projectTitle')}</div>
                </TableHead>
                <TableHead 
                  className="font-bold cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center">Category {getSortIcon('category')}</div>
                </TableHead>
                <TableHead 
                  className="font-bold cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort('section')}
                >
                  <div className="flex items-center">Section/Unit {getSortIcon('section')}</div>
                </TableHead>
                <TableHead 
                  className="font-bold cursor-pointer hover:bg-muted transition-colors text-right"
                  onClick={() => handleSort('totalCostBudget')}
                >
                  <div className="flex items-center justify-end">Allocated Cost {getSortIcon('totalCostBudget')}</div>
                </TableHead>
                <TableHead 
                  className="font-bold cursor-pointer hover:bg-muted transition-colors text-right"
                  onClick={() => handleSort('totalCostActual')}
                >
                  <div className="flex items-center justify-end">Actual Cost {getSortIcon('totalCostActual')}</div>
                </TableHead>
                <TableHead 
                  className="font-bold cursor-pointer hover:bg-muted transition-colors text-right"
                  onClick={() => handleSort('variance')}
                >
                  <div className="flex items-center justify-end">Variance {getSortIcon('variance')}</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.filtered.length > 0 ? (
                reportData.filtered.map((item) => {
                  const variance = (item.totalCostBudget - (item.totalCostActual || 0));
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold text-primary">{item.projectTitle}</TableCell>
                      <TableCell className="text-xs font-black uppercase tracking-tighter">{item.category}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-semibold">{item.section}</TableCell>
                      <TableCell className="text-right font-medium">₱{item.totalCostBudget.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium text-muted-foreground">₱{(item.totalCostActual || 0).toLocaleString()}</TableCell>
                      <TableCell className={cn(
                        "text-right font-bold",
                        variance < 0 ? "text-destructive" : "text-emerald-600"
                      )}>
                        ₱{variance.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                    No records found for the selected criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
