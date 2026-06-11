"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, Lock, ShieldCheck, Loader2, ArrowLeft, ShieldAlert, QrCode, CheckCircle2,
  BarChart3, Users, Table2, BookOpen, Network, Brain, Sparkles, AlertTriangle, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthProvider, useAuth } from '@/components/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useToast } from '@/hooks/use-toast';
import { useBranding } from '@/components/branding-context';
import Image from 'next/image';

const FEATURES = [
  { title: "Role-Based Data Access", desc: "Automated filtering ensures privacy and departmental data integrity across all divisions and sections.", icon: Users },
  { title: "Real-Time Analytics", desc: "Dynamic dashboards with comprehensive CAPEX and OPEX visualizations, utilization rates, and trend breakdowns.", icon: BarChart3 },
  { title: "Resource Inventory Log", desc: "Structured tracking of hardware and software assets — from procurement to delivery and SAMD turnover.", icon: Table2 },
  { title: "AI Anomaly Detection", desc: "Automatically flags budget overruns, unit cost magnitude errors, and unrecorded actuals on delivered items.", icon: AlertTriangle },
  { title: "AI Budget Autofill", desc: "Intelligent field suggestions for project titles and item descriptions based on category and classification inputs.", icon: Zap },
  { title: "AI Narrative Reports", desc: "Generates executive-ready summary paragraphs from live report data — ready for VP and AVP briefings.", icon: Sparkles },
  { title: "Centralized Knowledge Base", desc: "Quick access to standard operating procedures, technical manuals, and policy documents.", icon: BookOpen },
  { title: "Table of Organization", desc: "Comprehensive mapping of functional reporting lines and division command chains.", icon: Network },
  { title: "Multi-Factor Authentication", desc: "Secure TOTP verification compatible with Google Authenticator. Enforced per admin policy.", icon: ShieldCheck },
];

function LoginPage() {
  const router = useRouter();
  const { login, verify2FA, confirmSetup2FA, cancelPending, user, pending, isLoading } = useAuth();
  const { config } = useBranding();
  const { toast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    if (!isLoading && user) router.push('/dashboard');
  }, [user, isLoading, router]);

  // Lockout countdown
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const t = setTimeout(() => setLockoutSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [lockoutSeconds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(username, password);
    setSubmitting(false);

    if (result.status === 'locked') {
      setLockoutSeconds(result.remainingSeconds);
      toast({ title: 'Account Locked', description: `Too many failed attempts. Try again in ${Math.ceil(result.remainingSeconds / 60)} min.`, variant: 'destructive' });
    } else if (result.status === 'invalid') {
      toast({ title: 'Authentication Failed', description: 'Invalid username or password.', variant: 'destructive' });
    } else if (result.status === 'ok') {
      toast({ title: 'Welcome back', description: 'Signed in successfully.' });
      window.location.href = '/dashboard';
    }
    // needs_2fa_verify and needs_2fa_setup are handled by pending state
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let result: { success: boolean; error?: string };
    if (pending?.needs2FASetup && pending.setupData) {
      result = await confirmSetup2FA(otp, pending.setupData.secret);
    } else {
      result = await verify2FA(otp);
    }

    setSubmitting(false);
    if (result.success) {
      toast({ title: pending?.needs2FASetup ? '2FA Activated' : 'Welcome back', description: 'Authentication complete.' });
      window.location.href = '/dashboard';
    } else {
      toast({ title: 'Invalid Code', description: result.error ?? 'Please try again.', variant: 'destructive' });
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#EBF3F5]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

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
                <div className="h-10 w-10 relative"><Image src={config.logoUrl} alt="Logo" fill className="object-contain" /></div>
              ) : (
                <TrendingUp className="h-10 w-10 text-accent" />
              )}
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{config.appAcronym}</h1>
          </div>
          <h2 className="text-2xl font-semibold mb-4 text-accent">{config.appName}</h2>
          <p className="text-white/80 leading-relaxed text-lg mb-10">{config.loginDescription}</p>
          <div className="relative px-8">
            <Carousel className="w-full">
              <CarouselContent>
                {FEATURES.map((feature, index) => (
                  <CarouselItem key={index}>
                    <div className="flex flex-col items-center text-center space-y-4 p-4">
                      <div className="bg-white/10 p-4 rounded-2xl shadow-inner">
                        <feature.icon className="h-10 w-10 text-accent" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold tracking-tight">{feature.title}</h3>
                        <p className="text-sm text-white/60 leading-relaxed max-w-[280px] mx-auto">{feature.desc}</p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white" />
              <CarouselNext className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white" />
            </Carousel>
          </div>
        </div>
      </div>

      {/* Forms */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden">
          {/* Step 1: Username + Password */}
          {!pending ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <CardHeader className="text-center">
                <div className="md:hidden flex justify-center mb-4">
                  {config.logoUrl ? (
                    <div className="h-12 w-12 relative"><Image src={config.logoUrl} alt="Logo" fill className="object-contain" /></div>
                  ) : (
                    <TrendingUp className="h-12 w-12 text-primary" />
                  )}
                </div>
                <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
                <CardDescription>Enter your credentials to access {config.appAcronym}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  {lockoutSeconds > 0 && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Account locked. Try again in {Math.ceil(lockoutSeconds / 60)}m {lockoutSeconds % 60}s.
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" placeholder="Username" required value={username} onChange={e => setUsername(e.target.value)} disabled={lockoutSeconds > 0} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} disabled={lockoutSeconds > 0} />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 py-6 text-lg" disabled={submitting || lockoutSeconds > 0}>
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </div>
          ) : pending.needs2FASetup ? (
            /* Step 2a: Forced 2FA setup */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="text-center bg-primary/5">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full"><QrCode className="h-10 w-10 text-primary" /></div>
                </div>
                <CardTitle className="text-2xl font-bold">Mandatory 2FA Setup</CardTitle>
                <CardDescription>Your administrator has required 2FA. Scan the QR code with Google Authenticator.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {pending.setupData ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-white rounded-2xl shadow-inner border">
                      <Image src={pending.setupData.qrCodeUrl} alt="QR Code" width={180} height={180} className="rounded-lg" />
                    </div>
                    <div className="w-full space-y-2">
                      <Label className="text-[10px] font-black uppercase">Manual Key</Label>
                      <div className="p-2 bg-muted rounded-lg font-mono text-xs break-all border select-all text-center">{pending.setupData.secret}</div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[240px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                )}
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter 6-Digit Verification Code</Label>
                    <Input id="otp" placeholder="000000" className="text-center text-2xl tracking-[0.5em] h-14 font-mono" maxLength={6} required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 py-6 text-lg" disabled={submitting || !pending.setupData}>
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5 mr-2" /> Verify & Complete Setup</>}
                  </Button>
                </form>
              </CardContent>
            </div>
          ) : (
            /* Step 2b: 2FA verification */
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-accent/10 rounded-full"><ShieldAlert className="h-10 w-10 text-accent" /></div>
                </div>
                <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
                <CardDescription>Enter the 6-digit code from your Google Authenticator app.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input id="otp" placeholder="000000" className="text-center text-2xl tracking-[0.5em] h-14 font-mono" maxLength={6} required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90 py-6 text-lg" disabled={submitting}>
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify & Sign In'}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full gap-2" onClick={cancelPending} disabled={submitting}>
                    <ArrowLeft className="h-4 w-4" /> Back to Login
                  </Button>
                </form>
              </CardContent>
            </div>
          )}
          <CardFooter className="flex flex-col gap-4 text-sm text-center bg-muted/20 pt-6">
            <p className="text-[10px] text-muted-foreground italic">{config.copyright}</p>
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
