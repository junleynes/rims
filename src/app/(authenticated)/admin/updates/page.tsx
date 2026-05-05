"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, X, Send, Megaphone, Info, AlertTriangle, Sparkles, User as UserIcon } from 'lucide-react';
import { SystemUpdate, UpdateType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { fetchSystemUpdates, saveSystemUpdates } from '@/app/actions/db-actions';
import { format } from 'date-fns';

export default function AdminUpdatesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'Info' as UpdateType,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await fetchSystemUpdates();
      setUpdates(data);
      setIsLoading(false);
    }
    load();
  }, []);

  const handleSaveUpdate = async () => {
    if (!formData.title || !formData.content) {
      toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" });
      return;
    }

    const newUpdates = [...updates];
    if (editingId) {
      const idx = newUpdates.findIndex(u => u.id === editingId);
      if (idx !== -1) {
        newUpdates[idx] = {
          ...newUpdates[idx],
          ...formData,
        };
      }
      setEditingId(null);
    } else {
      const newUpdate: SystemUpdate = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        createdBy: user?.name || 'Admin',
        createdAt: new Date().toISOString(),
      };
      newUpdates.unshift(newUpdate);
    }

    setUpdates(newUpdates);
    await saveSystemUpdates(newUpdates);
    setFormData({ title: '', content: '', type: 'Info' });
    toast({ title: "Update Published", description: "The system announcement has been saved." });
  };

  const handleDeleteUpdate = async (id: string) => {
    const newUpdates = updates.filter(u => u.id !== id);
    setUpdates(newUpdates);
    await saveSystemUpdates(newUpdates);
    toast({ title: "Update Removed" });
  };

  const handleEdit = (update: SystemUpdate) => {
    setEditingId(update.id);
    setFormData({
      title: update.title,
      content: update.content,
      type: update.type,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getBadge = (type: UpdateType) => {
    switch (type) {
      case 'Alert': return <Badge className="bg-red-500 gap-1"><AlertTriangle className="h-3 w-3" /> Alert</Badge>;
      case 'Feature': return <Badge className="bg-emerald-500 gap-1"><Sparkles className="h-3 w-3" /> Feature</Badge>;
      default: return <Badge className="bg-blue-500 gap-1"><Info className="h-3 w-3" /> Info</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
          <Megaphone className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary">System Announcements</h1>
          <p className="text-muted-foreground">Post updates, maintenance alerts, or new feature releases to all users.</p>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Announcement' : 'Post New Update'}</CardTitle>
          <CardDescription>This will be visible on the main dashboard for all system users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-2">
              <Label>Headline / Title</Label>
              <Input 
                placeholder="e.g. FY 2027 Budget Encoding Now Open" 
                value={formData.title}
                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Update Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v) => setFormData(p => ({ ...p, type: v as UpdateType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Info">General Info</SelectItem>
                  <SelectItem value="Alert">Critical Alert</SelectItem>
                  <SelectItem value="Feature">New Feature</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4 space-y-2">
              <Label>Content</Label>
              <Textarea 
                placeholder="Details of the announcement..." 
                className="min-h-[120px]"
                value={formData.content}
                onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            {editingId && (
              <Button variant="outline" onClick={() => { setEditingId(null); setFormData({ title: '', content: '', type: 'Info' }); }}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
            )}
            <Button onClick={handleSaveUpdate} className="gap-2 px-8">
              <Send className="h-4 w-4" /> {editingId ? 'Update Post' : 'Publish Announcement'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Broadcast History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Headline</TableHead>
                <TableHead>Date Posted</TableHead>
                <TableHead>Author</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {updates.length > 0 ? (
                updates.map((update) => (
                  <TableRow key={update.id} className={editingId === update.id ? "bg-primary/5" : ""}>
                    <TableCell>{getBadge(update.type)}</TableCell>
                    <TableCell className="font-bold max-w-[300px] truncate">{update.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(update.createdAt), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-1.5 text-xs font-semibold">
                         <UserIcon className="h-3 w-3 text-muted-foreground" />
                         {update.createdBy}
                       </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(update)}>
                          <Edit2 className="h-4 w-4 text-primary" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteUpdate(update.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                    No announcements posted yet.
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
