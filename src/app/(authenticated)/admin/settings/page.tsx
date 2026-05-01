
"use client";

import React, { useState, useRef } from 'react';
import { useBranding } from '@/components/branding-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, RefreshCw, Download, Upload, Database, ImageIcon, X, TrendingUp, Palette, Check, Moon, Sun, LayoutPanelTop, Copyright } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const THEMES = [
  { id: 'default', name: 'Oceanic (Default)', primary: 'bg-[#2E86AB]', accent: 'bg-[#31C1A5]' },
  { id: 'forest', name: 'Forest', primary: 'bg-[#154726]', accent: 'bg-[#968215]' },
  { id: 'sunset', name: 'Sunset', primary: 'bg-[#E03E1A]', accent: 'bg-[#D6B51E]' },
  { id: 'midnight', name: 'Midnight', primary: 'bg-[#7C3AED]', accent: 'bg-[#D946EF]' },
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
  const [theme, setTheme] = useState(config.theme || 'default');
  const [darkMode, setDarkMode] = useState(!!config.darkMode);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      updateConfig({ appName, appAcronym, loginDescription, copyright, logoUrl, theme, darkMode });
      toast({
        title: "Settings Saved",
        description: "Branding settings have been updated successfully.",
      });
      setIsSaving(false);
    }, 600);
  };

  const handleReset = () => {
    setAppName('Resource Inventory Management System');
    setAppAcronym('R.I.M.S');
    setLoginDescription('A specialized system for broadcast, media, and engineering departments to manage expenditures and resources with precision.');
    setCopyright(`© ${new Date().getFullYear()} Resource Inventory Management System. All rights reserved.`);
    setLogoUrl('');
    setTheme('default');
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
      resources: localStorage.getItem('budgetguard_data'),
      divisions: localStorage.getItem('rims_divisions'),
      sections: localStorage.getItem('rims_sections'),
      locations: localStorage.getItem('rims_locations'),
      status: localStorage.getItem('rims_status_options'),
      users: localStorage.getItem('rims_users'),
      branding: localStorage.getItem('rims_branding'),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rims-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    toast({
      title: "Data Exported",
      description: "A backup of your local database has been downloaded.",
    });
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.resources) localStorage.setItem('budgetguard_data', data.resources);
        if (data.divisions) localStorage.setItem('rims_divisions', data.divisions);
        if (data.sections) localStorage.setItem('rims_sections', data.sections);
        if (data.locations) localStorage.setItem('rims_locations', data.locations);
        if (data.status) localStorage.setItem('rims_status_options', data.status);
        if (data.users) localStorage.setItem('rims_users', data.users);
        if (data.branding) localStorage.setItem('rims_branding', data.branding);
        
        toast({
          title: "Import Successful",
          description: "Your local database has been restored. Please refresh the page.",
        });
        
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast({
          title: "Import Failed",
          description: "The file format is invalid.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">System Settings</h1>
        <p className="text-muted-foreground">Manage application identity, appearance, and local data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Branding Configuration</CardTitle>
              <CardDescription>
                Customize how the application looks and identifies itself.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input 
                    id="appName" 
                    value={appName} 
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="e.g. Resource Inventory Management System"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appAcronym">Application Acronym / Short Name</Label>
                  <Input 
                    id="appAcronym" 
                    value={appAcronym} 
                    onChange={(e) => setAppAcronym(e.target.value)}
                    placeholder="e.g. R.I.M.S"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginDescription">Login Page Description</Label>
                  <Textarea 
                    id="loginDescription" 
                    value={loginDescription} 
                    onChange={(e) => setLoginDescription(e.target.value)}
                    placeholder="Welcome message for the login screen..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="copyright">Copyright Footer Text</Label>
                  <Input 
                    id="copyright" 
                    value={copyright} 
                    onChange={(e) => setCopyright(e.target.value)}
                    placeholder="e.g. © 2025 R.I.M.S System"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-dashed">
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      Dark Mode
                    </Label>
                    <p className="text-xs text-muted-foreground">Toggle application-wide dark theme.</p>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4" /> Theme Color Selection
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left group",
                        theme === t.id ? "border-primary bg-primary/5" : "border-transparent bg-muted/30 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex -space-x-2">
                        <div className={cn("h-6 w-6 rounded-full border-2 border-white", t.primary)} />
                        <div className={cn("h-6 w-6 rounded-full border-2 border-white", t.accent)} />
                      </div>
                      <span className="flex-1 text-xs font-bold">{t.name}</span>
                      {theme === t.id && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-sm font-semibold">Application Logo</Label>
                <div className="flex items-center gap-6">
                  <div className="relative h-20 w-20 rounded-2xl border-2 border-dashed flex items-center justify-center bg-muted/30 overflow-hidden group">
                    {logoUrl ? (
                      <>
                        <Image src={logoUrl} alt="App Logo" fill className="object-cover" />
                        <button 
                          onClick={() => setLogoUrl('')}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-5 w-5 text-white" />
                        </button>
                      </>
                    ) : (
                      <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Button 
                      variant="outline" 
                      onClick={() => logoInputRef.current?.click()}
                      className="gap-2"
                    >
                      <ImageIcon className="h-4 w-4" /> Change Logo
                    </Button>
                    <p className="text-xs text-muted-foreground">Recommended: Square PNG or JPEG with transparent background.</p>
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6 bg-muted/30">
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Reset to Default
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 min-w-[120px]">
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Branding
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Local Data Management
              </CardTitle>
              <CardDescription>
                Back up your shared JSON database or restore from a backup file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Button onClick={handleExportData} variant="outline" className="flex-1 gap-2 py-8 border-dashed">
                  <Download className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-bold">Export Backup</p>
                    <p className="text-xs text-muted-foreground">Download database as JSON</p>
                  </div>
                </Button>
                
                <div className="relative flex-1">
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleImportData}
                    className="absolute inset-0 opacity-0 cursor-pointer h-full w-full z-10"
                  />
                  <Button variant="outline" className="w-full gap-2 py-8 border-dashed pointer-events-none">
                    <Upload className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-bold">Import Backup</p>
                      <p className="text-xs text-muted-foreground">Restore from JSON file</p>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-lg sticky top-6">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Live Identity Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Sidebar Brand</Label>
                <div className="bg-card p-4 rounded-xl border shadow-sm flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center overflow-hidden",
                    theme === 'default' ? 'bg-[#2E86AB]' : 
                    theme === 'forest' ? 'bg-[#154726]' : 
                    theme === 'sunset' ? 'bg-[#E03E1A]' : 'bg-[#7C3AED]'
                  )}>
                    {logoUrl ? (
                      <Image src={logoUrl} alt="Preview" width={40} height={40} className="object-cover" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <span className="font-bold text-lg text-primary">{appAcronym}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Login Footer Preview</Label>
                <div className="bg-muted/20 p-4 rounded-xl border shadow-inner">
                  <p className="text-[10px] text-muted-foreground text-center font-medium italic">
                    {copyright}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-primary text-primary-foreground rounded-xl shadow-md space-y-2 transition-colors">
                <p className="text-xs font-bold opacity-70">Theme Mode</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-accent border-2 border-white/20 shadow-inner" />
                  <span className="text-sm font-bold capitalize">{darkMode ? 'Dark' : 'Light'} - {theme}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
