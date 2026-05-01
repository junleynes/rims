
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Lock, ShieldCheck, Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthProvider, useAuth } from '@/components/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useBranding } from '@/components/branding-context';
import Image from 'next/image';

function LoginPage() {
  const router = useRouter();
  const { login, verify2FA, cancel2FA, user, pendingUser } = useAuth();
  const { config } = useBranding();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');

  // Auto-redirect if already logged in
  React.useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      login(username)
        .then(() => {
          toast({
            title: "Verification Required",
            description: "A 2FA code has been generated for your account.",
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
    }, 800);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const success = verify2FA(otp);
      if (success) {
        toast({
          title: `Welcome to ${config.appAcronym}`,
          description: "2FA Verified successfully.",
        });
        router.push('/dashboard');
      } else {
        toast({
          title: "Invalid Code",
          description: "The 2FA code you entered is incorrect.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#EBF3F5]">
      {/* Hero Section */}
      <div className="hidden md:flex md:w-1/2 bg-primary items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -ml-48 -mb-48" />
        
        <div className="relative z-10 max-w-md">
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
          <p className="text-white/80 leading-relaxed text-lg mb-8">
            {config.loginDescription}
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-6 w-6 text-accent shrink-0 mt-1" />
              <div>
                <p className="font-semibold">Role-Based Access</p>
                <p className="text-sm text-white/60">Secure management boundaries for section leads and administrators.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form / 2FA Form */}
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
                      <Input id="password" type="password" placeholder="••••••••" required />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 py-6 text-lg" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
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
                  A verification code was sent to your registered device.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input 
                      id="otp" 
                      placeholder="Enter 6-digit code" 
                      className="text-center text-2xl tracking-[0.5em] h-14 font-mono"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
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
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} {config.appAcronym} System. All rights reserved.
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
