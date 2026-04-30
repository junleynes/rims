
"use client";

import React from 'react';
import { useSystemData } from '@/components/system-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Building2, 
  LayoutGrid, 
  User as UserIcon, 
  Shield, 
  ChevronRight, 
  ArrowDown, 
  Users,
  Briefcase,
  UserCheck
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

  const UserNode = ({ user, depth = 0 }: { user: any, depth?: number }) => (
    <div className={cn("space-y-4", depth > 0 && "ml-8 md:ml-12 border-l-2 border-dashed border-primary/20 pl-6")}>
      <Card className={cn(
        "border-none shadow-md hover:shadow-lg transition-all",
        user.role === 'Admin' ? "bg-primary/5" : "bg-white"
      )}>
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm truncate">{user.name}</span>
              {user.role === 'Admin' && <Shield className="h-3 w-3 text-primary" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Briefcase className="h-3 w-3" />
              <span className="truncate">{user.position || 'Employee'}</span>
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:flex text-[10px] font-black uppercase tracking-tighter">
            {user.role}
          </Badge>
        </CardContent>
      </Card>

      {user.children && user.children.length > 0 && (
        <div className="space-y-4">
          {user.children.map((child: any) => (
            <UserNode key={child.id} user={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Table of Organization</h1>
          <p className="text-muted-foreground">Functional and reporting structure of the system.</p>
        </div>
      </div>

      <Tabs defaultValue="functional" className="space-y-6">
        <TabsList className="bg-white border shadow-sm h-12">
          <TabsTrigger value="functional" className="gap-2 px-6">
            <LayoutGrid className="h-4 w-4" /> Functional Tree
          </TabsTrigger>
          <TabsTrigger value="reporting" className="gap-2 px-6">
            <UserCheck className="h-4 w-4" /> Reporting Hierarchy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="functional" className="space-y-6 animate-in slide-in-from-bottom-2">
          {divisions.map((div, divIdx) => (
            <div key={div.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
                  <Building2 className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-black text-primary uppercase tracking-tight">{div.name}</h2>
              </div>

              <div className="grid grid-cols-1 gap-6 ml-6 border-l-2 border-primary/10 pl-6">
                {/* Division Level Staff */}
                {getUsersForDivisionOnly(div.name).length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Users className="h-3 w-3" /> Division Administration
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getUsersForDivisionOnly(div.name).map(user => (
                        <Card key={user.id} className="border-none shadow-sm bg-white/50">
                          <CardContent className="p-3 flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate leading-tight">{user.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{user.position}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sections */}
                {sections.filter(s => s.divisionId === div.id).map(sec => (
                  <div key={sec.id} className="space-y-3">
                    <div className="flex items-center gap-2 text-primary/80">
                      <ChevronRight className="h-4 w-4" />
                      <span className="font-bold text-sm uppercase tracking-tight">{sec.name}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 ml-6">
                      {getUsersForSection(div.name, sec.name).map(user => (
                        <Card key={user.id} className="border-none shadow-sm hover:shadow-md transition-shadow group">
                          <CardContent className="p-3 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                              <UserIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate leading-tight">{user.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{user.position}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {getUsersForSection(div.name, sec.name).length === 0 && (
                        <div className="text-[10px] text-muted-foreground italic px-2">No personnel assigned.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="reporting" className="animate-in slide-in-from-bottom-2">
          <Card className="border-none shadow-lg bg-muted/30">
            <CardHeader className="text-center pb-8 border-b bg-white rounded-t-xl">
              <CardTitle className="flex items-center justify-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Line of Management
              </CardTitle>
              <CardDescription>
                Visualizing the reporting structure from Top Level Management down to Unit Staff.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-12 overflow-x-auto">
              <div className="min-w-[300px] max-w-4xl mx-auto space-y-8">
                {hierarchy.map((root: any) => (
                  <UserNode key={root.id} user={root} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
