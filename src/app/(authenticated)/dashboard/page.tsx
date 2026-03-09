
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
import { TrendingUp, FileText, ArrowRight } from 'lucide-react';
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
          <p className="text-muted-foreground">
            {user?.role === 'Admin' 
              ? `System-wide overview for fiscal year ${yearFilter}`
              : `Budget overview for ${user?.section} - FY ${yearFilter}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter Year:</span>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[120px] bg-white border-none shadow-sm">
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
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activities</CardTitle>
              <CardDescription>Latest budget entries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentBudgets.length > 0 ? (
                recentBudgets.map((b) => (
                  <div key={b.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`p-2 rounded-md ${b.category === 'CAPEX' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent-foreground'}`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{b.actionPlan}</p>
                      <p className="text-xs text-muted-foreground">{b.section} • ₱{b.totalCost.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recent entries for this year.
                </div>
              )}
              <Button asChild variant="ghost" className="w-full text-primary hover:text-primary hover:bg-primary/5 text-sm gap-2 mt-2">
                <Link href="/budgets">
                  View All Entries <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground border-none shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="h-32 w-32 rotate-12" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              <Button asChild className="w-full bg-white text-primary hover:bg-white/90">
                <Link href="/budgets/new">Create New Budget</Link>
              </Button>
              <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white">
                Download Annual Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
