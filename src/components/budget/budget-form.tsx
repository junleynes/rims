"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, X, Paperclip, ImageIcon, FileText } from 'lucide-react';
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
import { useSystemData } from '@/components/system-data-context';
import { CLASSIFICATIONS, OPEX_ACCOUNTS } from '@/lib/mock-data';
import { Classification, Account, BudgetEntry, BudgetCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface BudgetFormProps {
  initialData?: BudgetEntry;
}

export function BudgetForm({ initialData }: BudgetFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addBudget, updateBudget } = useBudgets();
  const { divisions, sections, locations, users, statusOptions } = useSystemData();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<Omit<BudgetEntry, 'id' | 'createdAt'>>({
    year: initialData?.year || new Date().getFullYear(),
    division: initialData?.division || (user?.division || divisions[0]?.name || ''),
    section: initialData?.section || (user?.section || sections[0]?.name || ''),
    location: initialData?.location || (locations[0]?.name || ''),
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
    grSisNumber: initialData?.grSisNumber || '',
    accountablePerson: initialData?.accountablePerson || '',
    status: initialData?.status || (statusOptions[0]?.name || 'working'),
    statusOthers: initialData?.statusOthers || '',
    remarks: initialData?.remarks || '',
    attachmentUrl: initialData?.attachmentUrl || '',
  });

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push(i.toString());
    }
    if (initialData?.year && !years.includes(initialData.year.toString())) {
      years.push(initialData.year.toString());
    }
    return Array.from(new Set(years)).sort();
  }, [initialData?.year]);

  useEffect(() => {
    if (!initialData) {
      if (formData.category === 'CAPEX') {
        setFormData(prev => ({ ...prev, account: 'Capex' }));
      } else if (formData.category === 'OPEX' && formData.account === 'Capex') {
        setFormData(prev => ({ ...prev, account: OPEX_ACCOUNTS[0] }));
      }
    }
  }, [formData.category, initialData]);

  const filteredSections = sections.filter(s => {
    const divId = divisions.find(d => d.name === formData.division)?.id;
    return s.divisionId === divId;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, attachmentUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setFormData(prev => ({ ...prev, attachmentUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
        description: initialData ? "Item updated successfully." : "Item entry saved successfully.",
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
          <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-primary">
                {initialData ? 'Edit Resource' : 'Item Entry'}
              </CardTitle>
              <CardDescription>
                {initialData ? 'Update existing resource details.' : 'Log a new hardware or software resource to the system.'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="year">Log Year</Label>
                <Select 
                  value={formData.year.toString()} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, year: parseInt(v) }))}
                >
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="division">Division</Label>
                <Select 
                  value={formData.division} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, division: v, section: '' }))}
                >
                  <SelectTrigger id="division">
                    <SelectValue placeholder="Select Division" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map(d => (
                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="section">Section/Unit</Label>
                <Select 
                  value={formData.section} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, section: v }))}
                  disabled={!formData.division}
                >
                  <SelectTrigger id="section">
                    <SelectValue placeholder="Select Section/Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSections.map(s => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select 
                  value={formData.location} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, location: v }))}
                >
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
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
              <Label htmlFor="projectTitle">Project Title or Item Name</Label>
              <Input 
                id="projectTitle" 
                placeholder="Brief title for the project or resource..."
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
                <Label htmlFor="quantity">Quantity</Label>
                <Input 
                  id="quantity" 
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitCostBudget">Unit cost (₱)</Label>
                <Input 
                  id="unitCostBudget" 
                  type="number"
                  min="0"
                  value={formData.unitCostBudget}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitCostBudget: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Cost</Label>
                <div className="h-10 px-3 py-2 rounded-md bg-secondary flex items-center font-bold text-primary">
                  ₱ {(formData.quantity * formData.unitCostBudget).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="unitCostActual">Unit cost (actual) (₱)</Label>
                <Input 
                  id="unitCostActual" 
                  type="number"
                  min="0"
                  value={formData.unitCostActual || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitCostActual: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Total cost (actual)</Label>
                <div className="h-10 px-3 py-2 rounded-md bg-muted/50 flex items-center font-bold text-muted-foreground">
                  ₱ {(formData.quantity * (formData.unitCostActual || 0)).toLocaleString()}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prNumber">PR # (Purchase Requisition)</Label>
                <Input 
                  id="prNumber" 
                  placeholder="PR-XXXXX"
                  value={formData.prNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, prNumber: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dateDelivered">Date Delivered</Label>
                <Input 
                  id="dateDelivered" 
                  type="date"
                  value={formData.dateDelivered}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateDelivered: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grSisNumber">GR / SIS #</Label>
                <Input 
                  id="grSisNumber" 
                  placeholder="GR/SIS #"
                  value={formData.grSisNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, grSisNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountablePerson">Accountable Person</Label>
                <Select 
                  value={formData.accountablePerson} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, accountablePerson: v }))}
                >
                  <SelectTrigger id="accountablePerson">
                    <SelectValue placeholder="Select Accountable Person" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="status">Operational Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, status: v, statusOthers: v === 'others:' ? prev.statusOthers : '' }))}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.status === 'others:' && (
                <div className="space-y-2">
                  <Label htmlFor="statusOthers">Specify Status</Label>
                  <Input 
                    id="statusOthers" 
                    placeholder="Enter status..."
                    value={formData.statusOthers}
                    onChange={(e) => setFormData(prev => ({ ...prev, statusOthers: e.target.value }))}
                    required={formData.status === 'others:'}
                  />
                </div>
              )}
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

            <div className="space-y-4 pt-4 border-t">
              <Label className="text-lg font-bold text-primary flex items-center gap-2">
                <Paperclip className="h-5 w-5" /> Image or File Reference
              </Label>
              
              <div className="flex flex-col gap-4">
                {formData.attachmentUrl ? (
                  <div className="relative w-full max-w-sm rounded-xl overflow-hidden border shadow-sm group">
                    {formData.attachmentUrl.startsWith('data:image/') ? (
                      <div className="relative aspect-video">
                        <Image 
                          src={formData.attachmentUrl} 
                          alt="Attachment preview" 
                          fill 
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="p-8 bg-muted/30 flex flex-col items-center justify-center gap-2">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                        <span className="text-sm font-medium">Document Attached</span>
                      </div>
                    )}
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={removeAttachment}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold">Click to upload reference</p>
                      <p className="text-xs text-muted-foreground">PDF, JPEG, or PNG (Max 5MB)</p>
                    </div>
                    <Input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileChange}
                      accept="image/*,application/pdf"
                    />
                  </div>
                )}
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
              {initialData ? 'Update Resource' : 'Save Resource'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
