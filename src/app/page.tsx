
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthProvider, useAuth } from '@/components/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useBranding } from '@/components/branding-context';

function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const { config } = useBranding();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');

  // Auto-redirect if already logged in
  React.useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      login(username);
      toast({
        title: `Welcome to ${config.appAcronym}`,
        description: "Successfully signed in.",
      });
      router.push('/dashboard');
    } catch (err) {
      toast({
        title: "Authentication Failed",
        description: "Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
              <TrendingUp className="h-10 w-10 text-accent" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{config.appAcronym}</h1>
          </div>
          <h2 className="text-2xl font-semibold mb-4 text-accent">{config.appName}</h2>
          <p className="text-white/80 leading-relaxed text-lg mb-8">
            A specialized system for broadcast, media, and engineering departments to manage expenditures and resources with precision.
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

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border-none">
          <CardHeader className="text-center">
            <div className="md:hidden flex justify-center mb-4">
              <TrendingUp className="h-12 w-12 text-primary" />
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
                  placeholder="e.g. admin or manager_media" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type="password" placeholder="••••••••" required defaultValue="password" />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 py-6 text-lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 text-sm text-center">
            <p className="text-muted-foreground">
              Demo access: use <code className="bg-muted px-1 rounded">admin</code> or <code className="bg-muted px-1 rounded">manager_media</code>
            </p>
            <div className="h-px w-full bg-border" />
            <p className="text-xs text-muted-foreground">
              &copy; 2025 {config.appAcronym} System. All rights reserved.
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
