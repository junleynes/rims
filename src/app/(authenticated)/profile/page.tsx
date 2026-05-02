
"use client";

import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/auth-context';
import { useSystemData } from '@/components/system-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  User as UserIcon, 
  Shield, 
  Lock, 
  KeyRound, 
  Building, 
  LayoutGrid, 
  Briefcase, 
  UserCheck, 
  Mail, 
  Phone,
  Camera,
  Trash2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilePage() {
  const { user, updateCurrentUser } = useAuth();
  const { updateUser } = useSystemData();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || '');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(!!user?.twoFactorEnabled);
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedData = { name, email, contactNumber, twoFactorEnabled, profilePicture };
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "File too large", description: "Profile picture must be under 2MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setProfilePicture('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              <div className="flex flex-col sm:flex-row items-center gap-8 p-6 bg-muted/30 rounded-3xl border border-border/50">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                    <AvatarImage src={profilePicture} className="object-cover" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-black">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-8 w-8 rounded-full" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    {profilePicture && (
                      <Button 
                        size="icon" 
                        variant="destructive" 
                        className="h-8 w-8 rounded-full" 
                        onClick={removePhoto}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                </div>
                <div className="text-center sm:text-left space-y-2">
                  <h3 className="text-2xl font-black text-primary uppercase tracking-tight">{user.name}</h3>
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-1">
                    <Badge variant="secondary" className="gap-1 px-3 py-1 font-bold">
                      {user.role === 'Admin' ? <Shield className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
                      {user.role}
                    </Badge>
                    <span className="text-sm text-muted-foreground font-black uppercase">@{user.username}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium italic">Click the photo to update your profile image.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Enter your full name"
                    className="h-12 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" /> Email Address
                    </Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="email@example.com"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactNumber" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> Contact Number
                    </Label>
                    <Input 
                      id="contactNumber" 
                      value={contactNumber} 
                      onChange={(e) => setContactNumber(e.target.value)} 
                      placeholder="+63 XXX XXX XXXX"
                      className="h-12 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                  <div className="space-y-1 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3" /> Position
                    </Label>
                    <p className="font-black text-sm text-primary">{user.position || 'Unassigned'}</p>
                  </div>
                  <div className="space-y-1 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="h-3 w-3" /> Reporting To
                    </Label>
                    <p className="font-black text-sm text-primary">{user.reportingTo || 'N/A'}</p>
                  </div>
                  <div className="space-y-1 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Building className="h-3 w-3" /> Division
                    </Label>
                    <p className="font-black text-sm text-primary">{user.division || 'Unassigned'}</p>
                  </div>
                  <div className="space-y-1 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <LayoutGrid className="h-3 w-3" /> Section/Unit
                    </Label>
                    <p className="font-black text-sm text-primary">{user.section || 'Unassigned'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t p-6 bg-muted/20 flex justify-end">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 min-w-[140px] font-bold h-12">
                {isSaving ? <Save className="h-4 w-4 animate-pulse" /> : <Save className="h-4 w-4" />}
                Update Settings
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
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-black text-[10px] uppercase">Enabled</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground font-black text-[10px] uppercase">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Require a verification code in addition to your password.</p>
                </div>
                <Switch 
                  checked={twoFactorEnabled} 
                  onCheckedChange={setTwoFactorEnabled}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-dashed">
                <div className="space-y-0.5">
                  <p className="font-bold">Password Management</p>
                  <p className="text-xs text-muted-foreground">Update your password regularly to keep your account secure.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleResetPassword} className="gap-2 font-bold">
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
              <CardTitle className="text-lg uppercase tracking-tight font-black">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Role Permissions</p>
                <p className="text-sm font-medium leading-relaxed">
                  {user.role === 'Admin' 
                    ? 'Full administrative access to resources, organization settings, and user management.' 
                    : `Access to log and manage resources within the scope of your role as ${user.role}.`}
                </p>
              </div>
              <div className="pt-4 border-t border-white/20">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">System Integrity</p>
                <p className="text-sm font-medium">Verified Active Personnel</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white overflow-hidden">
             <div className="h-1.5 bg-accent" />
            <CardContent className="p-6">
              <h4 className="font-black text-[11px] uppercase tracking-widest mb-4 flex items-center gap-2 text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-accent" />
                Session Info
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-muted-foreground uppercase">Username:</span>
                  <span className="text-primary">@{user.username}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-muted-foreground uppercase">Status:</span>
                  <span className="text-emerald-600">Online</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-muted-foreground uppercase">Last Active:</span>
                  <span className="text-slate-600">Just now</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
