
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { useBudgets } from '@/components/budget-context';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { OpexChart } from '@/components/dashboard/opex-chart';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, FileText, ArrowRight, Activity, Calendar, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user } = useAuth();
  const { budgets } = useBudgets();
  const [yearFilter, setYearFilter] = useState('2026');

  const filteredBudgets = budgets.filter(b => {
    const matchesYear = b.year.toString() === yearFilter;
    const matchesSection = user?.role === 'Manager' ? b.section === user.section : true;
    return matchesYear && matchesSection;
  });

  const recentBudgets = [...filteredBudgets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

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
              {user?.role === 'Admin' 
                ? `System-wide overview for fiscal year ${yearFilter}`
                : `Budget overview for ${user?.section} - FY ${yearFilter}`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border">
          <span className="text-sm font-semibold text-muted-foreground ml-2">Fiscal Year:</span>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[120px] bg-muted/30 border-none shadow-none focus:ring-0">
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

      <StatsCards budgets={filteredBudgets} section={user?.role === 'Manager' ? user.section : undefined} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OpexChart budgets={filteredBudgets} />
        </div>
        
        <div className="space-y-6">
          <Card className="border-none shadow-lg bg-white overflow-hidden">
            <div className="h-2 bg-accent" />
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Activities</CardTitle>
                <CardDescription>Latest budget entries</CardDescription>
              </div>
              <Zap className="h-5 w-5 text-accent animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
              {recentBudgets.length > 0 ? (
                recentBudgets.map((b) => (
                  <div key={b.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all cursor-default border border-transparent hover:border-border">
                    <div className={`p-2 rounded-lg ${b.category === 'CAPEX' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent-foreground'}`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-primary">{b.actionPlan || b.projectTitle}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">{b.section} • ₱{b.totalCostBudget.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
                  No recent entries for this year.
                </div>
              )}
              <Button asChild variant="ghost" className="w-full text-primary hover:text-primary hover:bg-primary/5 text-sm gap-2 mt-2 font-bold">
                <Link href="/budgets">
                  View Full Registry <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="h-40 w-40 rotate-12" />
            </div>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
              <CardDescription className="text-primary-foreground/70">Manage your resources efficiently</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <Button asChild className="w-full bg-white text-primary hover:bg-white/90 shadow-md font-bold h-12">
                <Link href="/budgets/new">Encode New Item</Link>
              </Button>
              <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white h-12 font-semibold">
                Generate Annual Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
