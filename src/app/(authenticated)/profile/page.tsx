
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { useSystemData } from '@/components/system-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, User as UserIcon, Shield, Lock, KeyRound, Building, LayoutGrid, Briefcase, UserCheck } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function ProfilePage() {
  const { user, updateCurrentUser } = useAuth();
  const { updateUser } = useSystemData();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(!!user?.twoFactorEnabled);
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedData = { name, twoFactorEnabled };
      await updateUser(user.id, updatedData);
      
      const updatedUser = { ...user, ...updatedData };
      updateCurrentUser(updatedUser);

      toast({
        title: "Profile Updated",
        description: "Your personal settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = () => {
    toast({
      title: "Password Reset Request",
      description: "A password reset link would be sent to your email in a production system.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">User Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and account security settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your display name and view your system role.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-black">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-primary">{user.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="gap-1 px-2 py-0.5">
                      {user.role === 'Admin' ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                      {user.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">@{user.username}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3" /> Position
                    </Label>
                    <p className="font-semibold text-sm">{user.position || 'Unassigned'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="h-3 w-3" /> Reporting To
                    </Label>
                    <p className="font-semibold text-sm">{user.reportingTo || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Building className="h-3 w-3" /> Division
                    </Label>
                    <p className="font-semibold text-sm">{user.division || 'Unassigned'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <LayoutGrid className="h-3 w-3" /> Section/Unit
                    </Label>
                    <p className="font-semibold text-sm">{user.section || 'Unassigned'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t p-6 bg-muted/20 flex justify-end">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 min-w-[140px]">
                {isSaving ? <Save className="h-4 w-4 animate-pulse" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your account protection and authentication methods.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl border border-dashed">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-bold">Two-Factor Authentication (2FA)</p>
                    {twoFactorEnabled ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Enabled</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Require a verification code in addition to your password.</p>
                </div>
                <Switch 
                  checked={twoFactorEnabled} 
                  onCheckedChange={setTwoFactorEnabled}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-dashed">
                <div className="space-y-0.5">
                  <p className="font-bold">Password Management</p>
                  <p className="text-sm text-muted-foreground">Update your password regularly to keep your account secure.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleResetPassword} className="gap-2">
                  <KeyRound className="h-4 w-4" /> Reset Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-lg bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="h-32 w-32 rotate-12" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Role Permissions</p>
                <p className="text-sm font-medium">
                  {user.role === 'Admin' 
                    ? 'Full administrative access to resources, organization settings, and user management.' 
                    : 'Access to log and manage resources within your assigned section.'}
                </p>
              </div>
              <div className="pt-4 border-t border-white/20">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Member Since</p>
                <p className="text-sm font-medium">January 2025</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-accent" />
                Session Information
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Logged in as:</span>
                  <span className="font-bold">{user.username}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">IP Address:</span>
                  <span className="font-mono">192.168.1.45</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Last Login:</span>
                  <span className="font-medium">2 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
