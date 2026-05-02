
"use client";

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/components/auth-context';
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
import { Plus, Trash2, Edit2, X, Users, Briefcase, UserCheck } from 'lucide-react';
import { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function MyTeamPage() {
  const { user: currentUser } = useAuth();
  const { users, positions, addUser, updateUser, deleteUser } = useSystemData();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    position: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const isReadOnly = currentUser?.role === 'Viewer';

  const myTeam = useMemo(() => {
    if (!currentUser) return [];
    return users.filter(u => 
      u.reportingTo === currentUser.name || 
      (u.section === currentUser.section && u.id !== currentUser.id)
    );
  }, [users, currentUser]);

  const handleSaveStaff = () => {
    if (isReadOnly) return;
    if (!formData.name || !formData.position) {
      toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" });
      return;
    }

    const payload = {
      name: formData.name,
      position: formData.position,
      division: currentUser?.division,
      section: currentUser?.section,
      reportingTo: currentUser?.name,
      isStaffOnly: true,
    };

    if (editingId) {
      updateUser(editingId, payload);
      setEditingId(null);
      toast({ title: "Staff Updated" });
    } else {
      addUser(payload);
      toast({ title: "Staff Added" });
    }

    setFormData({ name: '', position: '' });
  };

  const handleEdit = (staff: User) => {
    if (isReadOnly) return;
    setEditingId(staff.id);
    setFormData({
      name: staff.name,
      position: staff.position || '',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">My Team</h1>
          <p className="text-muted-foreground">Manage personnel assigned to your section ({currentUser?.section}).</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl text-primary font-bold">
          <Users className="h-5 w-5" />
          <span>{myTeam.length} Personnel</span>
        </div>
      </div>

      {!isReadOnly && (
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              {editingId ? 'Edit Personnel' : 'Add Personnel'}
            </CardTitle>
            <CardDescription>
              Register new team members. Personnel added here do not have system login access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                <Input 
                  placeholder="Staff Member Name" 
                  value={formData.name} 
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Position</Label>
                <Select 
                  value={formData.position} 
                  onValueChange={(v) => setFormData(p => ({ ...p, position: v }))}
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
              <div className="flex gap-2">
                <Button onClick={handleSaveStaff} className="flex-1 gap-2 font-bold h-10">
                  {editingId ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingId ? 'Update Personnel' : 'Add to Team'}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={() => { setEditingId(null); setFormData({ name: '', position: '' }); }} className="h-10">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-base font-bold">Team Roster</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10">
                <TableHead className="font-bold">Personnel Name</TableHead>
                <TableHead className="font-bold">Position</TableHead>
                <TableHead className="font-bold">Managed By</TableHead>
                {!isReadOnly && <TableHead className="text-right font-bold">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {myTeam.length > 0 ? (
                myTeam.map((staff) => (
                  <TableRow key={staff.id} className="group hover:bg-primary/5 transition-colors">
                    <TableCell className="font-bold text-primary">
                      {staff.name}
                      {staff.role && (
                        <Badge variant="secondary" className="ml-2 text-[9px] uppercase tracking-tighter h-4">
                          System {staff.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <Briefcase className="h-3 w-3" />
                        {staff.position || 'Unspecified'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <UserCheck className="h-3 w-3" />
                        {staff.reportingTo || 'N/A'}
                      </div>
                    </TableCell>
                    {!isReadOnly && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleEdit(staff)}
                            className="h-8 w-8 hover:bg-primary/10"
                          >
                            <Edit2 className="h-4 w-4 text-primary" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => deleteUser(staff.id)}
                            className="h-8 w-8 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isReadOnly ? 3 : 4} className="h-32 text-center text-muted-foreground italic">
                    No team members found for this section.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
