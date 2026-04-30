
"use client";

import React, { useState, useEffect } from 'react';
import { useSystemData } from '@/components/system-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Shield, User as UserIcon, Lock, Unlock, KeyRound, UserCheck, Briefcase, Edit2, X } from 'lucide-react';
import { Role, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function UserManagementPage() {
  const { users, divisions, sections, positions, addUser, deleteUser, updateUser } = useSystemData();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: 'Manager' as Role,
    division: '',
    section: '',
    position: '',
    reportingTo: '',
    twoFactorEnabled: true
  });

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);

  const handleAddOrUpdateUser = () => {
    if (!formData.name || !formData.username) {
      toast({ title: "Validation Error", description: "Name and Username are required.", variant: "destructive" });
      return;
    }

    if (editingUserId) {
      updateUser(editingUserId, formData);
      setEditingUserId(null);
      toast({ title: "User Updated", description: "Account details have been successfully modified." });
    } else {
      addUser(formData);
      toast({ title: "User Created", description: "The user account has been successfully generated." });
    }
    
    setFormData({ name: '', username: '', role: 'Manager', division: '', section: '', position: '', reportingTo: '', twoFactorEnabled: true });
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      username: user.username,
      role: user.role,
      division: user.division || '',
      section: user.section || '',
      position: user.position || '',
      reportingTo: user.reportingTo || '',
      twoFactorEnabled: !!user.twoFactorEnabled
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setFormData({ name: '', username: '', role: 'Manager', division: '', section: '', position: '', reportingTo: '', twoFactorEnabled: true });
  };

  const toggle2FA = (userId: string, currentStatus: boolean) => {
    updateUser(userId, { twoFactorEnabled: !currentStatus });
    toast({ 
      title: !currentStatus ? "2FA Enabled" : "2FA Disabled", 
      description: `Two-factor authentication has been ${!currentStatus ? 'enabled' : 'disabled'} for this user.` 
    });
  };

  const initiateReset = (user: User) => {
    setUserToReset(user);
    setResetDialogOpen(true);
  };

  const confirmReset = () => {
    if (userToReset) {
      toast({
        title: "Password Reset Successful",
        description: `Password for ${userToReset.name} (@${userToReset.username}) has been reset to system default: 'password'`,
      });
    }
    setResetDialogOpen(false);
    setUserToReset(null);
  };

  const filteredSections = sections.filter(s => {
    const divId = divisions.find(d => d.name === formData.division)?.id;
    return s.divisionId === divId;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">User Management</h1>
        <p className="text-muted-foreground">Manage system users, their organizational boundaries, and security settings.</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>{editingUserId ? 'Edit Account' : 'Create New Account'}</CardTitle>
          <CardDescription>
            {editingUserId ? 'Modify existing account properties and access levels.' : 'Assign roles and scope access to specific divisions or sections.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
              <Label className="text-xs">Position / Job Title</Label>
              <Select 
                value={formData.position} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, position: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map(pos => (
                    <SelectItem key={pos.id} value={pos.name}>{pos.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Reporting To</Label>
              <Select 
                value={formData.reportingTo} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, reportingTo: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  {users.filter(u => u.id !== editingUserId).map(u => (
                    <SelectItem key={u.id} value={u.name}>{u.name} (@{u.username})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="space-y-1 flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <Switch 
                  checked={formData.twoFactorEnabled} 
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, twoFactorEnabled: checked }))} 
                />
                <Label className="text-xs">Enable 2FA Security</Label>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            {editingUserId && (
              <Button variant="outline" onClick={cancelEdit} className="gap-2 px-8">
                <X className="h-4 w-4" /> Cancel Edit
              </Button>
            )}
            <Button onClick={handleAddOrUpdateUser} className="gap-2 px-8">
              {editingUserId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingUserId ? 'Update Account' : 'Create Account'}
            </Button>
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
                <TableHead>Position & Role</TableHead>
                <TableHead>Organization Scope</TableHead>
                <TableHead>Reporting Structure</TableHead>
                <TableHead className="text-center">2FA</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className={editingUserId === u.id ? "bg-primary/5" : ""}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">{u.name}</span>
                      <span className="text-xs text-muted-foreground">@{u.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                        <Briefcase className="h-3 w-3" /> {u.position || 'Unspecified Position'}
                      </div>
                      <div className="flex items-center gap-2">
                        {u.role === 'Admin' ? (
                          <Badge variant="default" className="gap-1 px-2 py-0.5"><Shield className="h-3 w-3" /> Admin</Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 px-2 py-0.5"><UserIcon className="h-3 w-3" /> Manager</Badge>
                        )}
                      </div>
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
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>{u.reportingTo || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch 
                        checked={!!u.twoFactorEnabled} 
                        onCheckedChange={() => toggle2FA(u.id, !!u.twoFactorEnabled)}
                      />
                      {u.twoFactorEnabled ? (
                        <Lock className="h-4 w-4 text-green-500" title="2FA Active" />
                      ) : (
                        <Unlock className="h-4 w-4 text-muted-foreground" title="2FA Disabled" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleEditUser(u)}
                        title="Edit User"
                        className="hover:bg-primary/10"
                      >
                        <Edit2 className="h-4 w-4 text-primary" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => initiateReset(u)}
                        title="Reset Password"
                        className="hover:bg-primary/10"
                      >
                        <KeyRound className="h-4 w-4 text-primary" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => deleteUser(u.id)}
                        disabled={u.username === 'admin'}
                        title={u.username === 'admin' ? "System root account cannot be deleted" : "Delete User"}
                        className="hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset User Password?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the password for <strong>{userToReset?.name}</strong> to the system default: <code className="bg-muted px-1.5 py-0.5 rounded font-bold">password</code>. 
              The user will need to use this password for their next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset} className="bg-primary hover:bg-primary/90">
              Confirm Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
