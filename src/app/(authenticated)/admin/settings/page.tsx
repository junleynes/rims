
"use client";

import React, { useState } from 'react';
import { useBranding } from '@/components/branding-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save, RefreshCw, Download, Upload, Database } from 'lucide-react';

export default function SettingsPage() {
  const { config, updateConfig } = useBranding();
  const { toast } = useToast();
  
  const [appName, setAppName] = useState(config.appName);
  const [appAcronym, setAppAcronym] = useState(config.appAcronym);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      updateConfig({ appName, appAcronym });
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
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">System Settings</h1>
        <p className="text-muted-foreground">Manage application identity, local data, and global preferences.</p>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Branding Configuration</CardTitle>
          <CardDescription>
            Change the application name and acronym displayed throughout the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              className="w-full md:w-[200px]"
            />
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
            Since you are running this app locally, you can back up your data or restore from a previous session.
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
              <Input 
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

      <Card className="border-dashed border-2 bg-muted/10">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Identity Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Header Display:</p>
            <h2 className="font-semibold text-lg text-primary">{appName}</h2>
          </div>
          <div className="p-4 bg-primary text-primary-foreground rounded-lg shadow-sm">
            <p className="text-xs opacity-70 mb-1">Sidebar Display:</p>
            <span className="font-bold text-xl">{appAcronym}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
