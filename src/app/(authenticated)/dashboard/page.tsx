
"use client";

import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Calendar, 
  Zap, 
  BarChart3, 
  FileText, 
  ArrowRight, 
  Megaphone, 
  Info, 
  AlertTriangle, 
  Sparkles,
  User as UserIcon
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { fetchSystemUpdates } from '@/app/actions/db-actions';
import { SystemUpdate, UpdateType } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const { budgets } = useBudgets();
  const [yearFilter, setYearFilter] = useState('2026');
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);

  useEffect(() => {
    async function load() {
      const data = await fetchSystemUpdates();
      setUpdates(data.slice(0, 5)); // Only show latest 5
    }
    load();
  }, []);

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

  const getUpdateIcon = (type: UpdateType) => {
    switch (type) {
      case 'Alert': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'Feature': return <Sparkles className="h-4 w-4 text-emerald-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getUpdateColor = (type: UpdateType) => {
    switch (type) {
      case 'Alert': return 'border-l-red-500 bg-red-50/30';
      case 'Feature': return 'border-l-emerald-500 bg-emerald-50/30';
      default: return 'border-l-blue-500 bg-blue-50/30';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
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

      {/* Announcements Section */}
      {updates.length > 0 && (
        <Card className="border-none shadow-xl bg-white overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">System Updates</CardTitle>
            </div>
            {user?.role === 'Admin' && (
              <Button variant="ghost" size="sm" asChild className="text-[10px] uppercase font-black text-primary">
                <Link href="/admin/updates">Manage Updates</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {updates.map((update) => (
                <div 
                  key={update.id} 
                  className={`p-4 rounded-xl border-l-4 shadow-sm transition-all hover:translate-x-1 ${getUpdateColor(update.type)}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {getUpdateIcon(update.type)}
                        <h4 className="font-bold text-sm text-foreground uppercase tracking-tight">{update.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{update.content}</p>
                      <div className="flex items-center gap-1.5 pt-1">
                         <UserIcon className="h-3 w-3 text-muted-foreground" />
                         <span className="text-[10px] font-bold text-muted-foreground uppercase">Author: {update.createdBy}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-muted-foreground uppercase whitespace-nowrap bg-white/50 px-2 py-1 rounded">
                      {formatDistanceToNow(new Date(update.createdAt))} ago
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
