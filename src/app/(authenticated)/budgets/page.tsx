
"use client";

import React, { useRef } from 'react';
import { BudgetTableView } from '@/components/budget/budget-table-view';
import { useBudgets } from '@/components/budget-context';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { BudgetEntry, Classification, BudgetCategory, Account } from '@/lib/types';

export default function BudgetsPage() {
  const { budgets, deleteBudget, importBudgets } = useBudgets();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        // Simple CSV parser
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const importedData: Omit<BudgetEntry, 'id' | 'createdAt'>[] = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            // Split by comma but respect quotes
            const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];
            
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index];
            });

            // Mapping CSV fields to BudgetEntry structure
            // Required Header names in CSV: Year, Division, Section, Location, Classification, Category, Account, Project Title, Item Description, Quantity, Unit Cost Budget, PR Number, Accountable Person, Status, Remarks
            const quantity = parseInt(row['Quantity']) || 1;
            const unitCostBudget = parseFloat(row['Unit Cost Budget']) || 0;

            return {
              year: parseInt(row['Year']) || new Date().getFullYear(),
              division: row['Division'] || '',
              section: row['Section'] || '',
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
          description: `${importedData.length} items have been added to the log.`,
        });
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        toast({
          title: "Import Failed",
          description: "Check if the CSV format is correct. Headers should include: Year, Division, Section, Location, Classification, Category, Account, Project Title, Item Description, Quantity, Unit Cost Budget...",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const triggerImport = () => {
    toast({
      title: "CSV Header Requirement",
      description: "Ensure headers are: Year, Division, Section, Location, Classification, Category, Account, Project Title, Item Description, Quantity, Unit Cost Budget",
      duration: 6000,
    });
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Resource Log</h1>
          <p className="text-muted-foreground">Manage and track your section's hardware and software resources.</p>
        </div>
        <div className="flex items-center gap-3">
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
      </div>

      <BudgetTableView budgets={budgets} onDelete={deleteBudget} />
    </div>
  );
}
