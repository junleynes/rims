
"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ExternalLink
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
import { BudgetEntry, Category, Section } from '@/lib/types';
import { SECTIONS } from '@/lib/mock-data';
import { useAuth } from '@/components/auth-context';

interface BudgetTableViewProps {
  budgets: BudgetEntry[];
  onDelete?: (id: string) => void;
}

export function BudgetTableView({ budgets, onDelete }: BudgetTableViewProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');
  const [filterSection, setFilterSection] = useState<Section | 'All'>('All');

  const filteredBudgets = budgets.filter(b => {
    const matchesSearch = b.actionPlan.toLowerCase().includes(search.toLowerCase()) || 
                          b.description.toLowerCase().includes(search.toLowerCase()) ||
                          b.subcategory.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'All' || b.category === filterCategory;
    const matchesSection = user?.role === 'Manager' 
      ? b.section === user.section 
      : (filterSection === 'All' || b.section === filterSection);
    
    return matchesSearch && matchesCategory && matchesSection;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search action plans, descriptions..." 
            className="pl-10 bg-muted/50 border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" /> Category: {filterCategory}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterCategory('All')}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory('CAPEX')}>CAPEX</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory('OPEX')}>OPEX</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user?.role === 'Admin' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" /> Section: {filterSection}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
                <DropdownMenuItem onClick={() => setFilterSection('All')}>All Sections</DropdownMenuItem>
                {SECTIONS.map(s => (
                  <DropdownMenuItem key={s} onClick={() => setFilterSection(s)}>{s}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[100px]">Year</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Section</TableHead>
              <TableHead className="min-w-[200px]">Action Plan</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBudgets.length > 0 ? (
              filteredBudgets.map((budget) => (
                <TableRow key={budget.id} className="hover:bg-muted/10">
                  <TableCell className="font-medium text-muted-foreground">{budget.year}</TableCell>
                  <TableCell>
                    <Badge variant={budget.category === 'CAPEX' ? 'default' : 'secondary'} className="rounded-md">
                      {budget.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{budget.section}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">{budget.actionPlan}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">{budget.subcategory}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold whitespace-nowrap">
                    ₱ {budget.totalCost.toLocaleString()}
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
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No budget entries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
