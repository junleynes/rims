
"use client";

import React, { useState } from 'react';
import { useBranding } from '@/components/branding-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save, RefreshCw } from 'lucide-react';

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

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">System Settings</h1>
        <p className="text-muted-foreground">Manage application identity and global preferences.</p>
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

      <Card className="border-dashed border-2 bg-muted/10">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Preview</CardTitle>
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
