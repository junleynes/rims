
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useBranding } from '@/components/branding-context';
import { useSystemData } from '@/components/system-data-context';
import { useBudgets } from '@/components/budget-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Save, 
  RefreshCw, 
  Download, 
  Upload, 
  Database, 
  ImageIcon, 
  X, 
  TrendingUp, 
  Palette, 
  Mail, 
  Server, 
  Key, 
  AtSign,
  ShieldCheck,
  FileUp,
  Settings as SettingsIcon,
  Info,
  Send,
  Loader2,
  Lock,
  Unlock,
  Calendar,
  User as UserIcon,
  Brain,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Zap,
  AlertTriangle,
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { fetchSmtpConfig, updateSmtpConfig, testSmtpConnection, fetchAiConfig, updateAiConfig, fetchAuditLog } from '@/app/actions/db-actions';
import type { AuditLogEntry } from '@/lib/server-db';
import { SmtpConfig, BrandingConfig, SystemConfig, AiConfig, AiProvider } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

const THEMES = [
  { id: 'sunset', name: 'Sunset', primary: 'bg-[#E03E1A]', accent: 'bg-[#D6B51E]' },
  { id: 'oceanic', name: 'Oceanic (Default)', primary: 'bg-[#2E86AB]', accent: 'bg-[#31C1A5]' },
  { id: 'forest', name: 'Forest', primary: 'bg-[#154726]', accent: 'bg-[#968215]' },
  { id: 'midnight', name: 'Midnight', primary: 'bg-[#7C3AED]', accent: 'bg-[#D946EF]' },
  { id: 'rose', name: 'Rose', primary: 'bg-[#E11D48]', accent: 'bg-[#FB7185]' },
  { id: 'slate', name: 'Slate', primary: 'bg-[#334155]', accent: 'bg-[#1E293B]' },
  { id: 'amber', name: 'Amber', primary: 'bg-[#D97706]', accent: 'bg-[#B45309]' },
];

