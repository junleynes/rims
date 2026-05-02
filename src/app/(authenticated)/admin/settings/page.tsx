
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useBranding } from '@/components/branding-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Check, 
  Moon, 
  Sun, 
  Mail, 
  Server, 
  Key, 
  AtSign,
  ShieldCheck
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { fetchSmtpConfig, updateSmtpConfig } from '@/app/actions/db-actions';
import { SmtpConfig } from '@/lib/types';

const THEMES = [
  { id: 'sunset', name: 'Sunset (Default)', primary: 'bg-[#E03E1A]', accent: 'bg-[#D6B51E]' },
  { id: 'oceanic', name: 'Oceanic', primary: 'bg-[#2E86AB]', accent: 'bg-[#31C1A5]' },
  { id: 'forest', name: 'Forest', primary: 'bg-[#154726]', accent: 'bg-[#968215]' },
  { id: 'midnight', name: 'Midnight', primary: 'bg-[#7C3AED]', accent: 'bg-[#D946EF]' },
  { id: 'rose', name: 'Rose', primary: 'bg-[#E11D48]', accent: 'bg-[#FB7185]' },
  { id: 'slate', name: 'Slate', primary: 'bg-[#334155]', accent: 'bg-[#1E293B]' },
  { id: 'amber', name: 'Amber', primary: 'bg-[#D97706]', accent: 'bg-[#B45309]' },
];

export default function SettingsPage() {
  const { config, updateConfig } = useBranding();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [appName, setAppName] = useState(config.appName);
  const [appAcronym, setAppAcronym] = useState(config.appAcronym);
  const [loginDescription, setLoginDescription] = useState(config.loginDescription);
  const [copyright, setCopyright] = useState(config.copyright);
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '');
  const [theme, setTheme] = useState(config.theme || 'sunset');
  const [darkMode, setDarkMode] = useState(!!config.darkMode);
  
  const [smtp, setSmtp] = useState<SmtpConfig>({
    host: '',
    port: 587,
    user: '',
    pass: '',
    fromEmail: '',
    secure: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSmtp() {
      const savedSmtp = await fetchSmtpConfig();
      if (savedSmtp) setSmtp(savedSmtp);
    }
    loadSmtp();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateConfig({ appName, appAcronym, loginDescription, copyright, logoUrl, theme, darkMode });
      await updateSmtpConfig(smtp);
      toast({
        title: "Settings Saved",
        description: "Branding and system settings have been updated.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setAppName('Resource Inventory Management System');
    setAppAcronym('R.I.M.S');
    setLoginDescription('A specialized system for broadcast, media, and engineering departments to manage expenditures and resources with precision.');
    setCopyright(`© ${new Date().getFullYear()} Resource Inventory Management System. All rights reserved.`);
    setLogoUrl('');
    setTheme('sunset');
    setDarkMode(false);
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
      branding: config,
      smtp: smtp,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rims-config-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">System Settings</h1>
        <p className="text-muted-foreground">Manage application identity, email infrastructure, and database maintenance.</p>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="bg-white border p-1 rounded-xl h-12">
          <TabsTrigger value="branding" className="rounded-lg px-6 gap-2">
            <Palette className="h-4 w-4" /> Branding
          </TabsTrigger>
          <TabsTrigger value="smtp" className="rounded-lg px-6 gap-2">
            <Mail className="h-4 w-4" /> Email (SMTP)
          </TabsTrigger>
          <TabsTrigger value="database" className="rounded-lg px-6 gap-2">
            <Database className="h-4 w-4" /> Data Management
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

                <div className="space-y-3">
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
                  <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                    <ImageIcon className="h-4 w-4 mr-2" /> Upload Logo
                  </Button>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t flex justify-between p-6">
              <Button variant="outline" onClick={handleReset}><RefreshCw className="h-4 w-4 mr-2" /> Restore Default</Button>
              <Button onClick={handleSave} disabled={isSaving} className="min-w-[140px]">
                {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Apply Changes
              </Button>
            </CardFooter>
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
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm flex gap-3">
                <Key className="h-5 w-5 shrink-0" />
                <p>SMTP credentials are stored securely and never exposed to standard dashboard queries.</p>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t flex justify-end p-6">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
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
    </div>
  );
}
