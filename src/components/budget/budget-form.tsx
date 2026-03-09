
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Save, X } from 'lucide-react';
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
import { SECTIONS, CATEGORIES } from '@/lib/mock-data';
import { Category, Subcategory, Section } from '@/lib/types';
import { aiBudgetDescriptionAssistant } from '@/ai/flows/ai-budget-description-assistant';
import { useToast } from '@/hooks/use-toast';

export function BudgetForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { addBudget } = useBudgets();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [formData, setFormData] = useState({
    year: new Date().getFullYear() + 1,
    section: (user?.role === 'Manager' ? user.section : SECTIONS[0]) as Section,
    category: 'CAPEX' as Category,
    subcategory: '' as Subcategory,
    actionPlan: '',
    description: '',
    quantity: 1,
    unitCost: 0,
    rolloutSchedule: '',
    remarks: '',
  });

  const handleAiAssist = async () => {
    if (!formData.category || !formData.subcategory) {
      toast({
        title: "Selection Required",
        description: "Please select a category and subcategory first.",
        variant: "destructive",
      });
      return;
    }

    setIsAiLoading(true);
    try {
      const result = await aiBudgetDescriptionAssistant({
        category: formData.category,
        subcategory: formData.subcategory,
      });

      setFormData(prev => ({
        ...prev,
        actionPlan: result.suggestedActionPlan,
        description: result.suggestedDescription,
      }));

      toast({
        title: "AI Suggestion Applied",
        description: "Suggested action plan and description have been filled.",
      });
    } catch (error) {
      toast({
        title: "AI Error",
        description: "Could not fetch suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      addBudget({
        ...formData,
        totalCost: formData.quantity * formData.unitCost,
      });
      toast({
        title: "Success",
        description: "Budget entry saved successfully.",
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
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold text-primary">Budget Encoding</CardTitle>
                <CardDescription>Enter details for a new budget item.</CardDescription>
              </div>
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                className="gap-2 text-primary border-primary/20 hover:bg-primary/5"
                onClick={handleAiAssist}
                disabled={isAiLoading}
              >
                {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                AI Assistant
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
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
                <Label htmlFor="section">Section</Label>
                <Select 
                  disabled={user?.role === 'Manager'}
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
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as Category, subcategory: '' as Subcategory }))}
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
                <Label htmlFor="subcategory">Subcategory</Label>
                <Select 
                  value={formData.subcategory} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, subcategory: v as Subcategory }))}
                >
                  <SelectTrigger id="subcategory">
                    <SelectValue placeholder="Select Subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES[formData.category].map(sc => (
                      <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actionPlan">Action Plan</Label>
              <Input 
                id="actionPlan" 
                placeholder="e.g. Hardware Refresh Q3"
                value={formData.actionPlan}
                onChange={(e) => setFormData(prev => ({ ...prev, actionPlan: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea 
                id="description" 
                placeholder="Details of the budget item..."
                className="min-h-[100px]"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input 
                  id="quantity" 
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitCost">Unit Cost (₱)</Label>
                <Input 
                  id="unitCost" 
                  type="number"
                  min="0"
                  value={formData.unitCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Cost</Label>
                <div className="h-10 px-3 py-2 rounded-md bg-secondary flex items-center font-bold text-primary">
                  ₱ {(formData.quantity * formData.unitCost).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="rollout">Rollout Schedule</Label>
                <Input 
                  id="rollout" 
                  placeholder="e.g. Q1 2026 or Jan-Jun"
                  value={formData.rolloutSchedule}
                  onChange={(e) => setFormData(prev => ({ ...prev, rolloutSchedule: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
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
              Save Budget
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
