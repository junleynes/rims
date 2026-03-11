
"use client";

import React, { useState } from 'react';
import { useSystemData } from '@/components/system-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    if (!formData.name || !formData.username) return;
    addUser(formData);
    setFormData({ name: '', username: '', role: 'Manager', division: '', section: '' });
    toast({ title: "User Created" });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">User Management</h1>
        <p className="text-muted-foreground">Manage system users and access roles.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
          <CardDescription>Create a new account with specific organizational scope.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                onValueChange={(v) => setFormData(prev => ({ ...prev, division: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  {divisions.map(d => (
                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddUser} className="w-full gap-2">
                <Plus className="h-4 w-4" /> Create User
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Division/Section</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold">{u.name}</span>
                      <span className="text-xs text-muted-foreground">@{u.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {u.role === 'Admin' ? <Shield className="h-3 w-3 text-primary" /> : <UserIcon className="h-3 w-3" />}
                      {u.role}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {u.division || 'All Divisions'}
                    {u.section && ` / ${u.section}`}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => deleteUser(u.id)}
                      disabled={u.username === 'admin'}
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
