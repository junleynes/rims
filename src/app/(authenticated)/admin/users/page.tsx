
"use client";

import React, { useState, useRef } from 'react';
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
  Mail,
  Phone,
  Upload,
  Download,
  Camera,
  Loader2
} from 'lucide-react';
import { Role, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { resetUserPassword } from '@/app/actions/db-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleAddOrUpdateUser = () => {
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
      updateUser(editingUserId, payload);
      setEditingUserId(null);
      toast({ title: "Updated Successfully" });
    } else {
      addUser(payload);
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

  const confirmReset = async () => {
    if (userToReset && newPasswordInput) {
      if (newPasswordInput.length < 4) {
        toast({ title: "Security Warning", description: "Password should be at least 4 characters.", variant: "destructive" });
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
      } catch (e) {
        toast({ title: "Error", description: "Failed to update password.", variant: "destructive" });
      } finally {
        setIsResetting(false);
      }
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
          description: "Check if the CSV format is correct. Headers: Name, Email, Contact Number, Username, Role, Position, Division, Section, Reporting To",
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
      description: "Required: Name, Email, Contact Number, Username, Role, Position, Division, Section, Reporting To. Username is optional for staff-only entries.",
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">System Registry</h1>
          <p className="text-muted-foreground">Manage system users and organizational personnel records.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv" 
            onChange={handleImportCSV} 
          />
          <Button variant="outline" onClick={handleExportCSV} className="gap-2 border-primary/20 hover:bg-primary/5 text-primary">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={triggerImport} className="gap-2 border-primary/20 hover:bg-primary/5 text-primary">
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
            <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg border">
              <Label className="text-xs font-bold uppercase tracking-tight">Staff Only (No Login)</Label>
              <Switch 
                checked={formData.isStaffOnly} 
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, isStaffOnly: v }))} 
              />
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identity</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Org Scope</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
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
                        <Phone className="h-3 w-3" /> {u.contactNumber || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.isStaffOnly ? (
                      <Badge variant="outline" className="gap-1 text-[10px] border-amber-200 text-amber-700 bg-amber-50 uppercase font-black">
                        <UserX className="h-3 w-3" /> Staff Only
                      </Badge>
                    ) : (
                      getRoleBadge(u.role)
                    )}
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
                      <Button size="icon" variant="ghost" onClick={() => handleEditUser(u)} className="h-8 w-8 hover:bg-primary/10">
                        <Edit2 className="h-4 w-4 text-primary" />
                      </Button>
                      {!u.isStaffOnly && (
                        <Button size="icon" variant="ghost" onClick={() => initiateReset(u)} className="h-8 w-8 hover:bg-primary/10">
                          <KeyRound className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      <Button 
                        size="icon" 
                        variant="ghost" 
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

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update User Password</DialogTitle>
            <DialogDescription>
              Enter a new temporary password for <strong>{userToReset?.name}</strong>. 
              The user will need to use this for their next login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password"
                type="text"
                placeholder="Enter new password"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground">Minimum 4 characters recommended.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)} disabled={isResetting}>
              Cancel
            </Button>
            <Button 
              onClick={confirmReset} 
              disabled={isResetting || !newPasswordInput} 
              className="bg-primary hover:bg-primary/90 font-bold"
            >
              {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
              Set New Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
