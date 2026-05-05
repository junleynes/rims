"use client";

import React from 'react';
import { useSystemData } from '@/components/system-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Building2, 
  LayoutGrid, 
  User as UserIcon, 
  Shield, 
  ChevronRight, 
  ArrowDown, 
  Users,
  Briefcase,
  UserCheck,
  Network,
  Waypoints
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from '@/lib/types';

export default function OrgStructurePage() {
  const { divisions, sections, users } = useSystemData();

  // Helper to get users by division and section
  const getUsersForSection = (divisionName: string, sectionName: string) => {
    return users.filter(u => u.division === divisionName && u.section === sectionName);
  };

  const getUsersForDivisionOnly = (divisionName: string) => {
    return users.filter(u => u.division === divisionName && (!u.section || u.section === 'None'));
  };

  // Helper to build a tree of users for the Reporting Hierarchy
  const getReportingHierarchy = () => {
    const rootUsers = users.filter(u => !u.reportingTo || u.reportingTo === 'None' || u.reportingTo === 'Board of Directors');
    
    const buildNode = (user: User): any => {
      const reports = users.filter(u => u.reportingTo === user.name);
      return {
        ...user,
        children: reports.map(buildNode)
      };
    };

    return rootUsers.map(buildNode);
  };

  const hierarchy = getReportingHierarchy();

  const UserNode = ({ user, depth = 0, isLast = false }: { user: any, depth?: number, isLast?: boolean }) => (
    <div className={cn(
      "relative space-y-4", 
      depth > 0 && "ml-8 md:ml-12 pl-6"
    )}>
      {/* Visual Connector Line */}
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px border-l-2 border-dashed border-primary/20 -translate-x-3">
           <div className="absolute top-8 left-0 w-6 h-px border-t-2 border-dashed border-primary/20" />
        </div>
      )}

      <Card className={cn(
        "border-none shadow-md hover:shadow-lg transition-all relative z-10",
        user.role === 'Admin' ? "bg-primary/5 ring-1 ring-primary/20" : 
        user.role === 'VP' ? "bg-purple-50 ring-1 ring-purple-200" :
        "bg-white"
      )}>
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className={cn(
            "h-12 w-12 border-2",
            user.role === 'Admin' ? "border-primary/40" : "border-slate-100"
          )}>
            <AvatarImage src={user.profilePicture} className="object-cover" />
            <AvatarFallback className={cn(
              "font-bold",
              user.role === 'Admin' ? "bg-primary text-white" : "bg-primary/10 text-primary"
            )}>
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-primary uppercase tracking-tight truncate">{user.name}</span>
              {user.role === 'Admin' && <Shield className="h-3 w-3 text-primary" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Briefcase className="h-3 w-3" />
              <span className="font-semibold truncate">{user.position || 'Personnel'}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
               <Badge variant="outline" className="text-[9px] font-black uppercase bg-white/50 border-slate-200">
                {user.role || 'Member'}
               </Badge>
               {user.section && user.section !== 'None' && (
                 <span className="text-[9px] text-muted-foreground uppercase font-bold truncate">@{user.section}</span>
               )}
            </div>
          </div>
          {user.children && user.children.length > 0 && (
            <div className="hidden sm:flex flex-col items-center justify-center bg-slate-100 rounded-full h-8 w-8 text-[10px] font-bold">
              {user.children.length}
            </div>
          )}
        </CardContent>
      </Card>

      {user.children && user.children.length > 0 && (
        <div className="space-y-4 pt-2">
          {user.children.map((child: any, idx: number) => (
            <UserNode key={child.id} user={child} depth={depth + 1} isLast={idx === user.children.length - 1} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl rotate-3">
            <Waypoints className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-primary">Table of Organization</h1>
            <p className="text-muted-foreground font-medium">Visualizing functional dependencies and management reporting lines.</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="functional" className="space-y-6">
        <TabsList className="bg-white border shadow-sm p-1 rounded-xl h-12 inline-flex">
          <TabsTrigger value="functional" className="gap-2 px-6 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            <LayoutGrid className="h-4 w-4" /> Functional Tree
          </TabsTrigger>
          <TabsTrigger value="reporting" className="gap-2 px-6 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            <UserCheck className="h-4 w-4" /> Reporting Chart
          </TabsTrigger>
        </TabsList>

        <TabsContent value="functional" className="space-y-8 animate-in slide-in-from-bottom-2">
          {divisions.map((div, divIdx) => (
            <div key={div.id} className="space-y-6 p-6 bg-white rounded-3xl border shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Building2 className="h-48 w-48" />
              </div>

              <div className="flex items-center gap-4 border-b pb-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">{div.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Operational Division</span>
                    <Badge variant="outline" className="text-[9px]">{sections.filter(s => s.divisionId === div.id).length} Sections</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {/* Division Level Staff */}
                {getUsersForDivisionOnly(div.name).length > 0 && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <Shield className="h-3 w-3 text-primary" /> Division Administration
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {getUsersForDivisionOnly(div.name).map(user => (
                        <Card key={user.id} className="border-none shadow-sm bg-primary/[0.03] hover:bg-primary/[0.06] transition-colors">
                          <CardContent className="p-4 flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profilePicture} className="object-cover" />
                              <AvatarFallback className="bg-white text-primary text-xs font-black shadow-sm">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-primary truncate leading-none uppercase">{user.name}</p>
                              <p className="text-[10px] text-muted-foreground font-bold truncate mt-1">{user.position}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sections.filter(s => s.divisionId === div.id).map(sec => (
                    <Card key={sec.id} className="border border-slate-100 shadow-sm bg-slate-50/30 overflow-hidden group">
                      <div className="h-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs font-black uppercase tracking-tight flex items-center gap-2">
                            <LayoutGrid className="h-3 w-3 text-primary" />
                            {sec.name}
                          </CardTitle>
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {getUsersForSection(div.name, sec.name).length} Staff
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        {getUsersForSection(div.name, sec.name).length > 0 ? (
                          getUsersForSection(div.name, sec.name).map(user => (
                            <div key={user.id} className="flex items-center gap-2 py-1.5 border-t border-slate-100 first:border-0">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={user.profilePicture} className="object-cover" />
                                <AvatarFallback className="bg-white border text-[9px] font-black text-primary">
                                  {user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold truncate leading-none">{user.name}</p>
                                <p className="text-[9px] text-muted-foreground truncate">{user.position}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[9px] text-muted-foreground italic py-4 text-center bg-white/50 rounded-lg">
                            Unit personnel pending.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="reporting" className="animate-in slide-in-from-bottom-2">
          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="text-center pb-12 pt-10 bg-slate-50 border-b relative">
              <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <Badge variant="outline" className="bg-white px-4 py-1 font-black text-[10px] tracking-widest uppercase">
                  Confidential Reporting Schema
                </Badge>
              </div>
              <CardTitle className="flex items-center justify-center gap-3 text-3xl font-black text-primary tracking-tighter uppercase">
                <Network className="h-8 w-8" />
                Management Hierarchy
              </CardTitle>
              <CardDescription className="font-medium">
                Comprehensive mapping of functional reporting relationships and command chain.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 md:p-20 overflow-x-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
              <div className="min-w-[400px] max-w-4xl mx-auto space-y-12">
                {/* Board of Directors / Top Level Marker */}
                <div className="flex flex-col items-center mb-12">
                   <div className="px-8 py-3 bg-primary text-white font-black text-sm uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-primary/20">
                     Board of Directors
                   </div>
                   <div className="h-12 w-px border-l-2 border-dashed border-primary/20" />
                </div>

                {hierarchy.map((root: any, idx: number) => (
                  <UserNode key={root.id} user={root} isLast={idx === hierarchy.length - 1} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
