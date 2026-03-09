
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useAuth } from '@/components/auth-context';
import { useBudgets } from '@/components/budget-context';
import { SECTIONS, DIVISIONS, CLASSIFICATIONS, OPEX_ACCOUNTS } from '@/lib/mock-data';
import { Section, Division, Classification, Account, BudgetEntry, BudgetCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface BudgetFormProps {
  initialData?: BudgetEntry;
}

export function BudgetForm({ initialData }: BudgetFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addBudget, updateBudget } = useBudgets();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<Omit<BudgetEntry, 'id' | 'createdAt'>>({
    year: initialData?.year || new Date().getFullYear() + 1,
    division: initialData?.division || (user?.division || DIVISIONS[0]) as Division,
    section: initialData?.section || (user?.section || SECTIONS[0]) as Section,
    classification: initialData?.classification || CLASSIFICATIONS[0],
    category: initialData?.category || 'CAPEX',
    account: initialData?.account || 'Capex',
    projectTitle: initialData?.projectTitle || '',
    itemDescription: initialData?.itemDescription || '',
    quantity: initialData?.quantity || 1,
    unitCostBudget: initialData?.unitCostBudget || 0,
    totalCostBudget: initialData?.totalCostBudget || 0,
    unitCostActual: initialData?.unitCostActual || 0,
    totalCostActual: initialData?.totalCostActual || 0,
    prNumber: initialData?.prNumber || '',
    dateDelivered: initialData?.dateDelivered || '',
    remarks: initialData?.remarks || '',
  });

  // Automatically update account when category changes if not in edit mode with existing data
  useEffect(() => {
    if (!initialData) {
      if (formData.category === 'CAPEX') {
        setFormData(prev => ({ ...prev, account: 'Capex' }));
      } else if (formData.category === 'OPEX' && formData.account === 'Capex') {
        setFormData(prev => ({ ...prev, account: OPEX_ACCOUNTS[0] }));
      }
    }
  }, [formData.category, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const totalCostBudget = formData.quantity * formData.unitCostBudget;
      const totalCostActual = formData.unitCostActual ? formData.quantity * formData.unitCostActual : 0;

      const finalData = {
        ...formData,
        totalCostBudget,
        totalCostActual,
      };

      if (initialData) {
        updateBudget(initialData.id, finalData);
      } else {
        addBudget(finalData);
      }

      toast({
        title: "Success",
        description: initialData ? "Budget entry updated successfully." : "Budget entry saved successfully.",
      });
      router.push('/budgets');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save entry.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <div>
              <CardTitle className="text-2xl font-bold text-primary">
                {initialData ? 'Edit Budget Entry' : 'Budget Encoding'}
              </CardTitle>
              <CardDescription>
                {initialData ? 'Update existing budget details.' : 'Enter details as per the official budget format.'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="year">Budget Year</Label>
                <Select 
                  value={formData.year.toString()} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, year: parseInt(v) }))}
                >
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                    <SelectItem value="2028">2028</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="division">Division</Label>
                <Select 
                  value={formData.division} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, division: v as Division }))}
                >
                  <SelectTrigger id="division">
                    <SelectValue placeholder="Select Division" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIVISIONS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="section">Section/Unit</Label>
                <Select 
                  value={formData.section} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, section: v as Section }))}
                >
                  <SelectTrigger id="section">
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTIONS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as BudgetCategory }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAPEX">CAPEX</SelectItem>
                    <SelectItem value="OPEX">OPEX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classification">Classification</Label>
                <Select 
                  value={formData.classification} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, classification: v as Classification }))}
                >
                  <SelectTrigger id="classification">
                    <SelectValue placeholder="Select Classification" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSIFICATIONS.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.category === 'OPEX' && (
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="account">Sub Category (Account)</Label>
                  <Select 
                    value={formData.account} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, account: v as Account }))}
                  >
                    <SelectTrigger id="account">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPEX_ACCOUNTS.map(a => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectTitle">Project title or description</Label>
              <Input 
                id="projectTitle" 
                placeholder="Brief title for the project..."
                value={formData.projectTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, projectTitle: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemDescription">Item Description</Label>
              <Textarea 
                id="itemDescription" 
                placeholder="Detailed item specifications..."
                className="min-h-[100px]"
                value={formData.itemDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, itemDescription: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="quantity">quantity</Label>
                <Input 
                  id="quantity" 
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitCostBudget">unit cost (budget) (₱)</Label>
                <Input 
                  id="unitCostBudget" 
                  type="number"
                  min="0"
                  value={formData.unitCostBudget}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitCostBudget: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>total cost (budget)</Label>
                <div className="h-10 px-3 py-2 rounded-md bg-secondary flex items-center font-bold text-primary">
                  ₱ {(formData.quantity * formData.unitCostBudget).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="unitCostActual">unit cost (actual) (₱)</Label>
                <Input 
                  id="unitCostActual" 
                  type="number"
                  min="0"
                  value={formData.unitCostActual || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitCostActual: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>total cost (actual)</Label>
                <div className="h-10 px-3 py-2 rounded-md bg-muted/50 flex items-center font-bold text-muted-foreground">
                  ₱ {(formData.quantity * (formData.unitCostActual || 0)).toLocaleString()}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prNumber">Purchase Requisition number</Label>
                <Input 
                  id="prNumber" 
                  placeholder="PR-XXXXX"
                  value={formData.prNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, prNumber: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dateDelivered">date delivered</Label>
                <Input 
                  id="dateDelivered" 
                  type="date"
                  value={formData.dateDelivered}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateDelivered: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">remarks</Label>
                <Input 
                  id="remarks" 
                  placeholder="Additional notes..."
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
          <div className="p-6 border-t border-primary/10 bg-muted/30 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => router.back()}
              className="gap-2"
            >
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 gap-2 min-w-[120px]"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {initialData ? 'Update Budget' : 'Save Budget'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
