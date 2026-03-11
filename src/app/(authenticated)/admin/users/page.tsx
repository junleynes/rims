"use client";

import React, { useState } from 'react';
import { useSystemData } from '@/components/system-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { Role } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function UserManagementPage() {
  const { users, divisions, sections, addUser, deleteUser } = useSystemData();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: 'Manager' as Role,
    division: '',
    section: ''
  });

  const handleAddUser = () => {
    if (!formData.name || !formData.username) {
      toast({ title: "Validation Error", description: "Name and Username are required.", variant: "destructive" });
      return;
    }
    addUser(formData);
    setFormData({ name: '', username: '', role: 'Manager', division: '', section: '' });
    toast({ title: "User Created", description: "The user account has been successfully generated." });
  };

  const filteredSections = sections.filter(s => {
    const divId = divisions.find(d => d.name === formData.division)?.id;
    return s.divisionId === divId;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">User Management</h1>
        <p className="text-muted-foreground">Manage system users and their organizational access boundaries.</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Create New Account</CardTitle>
          <CardDescription>Assign roles and scope access to specific divisions or sections.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Full Name</Label>
              <Input 
                placeholder="John Doe" 
                value={formData.name} 
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Username</Label>
              <Input 
                placeholder="jdoe" 
                value={formData.username} 
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))} 
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, role: v as Role }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Division</Label>
              <Select 
                value={formData.division} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, division: v, section: '' }))}
              >
                <SelectTrigger><SelectValue placeholder="Select Division" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None (System Wide)</SelectItem>
                  {divisions.map(d => (
                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Section/Unit</Label>
              <Select 
                value={formData.section} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, section: v }))}
                disabled={!formData.division || formData.division === 'None'}
              >
                <SelectTrigger><SelectValue placeholder="Select Section/Unit" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None (Full Division)</SelectItem>
                  {filteredSections.map(s => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddUser} className="w-full gap-2">
                <Plus className="h-4 w-4" /> Create
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Account Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Identity</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Organization Scope</TableHead>
                <TableHead className="text-right">Management</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">{u.name}</span>
                      <span className="text-xs text-muted-foreground">@{u.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {u.role === 'Admin' ? (
                        <Badge variant="default" className="gap-1 px-2 py-0.5"><Shield className="h-3 w-3" /> Admin</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 px-2 py-0.5"><UserIcon className="h-3 w-3" /> Manager</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium">{u.division || 'Unassigned / Global'}</span>
                      {u.section && u.section !== 'None' && (
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Section/Unit: {u.section}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => deleteUser(u.id)}
                      disabled={u.username === 'admin'}
                      title={u.username === 'admin' ? "System root account cannot be deleted" : "Delete User"}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}