"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  Lock, 
  ShieldCheck, 
  Loader2, 
  ArrowLeft, 
  ShieldAlert, 
  QrCode, 
  CheckCircle2,
  BarChart3,
  Users,
  Table2,
  BookOpen,
  Layers,
  Network
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthProvider, useAuth } from '@/components/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useBranding } from '@/components/branding-context';
import Image from 'next/image';
import { setupTwoFactor } from '@/app/actions/db-actions';

function LoginPage() {
  const router = useRouter();
  const { login, verify2FA, setupForced2FA, cancel2FA, user, pendingUser } = useAuth();
  const { config } = useBranding();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  // Forced 2FA Setup State
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  // Load setup data if forced 2FA setup is required
  useEffect(() => {
    if (pendingUser?.needs2FASetup && !setupData) {
      setupTwoFactor(pendingUser.id).then(setSetupData);
    }
  }, [pendingUser, setupData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    login(username, password)
      .then(() => {
        toast({
          title: "Identity Verified",
          description: "Proceeding with authentication...",
        });
      })
      .catch((err) => {
        toast({
          title: "Authentication Failed",
          description: "Please check your credentials.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (pendingUser?.needs2FASetup && setupData) {
      setupForced2FA(otp, setupData.secret).then((success) => {
        if (success) {
          toast({ title: "2FA Activated", description: "Your account is now secured with Google Authenticator." });
          router.push('/dashboard');
        } else {
          toast({ title: "Invalid Code", description: "The setup code you entered is incorrect.", variant: "destructive" });
          setIsLoading(false);
        }
      });
    } else {
      verify2FA(otp).then((success) => {
        if (success) {
          toast({ title: `Welcome back`, description: "2FA Verified successfully." });
          router.push('/dashboard');
        } else {
          toast({ title: "Invalid Code", description: "The authentication code you entered is incorrect.", variant: "destructive" });
          setIsLoading(false);
        }
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#EBF3F5]">
      {/* Hero Section */}
      <div className="hidden md:flex md:w-1/2 bg-primary items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -ml-48 -mb-48" />
        
        <div className="relative z-10 max-w-md w-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
              {config.logoUrl ? (
                <div className="h-10 w-10 relative">
                  <Image src={config.logoUrl} alt="Logo" fill className="object-contain" />
                </div>
              ) : (
                <TrendingUp className="h-10 w-10 text-accent" />
              )}
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{config.appAcronym}</h1>
          </div>
          <h2 className="text-2xl font-semibold mb-4 text-accent">{config.appName}</h2>
          <p className="text-white/80 leading-relaxed text-lg mb-10">
            {config.loginDescription}
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-2 rounded-lg">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-bold text-sm tracking-tight">Role-Based Data Access</p>
                <p className="text-sm text-white/60">Automated filtering ensures privacy and departmental data integrity.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-2 rounded-lg">
                <BarChart3 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-bold text-sm tracking-tight">Real-Time Analytics</p>
                <p className="text-sm text-white/60">Dynamic dashboards with comprehensive CAPEX and OPEX visualizations.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-2 rounded-lg">
                <Table2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-bold text-sm tracking-tight">Resource Inventory Log</p>
                <p className="text-sm text-white/60">Structured tracking of hardware and software assets across the organization.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-bold text-sm tracking-tight">Centralized Knowledge Base</p>
                <p className="text-sm text-white/60">Quick access to standard operating procedures and technical manuals.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-2 rounded-lg">
                <Network className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-bold text-sm tracking-tight">Table of Organization</p>
                <p className="text-sm text-white/60">Comprehensive mapping of functional reporting lines and command chains.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-2 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-bold text-sm tracking-tight">Multi-Factor Authentication</p>
                <p className="text-sm text-white/60">Secure TOTP verification compatible with Google Authenticator.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form / 2FA Form / Setup Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden">
          {!pendingUser ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <CardHeader className="text-center">
                <div className="md:hidden flex justify-center mb-4">
                  {config.logoUrl ? (
                    <div className="h-12 w-12 relative">
                      <Image src={config.logoUrl} alt="Logo" fill className="object-contain" />
                    </div>
                  ) : (
                    <TrendingUp className="h-12 w-12 text-primary" />
                  )}
                </div>
                <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
                <CardDescription>Enter your credentials to access {config.appAcronym}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      placeholder="Username" 
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 py-6 text-lg" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </div>
          ) : pendingUser.needs2FASetup ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="text-center bg-primary/5">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <QrCode className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Mandatory 2FA Setup</CardTitle>
                <CardDescription>
                  Your administrator has required 2FA for your account. Please set up Google Authenticator to continue.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {setupData ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-white rounded-2xl shadow-inner border">
                      <Image src={setupData.qrCodeUrl} alt="QR Code" width={180} height={180} className="rounded-lg" />
                    </div>
                    <div className="w-full space-y-2">
                      <Label className="text-[10px] font-black uppercase">Manual Key</Label>
                      <div className="p-2 bg-muted rounded-lg font-mono text-xs break-all border select-all text-center">
                        {setupData.secret}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[240px] flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">Generating security key...</p>
                  </div>
                )}

                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter 6-Digit Verification Code</Label>
                    <Input 
                      id="otp" 
                      placeholder="000000" 
                      className="text-center text-2xl tracking-[0.5em] h-14 font-mono"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 py-6 text-lg" disabled={isLoading || !setupData}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5 mr-2" /> Verify & Complete Setup</>}
                  </Button>
                </form>
              </CardContent>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-accent/10 rounded-full">
                    <ShieldAlert className="h-10 w-10 text-accent" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Enter the 6-digit code from your Google Authenticator app.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input 
                      id="otp" 
                      placeholder="000000" 
                      className="text-center text-2xl tracking-[0.5em] h-14 font-mono"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90 py-6 text-lg" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify & Sign In'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full gap-2" 
                    onClick={cancel2FA}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Login
                  </Button>
                </form>
              </CardContent>
            </div>
          )}
          <CardFooter className="flex flex-col gap-4 text-sm text-center bg-muted/20 pt-6">
            <p className="text-[10px] text-muted-foreground italic">
              {config.copyright}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}
