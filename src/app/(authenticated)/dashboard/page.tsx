
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { useBudgets } from '@/components/budget-context';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { OpexChart } from '@/components/dashboard/opex-chart';
import { ExpenditureChart } from '@/components/dashboard/expenditure-chart';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Calendar, Zap, BarChart3, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user } = useAuth();
  const { budgets } = useBudgets();
  const [yearFilter, setYearFilter] = useState('2026');

  const filteredBudgets = budgets.filter(b => {
    const matchesYear = b.year.toString() === yearFilter;
    
    let matchesVisibility = true;
    if (user?.role === 'Manager') {
      matchesVisibility = b.section === user.section;
    } else if (user?.role === 'AVP') {
      matchesVisibility = b.division === user.division;
    }
    
    return matchesYear && matchesVisibility;
  });

  const recentBudgets = [...filteredBudgets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const isManagement = user?.role === 'Admin' || user?.role === 'VP' || user?.role === 'AVP' || user?.role === 'Viewer';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Activity className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              {user?.role === 'Admin' || user?.role === 'VP' || user?.role === 'Viewer'
                ? `Department-wide resource overview for fiscal year ${yearFilter}`
                : user?.role === 'AVP'
                  ? `Division overview for ${user?.division} - FY ${yearFilter}`
                  : `Resource overview for ${user?.section} - FY ${yearFilter}`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isManagement && (
            <Button asChild variant="outline" className="gap-2 font-bold h-10 border-primary/20 hover:bg-primary/5 text-primary">
              <Link href="/admin/reports">
                <BarChart3 className="h-4 w-4" /> Reports
              </Link>
            </Button>
          )}
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border h-10">
            <span className="text-xs font-bold text-muted-foreground ml-2 uppercase tracking-tighter">Fiscal Year:</span>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[100px] bg-muted/30 border-none shadow-none focus:ring-0 h-8">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <StatsCards budgets={filteredBudgets} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenditureChart budgets={filteredBudgets} />
        <OpexChart budgets={filteredBudgets} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <Card className="border-none shadow-lg bg-white overflow-hidden h-full">
            <div className="h-2 bg-accent" />
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Resource Log</CardTitle>
                <CardDescription>Latest inventory entries for FY {yearFilter}</CardDescription>
              </div>
              <Zap className="h-5 w-5 text-accent animate-pulse" />
            </CardHeader>
            <CardContent>
              {recentBudgets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recentBudgets.map((b) => (
                    <div key={b.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all cursor-default border border-transparent hover:border-border">
                      <div className={`p-2 rounded-lg ${b.category === 'CAPEX' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent-foreground'}`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate text-primary">{b.projectTitle}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">{b.section} • ₱{b.totalCostBudget.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
                  No recent entries for this year.
                </div>
              )}
              <Button asChild variant="ghost" className="w-full text-primary hover:text-primary hover:bg-primary/5 text-sm gap-2 mt-4 font-bold">
                <Link href="/budgets">
                  View Full Registry <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