export default function SettingsPage() {
  const { config: brandingConfig, updateConfig: updateBranding } = useBranding();
  const { systemConfig, updateSystemConfig, lockedYears, toggleYearLock } = useSystemData();
  const { budgets } = useBudgets();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [appName, setAppName] = useState(brandingConfig.appName);
  const [appAcronym, setAppAcronym] = useState(brandingConfig.appAcronym);
  const [loginDescription, setLoginDescription] = useState(brandingConfig.loginDescription);
  const [copyright, setCopyright] = useState(brandingConfig.copyright);
  const [logoUrl, setLogoUrl] = useState(brandingConfig.logoUrl || '');
  const [theme, setTheme] = useState(brandingConfig.theme || 'oceanic');
  
  const [maxUploadSize, setMaxUploadSize] = useState(systemConfig.maxUploadSize || 20);
  const [maintenanceMode, setMaintenanceModeState] = useState(systemConfig.maintenanceMode ?? false);
  
  const [smtp, setSmtp] = useState<SmtpConfig>({
    host: '',
    port: 587,
    user: '',
    pass: '',
    fromEmail: '',
    fromName: '',
    secure: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testRecipientEmail, setTestRecipientEmail] = useState('');
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);

  const [aiConfig, setAiConfig] = useState<AiConfig>({
    provider: 'anthropic',
    apiKey: '',
    model: 'claude-sonnet-4-20250514',
    ollamaBaseUrl: 'http://localhost:11434',
    enabled: false,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isSavingAi, setIsSavingAi] = useState(false);

  useEffect(() => {
    async function loadSmtp() {
      const savedSmtp = await fetchSmtpConfig();
      if (savedSmtp) setSmtp(savedSmtp);
    }
    loadSmtp();
  }, []);

  useEffect(() => {
    async function loadAi() {
      const saved = await fetchAiConfig();
      if (saved) setAiConfig(saved);
    }
    loadAi();
  }, []);

  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [isLoadingAuditLog, setIsLoadingAuditLog] = useState(true);

  const loadAuditLog = async () => {
    setIsLoadingAuditLog(true);
    try {
      const entries = await fetchAuditLog(200);
      setAuditLog(entries);
    } finally {
      setIsLoadingAuditLog(false);
    }
  };

  useEffect(() => {
    loadAuditLog();
  }, []);

  useEffect(() => {
    setAppName(brandingConfig.appName);
    setAppAcronym(brandingConfig.appAcronym);
    setLoginDescription(brandingConfig.loginDescription);
    setCopyright(brandingConfig.copyright);
    setLogoUrl(brandingConfig.logoUrl || '');
    setTheme(brandingConfig.theme || 'oceanic');
  }, [brandingConfig]);

  useEffect(() => {
    setMaxUploadSize(systemConfig.maxUploadSize || 20);
    setMaintenanceModeState(systemConfig.maintenanceMode ?? false);
  }, [systemConfig]);

  const availableYears = useMemo(() => {
    const years = budgets.map(b => b.year.toString());
    const currentYear = new Date().getFullYear();
    const dynamicYears = [currentYear - 1, currentYear, currentYear + 1].map(y => y.toString());
    return Array.from(new Set([...years, ...dynamicYears])).sort().reverse();
  }, [budgets]);

  // Mirrors the AI Integration tab's enable switch: flipping this only
  // updates local state immediately (so the warning panel below reacts
  // right away). It doesn't take effect until "Save Constraints" is
  // pressed, which is what actually persists it via handleSaveSystem.
  const handleToggleMaintenance = (enabled: boolean) => {
    setMaintenanceModeState(enabled);
  };

  const handleSaveBranding = async () => {
    setIsSaving(true);
    try {
      const updatedBranding: BrandingConfig = {
        appName,
        appAcronym,
        loginDescription,
        copyright,
        logoUrl,
        theme
      };
      await updateBranding(updatedBranding);
      toast({
        title: "Branding Saved",
        description: "Branding configuration has been updated.",
      });
    } catch (e) {
      toast({
        title: "Error Saving",
        description: "An error occurred while saving branding configuration.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSystem = async () => {
    setIsSaving(true);
    try {
      // Always carry the current maintenanceMode value explicitly — never
      // omit it, since an incomplete payload here previously caused saving
      // unrelated constraints (like max upload size) to silently reset or
      // revert maintenance mode.
      const updatedSystem: SystemConfig = {
        maxUploadSize,
        maintenanceMode
      };
      await updateSystemConfig(updatedSystem);
      toast({
        title: "Constraints Saved",
        description: maintenanceMode
          ? "System constraints updated. Maintenance mode is now ON — only Admin accounts can log in."
          : "System constraints updated. Maintenance mode is OFF — the site is accessible to all users.",
        variant: maintenanceMode ? "destructive" : "default",
      });
    } catch (e) {
      toast({
        title: "Error Saving",
        description: "An error occurred while saving system constraints.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSmtp = async () => {
    setIsSaving(true);
    try {
      await updateSmtpConfig(smtp);
      toast({
        title: "Email Settings Saved",
        description: "SMTP configuration has been updated.",
      });
    } catch (e) {
      toast({
        title: "Error Saving",
        description: "An error occurred while saving SMTP configuration.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSmtp = () => {
    if (!smtp.host || !smtp.user || !smtp.pass) {
      toast({ 
        title: "Validation Error", 
        description: "Please fill in Host, Username, and Password before testing.", 
        variant: "destructive" 
      });
      return;
    }
    setTestRecipientEmail(smtp.fromEmail || '');
    setIsTestDialogOpen(true);
  };

  const confirmTestSmtp = async () => {
    if (!testRecipientEmail) {
      toast({ title: "Recipient Missing", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setIsTestDialogOpen(false);
    setIsTestingSmtp(true);
    try {
      const result = await testSmtpConnection(smtp, testRecipientEmail);
      if (result.success) {
        toast({
          title: "SMTP Test Successful",
          description: `A test email has been sent to ${testRecipientEmail}.`,
        });
      } else {
        toast({
          title: "SMTP Connection Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Unexpected Error",
        description: "Could not complete the SMTP test.",
        variant: "destructive"
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleReset = () => {
    setAppName('Resource Inventory Management System');
    setAppAcronym('R.I.M.S');
    setLoginDescription('A specialized system for broadcast, media, and engineering departments to manage expenditures and resources with precision.');
    setCopyright(`© ${new Date().getFullYear()} Resource Inventory Management System. All rights reserved.`);
    setLogoUrl('');
    setTheme('oceanic');
    setMaxUploadSize(20);
  };

  const AI_MODELS: Record<AiProvider, string[]> = {
    anthropic: ['claude-sonnet-4-20250514', 'claude-opus-4-5', 'claude-haiku-4-5-20251001'],
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-mini'],
    openrouter: [
      'meta-llama/llama-3.3-70b-instruct',
      'meta-llama/llama-3.1-8b-instruct:free',
      'google/gemini-2.0-flash-001',
      'google/gemini-flash-1.5',
      'deepseek/deepseek-chat-v3-0324:free',
      'mistralai/mistral-small-3.2-24b-instruct:free',
      'qwen/qwen3-235b-a22b:free',
      'anthropic/claude-sonnet-4-5',
      'openai/gpt-4o',
    ],
    ollama: ['llama3', 'llama3.1', 'mistral', 'phi3', 'gemma2', 'deepseek-r1'],
  };

  const handleSaveAi = async () => {
    setIsSavingAi(true);
    try {
      await updateAiConfig(aiConfig);
      toast({ title: 'AI Settings Saved', description: 'Configuration has been updated.' });
      setAiTestResult(null);
    } catch {
      toast({ title: 'Error', description: 'Failed to save AI settings.', variant: 'destructive' });
    } finally {
      setIsSavingAi(false);
    }
  };

  const handleTestAi = async () => {
    setIsTestingAi(true);
    setAiTestResult(null);
    try {
      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiConfig),
      });
      const data = await response.json();
      if (data.ok) {
        setAiTestResult({ ok: true, msg: `Connection successful. Response: "${data.reply}"` });
      } else {
        setAiTestResult({ ok: false, msg: data.error ?? 'Connection failed.' });
      }
    } catch (e: any) {
      setAiTestResult({ ok: false, msg: e.message ?? 'Connection failed.' });
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = async () => {
    setIsBackingUp(true);
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) {
        const err = await res.json();
        toast({ title: 'Backup Failed', description: err.error ?? 'Unknown error.', variant: 'destructive' });
        return;
      }
      const blob = await res.blob();
      const date = new Date().toISOString().split('T')[0];
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rims-backup-${date}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Backup Downloaded', description: 'Database, uploads and settings included in the zip.' });
    } catch (err: any) {
      toast({ title: 'Backup Failed', description: err.message ?? 'Could not download backup.', variant: 'destructive' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingRestoreFile(file);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!pendingRestoreFile) return;
    setIsRestoring(true);
    try {
      const formData = new FormData();
      formData.append('file', pendingRestoreFile);
      const res = await fetch('/api/restore', { method: 'POST', body: formData });
      const result = await res.json();
      if (!res.ok) {
        toast({ title: 'Restore Failed', description: result.error ?? 'Unknown error.', variant: 'destructive' });
        return;
      }

      if (result.databaseRestored) {
        const uploadsNote = result.uploadsRestored ? ` and ${result.uploadsRestored} uploaded file(s)` : '';
        toast({
          title: 'Database Restored',
          description: `Database${uploadsNote} restored. Restart the application now for the changes to take effect.`,
        });
      } else if (result.settingsRestored?.length) {
        toast({
          title: 'Settings Restored',
          description: `Updated: ${result.settingsRestored.join(', ')}. These changes are already live — no restart needed.`,
        });
      } else {
        toast({ title: 'Restore Complete', description: 'No recognizable data was found to restore.' });
      }
      setRestoreDialogOpen(false);
      loadAuditLog();
    } catch (err: any) {
      toast({ title: 'Restore Failed', description: err.message ?? 'Could not restore backup.', variant: 'destructive' });
    } finally {
      setIsRestoring(false);
      setPendingRestoreFile(null);
      if (restoreInputRef.current) restoreInputRef.current.value = '';
    }
  };

  const handleToggleLock = async (year: string) => {
    await toggleYearLock(parseInt(year));
    const isLocked = !lockedYears.some(ly => ly.year === parseInt(year));
    toast({
      title: isLocked ? "Year Locked" : "Year Unlocked",
      description: `Modifications for FY ${year} are now ${isLocked ? 'restricted' : 'allowed'}.`,
    });
  };

  const AUDIT_ACTION_LABELS: Record<string, string> = {
    login_success: 'Login',
    login_failed: 'Login failed',
    login_blocked_lockout: 'Login blocked (lockout)',
    login_blocked_maintenance: 'Login blocked (maintenance mode)',
    login_2fa_failed: '2FA code rejected',
    logout: 'Logout',
    password_changed: 'Password changed (self-service)',
    password_change_failed: 'Password change failed',
    password_reset_by_admin: 'Password reset by admin',
    '2fa_enabled': '2FA enabled',
    '2fa_disabled': '2FA disabled (self-service)',
    '2fa_disabled_by_admin': '2FA disabled by admin',
    user_created: 'Personnel account created',
    user_deleted: 'Personnel account deleted',
    user_role_changed: 'Role changed',
    maintenance_enabled: 'Maintenance mode enabled',
    maintenance_disabled: 'Maintenance mode disabled',
    backup_downloaded: 'Backup downloaded',
    restore_performed: 'Backup restored',
    budget_entry_added: 'Budget entry added',
    budget_entry_updated: 'Budget entry updated',
    budget_entry_deleted: 'Budget entry deleted',
    budget_imported: 'Budget imported',
    kb_document_uploaded: 'KB document uploaded',
    kb_document_deleted: 'KB document deleted',
  };

  const AUDIT_ACTION_CATEGORIES: Record<string, string> = {
    login_success: 'Auth',
    login_failed: 'Auth',
    login_blocked_lockout: 'Auth',
    login_blocked_maintenance: 'Auth',
    login_2fa_failed: 'Auth',
    logout: 'Auth',
    password_changed: 'Auth',
    password_change_failed: 'Auth',
    password_reset_by_admin: 'Auth',
    '2fa_enabled': 'Auth',
    '2fa_disabled': 'Auth',
    '2fa_disabled_by_admin': 'Auth',
    user_created: 'Personnel',
    user_deleted: 'Personnel',
    user_role_changed: 'Personnel',
    maintenance_enabled: 'System',
    maintenance_disabled: 'System',
    backup_downloaded: 'System',
    restore_performed: 'System',
    budget_entry_added: 'Budget',
    budget_entry_updated: 'Budget',
    budget_entry_deleted: 'Budget',
    budget_imported: 'Budget',
    kb_document_uploaded: 'Knowledge Base',
    kb_document_deleted: 'Knowledge Base',
  };

  const isDestructiveAuditAction = (action: string) =>
    ['user_deleted', 'restore_performed', 'maintenance_enabled', '2fa_disabled_by_admin', 'budget_entry_deleted', 'kb_document_deleted'].includes(action);

  // --- Audit log filter/sort/search state ---
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('All');
  const [auditResultFilter, setAuditResultFilter] = useState('All');
  const [auditSortDir, setAuditSortDir] = useState<'desc' | 'asc'>('desc');

  const AUDIT_CATEGORIES = ['All', 'Auth', 'Personnel', 'Budget', 'Knowledge Base', 'System'];

  const filteredAuditLog = auditLog
    .filter(entry => {
      const label = AUDIT_ACTION_LABELS[entry.action] || entry.action;
      const cat = AUDIT_ACTION_CATEGORIES[entry.action] || '';
      const matchesSearch =
        !auditSearch ||
        label.toLowerCase().includes(auditSearch.toLowerCase()) ||
        (entry.username || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
        (entry.details || '').toLowerCase().includes(auditSearch.toLowerCase());
      const matchesCat = auditCategoryFilter === 'All' || cat === auditCategoryFilter;
      const matchesResult =
        auditResultFilter === 'All' ||
        (auditResultFilter === 'Success' && entry.success) ||
        (auditResultFilter === 'Failed' && !entry.success);
      return matchesSearch && matchesCat && matchesResult;
    })
    .sort((a, b) => {
      const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return auditSortDir === 'desc' ? -diff : diff;
    });

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
          <SettingsIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">System Settings</h1>
          <p className="text-muted-foreground font-medium">Manage application identity, limits, and infrastructure.</p>
        </div>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="bg-white border p-1 rounded-xl h-12 shadow-sm">
          <TabsTrigger value="branding" className="rounded-lg px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Palette className="h-4 w-4" /> Branding
          </TabsTrigger>
          <TabsTrigger value="system" className="rounded-lg px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <SettingsIcon className="h-4 w-4" /> System
          </TabsTrigger>
          <TabsTrigger value="smtp" className="rounded-lg px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Mail className="h-4 w-4" /> Email (SMTP)
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-lg px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Brain className="h-4 w-4" /> AI Integration
          </TabsTrigger>
          <TabsTrigger value="database" className="rounded-lg px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Database className="h-4 w-4" /> Maintenance
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-lg px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <ShieldCheck className="h-4 w-4" /> Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6 animate-in slide-in-from-bottom-2">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Branding Configuration</CardTitle>
              <CardDescription>Customize the application identity and appearance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input id="appName" value={appName} onChange={(e) => setAppName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appAcronym">Short Name (Acronym)</Label>
                  <Input id="appAcronym" value={appAcronym} onChange={(e) => setAppAcronym(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="loginDescription">Welcome Message</Label>
                <Textarea id="loginDescription" value={loginDescription} onChange={(e) => setLoginDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copyright">Footer Copyright Text</Label>
                <Input id="copyright" value={copyright} onChange={(e) => setCopyright(e.target.value)} />
              </div>

              <div className="pt-4 border-t space-y-4">
                <div className="space-y-3 pt-2">
                  <Label className="text-sm font-semibold flex items-center gap-2"><Palette className="h-4 w-4" /> System Color Theme</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                          theme === t.id ? "border-primary bg-primary/5" : "border-transparent bg-muted/30 hover:bg-muted/50"
                        )}
                      >
                        <div className="flex -space-x-2">
                          <div className={cn("h-8 w-8 rounded-full border-2 border-white shadow-sm", t.primary)} />
                          <div className={cn("h-8 w-8 rounded-full border-2 border-white shadow-sm", t.accent)} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <Label>Organization Logo</Label>
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-2xl border-2 border-dashed bg-muted/30 flex items-center justify-center relative overflow-hidden group">
                    {logoUrl ? (
                      <Image src={logoUrl} alt="Logo" fill className="object-cover" />
                    ) : (
                      <TrendingUp className="h-10 w-10 text-muted-foreground/30" />
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} className="font-bold">
                    <ImageIcon className="h-4 w-4 mr-2" /> Upload Logo
                  </Button>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t flex justify-between p-6">
              <Button variant="outline" onClick={handleReset} className="font-bold"><RefreshCw className="h-4 w-4 mr-2" /> Restore Default</Button>
              <Button onClick={handleSaveBranding} disabled={isSaving} className="min-w-[140px] font-bold">
                {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4" />}
                Apply Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6 animate-in slide-in-from-bottom-2">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>System Constraints</CardTitle>
              <CardDescription>Manage technical limits and global operational settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Maintenance Mode */}
              <div className={`p-4 rounded-xl border space-y-3 ${maintenanceMode ? 'bg-red-50 border-red-300' : 'bg-muted/30 border-dashed'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${maintenanceMode ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground'}`}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-base font-bold">Maintenance Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      {maintenanceMode
                        ? 'Site is in maintenance — only Admin accounts can log in.'
                        : 'Toggle on to restrict access to Admin only during maintenance.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={maintenanceMode}
                      onCheckedChange={handleToggleMaintenance}
                    />
                  </div>
                </div>
                {maintenanceMode && (
                  <div className="bg-red-100 border border-red-200 rounded-lg p-3 flex gap-3 text-xs text-red-800">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>Maintenance mode is <strong>active</strong>. Non-admin users will see a maintenance page and cannot log in. Disable this when work is complete.</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-muted/30 rounded-xl border border-dashed space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <FileUp className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-base font-bold">Max Upload Size (MB)</Label>
                    <p className="text-xs text-muted-foreground">Global limit for Knowledge Base and Resource attachments.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="number" 
                      min="1" 
                      max="50" 
                      value={maxUploadSize} 
                      onChange={(e) => setMaxUploadSize(parseInt(e.target.value) || 1)} 
                      className="w-24 font-bold text-center h-11"
                    />
                    <span className="font-bold text-muted-foreground">MB</span>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 text-xs text-amber-800">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>The server ceiling is set to 50MB. Setting a value higher than this will still be capped by server-side configuration.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t flex justify-end p-6">
              <Button onClick={handleSaveSystem} disabled={isSaving} className="font-bold">
                {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Constraints
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Year Locking Control</CardTitle>
              <CardDescription>Prevent non-admin users from editing resources for specific fiscal years.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {availableYears.map(year => {
                  const isLocked = lockedYears.some(ly => ly.year === parseInt(year));
                  return (
                    <div 
                      key={year} 
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                        isLocked ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          isLocked ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                        )}>
                          <Calendar className="h-4 w-4" />
                        </div>
                        <span className="font-black text-lg">FY {year}</span>
                      </div>
                      <Button 
                        size="icon" 
                        variant={isLocked ? "destructive" : "outline"} 
                        className="h-9 w-9 rounded-full shadow-sm"
                        onClick={() => handleToggleLock(year)}
                      >
                        {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </Button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-dashed flex gap-3 text-xs text-muted-foreground italic">
                <Info className="h-4 w-4 shrink-0 text-primary" />
                <p>Locking a year prevents Managers and AVPs from adding, editing, or deleting entries for that period. Admins and VPs can always override locks.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smtp" className="animate-in slide-in-from-bottom-2">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> SMTP Configuration</CardTitle>
              <CardDescription>Configure the email server for system notifications and password resets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Server className="h-3.5 w-3.5" /> Host</Label>
                  <Input placeholder="smtp.gmail.com" value={smtp.host} onChange={(e) => setSmtp({...smtp, host: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input type="number" placeholder="587" value={smtp.port} onChange={(e) => setSmtp({...smtp, port: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><AtSign className="h-3.5 w-3.5" /> Username</Label>
                  <Input placeholder="user@example.com" value={smtp.user} onChange={(e) => setSmtp({...smtp, user: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Key className="h-3.5 w-3.5" /> Password</Label>
                  <Input type="password" placeholder="••••••••" value={smtp.pass} onChange={(e) => setSmtp({...smtp, pass: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><UserIcon className="h-3.5 w-3.5" /> Sender Name ("From Name")</Label>
                  <Input placeholder="R.I.M.S. Notifications" value={smtp.fromName} onChange={(e) => setSmtp({...smtp, fromName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Sender Address ("From Email")</Label>
                  <Input placeholder="noreply@rims.com" value={smtp.fromEmail} onChange={(e) => setSmtp({...smtp, fromEmail: e.target.value})} />
                </div>
                <div className="md:col-span-2 flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-dashed">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Secure Connection (SSL)
                    </Label>
                    <p className="text-xs text-muted-foreground">Enable for port 465. Leave disabled for port 587 (STARTTLS).</p>
                  </div>
                  <Switch checked={smtp.secure} onCheckedChange={(v) => setSmtp({...smtp, secure: v})} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t flex justify-between p-6">
              <Button 
                variant="outline" 
                onClick={handleTestSmtp} 
                disabled={isTestingSmtp} 
                className="gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold"
              >
                {isTestingSmtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Test Connection
              </Button>
              <Button onClick={handleSaveSmtp} disabled={isSaving} className="font-bold">
                {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Configuration
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6 animate-in slide-in-from-bottom-2">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" /> AI Integration</CardTitle>
                  <CardDescription>Configure the AI provider for anomaly detection and narrative report generation.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground">{aiConfig.enabled ? 'Enabled' : 'Disabled'}</span>
                  <Switch checked={aiConfig.enabled} onCheckedChange={(v) => setAiConfig({ ...aiConfig, enabled: v })} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">AI Provider</label>
                <div className="grid grid-cols-4 gap-3">
                  {(['anthropic', 'openai', 'openrouter', 'ollama'] as AiProvider[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        const defaultModels: Record<AiProvider, string> = {
                          anthropic: 'claude-sonnet-4-20250514',
                          openai: 'gpt-4o',
                          openrouter: 'meta-llama/llama-3.3-70b-instruct',
                          ollama: 'llama3',
                        };
                        setAiConfig({ ...aiConfig, provider: p, model: defaultModels[p] });
                        setAiTestResult(null);
                      }}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                        aiConfig.provider === p ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30 hover:bg-muted/50'
                      )}
                    >
                      <Zap className={cn('h-6 w-6', aiConfig.provider === p ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="text-xs font-black uppercase tracking-widest capitalize">
                        {p === 'openrouter' ? 'OpenRouter' : p}
                      </span>
                      {p === 'ollama' && <span className="text-[9px] text-muted-foreground font-semibold">Local / Self-hosted</span>}
                      {p === 'openrouter' && <span className="text-[9px] text-muted-foreground font-semibold">300+ Models</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key (not for Ollama) */}
              {aiConfig.provider !== 'ollama' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Key className="h-3.5 w-3.5" /> API Key</Label>
                  <div className="relative">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder={
                        aiConfig.provider === 'anthropic' ? 'sk-ant-...' :
                        aiConfig.provider === 'openrouter' ? 'sk-or-v1-...' :
                        'sk-...'
                      }
                      value={aiConfig.apiKey}
                      onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Stored encrypted in the local database. Never exposed to the client.
                    {aiConfig.provider === 'openrouter' && (
                      <> Get your key at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline text-primary">openrouter.ai/keys</a>. Free models available.</>
                    )}
                  </p>
                </div>
              )}

              {/* Ollama base URL */}
              {aiConfig.provider === 'ollama' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Server className="h-3.5 w-3.5" /> Ollama Base URL</Label>
                  <Input
                    placeholder="http://localhost:11434"
                    value={aiConfig.ollamaBaseUrl}
                    onChange={(e) => setAiConfig({ ...aiConfig, ollamaBaseUrl: e.target.value })}
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {/* Model selection */}
              <div className="space-y-2">
                <Label>Model</Label>
                <div className="flex gap-2">
                  <select
                    value={aiConfig.model}
                    onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {(AI_MODELS[aiConfig.provider] || []).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="or type custom model"
                    value={AI_MODELS[aiConfig.provider]?.includes(aiConfig.model) ? '' : aiConfig.model}
                    onChange={(e) => e.target.value && setAiConfig({ ...aiConfig, model: e.target.value })}
                    className="w-56 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Features info */}
              <div className="p-4 bg-muted/30 rounded-xl border border-dashed space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Enabled Features</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="h-3 w-3" /></div>
                    <div><span className="font-bold">Anomaly Detection</span> — flags budget overruns, unit cost errors, and missing actuals on delivered items in the Reports page.</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="h-3 w-3" /></div>
                    <div><span className="font-bold">Narrative Report</span> — generates an executive summary paragraph from the current report view, ready to copy for VP/AVP briefings.</div>
                  </div>
                </div>
              </div>

              {/* Test result */}
              {aiTestResult && (
                <div className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border text-sm',
                  aiTestResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                )}>
                  {aiTestResult.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                  <span>{aiTestResult.msg}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-muted/30 border-t flex justify-between p-6">
              <Button
                variant="outline"
                onClick={handleTestAi}
                disabled={isTestingAi || (!aiConfig.apiKey && aiConfig.provider !== 'ollama')}
                className="gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold"
              >
                {isTestingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Test Connection
              </Button>
              <Button onClick={handleSaveAi} disabled={isSavingAi} className="font-bold">
                {isSavingAi ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4" />}
                Save AI Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="animate-in slide-in-from-bottom-2">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Maintenance & Backups</CardTitle>
              <CardDescription>Manage the integrity of your local system configuration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" onClick={handleExportData} disabled={isBackingUp} className="h-20 gap-3 border-dashed">
                  {isBackingUp ? <Loader2 className="h-5 w-5 animate-spin text-blue-500" /> : <Download className="h-5 w-5 text-blue-500" />}
                  <div className="text-left">
                    <p className="font-bold">{isBackingUp ? 'Creating Backup...' : 'Download Backup'}</p>
                    <p className="text-xs text-muted-foreground">Database, uploads & settings as ZIP</p>
                  </div>
                </Button>
                <Button variant="outline" disabled={isRestoring} className="h-20 gap-3 border-dashed relative overflow-hidden">
                  {isRestoring ? <Loader2 className="h-5 w-5 animate-spin text-emerald-500" /> : <Upload className="h-5 w-5 text-emerald-500" />}
                  <div className="text-left">
                    <p className="font-bold">{isRestoring ? 'Restoring...' : 'Restore Backup'}</p>
                    <p className="text-xs text-muted-foreground">Upload a backup .zip, settings .json, or database .db file</p>
                  </div>
                  <input
                    ref={restoreInputRef}
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    accept=".zip,.json,.db"
                    disabled={isRestoring}
                    onChange={handleRestoreFileSelected}
                  />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="animate-in slide-in-from-bottom-2">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Audit Log</CardTitle>
                <CardDescription>All system events: logins, personnel changes, budget entries, knowledge base uploads, maintenance, and backups.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadAuditLog} disabled={isLoadingAuditLog} className="gap-2">
                <RefreshCw className={cn("h-4 w-4", isLoadingAuditLog && "animate-spin")} /> Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search + Filter + Sort bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, event, or details…"
                    value={auditSearch}
                    onChange={e => setAuditSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={auditCategoryFilter} onValueChange={setAuditCategoryFilter}>
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIT_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={auditResultFilter} onValueChange={setAuditResultFilter}>
                  <SelectTrigger className="h-9 w-[130px]">
                    <SelectValue placeholder="Result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All results</SelectItem>
                    <SelectItem value="Success">Success</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 px-3 shrink-0"
                  onClick={() => setAuditSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                  title={auditSortDir === 'desc' ? 'Newest first' : 'Oldest first'}
                >
                  {auditSortDir === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  {auditSortDir === 'desc' ? 'Newest' : 'Oldest'}
                </Button>
              </div>

              {/* Result count */}
              {!isLoadingAuditLog && auditLog.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Showing {filteredAuditLog.length} of {auditLog.length} events
                </p>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAuditLog && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoadingAuditLog && filteredAuditLog.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                        {auditLog.length === 0 ? 'No audit events recorded yet.' : 'No events match your filters.'}
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredAuditLog.map((entry) => {
                    const cat = AUDIT_ACTION_CATEGORIES[entry.action];
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(entry.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {entry.username || <span className="text-muted-foreground italic">unknown</span>}
                        </TableCell>
                        <TableCell>
                          {cat && (
                            <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wide">
                              {cat}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              !entry.success && "bg-destructive/10 text-destructive",
                              entry.success && isDestructiveAuditAction(entry.action) && "bg-amber-100 text-amber-700"
                            )}
                          >
                            {AUDIT_ACTION_LABELS[entry.action] || entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{entry.details || '—'}</TableCell>
                        <TableCell className="text-right">
                          {entry.success ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 inline-block" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive inline-block" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Test SMTP Delivery</DialogTitle>
            <DialogDescription>
              Enter a recipient email address to verify that system notifications are delivering correctly.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Recipient Email Address</Label>
              <Input 
                id="test-email"
                placeholder="recipient@example.com"
                value={testRecipientEmail}
                onChange={(e) => setTestRecipientEmail(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmTestSmtp} disabled={!testRecipientEmail} className="gap-2 font-bold">
              <Send className="h-4 w-4" /> Send Test Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={restoreDialogOpen} onOpenChange={(open) => {
        setRestoreDialogOpen(open);
        if (!open) {
          setPendingRestoreFile(null);
          if (restoreInputRef.current) restoreInputRef.current.value = '';
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-amber-600" />
              Restore from Backup
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRestoreFile?.name.toLowerCase().endsWith('.json') ? (
                <>
                  This will update branding, system constraints, SMTP, and/or AI settings from <strong>{pendingRestoreFile.name}</strong>, overwriting your current values for whichever of those sections the file contains. This takes effect immediately — no restart needed.
                </>
              ) : (
                <>
                  This will replace your current database{pendingRestoreFile ? <> with <strong>{pendingRestoreFile.name}</strong></> : ''} — personnel, budgets, and all settings — plus any uploaded files included in a full backup zip. A safety copy of the current database is kept on the server in case you need to undo this.
                  <br /><br />
                  The application needs to be restarted after this completes for the restored database to take effect.
                </>
              )}
              {' '}This cannot be undone from the UI — proceed only if you're sure this is the right file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmRestore(); }}
              disabled={isRestoring}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {isRestoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Restore Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
