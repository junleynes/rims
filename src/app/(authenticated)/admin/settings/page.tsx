
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
  Save, 
  RefreshCw, 
  Download, 
  Upload, 
  Database, 
  ImageIcon, 
  X, 
  TrendingUp, 
  Palette, 
  Moon, 
  Sun, 
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
  Calendar
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { fetchSmtpConfig, updateSmtpConfig, saveSystemData, testSmtpConnection } from '@/app/actions/db-actions';
import { SmtpConfig, BrandingConfig, SystemConfig } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

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
  const [darkMode, setDarkMode] = useState(!!brandingConfig.darkMode);
  
  const [maxUploadSize, setMaxUploadSize] = useState(systemConfig.maxUploadSize || 20);
  
  const [smtp, setSmtp] = useState<SmtpConfig>({
    host: '',
    port: 587,
    user: '',
    pass: '',
    fromEmail: '',
    secure: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testRecipientEmail, setTestRecipientEmail] = useState('');
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);

  useEffect(() => {
    async function loadSmtp() {
      const savedSmtp = await fetchSmtpConfig();
      if (savedSmtp) setSmtp(savedSmtp);
    }
    loadSmtp();
  }, []);

  useEffect(() => {
    setAppName(brandingConfig.appName);
    setAppAcronym(brandingConfig.appAcronym);
    setLoginDescription(brandingConfig.loginDescription);
    setCopyright(brandingConfig.copyright);
    setLogoUrl(brandingConfig.logoUrl || '');
    setTheme(brandingConfig.theme || 'oceanic');
    setDarkMode(!!brandingConfig.darkMode);
  }, [brandingConfig]);

  useEffect(() => {
    setMaxUploadSize(systemConfig.maxUploadSize || 20);
  }, [systemConfig]);

  const availableYears = useMemo(() => {
    const years = budgets.map(b => b.year.toString());
    const currentYear = new Date().getFullYear();
    const dynamicYears = [currentYear - 1, currentYear, currentYear + 1].map(y => y.toString());
    return Array.from(new Set([...years, ...dynamicYears])).sort().reverse();
  }, [budgets]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedBranding: BrandingConfig = { 
        appName, 
        appAcronym, 
        loginDescription, 
        copyright, 
        logoUrl, 
        theme, 
        darkMode 
      };

      const updatedSystem: SystemConfig = {
        maxUploadSize
      };

      await updateBranding(updatedBranding);
      await updateSystemConfig(updatedSystem);
      await saveSystemData({ branding: updatedBranding, systemConfig: updatedSystem });
      await updateSmtpConfig(smtp);
      
      toast({
        title: "Settings Saved",
        description: "System and branding settings have been updated.",
      });
    } catch (e) {
      toast({
        title: "Error Saving",
        description: "An error occurred while saving configuration.",
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
    setDarkMode(false);
    setMaxUploadSize(20);
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

  const handleExportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      branding: brandingConfig,
      system: systemConfig,
      smtp: smtp,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rims-config-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleToggleLock = async (year: string) => {
    await toggleYearLock(parseInt(year));
    const isLocked = !lockedYears.some(ly => ly.year === parseInt(year));
    toast({
      title: isLocked ? "Year Locked" : "Year Unlocked",
      description: `Modifications for FY ${year} are now ${isLocked ? 'restricted' : 'allowed'}.`,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
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
          <TabsTrigger value="database" className="rounded-lg px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Database className="h-4 w-4" /> Maintenance
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
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-dashed">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      Dark Mode Enablement
                    </Label>
                    <p className="text-xs text-muted-foreground">Toggle application-wide theme mode.</p>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>

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
              <Button onClick={handleSave} disabled={isSaving} className="min-w-[140px] font-bold">
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
              <Button onClick={handleSave} disabled={isSaving} className="font-bold">
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
                <div className="space-y-2 md:col-span-2">
                  <Label>Sender Address ("From")</Label>
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
              <Button onClick={handleSave} disabled={isSaving} className="font-bold">
                {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Configuration
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
                <Button variant="outline" onClick={handleExportData} className="h-20 gap-3 border-dashed">
                  <Download className="h-5 w-5 text-blue-500" />
                  <div className="text-left">
                    <p className="font-bold">Download Backup</p>
                    <p className="text-xs text-muted-foreground">Export system settings to JSON</p>
                  </div>
                </Button>
                <Button variant="outline" className="h-20 gap-3 border-dashed relative overflow-hidden">
                  <Upload className="h-5 w-5 text-emerald-500" />
                  <div className="text-left">
                    <p className="font-bold">Restore Backup</p>
                    <p className="text-xs text-muted-foreground">Import settings from file</p>
                  </div>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".json" />
                </Button>
              </div>
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
    </div>
  );
}
