"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useBudgets } from '@/components/budget-context';
import { useSystemData } from '@/components/system-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Printer, 
  Download, 
  FileBarChart, 
  TrendingUp, 
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Brain,
  AlertTriangle,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  XCircle
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, CartesianGrid, Bar as RechartsBar } from 'recharts';
import { cn } from '@/lib/utils';
import { BudgetEntry } from '@/lib/types';
import { detectAnomalies, generateNarrativeReport, type AnomalyFlag } from '@/app/actions/ai-actions';

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

  const [anomalies, setAnomalies] = useState<AnomalyFlag[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [anomalyError, setAnomalyError] = useState('');
  const [showAnomalies, setShowAnomalies] = useState(false);

  const [narrative, setNarrative] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrativeError, setNarrativeError] = useState('');

  const handleDetectAnomalies = useCallback(async () => {
    setIsDetecting(true);
    setAnomalyError('');
    try {
      const filtered = budgets.filter(b => {
        if (b.year.toString() !== yearFilter) return false;
        if (divisionFilter !== 'All' && b.division !== divisionFilter) return false;
        return true;
      });
      const result = await detectAnomalies(filtered);
      setAnomalies(result.flags);
      setShowAnomalies(true);
    } catch (e: any) {
      setAnomalyError(e.message ?? 'Detection failed.');
    } finally {
      setIsDetecting(false);
    }
  }, [budgets, yearFilter, divisionFilter]);

  const handleGenerateNarrative = useCallback(async () => {
    setIsGenerating(true);
    setNarrativeError('');
    setNarrative('');
    try {
      const result = await generateNarrativeReport(budgets, yearFilter, divisionFilter);
      if (result.error) setNarrativeError(result.error);
      else setNarrative(result.narrative);
    } catch (e: any) {
      setNarrativeError(e.message ?? 'Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  }, [budgets, yearFilter, divisionFilter]);

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
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
            <FileBarChart className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Financial Reports</h1>
            <p className="text-muted-foreground font-medium">Generate and export comprehensive resource expenditure summaries.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handlePrint} className="gap-2 font-bold h-10 border-primary/20 hover:bg-primary/5">
            <Printer className="h-4 w-4" /> Print Report
          </Button>
          <Button variant="outline" className="gap-2 font-bold h-10 border-primary/20 hover:bg-primary/5">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleDetectAnomalies}
            disabled={isDetecting}
            className="gap-2 font-bold h-10 border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            {isDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            Detect Anomalies
          </Button>
          <Button
            onClick={handleGenerateNarrative}
            disabled={isGenerating}
            className="gap-2 font-bold h-10"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            AI Narrative
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

      {/* Anomaly Detection Panel */}
      {(showAnomalies || anomalyError) && (
        <Card className="border-none shadow-lg border-l-4 border-l-amber-400 print:hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
                Anomaly Detection Results
                {anomalies.length > 0 && (
                  <Badge variant="outline" className="ml-2 border-amber-400 text-amber-700 font-bold">
                    {anomalies.length} flag{anomalies.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAnomalies(v => !v)}>
                  {showAnomalies ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setAnomalies([]); setShowAnomalies(false); setAnomalyError(''); }}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {showAnomalies && (
            <CardContent>
              {anomalyError ? (
                <p className="text-sm text-destructive">{anomalyError}</p>
              ) : anomalies.length === 0 ? (
                <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-semibold">No anomalies detected for the current filter. Budget data looks clean.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {anomalies.map((flag) => (
                    <div
                      key={flag.id}
                      className={cn(
                        'flex items-start gap-4 p-4 rounded-xl border',
                        flag.severity === 'high' ? 'bg-red-50 border-red-200' :
                        flag.severity === 'medium' ? 'bg-amber-50 border-amber-200' :
                        'bg-blue-50 border-blue-200'
                      )}
                    >
                      <div className={cn(
                        'shrink-0 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-0.5',
                        flag.severity === 'high' ? 'bg-red-200 text-red-800' :
                        flag.severity === 'medium' ? 'bg-amber-200 text-amber-800' :
                        'bg-blue-200 text-blue-800'
                      )}>
                        {flag.severity}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{flag.projectTitle}</p>
                        <p className="text-xs text-muted-foreground font-semibold mb-1">{flag.section} · {flag.category}</p>
                        <p className="text-sm">{flag.reason}</p>
                      </div>
                      <div className="text-right text-xs shrink-0">
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-bold">₱{flag.budgeted.toLocaleString()}</p>
                        <p className="text-muted-foreground mt-1">Actual</p>
                        <p className="font-bold">₱{flag.actual.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* AI Narrative Panel */}
      {(narrative || narrativeError || isGenerating) && (
        <Card className="border-none shadow-lg border-l-4 border-l-primary print:hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Brain className="h-5 w-5" />
                AI Executive Summary
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setNarrative(''); setNarrativeError(''); }}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>FY {yearFilter} · {divisionFilter} · Generated by AI — review before use.</CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex items-center gap-3 text-muted-foreground py-6 justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Generating narrative…</span>
              </div>
            ) : narrativeError ? (
              <p className="text-sm text-destructive">{narrativeError}</p>
            ) : (
              <div className="space-y-3">
                <div className="bg-muted/30 rounded-xl p-5 text-sm leading-relaxed whitespace-pre-wrap border">
                  {narrative}
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-bold gap-2"
                    onClick={() => navigator.clipboard.writeText(narrative)}
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Copy to Clipboard
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
