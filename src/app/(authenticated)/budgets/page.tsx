
"use client";

import React, { useRef, useState, useMemo } from 'react';
import { BudgetTableView } from '@/components/budget/budget-table-view';
import { useBudgets } from '@/components/budget-context';
import { useAuth } from '@/components/auth-context';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { BudgetEntry, Classification, BudgetCategory, Account } from '@/lib/types';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function BudgetsPage() {
  const { budgets, deleteBudget, importBudgets, clearYearResources } = useBudgets();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [purgeYear, setPurgeYear] = useState<string>('');
  const [purgeConfirmText, setPurgeConfirmText] = useState<string>('');
  const [isPurging, setIsPurging] = useState(false);
  const [isPurgeDialogOpen, setIsPurgeDialogOpen] = useState(false);

  const isAdmin = user?.role === 'Admin';
  const isReadOnly = user?.role === 'Viewer';

  const availableYears = useMemo(() => {
    const years = budgets.map(b => b.year.toString());
    return Array.from(new Set(years)).sort().reverse();
  }, [budgets]);

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) throw new Error("File is empty or missing data.");

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const importedData: Omit<BudgetEntry, 'id' | 'createdAt'>[] = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];
            
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index];
            });

            const quantity = parseInt(row['Quantity']) || 1;
            const unitCostBudget = parseFloat(row['Unit Cost Budget']) || 0;

            const division = user?.role === 'Manager' ? (user.division || '') : (row['Division'] || '');
            const section = user?.role === 'Manager' ? (user.section || '') : (row['Section'] || '');

            return {
              year: parseInt(row['Year']) || new Date().getFullYear(),
              division: division,
              section: section,
              location: row['Location'] || '',
              classification: (row['Classification'] as Classification) || 'Hardware',
              category: (row['Category'] as BudgetCategory) || 'CAPEX',
              account: (row['Account'] as Account) || 'Capex',
              projectTitle: row['Project Title'] || 'Imported Item',
              itemDescription: row['Item Description'] || '',
              quantity: quantity,
              unitCostBudget: unitCostBudget,
              totalCostBudget: quantity * unitCostBudget,
              unitCostActual: parseFloat(row['Unit Cost Actual']) || 0,
              totalCostActual: quantity * (parseFloat(row['Unit Cost Actual']) || 0),
              prNumber: row['PR Number'] || '',
              dateDelivered: row['Date Delivered'] || '',
              grSisNumber: row['GR SIS Number'] || '',
              accountablePerson: row['Accountable Person'] || '',
              status: row['Status'] || 'working',
              statusOthers: row['Status Others'] || '',
              remarks: row['Remarks'] || '',
              attachmentUrl: '',
            };
          });

        importBudgets(importedData);
        toast({
          title: "Import Successful",
          description: user?.role === 'Manager' 
            ? `${importedData.length} items have been imported into ${user.section}.`
            : `${importedData.length} items have been added to the system log.`,
        });
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        toast({
          title: "Import Failed",
          description: "Check if the CSV format is correct. Required headers: Year, Division, Section, Location, Classification, Category, Account, Project Title, Item Description, Quantity, Unit Cost Budget",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const triggerImport = () => {
    let desc = "Ensure headers are: Year, Division, Section, Location, Classification, Category, Account, Project Title, Item Description, Quantity, Unit Cost Budget";
    
    if (user?.role === 'Manager') {
      desc = `Importing for ${user.section}. All items in the CSV will be automatically assigned to your section. Headers: Year, Location, Classification, Category, Account, Project Title, Item Description, Quantity, Unit Cost Budget`;
    }

    toast({
      title: "CSV Header Requirement",
      description: desc,
      duration: 8000,
    });
    fileInputRef.current?.click();
  };

  const handlePurgeYear = async () => {
    if (!purgeYear || purgeConfirmText !== purgeYear) return;

    setIsPurging(true);
    try {
      await clearYearResources(parseInt(purgeYear));
      toast({
        title: "Year Data Purged",
        description: `All log entries for FY ${purgeYear} have been permanently removed.`,
      });
      setIsPurgeDialogOpen(false);
      setPurgeYear('');
      setPurgeConfirmText('');
    } catch (error) {
      toast({
        title: "Purge Failed",
        description: "An error occurred while clearing data.",
        variant: "destructive",
      });
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Resource Log</h1>
          <p className="text-muted-foreground">Manage and track your section's hardware and software resources.</p>
        </div>
        {!isReadOnly && (
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <AlertDialog open={isPurgeDialogOpen} onOpenChange={setIsPurgeDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 border-destructive/20 hover:bg-destructive/5 text-destructive">
                    <Trash2 className="h-4 w-4" /> Purge Year Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Critical Data Deletion
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete <strong>ALL</strong> resource entries for the selected fiscal year. 
                      This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Select Fiscal Year to Purge</Label>
                      <Select value={purgeYear} onValueChange={setPurgeYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableYears.map(year => (
                            <SelectItem key={year} value={year}>FY {year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {purgeYear && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <Label>Type <span className="font-mono font-bold text-primary">{purgeYear}</span> to confirm</Label>
                        <Input 
                          placeholder="Type the year here"
                          value={purgeConfirmText}
                          onChange={(e) => setPurgeConfirmText(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => { setPurgeYear(''); setPurgeConfirmText(''); }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={(e) => {
                        e.preventDefault();
                        handlePurgeYear();
                      }}
                      disabled={!purgeYear || purgeConfirmText !== purgeYear || isPurging}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
                    >
                      {isPurging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                      Purge Everything for {purgeYear || '...'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv" 
              onChange={handleImportCSV} 
            />
            <Button variant="outline" onClick={triggerImport} className="gap-2 border-primary/20 hover:bg-primary/5 text-primary">
              <Upload className="h-4 w-4" /> Import CSV
            </Button>
            <Button asChild className="gap-2 bg-primary hover:bg-primary/90 shadow-lg">
              <Link href="/budgets/new">
                <Plus className="h-4 w-4" /> Add Resource
              </Link>
            </Button>
          </div>
        )}
      </div>

      <BudgetTableView budgets={budgets} onDelete={deleteBudget} />
    </div>
  );
}
