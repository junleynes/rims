
"use client";

import React, { useState, useMemo } from 'react';
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
  Globe
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
import { BudgetEntry, Account, Section, Division, BudgetCategory } from '@/lib/types';
import { DIVISIONS, DIVISION_SECTIONS_MAP, OPEX_ACCOUNTS } from '@/lib/mock-data';
import { useAuth } from '@/components/auth-context';
import { cn } from '@/lib/utils';

interface BudgetTableViewProps {
  budgets: BudgetEntry[];
  onDelete?: (id: string) => void;
}

type ViewScope = 'drilldown' | 'whole' | 'division';

export function BudgetTableView({ budgets, onDelete }: BudgetTableViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  // Scoping state
  const [scope, setScope] = useState<ViewScope>('drilldown');
  
  // Drill-down state
  const [currentDivision, setCurrentDivision] = useState<Division | null>(
    user?.role === 'Manager' ? (user.division as Division) : null
  );
  const [currentSection, setCurrentSection] = useState<Section | null>(
    user?.role === 'Manager' ? (user.section as Section) : null
  );
  const [currentYear, setCurrentYear] = useState<string | null>(null);
  
  // Flat view state (for 'whole' or 'division' scope)
  const [selectedDivisionFlat, setSelectedDivisionFlat] = useState<Division | 'All'>('All');
  
  // Table filters
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | 'All'>('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<Account | 'All'>('All');
  const [search, setSearch] = useState('');

  // Available years for selection logic
  const availableYears = useMemo(() => {
    const years = (budgets || [])
      .filter(b => (!currentDivision || b.division === currentDivision) && (!currentSection || b.section === currentSection))
      .map(b => b.year?.toString())
      .filter(Boolean);
    const baseYears = ['2025', '2026', '2027', '2028'];
    return Array.from(new Set([...years, ...baseYears])).sort();
  }, [budgets, currentDivision, currentSection]);

  const filteredBudgets = useMemo(() => {
    return (budgets || []).filter(b => {
      // Scope Logic
      if (scope === 'drilldown') {
        if (currentDivision && b.division !== currentDivision) return false;
        if (currentSection && b.section !== currentSection) return false;
        if (currentYear && b.year?.toString() !== currentYear) return false;
      } else if (scope === 'division') {
        if (selectedDivisionFlat !== 'All' && b.division !== selectedDivisionFlat) return false;
      }
      
      // General Filters
      const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
      const matchesSubCategory = selectedSubCategory === 'All' || b.account === selectedSubCategory;
      const matchesSearch = 
        (b.projectTitle || '').toLowerCase().includes(search.toLowerCase()) || 
        (b.itemDescription || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.section || '').toLowerCase().includes(search.toLowerCase());
      
      return matchesCategory && matchesSubCategory && matchesSearch;
    });
  }, [budgets, scope, currentDivision, currentSection, currentYear, selectedDivisionFlat, selectedCategory, selectedSubCategory, search]);

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
              <Globe className="h-3 w-3" /> Whole
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {scope === 'division' && (
          <Select value={selectedDivisionFlat} onValueChange={(v) => setSelectedDivisionFlat(v as Division | 'All')}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="Select Division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Divisions</SelectItem>
              {DIVISIONS.map(d => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <Select value={selectedCategory} onValueChange={(v) => {
          setSelectedCategory(v as BudgetCategory | 'All');
          setSelectedSubCategory('All');
        }}>
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
            placeholder="Search items..." 
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

  // DRILL-DOWN VIEWS
  if (scope === 'drilldown') {
    // Step 1: Selection of Division
    if (!currentDivision && user?.role === 'Admin') {
      return (
        <div className="space-y-6">
          {renderHeaderControls()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {DIVISIONS.map((division) => (
              <Card 
                key={division} 
                className="group cursor-pointer hover:border-primary hover:shadow-md transition-all border-2 border-transparent bg-white overflow-hidden"
                onClick={() => setCurrentDivision(division)}
              >
                <CardContent className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{division}</h3>
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

    // Step 2: Selection of Section
    if (currentDivision && !currentSection) {
      const sections = DIVISION_SECTIONS_MAP[currentDivision] || [];
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setCurrentDivision(null)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Divisions
            </Button>
            <div className="h-4 w-px bg-border" />
            <h2 className="text-lg font-semibold text-primary">{currentDivision}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((section) => (
              <Card 
                key={section} 
                className="group cursor-pointer hover:border-accent hover:shadow-md transition-all border-2 border-transparent bg-white"
                onClick={() => setCurrentSection(section)}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                      <LayoutGrid className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-sm group-hover:text-accent transition-colors">{section}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    // Step 3: Selection of Year
    if (currentSection && !currentYear) {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                if (user?.role === 'Admin') setCurrentSection(null);
                else setCurrentDivision(null);
              }} 
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Sections
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-primary">{currentSection}</h2>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{currentDivision}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {availableYears.map((year) => (
              <Card 
                key={year} 
                className="group cursor-pointer hover:border-primary hover:shadow-md transition-all border-2 border-transparent bg-white"
                onClick={() => setCurrentYear(year)}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
                  <CalendarDays className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xl font-bold group-hover:text-primary transition-colors">{year}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }
  }

  // FLAT VIEWS (Whole or Division) or Final Table for Drill-down
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {renderHeaderControls()}

      {scope === 'drilldown' && (
        <div className="flex items-center gap-3 mb-2 px-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentYear(null)} className="h-7 text-xs">
            <ArrowLeft className="h-3 w-3 mr-1" /> {currentYear}
          </Button>
          <div className="flex flex-col">
            <h2 className="text-xs font-bold text-primary leading-tight">{currentSection}</h2>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">FY {currentYear}</span>
          </div>
        </div>
      )}

      <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Category</TableHead>
              {scope !== 'drilldown' && <TableHead>Section/Unit</TableHead>}
              <TableHead>Account/Class</TableHead>
              <TableHead className="min-w-[200px]">Project Title</TableHead>
              <TableHead>Budget Cost</TableHead>
              <TableHead>Actual Cost</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                        "rounded-md text-[10px] px-2 py-0.5 uppercase",
                        budget.category === 'CAPEX' ? "bg-primary" : "bg-accent"
                      )}
                    >
                      {budget.category}
                    </Badge>
                  </TableCell>
                  {scope !== 'drilldown' && (
                    <TableCell className="text-[10px] font-medium max-w-[120px] truncate text-muted-foreground">
                      {budget.section}
                    </TableCell>
                  )}
                  <TableCell className="text-[11px] font-medium max-w-[150px] truncate">
                    {budget.category === 'CAPEX' ? budget.classification : budget.account}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary group-hover:underline text-sm">{budget.projectTitle || 'Untitled'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-muted-foreground uppercase">{budget.prNumber || 'NO PR #'}</span>
                        <span className="text-[9px] text-muted-foreground font-bold">FY {budget.year}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold whitespace-nowrap text-sm">
                    ₱ {(budget.totalCostBudget || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground whitespace-nowrap text-xs">
                    {budget.totalCostActual ? `₱ ${budget.totalCostActual.toLocaleString()}` : '---'}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2" onClick={() => router.push(`/budgets/${budget.id}/edit`)}>
                          <Edit2 className="h-4 w-4" /> Edit Entry
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => onDelete?.(budget.id)}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={scope !== 'drilldown' ? 7 : 6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <p>No budget entries found for the selected scope.</p>
                    <Button variant="outline" size="sm" onClick={() => router.push('/budgets/new')}>
                      Encode New Item
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
