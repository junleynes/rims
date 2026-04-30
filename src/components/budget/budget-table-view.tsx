"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Download, 
  Trash2, 
  MoreVertical,
  Edit2,
  ChevronRight,
  LayoutGrid,
  Building2,
  ArrowLeft,
  CalendarDays,
  Filter,
  Globe,
  MapPin,
  Paperclip
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetEntry, BudgetCategory } from '@/lib/types';
import { useAuth } from '@/components/auth-context';
import { useSystemData } from '@/components/system-data-context';
import { cn } from '@/lib/utils';

interface BudgetTableViewProps {
  budgets: BudgetEntry[];
  onDelete?: (id: string) => void;
}

type ViewScope = 'drilldown' | 'whole' | 'division';

export function BudgetTableView({ budgets, onDelete }: BudgetTableViewProps) {
  const { user } = useAuth();
  const { divisions, sections } = useSystemData();
  const router = useRouter();
  
  const [scope, setScope] = useState<ViewScope>('drilldown');
  const [currentDivisionName, setCurrentDivisionName] = useState<string | null>(
    user?.division || null
  );
  const [currentSectionName, setCurrentSectionName] = useState<string | null>(
    user?.section || null
  );
  const [currentYear, setCurrentYear] = useState<string | null>(null);
  const [selectedDivisionFlat, setSelectedDivisionFlat] = useState<string | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | 'All'>('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.role === 'Manager') {
      if (user.division) setCurrentDivisionName(user.division);
      if (user.section) setCurrentSectionName(user.section);
    }
  }, [user]);

  const availableYears = useMemo(() => {
    const currentYearNum = new Date().getFullYear();
    const dynamicYears = [];
    for (let i = currentYearNum - 2; i <= currentYearNum + 2; i++) {
      dynamicYears.push(i.toString());
    }
    const existingDataYears = (budgets || [])
      .map(b => b.year?.toString())
      .filter(Boolean);
    return Array.from(new Set([...dynamicYears, ...existingDataYears])).sort();
  }, [budgets]);

  const filteredBudgets = useMemo(() => {
    return (budgets || []).filter(b => {
      if (user?.role === 'Manager') {
        if (user.division && b.division !== user.division) return false;
        if (user.section && b.section !== user.section) return false;
      }
      if (scope === 'drilldown') {
        if (currentDivisionName && b.division !== currentDivisionName) return false;
        if (currentSectionName && b.section !== currentSectionName) return false;
        if (currentYear && b.year?.toString() !== currentYear) return false;
      } else if (scope === 'division') {
        if (selectedDivisionFlat !== 'All' && b.division !== selectedDivisionFlat) return false;
      }
      const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
      const matchesSearch = 
        (b.projectTitle || '').toLowerCase().includes(search.toLowerCase()) || 
        (b.itemDescription || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.section || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.location || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.accountablePerson || '').toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [budgets, scope, currentDivisionName, currentSectionName, currentYear, selectedDivisionFlat, selectedCategory, search, user]);

  const renderHeaderControls = () => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-border/50 mb-6">
      <div className="flex items-center gap-4">
        <Tabs value={scope} onValueChange={(v) => setScope(v as ViewScope)} className="w-auto">
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="drilldown" className="text-xs gap-2">
              <Filter className="h-3 w-3" /> Drill-down
            </TabsTrigger>
            <TabsTrigger value="division" className="text-xs gap-2">
              <Building2 className="h-3 w-3" /> Division
            </TabsTrigger>
            <TabsTrigger value="whole" className="text-xs gap-2">
              <Globe className="h-3 w-3" /> Whole Log
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {scope === 'division' && (
          <Select 
            value={selectedDivisionFlat} 
            onValueChange={setSelectedDivisionFlat}
            disabled={user?.role === 'Manager' && !!user.division}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="Select Division" />
            </SelectTrigger>
            <SelectContent>
              {user?.role !== 'Manager' && <SelectItem value="All">All Divisions</SelectItem>}
              {divisions
                .filter(d => user?.role === 'Manager' ? d.name === user.division : true)
                .map(d => <SelectItem key={d.id} value={d.name} className="text-xs">{d.name}</SelectItem>)
              }
            </SelectContent>
          </Select>
        )}
        <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as BudgetCategory | 'All')}>
          <SelectTrigger className="h-8 w-[100px] text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            <SelectItem value="CAPEX">CAPEX</SelectItem>
            <SelectItem value="OPEX">OPEX</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative h-8">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            placeholder="Search log..." 
            className="pl-8 h-8 w-48 text-xs bg-muted/50 border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>
    </div>
  );

  const getStatusBadge = (budget: BudgetEntry) => {
    const statusText = budget.status === 'others:' ? budget.statusOthers : budget.status;
    let colorClass = "bg-muted text-muted-foreground";
    
    if (budget.status === 'working') colorClass = "bg-green-100 text-green-700 border-green-200";
    if (budget.status === 'defective') colorClass = "bg-red-100 text-red-700 border-red-200";
    if (budget.status === 'turned over to SAMD') colorClass = "bg-blue-100 text-blue-700 border-blue-200";
    
    return (
      <Badge variant="outline" className={cn("text-[9px] font-bold uppercase py-0 px-2", colorClass)}>
        {statusText}
      </Badge>
    );
  };

  if (scope === 'drilldown') {
    if (!currentDivisionName && user?.role === 'Admin') {
      return (
        <div className="space-y-6">
          {renderHeaderControls()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {divisions.map((division) => (
              <Card 
                key={division.id} 
                className="group cursor-pointer hover:border-primary hover:shadow-xl transition-all border-none bg-white overflow-hidden shadow-sm"
                onClick={() => setCurrentDivisionName(division.name)}
              >
                <CardContent className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-500 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{division.name}</h3>
                      <p className="text-sm text-muted-foreground">Select to view sections</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-primary translate-x-0 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }
    if (currentDivisionName && !currentSectionName) {
      const divId = divisions.find(d => d.name === currentDivisionName)?.id;
      const filteredSections = sections.filter(s => s.divisionId === divId);
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center gap-4">
            {user?.role === 'Admin' && (
              <Button variant="ghost" size="sm" onClick={() => setCurrentDivisionName(null)} className="gap-2 font-bold text-primary">
                <ArrowLeft className="h-4 w-4" /> Back to Divisions
              </Button>
            )}
            <div className="h-4 w-px bg-border" />
            <h2 className="text-lg font-bold text-primary">{currentDivisionName}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSections.map((section) => (
              <Card 
                key={section.id} 
                className="group cursor-pointer hover:border-accent hover:shadow-xl transition-all border-none bg-white shadow-sm"
                onClick={() => setCurrentSectionName(section.name)}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-500 text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                      <LayoutGrid className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-sm group-hover:text-emerald-600 transition-colors">{section.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }
    if (currentSectionName && !currentYear) {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                if (user?.role === 'Admin') setCurrentSectionName(null);
              }} 
              disabled={user?.role === 'Manager'}
              className="gap-2 font-bold text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Sections
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-primary leading-tight">{currentSectionName}</h2>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{currentDivisionName}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {availableYears.map((year) => (
              <Card 
                key={year} 
                className="group cursor-pointer hover:border-primary hover:shadow-xl transition-all border-none bg-white shadow-sm"
                onClick={() => setCurrentYear(year)}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                  <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-orange-500 text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                    <CalendarDays className="h-7 w-7" />
                  </div>
                  <span className="text-xl font-black group-hover:text-orange-600 transition-colors">{year}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {renderHeaderControls()}
      {scope === 'drilldown' && (
        <div className="flex items-center gap-3 mb-2 px-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentYear(null)} className="h-7 text-xs font-bold bg-white">
            <ArrowLeft className="h-3 w-3 mr-1" /> Change Year
          </Button>
          <div className="flex flex-col">
            <h2 className="text-xs font-black text-primary leading-tight uppercase">{currentSectionName}</h2>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">FY {currentYear}</span>
          </div>
        </div>
      )}
      <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-bold">Category</TableHead>
              {scope !== 'drilldown' && <TableHead className="font-bold">Section/Unit</TableHead>}
              <TableHead className="font-bold">Location</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="min-w-[200px] font-bold">Project / Item Title</TableHead>
              <TableHead className="font-bold">Allocated Cost</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBudgets.length > 0 ? (
              filteredBudgets.map((budget) => (
                <TableRow 
                  key={budget.id} 
                  className="hover:bg-muted/10 cursor-pointer group transition-colors"
                  onClick={() => router.push(`/budgets/${budget.id}/edit`)}
                >
                  <TableCell>
                    <Badge 
                      variant={budget.category === 'CAPEX' ? 'default' : 'secondary'} 
                      className={cn(
                        "rounded-md text-[10px] px-2 py-0.5 font-black uppercase",
                        budget.category === 'CAPEX' ? "bg-primary" : "bg-accent"
                      )}
                    >
                      {budget.category}
                    </Badge>
                  </TableCell>
                  {scope !== 'drilldown' && (
                    <TableCell className="text-[10px] font-black max-w-[120px] truncate text-muted-foreground uppercase">
                      {budget.section}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <MapPin className="h-3 w-3 text-red-500" />
                      {budget.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(budget)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary group-hover:underline text-sm">{budget.projectTitle || 'Untitled'}</span>
                        {budget.attachmentUrl && (
                          <Paperclip className="h-3.5 w-3.5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">{budget.prNumber || 'NO PR #'}</span>
                        <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        <span className="text-[9px] text-muted-foreground font-black">FY {budget.year}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-black whitespace-nowrap text-sm text-primary">
                    ₱ {(budget.totalCostBudget || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl shadow-xl">
                        <DropdownMenuItem className="gap-2 font-semibold" onClick={() => router.push(`/budgets/${budget.id}/edit`)}>
                          <Edit2 className="h-4 w-4 text-blue-500" /> Edit Record
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive font-semibold" onClick={() => onDelete?.(budget.id)}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={scope !== 'drilldown' ? 8 : 7} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-muted/30 rounded-full">
                      <Globe className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold">No log entries found</p>
                      <p className="text-xs">Try adjusting your filters or adding a new resource.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/budgets/new')} className="font-bold">
                      Add Your First Resource
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
