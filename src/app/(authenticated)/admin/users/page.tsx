
"use client";

import React, { useState, useRef, useMemo } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
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
import { 
  Plus, 
  Trash2, 
  Shield, 
  User as UserIcon, 
  KeyRound, 
  Briefcase, 
  Edit2, 
  X, 
  UserX, 
  Network, 
  Building2,
  Check,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Upload,
  Download,
  Camera,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Send,
  Search,
  Filter
} from 'lucide-react';
import { Role, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { resetUserPassword, emailUserCredentials } from '@/app/actions/db-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export default function UserManagementPage() {
  const { users = [], divisions = [], sections = [], positions = [], addUser, importUsers, deleteUser, updateUser } = useSystemData();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    contactNumber: '',
    role: 'Manager' as Role,
    division: '',
    section: '',
    position: '',
    reportingTo: '',
    twoFactorEnabled: false,
    isStaffOnly: false,
    profilePicture: ''
  });

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [registrySearch, setRegistrySearch] = useState('');
  const [registryRoleFilter, setRegistryRoleFilter] = useState<'All' | Role | 'StaffOnly'>('All');
  const [registryDivisionFilter, setRegistryDivisionFilter] = useState('All');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDispatchingEmail, setIsDispatchingEmail] = useState<string | null>(null);

  // 2FA Reset State
  const [reset2FADialogOpen, setReset2FADialogOpen] = useState(false);
  const [userFor2FAReset, setUserFor2FAReset] = useState<User | null>(null);
  const [isResetting2FA, setIsResetting2FA] = useState(false);

  const handleAddOrUpdateUser = async () => {
    if (!formData.name) {
      toast({ title: "Validation Error", description: "Name is required.", variant: "destructive" });
      return;
    }

    if (!formData.isStaffOnly) {
      if (!formData.username) {
        toast({ title: "Validation Error", description: "Username is required for system accounts.", variant: "destructive" });
        return;
      }
      
      const usernameExists = users.some(u => 
        u.username?.toLowerCase() === formData.username.toLowerCase() && 
        u.id !== editingUserId
      );
      
      if (usernameExists) {
        toast({ title: "Validation Error", description: "This username is already in use.", variant: "destructive" });
        return;
      }
    }

    const payload = {
      ...formData,
      username: formData.isStaffOnly ? undefined : formData.username,
      role: formData.isStaffOnly ? undefined : formData.role,
      email: formData.email || undefined,
    };

    if (editingUserId) {
      await updateUser(editingUserId, payload);
      setEditingUserId(null);
      toast({ title: "Updated Successfully" });
    } else {
      await addUser(payload);
      toast({ title: "Added Successfully" });
    }
    
    setFormData({ name: '', username: '', email: '', contactNumber: '', role: 'Manager', division: '', section: '', position: '', reportingTo: '', twoFactorEnabled: false, isStaffOnly: false, profilePicture: '' });
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      username: user.username || '',
      email: user.email || '',
      contactNumber: user.contactNumber || '',
      role: user.role || 'Manager',
      division: user.division || '',
      section: user.section || '',
      position: user.position || '',
      reportingTo: user.reportingTo || '',
      twoFactorEnabled: !!user.twoFactorEnabled,
      isStaffOnly: !!user.isStaffOnly,
      profilePicture: user.profilePicture || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setFormData({ name: '', username: '', email: '', contactNumber: '', role: 'Manager', division: '', section: '', position: '', reportingTo: '', twoFactorEnabled: false, isStaffOnly: false, profilePicture: '' });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const initiateReset = (user: User) => {
    setUserToReset(user);
    setNewPasswordInput('');
    setResetDialogOpen(true);
  };

  const handleSendCredentialsEmail = async (user: User) => {
    if (!user.email) {
      toast({ title: "Email Missing", description: "This user does not have a registered email address.", variant: "destructive" });
      return;
    }

    setIsDispatchingEmail(user.id);
    try {
      const result = await emailUserCredentials(user.id);
      if (result.success) {
        toast({ title: "Password Reset & Emailed", description: `A temporary password has been dispatched to ${user.email}.` });
      } else {
        toast({ title: "Email Failed", description: result.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to communicate with email server.", variant: "destructive" });
    } finally {
      setIsDispatchingEmail(null);
    }
  };

  const confirmReset = async () => {
    if (userToReset && newPasswordInput) {
      if (newPasswordInput.length < 8) {
        toast({ title: "Password Too Short", description: "Password must be at least 8 characters.", variant: "destructive" });
        return;
      }
      if (!/[A-Z]/.test(newPasswordInput)) {
        toast({ title: "Password Too Weak", description: "Must include at least one uppercase letter.", variant: "destructive" });
        return;
      }
      if (!/[a-z]/.test(newPasswordInput)) {
        toast({ title: "Password Too Weak", description: "Must include at least one lowercase letter.", variant: "destructive" });
        return;
      }
      if (!/[0-9]/.test(newPasswordInput)) {
        toast({ title: "Password Too Weak", description: "Must include at least one number.", variant: "destructive" });
        return;
      }
      if (!/[^A-Za-z0-9]/.test(newPasswordInput)) {
        toast({ title: "Password Too Weak", description: "Must include at least one special character.", variant: "destructive" });
        return;
      }
      if (newPasswordInput !== confirmPasswordInput) {
        toast({ title: "Passwords Don't Match", description: "New password and confirmation do not match.", variant: "destructive" });
        return;
      }

      setIsResetting(true);
      try {
        await resetUserPassword(userToReset.id, newPasswordInput);
        toast({
          title: "Password Updated",
          description: `The credentials for ${userToReset.name} have been updated successfully.`,
        });
        setResetDialogOpen(false);
        setUserToReset(null);
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      } catch (e) {
        toast({ title: "Error", description: "Failed to update password.", variant: "destructive" });
      } finally {
        setIsResetting(false);
      }
    }
  };

  const initiate2FAReset = (user: User) => {
    setUserFor2FAReset(user);
    setReset2FADialogOpen(true);
  };

  const confirm2FAReset = async () => {
    if (!userFor2FAReset) return;
    setIsResetting2FA(true);
    try {
      // We clear the secret and disable 2FA
      await updateUser(userFor2FAReset.id, { 
        twoFactorEnabled: false, 
        twoFactorSecret: null 
      });
      toast({
        title: "2FA Reset Successful",
        description: `Authenticator security has been removed for ${userFor2FAReset.name}.`,
      });
      setReset2FADialogOpen(false);
      setUserFor2FAReset(null);
    } catch (e) {
      toast({ title: "Error", description: "Failed to reset 2FA.", variant: "destructive" });
    } finally {
      setIsResetting2FA(false);
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) throw new Error("File is empty or missing data.");

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const importedData: Omit<User, 'id'>[] = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];
            
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index];
            });

            const isStaffOnly = !row['Username'] || row['Is Staff Only']?.toLowerCase() === 'true';

            return {
              name: row['Name'] || 'Imported Personnel',
              username: isStaffOnly ? undefined : row['Username'],
              email: row['Email'] || '',
              contactNumber: row['Contact Number'] || '',
              role: (row['Role'] as Role) || 'Manager',
              division: row['Division'] || '',
              section: row['Section'] || '',
              position: row['Position'] || '',
              reportingTo: row['Reporting To'] || '',
              twoFactorEnabled: row['2FA Enabled']?.toLowerCase() === 'true',
              isStaffOnly: isStaffOnly,
              profilePicture: ''
            };
          });

        importUsers(importedData);
        toast({
          title: "Import Successful",
          description: `${importedData.length} personnel records have been added to the registry.`,
        });
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        toast({
          title: "Import Failed",
          description: "Check if the CSV format is correct.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    if (users.length === 0) return;

    const headers = [
      "Name",
      "Email",
      "Contact Number",
      "Username",
      "Role",
      "Position",
      "Division",
      "Section",
      "Reporting To",
      "2FA Enabled",
      "Is Staff Only"
    ];

    const rows = users.map(u => [
      `"${u.name || ''}"`,
      `"${u.email || ''}"`,
      `"${u.contactNumber || ''}"`,
      `"${u.username || ''}"`,
      `"${u.role || ''}"`,
      `"${u.position || ''}"`,
      `"${u.division || ''}"`,
      `"${u.section || ''}"`,
      `"${u.reportingTo || ''}"`,
      u.twoFactorEnabled ? "true" : "false",
      u.isStaffOnly ? "true" : "false"
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rims-personnel-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Personnel registry has been downloaded as CSV.",
    });
  };

  const triggerImport = () => {
    toast({
      title: "CSV Header Requirement",
      description: "Required: Name, Email, Contact Number, Username, Role, Position, Division, Section, Reporting To.",
      duration: 8000,
    });
    fileInputRef.current?.click();
  };

  const filteredSections = sections.filter(s => {
    const divId = divisions.find(d => d.name === formData.division)?.id;
    return s.divisionId === divId;
  });

  const getRoleBadge = (role: Role | undefined) => {
    if (!role) return null;
    switch (role) {
      case 'Admin': return <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary"><Shield className="h-3 w-3" /> Admin</Badge>;
      case 'VP': return <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-700"><Building2 className="h-3 w-3" /> VP</Badge>;
      case 'AVP': return <Badge variant="secondary" className="gap-1 bg-indigo-100 text-indigo-700"><Network className="h-3 w-3" /> AVP</Badge>;
      case 'Manager': return <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700"><UserIcon className="h-3 w-3" /> Manager</Badge>;
      case 'Viewer': return <Badge variant="secondary" className="gap-1 bg-slate-100 text-slate-700"><Eye className="h-3 w-3" /> Viewer</Badge>;
    }
  };

  const filteredUsers = useMemo(() => {
    const term = registrySearch.trim().toLowerCase();
    return users.filter(u => {
      const matchesSearch = !term ||
        u.name.toLowerCase().includes(term) ||
        (u.username || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.position || '').toLowerCase().includes(term) ||
        (u.contactNumber || '').toLowerCase().includes(term);

      const matchesRole =
        registryRoleFilter === 'All' ||
        (registryRoleFilter === 'StaffOnly' ? u.isStaffOnly : (!u.isStaffOnly && u.role === registryRoleFilter));

      const matchesDivision = registryDivisionFilter === 'All' || u.division === registryDivisionFilter;

      return matchesSearch && matchesRole && matchesDivision;
    });
  }, [users, registrySearch, registryRoleFilter, registryDivisionFilter]);

  const hasActiveRegistryFilters = !!registrySearch || registryRoleFilter !== 'All' || registryDivisionFilter !== 'All';

  const clearRegistryFilters = () => {
    setRegistrySearch('');
    setRegistryRoleFilter('All');
    setRegistryDivisionFilter('All');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">System Registry</h1>
            <p className="text-muted-foreground font-medium">Manage system users and organizational personnel records.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv" 
            onChange={handleImportCSV} 
          />
          <Button variant="outline" onClick={handleExportCSV} className="gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={triggerImport} className="gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold">
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{editingUserId ? 'Modify Entry' : 'New Personnel/Account'}</CardTitle>
              <CardDescription>
                Define if this person has system access or is strictly for organizational tracking.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3 bg-muted/50 p-2 px-3 rounded-lg border">
                <Label className="text-[10px] font-black uppercase tracking-tight">Staff Only</Label>
                <Switch 
                  checked={formData.isStaffOnly} 
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, isStaffOnly: v }))} 
                />
              </div>
              {!formData.isStaffOnly && (
                <div className="flex items-center gap-3 bg-amber-50 p-2 px-3 rounded-lg border border-amber-200 animate-in fade-in zoom-in-95">
                  <Label className="text-[10px] font-black uppercase tracking-tight text-amber-900">Force 2FA</Label>
                  <Switch 
                    checked={formData.twoFactorEnabled} 
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, twoFactorEnabled: v }))} 
                  />
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center gap-4 shrink-0">
               <div className="relative group">
                 <Avatar className="h-32 w-32 border-4 border-slate-100 shadow-md">
                   <AvatarImage src={formData.profilePicture} className="object-cover" />
                   <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-black">
                     {formData.name?.charAt(0) || <UserIcon className="h-10 w-10" />}
                   </AvatarFallback>
                 </Avatar>
                 <button 
                  className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                  onClick={() => photoInputRef.current?.click()}
                 >
                   <Camera className="h-4 w-4" />
                 </button>
                 <input 
                  type="file" 
                  ref={photoInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handlePhotoChange} 
                 />
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Profile Photo</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
              <div className="space-y-1">
                <Label className="text-xs">Full Name</Label>
                <Input 
                  placeholder="Name" 
                  value={formData.name} 
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Email Address</Label>
                <div className="relative">
                  <Input 
                    placeholder="email@example.com" 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} 
                  />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Contact Number</Label>
                <div className="relative">
                  <Input 
                    placeholder="+63 XXX XXX XXXX" 
                    value={formData.contactNumber} 
                    onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))} 
                  />
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              {!formData.isStaffOnly && (
                <>
                  <div className="space-y-1 animate-in slide-in-from-left-2">
                    <Label className="text-xs">Username</Label>
                    <Input 
                      placeholder="jdoe" 
                      value={formData.username} 
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))} 
                    />
                  </div>
                  <div className="space-y-1 animate-in slide-in-from-left-2">
                    <Label className="text-xs">System Role</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, role: v as Role }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin (Global)</SelectItem>
                        <SelectItem value="VP">VP (Department-wide)</SelectItem>
                        <SelectItem value="AVP">AVP (Division-wide)</SelectItem>
                        <SelectItem value="Manager">Manager (Section-wide)</SelectItem>
                        <SelectItem value="Viewer">Viewer (Read-only for all)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <Label className="text-xs">Position</Label>
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
                <Label className="text-xs">Division</Label>
                <Select 
                  value={formData.division} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, division: v, section: '' }))}
                >
                  <SelectTrigger><SelectValue placeholder="Division" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
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
                  <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    {filteredSections.map(s => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
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
                  <SelectTrigger><SelectValue placeholder="Manager" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    {users.filter(u => u.id !== editingUserId).map(u => (
                      <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            {editingUserId && (
              <Button variant="outline" onClick={cancelEdit} className="gap-2 px-8">
                <X className="h-4 w-4" /> Cancel
              </Button>
            )}
            <Button onClick={handleAddOrUpdateUser} className="gap-2 px-8 font-bold">
              {editingUserId ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingUserId ? 'Update Entry' : 'Create Entry'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Personnel & Account Registry</CardTitle>
          <CardDescription>
            Showing {filteredUsers.length} of {users.length} {users.length === 1 ? 'entry' : 'entries'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, username, email, position..."
                className="pl-9"
                value={registrySearch}
                onChange={(e) => setRegistrySearch(e.target.value)}
              />
            </div>
            <Select value={registryRoleFilter} onValueChange={(v) => setRegistryRoleFilter(v as typeof registryRoleFilter)}>
              <SelectTrigger className="w-full md:w-[160px] gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="VP">VP</SelectItem>
                <SelectItem value="AVP">AVP</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
                <SelectItem value="StaffOnly">Staff Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={registryDivisionFilter} onValueChange={setRegistryDivisionFilter}>
              <SelectTrigger className="w-full md:w-[180px] gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Divisions</SelectItem>
                {divisions.map(d => (
                  <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveRegistryFilters && (
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={clearRegistryFilters}>
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identity</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Security</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Org Scope</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                    No personnel match your search or filters.
                  </TableCell>
                </TableRow>
              )}
              {filteredUsers.map((u) => (
                <TableRow key={u.id} className={editingUserId === u.id ? "bg-primary/5" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border shadow-sm">
                        <AvatarImage src={u.profilePicture} className="object-cover" />
                        <AvatarFallback className="text-[10px] font-black uppercase bg-primary/5 text-primary">
                          {u.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-primary">{u.name}</span>
                        {u.username && <span className="text-[10px] text-muted-foreground uppercase font-black">@{u.username}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> {u.email || 'N/A'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                        Phone: {u.contactNumber || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      {u.isStaffOnly ? (
                        <Badge variant="outline" className="gap-1 text-[10px] border-amber-200 text-amber-700 bg-amber-50 uppercase font-black">
                          <UserX className="h-3 w-3" /> Staff Only
                        </Badge>
                      ) : (
                        <>
                          {getRoleBadge(u.role)}
                          <div className="flex items-center gap-1">
                            {u.twoFactorEnabled ? (
                              u.twoFactorSecret ? (
                                <Badge variant="outline" className="text-[8px] bg-emerald-50 text-emerald-700 border-emerald-200 uppercase font-black gap-1">
                                  <ShieldCheck className="h-2.5 w-2.5" /> 2FA Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[8px] bg-amber-50 text-amber-700 border-amber-200 uppercase font-black gap-1 animate-pulse">
                                  <ShieldAlert className="h-2.5 w-2.5" /> Setup Pending
                                </Badge>
                              )
                            ) : (
                              <Badge variant="outline" className="text-[8px] opacity-40 uppercase font-black">2FA Off</Badge>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-600">
                    {u.position || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold">{u.division || 'Global'}</span>
                      {u.section && u.section !== 'None' && (
                        <span className="text-[9px] text-muted-foreground uppercase tracking-tight">{u.section}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!u.isStaffOnly && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          title="Reset Password & Email Credentials" 
                          onClick={() => handleSendCredentialsEmail(u)} 
                          disabled={isDispatchingEmail === u.id || !u.email}
                          className="h-8 w-8 hover:bg-blue-100"
                        >
                          {isDispatchingEmail === u.id ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <Send className="h-4 w-4 text-blue-600" />}
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" title="Edit Personnel" onClick={() => handleEditUser(u)} className="h-8 w-8 hover:bg-primary/10">
                        <Edit2 className="h-4 w-4 text-primary" />
                      </Button>
                      {!u.isStaffOnly && (
                        <>
                          <Button size="icon" variant="ghost" title="Manual Password Set" onClick={() => initiateReset(u)} className="h-8 w-8 hover:bg-primary/10">
                            <KeyRound className="h-4 w-4 text-primary" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            title="Reset 2FA"
                            onClick={() => initiate2FAReset(u)} 
                            disabled={!u.twoFactorEnabled && !u.twoFactorSecret}
                            className="h-8 w-8 hover:bg-amber-100"
                          >
                            <ShieldOff className={cn("h-4 w-4", (u.twoFactorEnabled || u.twoFactorSecret) ? "text-amber-600" : "text-muted-foreground/30")} />
                          </Button>
                        </>
                      )}
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        title="Delete Entry"
                        onClick={() => deleteUser(u.id)} 
                        disabled={u.username === 'admin'}
                        className="h-8 w-8 hover:bg-destructive/10"
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

      <Dialog open={resetDialogOpen} onOpenChange={(open) => {
        setResetDialogOpen(open);
        if (!open) {
          setNewPasswordInput('');
          setConfirmPasswordInput('');
          setShowNewPassword(false);
          setShowConfirmPassword(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update User Password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{userToReset?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  autoFocus
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Complexity meter */}
            {newPasswordInput.length > 0 && (() => {
              const checks = [
                { label: 'At least 8 characters', ok: newPasswordInput.length >= 8 },
                { label: 'Uppercase letter (A–Z)', ok: /[A-Z]/.test(newPasswordInput) },
                { label: 'Lowercase letter (a–z)', ok: /[a-z]/.test(newPasswordInput) },
                { label: 'Number (0–9)', ok: /[0-9]/.test(newPasswordInput) },
                { label: 'Special character (!@#$…)', ok: /[^A-Za-z0-9]/.test(newPasswordInput) },
              ];
              const passed = checks.filter(c => c.ok).length;
              const strength = passed <= 2 ? 'Weak' : passed <= 3 ? 'Fair' : passed === 4 ? 'Good' : 'Strong';
              const colors = { Weak: 'bg-red-500', Fair: 'bg-amber-400', Good: 'bg-blue-500', Strong: 'bg-emerald-500' };
              return (
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Strength</span>
                    <span className={`text-xs font-black ${passed <= 2 ? 'text-red-500' : passed <= 3 ? 'text-amber-500' : passed === 4 ? 'text-blue-500' : 'text-emerald-500'}`}>{strength}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= passed ? colors[strength] : 'bg-muted'}`} />
                    ))}
                  </div>
                  <div className="space-y-1 mt-2">
                    {checks.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {c.ok
                          ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          : <XCircle className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
                        <span className={c.ok ? 'text-emerald-700' : 'text-muted-foreground'}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPasswordInput.length > 0 && (
                <p className={`text-xs flex items-center gap-1 ${newPasswordInput === confirmPasswordInput ? 'text-emerald-600' : 'text-red-500'}`}>
                  {newPasswordInput === confirmPasswordInput
                    ? <><CheckCircle2 className="h-3 w-3" /> Passwords match</>
                    : <><XCircle className="h-3 w-3" /> Passwords do not match</>}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)} disabled={isResetting}>
              Cancel
            </Button>
            <Button
              onClick={confirmReset}
              disabled={isResetting || !newPasswordInput || !confirmPasswordInput}
              className="bg-primary hover:bg-primary/90 font-bold"
            >
              {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
              Set New Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={reset2FADialogOpen} onOpenChange={setReset2FADialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-amber-600" />
              Reset Authenticator (2FA)
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the current Google Authenticator link for <strong>{userFor2FAReset?.name}</strong>. 
              The user will be able to log in with just their password. Use this if the user has lost their mobile device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting2FA}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); confirm2FAReset(); }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              disabled={isResetting2FA}
            >
              {isResetting2FA ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldOff className="h-4 w-4 mr-2" />}
              Reset 2FA Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
