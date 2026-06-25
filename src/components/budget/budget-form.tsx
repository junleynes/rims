"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, X, Paperclip, ImageIcon, FileText, Plus, PlusCircle, Edit2, Sparkles } from 'lucide-react';
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
import { useBranding } from '@/components/branding-context';
import { useBudgets } from '@/components/budget-context';
import { useSystemData } from '@/components/system-data-context';
import { CLASSIFICATIONS, OPEX_ACCOUNTS } from '@/lib/mock-data';
import { Classification, Account, BudgetEntry, BudgetCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { uploadFile, deleteFile, getFileUrl } from '@/lib/file-upload';
import { autofillBudgetFields } from '@/app/actions/ai-autofill-action';
import Image from 'next/image';

interface BudgetFormProps {
  initialData?: BudgetEntry;
}

export function BudgetForm({ initialData }: BudgetFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addBudget, updateBudget } = useBudgets();
  const { divisions, sections, locations, users, statusOptions, systemConfig } = useSystemData();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  const handleGenerateDescription = async () => {
    if (!formData.projectTitle?.trim()) {
      toast({ title: 'Enter a project name first', description: 'Type the item or project name above, then click Generate Description.', variant: 'destructive' });
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const result = await autofillBudgetFields({
        category: formData.category,
        classification: formData.classification,
        account: formData.account,
        projectTitle: formData.projectTitle,
      });
      if (result.error) {
        toast({ title: 'Generation Failed', description: result.error, variant: 'destructive' });
      } else if (result.itemDescription) {
        setFormData(prev => ({ ...prev, itemDescription: result.itemDescription! }));
        toast({ title: 'Description Generated', description: 'AI description added. Review before saving.' });
      }
    } catch {
      toast({ title: 'Generation Failed', description: 'Unexpected error. Try again.', variant: 'destructive' });
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  // Determine organizational restrictions
  const isManager = user?.role === 'Manager';
  const isAVP = user?.role === 'AVP';
  const isGlobalUser = user?.role === 'Admin' || user?.role === 'VP' || user?.role === 'Viewer';

  const [formData, setFormData] = useState<Omit<BudgetEntry, 'id' | 'createdAt'>>({
    year: initialData?.year || new Date().getFullYear(),
    division: initialData?.division || (user?.division || divisions[0]?.name || ''),
    section: initialData?.section || (user?.section || sections[0]?.name || ''),
    location: initialData?.location || (locations[0]?.name || ''),
    locationDetails: initialData?.locationDetails || '',
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
    attachments: initialData?.attachments || [],
  });

  const MAX_FILE_SIZE = (systemConfig.maxUploadSize || 20) * 1024 * 1024;

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

  // Logic to filter available divisions based on role
  const availableDivisions = useMemo(() => {
    if (isGlobalUser) return divisions;
    return divisions.filter(d => d.name === user?.division);
  }, [divisions, user, isGlobalUser]);

  // Logic to filter sections based on selected division and user role
  const availableSections = useMemo(() => {
    const divId = divisions.find(d => d.name === formData.division)?.id;
    let filtered = sections.filter(s => s.divisionId === divId);
    
    if (isManager && formData.division === user?.division) {
      filtered = filtered.filter(s => s.name === user?.section);
    }
    
    return filtered;
  }, [sections, divisions, formData.division, user, isManager]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const valid: File[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the ${systemConfig.maxUploadSize || 20}MB limit.`,
          variant: "destructive"
        });
        continue;
      }
      valid.push(file);
    }
    if (valid.length > 0) {
      setPendingFiles(prev => [...prev, ...valid]);
      toast({ title: `${valid.length} file(s) selected`, description: 'Files will upload when you press Save.' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePending = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeAttachment = async (index: number) => {
    const path = formData.attachments?.[index];
    if (path && !path.startsWith('data:')) {
      await deleteFile(path).catch(() => {}); // best effort
    }
    setFormData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const totalCostBudget = formData.quantity * formData.unitCostBudget;
      const totalCostActual = formData.unitCostActual ? formData.quantity * formData.unitCostActual : 0;

      // Upload pending files on submit
      const uploadedPaths: string[] = [];
      for (const file of pendingFiles) {
        const result = await uploadFile(file, 'budget-attachments');
        uploadedPaths.push(result.filePath);
      }
      setPendingFiles([]);

      const finalData = {
        ...formData,
        attachments: [...(formData.attachments || []), ...uploadedPaths],
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
    <div className="w-full py-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-lg border-primary/10 overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-row items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shrink-0">
              {initialData ? <Edit2 className="h-6 w-6" /> : <PlusCircle className="h-6 w-6" />}
            </div>
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
                  disabled={availableDivisions.length <= 1}
                >
                  <SelectTrigger id="division">
                    <SelectValue placeholder="Select Division" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDivisions.map(d => (
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
                  disabled={!formData.division || availableSections.length <= 1}
                >
                  <SelectTrigger id="section">
                    <SelectValue placeholder="Select Section/Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map(s => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">General Location</Label>
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

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="locationDetails">Specific Office / Work Area / Address</Label>
                <Input 
                  id="locationDetails" 
                  placeholder="e.g. Office 502, Video Suite A, or Full Delivery Address for deployed units"
                  value={formData.locationDetails}
                  onChange={(e) => setFormData(prev => ({ ...prev, locationDetails: e.target.value }))}
                />
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
              <Label htmlFor="projectTitle">Project Title or Description</Label>
              <Input 
                id="projectTitle" 
                placeholder="Brief title for the project or resource..."
                value={formData.projectTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, projectTitle: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="itemDescription">Item Description</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingDesc}
                  className="gap-1.5 border-primary/20 text-primary hover:bg-primary/5 font-bold text-xs h-7 px-2"
                >
                  {isGeneratingDesc
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Sparkles className="h-3 w-3" />}
                  {isGeneratingDesc ? 'Generating...' : 'AI Autofill'}
                </Button>
              </div>
              <Textarea 
                id="itemDescription" 
                placeholder="Detailed item specifications — or type a project title above and click Generate..."
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
                <Paperclip className="h-5 w-5" /> Images or File References
              </Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(formData.attachments || []).map((filePath, idx) => {
                  const fileUrl = getFileUrl(filePath);
                  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
                  const isImage = ['png','jpg','jpeg','gif','webp'].includes(ext) || filePath.startsWith('data:image/');
                  return (
                  <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border shadow-sm group bg-muted/20">
                    {isImage ? (
                      <Image 
                        src={fileUrl} 
                        alt={`Attachment ${idx + 1}`} 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="h-full flex flex-col items-center justify-center gap-2 hover:bg-muted/30 transition-colors">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <span className="text-[10px] font-medium px-2 text-center truncate w-full">
                          {filePath.split('/').pop() ?? `Document ${idx + 1}`}
                        </span>
                      </a>
                    )}
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeAttachment(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  );
                })}
                
                {pendingFiles.map((file, idx) => (
                  <div key={`pending-${idx}`} className="relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-amber-400 shadow-sm group bg-amber-50/40 flex flex-col items-center justify-center gap-1">
                    <FileText className="h-7 w-7 text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-700 px-2 text-center truncate w-full">{file.name}</span>
                    <span className="text-[9px] text-amber-500 font-semibold">Pending upload</span>
                    <Button
                      type="button" variant="destructive" size="icon"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePending(idx)}
                    ><X className="h-4 w-4" /></Button>
                  </div>
                ))}

                <div 
                  className="aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <Plus className="h-5 w-5" />
                  </div>
                  <p className="text-[11px] font-bold">Add Attachment</p>
                  <Input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                    multiple
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">Max {systemConfig.maxUploadSize || 20}MB per file.</p>
            </div>
          </CardContent>
          <div className="p-6 border-t border-primary/10 bg-muted/30 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => router.back()}
              className="gap-2 font-bold"
            >
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 gap-2 min-w-[140px] font-bold"
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
