
"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  MoreVertical,
  ExternalLink,
  ChevronRight,
  ChevronDown
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
import { BudgetEntry, Account, Section, BudgetCategory } from '@/lib/types';
import { SECTIONS, OPEX_ACCOUNTS } from '@/lib/mock-data';
import { useAuth } from '@/components/auth-context';
import { cn } from '@/lib/utils';

interface BudgetTableViewProps {
  budgets: BudgetEntry[];
  onDelete?: (id: string) => void;
}

export function BudgetTableView({ budgets, onDelete }: BudgetTableViewProps) {
  const { user } = useAuth();
  
  // Hierarchical state
  const [selectedSection, setSelectedSection] = useState<Section | 'All'>(user?.role === 'Manager' ? (user.section as Section) : 'All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | 'All'>('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<Account | 'All'>('All');
  
  const [search, setSearch] = useState('');

  // Filter budgets based on hierarchy and search
  const filteredBudgets = (budgets || []).filter(b => {
    const projectTitle = b.projectTitle || '';
    const itemDescription = b.itemDescription || '';
    const account = b.account || '';
    const section = b.section || '';
    const category = b.category || '';
    const year = b.year?.toString() || '';

    const matchesSearch = projectTitle.toLowerCase().includes(search.toLowerCase()) || 
                          itemDescription.toLowerCase().includes(search.toLowerCase());
    
    const matchesSection = selectedSection === 'All' || section === selectedSection;
    const matchesYear = selectedYear === 'All' || year === selectedYear;
    const matchesCategory = selectedCategory === 'All' || category === selectedCategory;
    const matchesSubCategory = selectedSubCategory === 'All' || account === selectedSubCategory;
    
    return matchesSearch && matchesSection && matchesYear && matchesCategory && matchesSubCategory;
  });

  const availableYears = Array.from(new Set(budgets.map(b => b.year.toString()))).sort();

  return (
    <div className="space-y-6">
      {/* Hierarchy Navigation Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2 px-2">
          <Filter className="h-4 w-4" />
          <span>Hierarchy Filter:</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Section Selector */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Section</Label>
            <Select 
              value={selectedSection} 
              onValueChange={(v) => {
                setSelectedSection(v as Section);
                setSelectedYear('All');
                setSelectedCategory('All');
                setSelectedSubCategory('All');
              }}
              disabled={user?.role === 'Manager'}
            >
              <SelectTrigger className="bg-muted/50 border-none">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Sections</SelectItem>
                {SECTIONS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Selector */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Year</Label>
            <Select 
              value={selectedYear} 
              onValueChange={(v) => {
                setSelectedYear(v);
                setSelectedCategory('All');
                setSelectedSubCategory('All');
              }}
            >
              <SelectTrigger className="bg-muted/50 border-none">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Years</SelectItem>
                {availableYears.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Category</Label>
            <Select 
              value={selectedCategory} 
              onValueChange={(v) => {
                setSelectedCategory(v as BudgetCategory | 'All');
                setSelectedSubCategory('All');
              }}
            >
              <SelectTrigger className="bg-muted/50 border-none">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                <SelectItem value="CAPEX">CAPEX</SelectItem>
                <SelectItem value="OPEX">OPEX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* SubCategory Selector (only for OPEX) */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Sub Category</Label>
            <Select 
              value={selectedSubCategory} 
              onValueChange={(v) => setSelectedSubCategory(v as Account | 'All')}
              disabled={selectedCategory === 'CAPEX'}
            >
              <SelectTrigger className="bg-muted/50 border-none">
                <SelectValue placeholder={selectedCategory === 'CAPEX' ? "N/A (CAPEX)" : "All Sub-categories"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Sub-categories</SelectItem>
                {OPEX_ACCOUNTS.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search within current filters..." 
            className="pl-10 bg-muted/50 border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[80px]">Year</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Sub Category / Account</TableHead>
              <TableHead className="min-w-[200px]">Project Title</TableHead>
              <TableHead>Budget Cost</TableHead>
              <TableHead>Actual Cost</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBudgets.length > 0 ? (
              filteredBudgets.map((budget) => (
                <TableRow key={budget.id} className="hover:bg-muted/10">
                  <TableCell className="font-medium text-muted-foreground">{budget.year}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={budget.category === 'CAPEX' ? 'default' : 'secondary'} 
                      className={cn(
                        "rounded-md text-[10px] px-2 py-0.5",
                        budget.category === 'CAPEX' ? "bg-primary" : "bg-accent"
                      )}
                    >
                      {budget.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium max-w-[150px] truncate">
                    {budget.category === 'CAPEX' ? budget.classification : budget.account}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">{budget.projectTitle || 'Untitled'}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{budget.section || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold whitespace-nowrap">
                    ₱ {(budget.totalCostBudget || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground whitespace-nowrap">
                    {budget.totalCostActual ? `₱ ${budget.totalCostActual.toLocaleString()}` : '---'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <ExternalLink className="h-4 w-4" /> View Details
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
                    <p>No budget entries found for the selected hierarchy.</p>
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedSection(user?.role === 'Manager' ? (user.section as Section) : 'All');
                      setSelectedYear('All');
                      setSelectedCategory('All');
                      setSelectedSubCategory('All');
                    }}>Reset All Filters</Button>
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

// Small helper for labels used in the hierarchy view
function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("text-sm font-medium leading-none", className)}>{children}</div>
}
