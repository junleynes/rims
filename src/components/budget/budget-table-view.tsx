
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
  ArrowLeft
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
import { BudgetEntry, Account, Section, Division, BudgetCategory } from '@/lib/types';
import { DIVISIONS, DIVISION_SECTIONS_MAP, OPEX_ACCOUNTS } from '@/lib/mock-data';
import { useAuth } from '@/components/auth-context';
import { cn } from '@/lib/utils';

interface BudgetTableViewProps {
  budgets: BudgetEntry[];
  onDelete?: (id: string) => void;
}

export function BudgetTableView({ budgets, onDelete }: BudgetTableViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  // Drill-down state
  const [currentDivision, setCurrentDivision] = useState<Division | null>(
    user?.role === 'Manager' ? (user.division as Division) : null
  );
  const [currentSection, setCurrentSection] = useState<Section | null>(
    user?.role === 'Manager' ? (user.section as Section) : null
  );
  
  // Table filters
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | 'All'>('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<Account | 'All'>('All');
  const [search, setSearch] = useState('');

  const filteredBudgets = useMemo(() => {
    return (budgets || []).filter(b => {
      const matchesDivision = !currentDivision || b.division === currentDivision;
      const matchesSection = !currentSection || b.section === currentSection;
      const matchesYear = selectedYear === 'All' || b.year?.toString() === selectedYear;
      const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
      const matchesSubCategory = selectedSubCategory === 'All' || b.account === selectedSubCategory;
      const matchesSearch = 
        (b.projectTitle || '').toLowerCase().includes(search.toLowerCase()) || 
        (b.itemDescription || '').toLowerCase().includes(search.toLowerCase());
      
      return matchesDivision && matchesSection && matchesYear && matchesCategory && matchesSubCategory && matchesSearch;
    });
  }, [budgets, currentDivision, currentSection, selectedYear, selectedCategory, selectedSubCategory, search]);

  const availableYears = useMemo(() => {
    const years = (budgets || []).map(b => b.year?.toString()).filter(Boolean);
    return Array.from(new Set(years)).sort();
  }, [budgets]);

  // Step 1: Selection of Division
  if (!currentDivision && user?.role === 'Admin') {
    return (
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
                  <p className="text-sm text-muted-foreground">Click to view sections</p>
                </div>
              </div>
              <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-primary translate-x-0 group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        ))}
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

  // Step 3: Entries Table
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Breadcrumbs / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          {user?.role === 'Admin' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setCurrentSection(null);
                setSelectedYear('All');
                setSelectedCategory('All');
                setSelectedSubCategory('All');
              }}
              className="h-8"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> All Sections
            </Button>
          )}
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-primary leading-tight">{currentSection}</h2>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{currentDivision}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Years</SelectItem>
              {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={(v) => {
            setSelectedCategory(v as BudgetCategory | 'All');
            setSelectedSubCategory('All');
          }}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="CAPEX">CAPEX</SelectItem>
              <SelectItem value="OPEX">OPEX</SelectItem>
            </SelectContent>
          </Select>

          {selectedCategory === 'OPEX' && (
            <Select value={selectedSubCategory} onValueChange={(v) => setSelectedSubCategory(v as Account | 'All')}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue placeholder="Sub Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Accounts</SelectItem>
                {OPEX_ACCOUNTS.map(a => <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <div className="relative h-8">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
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

      <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[80px]">Year</TableHead>
              <TableHead>Category</TableHead>
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
                  <TableCell className="font-medium text-muted-foreground text-xs">{budget.year}</TableCell>
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
                  <TableCell className="text-[11px] font-medium max-w-[150px] truncate">
                    {budget.category === 'CAPEX' ? budget.classification : budget.account}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary group-hover:underline text-sm">{budget.projectTitle || 'Untitled'}</span>
                      <span className="text-[9px] text-muted-foreground uppercase">{budget.prNumber || 'NO PR #'}</span>
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
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <p>No budget entries found for the selected section.</p>
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
