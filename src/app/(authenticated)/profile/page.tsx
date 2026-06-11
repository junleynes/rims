
"use client";

import React, { useState, useRef, useEffect } from 'react';
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
  Trash2,
  QrCode,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { actionSetupTwoFactor, actionConfirmTwoFactor, actionDisableTwoFactor, actionChangePassword } from '@/app/actions/auth-actions';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, updateCurrentUser } = useAuth();
  const { updateUser } = useSystemData();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [isSaving, setIsSaving] = useState(false);

  // Password Update State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // 2FA Setup State
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedData = { name, email, contactNumber, profilePicture };
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.old || !passwords.new || !passwords.confirm) {
      toast({ title: "Validation Error", description: "All password fields are required.", variant: "destructive" });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast({ title: "Validation Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (passwords.new.length < 12) {
      toast({ title: "Validation Error", description: "Password must be at least 12 characters.", variant: "destructive" });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const result = await actionChangePassword(passwords.old, passwords.new);
      if (result.success) {
        toast({ title: "Password Updated", description: "Your account security credentials have been changed." });
        setPasswords({ old: '', new: '', confirm: '' });
        setShowPasswordForm(false);
      } else {
        toast({ title: "Update Failed", description: result.error || "Could not change password.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsUpdatingPassword(false);
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

  const handleStart2FASetup = async () => {
    setIsSettingUp2FA(true);
    try {
      const data = await actionSetupTwoFactor();
      setSetupData(data);
    } catch (e) {
      toast({ title: "Setup Error", description: "Could not initiate 2FA setup.", variant: "destructive" });
      setIsSettingUp2FA(false);
    }
  };

  const handleConfirm2FA = async () => {
    if (!setupData || verificationCode.length !== 6) return;
    setIsVerifying2FA(true);
    try {
      const result = await actionConfirmTwoFactor(verificationCode, setupData.secret);
      if (result.success) {
        toast({ title: "2FA Activated", description: "Google Authenticator setup successful." });
        updateCurrentUser({ ...user, twoFactorEnabled: true });
        setIsSettingUp2FA(false);
        setSetupData(null);
        setVerificationCode('');
      } else {
        toast({ title: "Verification Failed", description: result.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      await actionDisableTwoFactor();
      updateCurrentUser({ ...user, twoFactorEnabled: false });
      toast({ title: "2FA Disabled", description: "Authenticator security has been removed from your account." });
    } catch (e) {
      toast({ title: "Error", description: "Could not disable 2FA.", variant: "destructive" });
    }
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
              </div>
            </CardContent>
            <CardFooter className="border-t p-6 bg-muted/20 flex justify-end">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 min-w-[140px] font-bold h-12">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Update Profile
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Account Password
                  </CardTitle>
                  <CardDescription>Update your system authentication credentials.</CardDescription>
                </div>
                {!showPasswordForm && (
                  <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)} className="font-bold">
                    Change Password
                  </Button>
                )}
              </div>
            </CardHeader>
            {showPasswordForm && (
              <CardContent className="pt-6 animate-in slide-in-from-top-2">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="oldPass">Current Password</Label>
                      <div className="relative">
                        <Input 
                          id="oldPass" 
                          type={showOldPass ? "text" : "password"} 
                          value={passwords.old} 
                          onChange={(e) => setPasswords({...passwords, old: e.target.value})}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowOldPass(!showOldPass)} 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                        >
                          {showOldPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="hidden md:block" />
                    <div className="space-y-2">
                      <Label htmlFor="newPass">New Password</Label>
                      <div className="relative">
                        <Input 
                          id="newPass" 
                          type={showNewPass ? "text" : "password"} 
                          value={passwords.new} 
                          onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowNewPass(!showNewPass)} 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                        >
                          {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPass">Confirm New Password</Label>
                      <Input 
                        id="confirmPass" 
                        type="password" 
                        value={passwords.confirm} 
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" type="button" onClick={() => { setShowPasswordForm(false); setPasswords({old:'', new:'', confirm:''}); }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isUpdatingPassword} className="gap-2 font-bold min-w-[140px]">
                      {isUpdatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Apply New Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>

          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                Two-Factor Authentication (TOTP)
              </CardTitle>
              <CardDescription>Secure your account with Google Authenticator or compatible apps.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {!user.twoFactorEnabled && !isSettingUp2FA && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-xl border border-dashed text-sm">
                    <p className="font-semibold text-primary">Enhance your security</p>
                    <p className="text-muted-foreground mt-1">Protect your account with a time-based 6-digit code. No SMS or email required.</p>
                  </div>
                  <Button onClick={handleStart2FASetup} className="gap-2 font-bold">
                    Set up Google Authenticator
                  </Button>
                </div>
              )}

              {isSettingUp2FA && (
                <div className="space-y-6 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="flex flex-col items-center gap-4">
                      {setupData ? (
                        <div className="p-4 bg-white rounded-2xl shadow-inner border">
                          <Image src={setupData.qrCodeUrl} alt="QR Code" width={200} height={200} className="rounded-lg" />
                        </div>
                      ) : (
                        <div className="h-[232px] w-[232px] flex items-center justify-center bg-muted animate-pulse rounded-2xl">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest px-4">
                        Scan this QR code with your Authenticator app.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase">Manual Key</Label>
                        <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all border select-all">
                          {setupData?.secret || 'Generating...'}
                        </div>
                      </div>
                      
                      <div className="space-y-2 pt-2">
                        <Label htmlFor="vcode" className="text-xs font-black uppercase">Enter 6-Digit Verification Code</Label>
                        <Input 
                          id="vcode"
                          placeholder="000000"
                          maxLength={6}
                          className="h-12 text-center text-2xl tracking-[0.5em] font-mono"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" onClick={() => { setIsSettingUp2FA(false); setSetupData(null); setVerificationCode(''); }}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleConfirm2FA} 
                      disabled={verificationCode.length !== 6 || isVerifying2FA}
                      className="gap-2 font-bold min-w-[120px]"
                    >
                      {isVerifying2FA ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Verify & Enable
                    </Button>
                  </div>
                </div>
              )}

              {user.twoFactorEnabled && (
                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-900">Authenticator Active</p>
                      <p className="text-xs text-emerald-700">Your account is protected by standard TOTP 2FA.</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDisable2FA} className="text-red-600 border-red-200 hover:bg-red-50 font-bold">
                    Disable 2FA
                  </Button>
                </div>
              )}
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
                  <span className="text-muted-foreground uppercase">Security:</span>
                  <span className={user.twoFactorEnabled ? "text-emerald-600" : "text-amber-600"}>
                    {user.twoFactorEnabled ? "2FA Enabled" : "2FA Off"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
