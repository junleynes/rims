
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Table2, 
  PlusCircle, 
  Users, 
  LogOut,
  TrendingUp,
  Settings,
  Building2,
  FileBarChart,
  Network,
  UsersRound,
  Megaphone,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-context';
import { useBranding } from '@/components/branding-context';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { fetchSystemUpdates } from '@/app/actions/db-actions';

export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { config } = useBranding();
  const [hasUnreadUpdates, setHasUnreadUpdates] = useState(false);

  useEffect(() => {
    async function checkUpdates() {
      if (!user) return;
      try {
        const updates = await fetchSystemUpdates();
        if (updates.length > 0) {
          const lastSeen = localStorage.getItem(`rims_last_seen_update_${user.id}`);
          const newest = updates[0].createdAt;
          
          if (!lastSeen || new Date(newest) > new Date(lastSeen)) {
            setHasUnreadUpdates(true);
          } else {
            setHasUnreadUpdates(false);
          }
        }
      } catch (e) {
        console.error("Failed to check for updates in sidebar", e);
      }
    }
    
    checkUpdates();
    const interval = setInterval(checkUpdates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, pathname]);

  if (!user) return null;

  const isReadOnly = user.role === 'Viewer';

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', color: 'bg-blue-500', badge: hasUnreadUpdates },
    { name: 'Resource Log', icon: Table2, href: '/budgets', color: 'bg-emerald-500' },
    { name: 'Knowledge Base', icon: BookOpen, href: '/knowledge-base', color: 'bg-indigo-500' },
  ];

  if (!isReadOnly) {
    navItems.push({ name: 'Add Resource', icon: PlusCircle, href: '/budgets/new', color: 'bg-orange-500' });
  }

  if (user.role === 'Manager') {
    navItems.push({ name: 'My Team', icon: UsersRound, href: '/team', color: 'bg-cyan-500' });
  }

  const managementItems = [
    { name: 'Reports', icon: FileBarChart, href: '/admin/reports', color: 'bg-rose-500' },
    { name: 'Org Structure', icon: Network, href: '/admin/org-structure', color: 'bg-indigo-500' },
  ];

  const adminItems = [
    { name: 'User Management', icon: Users, href: '/admin/users', color: 'bg-cyan-500' },
    { name: 'System Updates', icon: Megaphone, href: '/admin/updates', color: 'bg-rose-500' },
    { name: 'Organization', icon: Building2, href: '/admin/organization', color: 'bg-purple-500' },
    { name: 'System Settings', icon: Settings, href: '/admin/settings', color: 'bg-amber-500' },
  ];

  const isManagement = user.role === 'Admin' || user.role === 'VP' || user.role === 'AVP' || user.role === 'Manager' || user.role === 'Viewer';

  const renderNavItems = (items: any[]) => {
    return items.map((item) => (
      <SidebarMenuItem key={item.name}>
        <SidebarMenuButton 
          asChild 
          isActive={pathname === item.href}
          tooltip={item.name}
          className={cn(
            "h-11 rounded-xl transition-all duration-200 mb-1 group relative",
            pathname === item.href ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
          )}
        >
          <Link href={item.href} className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
            <div className={cn(
              "flex items-center justify-center h-8 w-8 rounded-lg shadow-sm text-white shrink-0 transition-transform group-hover:scale-105",
              item.color,
              "group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:mx-auto"
            )}>
              <item.icon className="h-4 w-4 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" />
            </div>
            <span className="font-semibold text-[14px] group-data-[collapsible=icon]:hidden">{item.name}</span>
            {item.badge && (
              <span className="absolute top-2 right-2 flex h-2 w-2 group-data-[collapsible=icon]:top-1 group-data-[collapsible=icon]:right-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));
  };

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-6 pb-2">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="bg-primary h-10 w-10 rounded-xl shadow-sm flex items-center justify-center overflow-hidden shrink-0">
            {config.logoUrl ? (
              <Image 
                src={config.logoUrl} 
                alt="Logo" 
                width={40} 
                height={40} 
                className="object-cover h-full w-full"
              />
            ) : (
              <TrendingUp className="text-primary-foreground h-5 w-5" />
            )}
          </div>
          <span className="font-bold text-xl tracking-tight text-primary group-data-[collapsible=icon]:hidden truncate">
            {config.appAcronym}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1 group-data-[collapsible=icon]:hidden">Home</SidebarGroupLabel>
          <SidebarMenu>
            {renderNavItems(navItems.slice(0, 1))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1 mt-2 group-data-[collapsible=icon]:hidden">Inventory</SidebarGroupLabel>
          <SidebarMenu>
            {renderNavItems(navItems.slice(1))}
          </SidebarMenu>
        </SidebarGroup>

        {isManagement && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1 mt-2 group-data-[collapsible=icon]:hidden">Management</SidebarGroupLabel>
            <SidebarMenu>
              {renderNavItems(managementItems)}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {user.role === 'Admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1 mt-2 group-data-[collapsible=icon]:hidden">Administration</SidebarGroupLabel>
            <SidebarMenu>
              {renderNavItems(adminItems)}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto border-t border-border/50">
        <div className="flex flex-col gap-2">
          <Link 
            href="/profile" 
            className={cn(
              "flex items-center gap-3 px-2 py-2 rounded-xl transition-colors group-data-[collapsible=icon]:justify-center",
              pathname === '/profile' ? "bg-primary/10" : "hover:bg-muted/50"
            )}
          >
            <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm shrink-0">
              <AvatarImage src={user.profilePicture || undefined} className="object-cover" />
              <AvatarFallback className="bg-secondary text-primary font-bold">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="text-[14px] font-bold truncate text-primary leading-tight">{user.name}</span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tight truncate">
                {user.role}
              </span>
            </div>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            className="justify-start gap-3 h-11 px-3 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors font-semibold group-data-[collapsible=icon]:justify-center"
            onClick={logout}
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-800 text-white shrink-0 shadow-sm">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="group-data-[collapsible=icon]:hidden text-[14px]">Sign Out</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
