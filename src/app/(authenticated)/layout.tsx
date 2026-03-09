
"use client";

import { AuthProvider, useAuth } from '@/components/auth-context';
import { BudgetProvider } from '@/components/budget-context';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

function AuthenticatedContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <SidebarNav />
        <SidebarInset className="flex flex-col bg-[#EBF3F5]">
          <header className="h-16 flex items-center px-6 gap-4 border-b border-border/50 bg-white shadow-sm shrink-0">
            <SidebarTrigger />
            <div className="h-6 w-px bg-border mx-2" />
            <div className="flex-1 flex justify-between items-center">
              <h2 className="font-semibold text-lg text-primary">Budget Management System</h2>
              <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                Financial Year: 2026/2027
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BudgetProvider>
        <AuthenticatedContent>{children}</AuthenticatedContent>
      </BudgetProvider>
    </AuthProvider>
  );
}
