"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth-context';
import { useSystemData } from '@/components/system-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  FileText, Search, Upload, Download, Trash2, File,
  BookOpen, Plus, X, FileCode, Loader2, Sparkles, FilePlus2,
  CheckCircle2, Pencil, RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchKnowledgeBaseEntries } from '@/app/actions/db-actions';
import { generateContentFromTitle } from '@/app/actions/ai-autofill-action';
import { KnowledgeBaseEntry } from '@/lib/types';
import { deleteFile, getFileUrl } from '@/lib/file-upload';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const { systemConfig } = useSystemData();
  const { toast } = useToast();
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const editFileRef     = useRef<HTMLInputElement>(null);

  const [entries, setEntries]             = useState<KnowledgeBaseEntry[]>([]);
  const [search, setSearch]               = useState('');
  const [isLoading, setIsLoading]         = useState(true);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [isPublishing, setIsPublishing]   = useState(false);
  const [isDeleting, setIsDeleting]       = useState(false);
  const [isSaving, setIsSaving]           = useState(false);
  const [showForm, setShowForm]           = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  // New entry form
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [pickedFile, setPickedFile]   = useState<File | null>(null);   // held locally, NOT uploaded yet

  // Edit modal
  const [editEntry, setEditEntry]           = useState<KnowledgeBaseEntry | null>(null);
  const [editTitle, setEditTitle]           = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPickedFile, setEditPickedFile] = useState<File | null>(null);  // optional replacement file
  const [isEditGenerating, setIsEditGenerating] = useState(false);

  const isAdmin   = user?.role === 'Admin';
  const MAX_BYTES = (systemConfig.maxUploadSize || 20) * 1024 * 1024;

  useEffect(() => { loadEntries(); }, []);

  async function loadEntries() {
    setIsLoading(true);
    try { setEntries(await fetchKnowledgeBaseEntries()); }
    catch { toast({ title: 'Load Error', description: 'Failed to load entries.', variant: 'destructive' }); }
    finally { setIsLoading(false); }
  }

  function resetForm() {
    setTitle(''); setDescription(''); setPickedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ── Upload helper — called only at publish/save time ─────────────────────
  async function uploadFileToDisk(file: File, folder: string) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    const res  = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || `Upload failed (${res.status})`);
    return data as { fileName: string; fileType: string; filePath: string };
  }

  // ── Pick file (just hold in state, no upload yet) ─────────────────────────
  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast({ title: 'File too large', description: `Max size is ${systemConfig.maxUploadSize || 20} MB.`, variant: 'destructive' });
      e.target.value = '';
      return;
    }
    setPickedFile(file);
    toast({ title: 'File selected', description: `${file.name} — press Publish to upload and save.` });
  }

  function handleEditFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast({ title: 'File too large', description: `Max size is ${systemConfig.maxUploadSize || 20} MB.`, variant: 'destructive' });
      e.target.value = '';
      return;
    }
    setEditPickedFile(file);
    toast({ title: 'Replacement file selected', description: `${file.name} — press Save to apply.` });
  }

  // ── Publish: upload file then save entry to DB ────────────────────────────
  async function handlePublish() {
    if (!title.trim()) {
      toast({ title: 'Title required', description: 'Please enter a document title.', variant: 'destructive' });
      return;
    }
    if (!pickedFile) {
      toast({ title: 'No file selected', description: 'Please select a file to upload.', variant: 'destructive' });
      return;
    }

    setIsPublishing(true);
    try {
      // Upload file NOW (only when user presses Publish)
      const uploaded = await uploadFileToDisk(pickedFile, 'knowledge-base');

      const payload: KnowledgeBaseEntry = {
        id:          generateId(),
        title:       title.trim(),
        description: description.trim(),
        fileName:    uploaded.fileName,
        fileType:    uploaded.fileType,
        filePath:    uploaded.filePath,
        uploadedBy:  user?.name || 'Admin',
        createdAt:   new Date().toISOString(),
      };

      const res  = await fetch('/api/knowledge-base', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Server error (${res.status})`);

      toast({ title: 'Published', description: 'Document is now available to all users.' });
      resetForm();
      setShowForm(false);
      await loadEntries();
    } catch (err: any) {
      console.error('Publish error:', err);
      toast({ title: 'Publish Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsPublishing(false);
    }
  }

  // ── Open edit modal ───────────────────────────────────────────────────────
  function openEdit(entry: KnowledgeBaseEntry) {
    setEditEntry(entry);
    setEditTitle(entry.title);
    setEditDescription(entry.description || '');
    setEditPickedFile(null);
    if (editFileRef.current) editFileRef.current.value = '';
  }

  // ── Save edit: optionally upload new file, then PATCH entry ──────────────
  async function handleSaveEdit() {
    if (!editEntry) return;
    if (!editTitle.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      let fileName = editEntry.fileName;
      let fileType = editEntry.fileType;
      let filePath = editEntry.filePath;

      // If user picked a replacement file, upload it now
      if (editPickedFile) {
        const uploaded = await uploadFileToDisk(editPickedFile, 'knowledge-base');
        // Delete old file from disk (best effort)
        if (editEntry.filePath && !editEntry.filePath.startsWith('data:')) {
          await deleteFile(editEntry.filePath).catch(() => {});
        }
        fileName = uploaded.fileName;
        fileType = uploaded.fileType;
        filePath = uploaded.filePath;
      }

      const updated: KnowledgeBaseEntry = {
        ...editEntry,
        title:       editTitle.trim(),
        description: editDescription.trim(),
        fileName, fileType, filePath,
      };

      const res  = await fetch('/api/knowledge-base', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Server error (${res.status})`);

      toast({ title: 'Updated', description: 'Document details saved.' });
      setEditEntry(null);
      await loadEntries();
    } catch (err: any) {
      toast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!entryToDelete) return;
    setIsDeleting(true);
    try {
      const entry = entries.find(e => e.id === entryToDelete);
      if (entry?.filePath && !entry.filePath.startsWith('data:')) {
        await deleteFile(entry.filePath).catch(() => {});
      }
      const res  = await fetch('/api/knowledge-base', {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entryToDelete }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Server error (${res.status})`);
      toast({ title: 'Deleted', description: 'Document removed.' });
      await loadEntries();
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setEntryToDelete(null);
    }
  }

  // ── AI description ────────────────────────────────────────────────────────
  async function handleGenerate(forEdit = false) {
    const t = forEdit ? editTitle : title;
    if (!t.trim()) { toast({ title: 'Add a title first', variant: 'destructive' }); return; }
    forEdit ? setIsEditGenerating(true) : setIsGenerating(true);
    const result = await generateContentFromTitle({ title: t, context: 'knowledge-base' });
    forEdit ? setIsEditGenerating(false) : setIsGenerating(false);
    if (result.content) {
      forEdit ? setEditDescription(result.content) : setDescription(result.content);
      toast({ title: 'Description generated' });
    } else {
      toast({ title: 'Generation failed', description: result.error, variant: 'destructive' });
    }
  }

  function downloadFile(entry: KnowledgeBaseEntry) {
    const link = document.createElement('a');
    // Pass original fileName so the serve route sends the correct Content-Disposition
    link.href = getFileUrl(entry.filePath, entry.fileName);
    link.download = entry.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredEntries = entries.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.description || '').toLowerCase().includes(search.toLowerCase())
  );

  function getFileIcon(type: string) {
    if (type === 'pdf')                    return <FileText className="h-8 w-8 text-red-500" />;
    if (type === 'doc' || type === 'docx') return <FileCode className="h-8 w-8 text-blue-600" />;
    if (type === 'ppt' || type === 'pptx') return <FilePlus2 className="h-8 w-8 text-orange-500" />;
    return <File className="h-8 w-8 text-slate-400" />;
  }

  const canPublish = !isPublishing && !!pickedFile && !!title.trim();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary">Knowledge Base</h1>
            <p className="text-muted-foreground">Standard Operating Procedures, Manuals, and Reference Documents.</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => { if (showForm) resetForm(); setShowForm(f => !f); }} className="gap-2">
            {showForm ? <X className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'Upload Manual'}
          </Button>
        )}
      </div>

      {/* Upload form */}
      {showForm && (
        <Card className="border-none shadow-xl bg-white overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className="h-1.5 bg-primary" />
          <CardHeader>
            <CardTitle className="text-lg">New Document Upload</CardTitle>
            <CardDescription>
              Fill in the title, select a file, then press Publish. The file uploads only when you press Publish.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Title */}
                <div className="space-y-2">
                  <Label>Document Title <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="e.g. Video Suite Operation Procedure"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    disabled={isPublishing}
                  />
                </div>

                {/* File picker — no upload yet */}
                <div className="space-y-2">
                  <Label>Select File <span className="text-destructive">*</span></Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFilePick}
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      disabled={isPublishing}
                      className="cursor-pointer"
                    />
                    {pickedFile && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                  </div>
                  {pickedFile && (
                    <p className="text-[11px] text-emerald-600 font-semibold truncate">
                      ✓ {pickedFile.name} — will upload on Publish
                    </p>
                  )}
                  {!pickedFile && (
                    <p className="text-[11px] text-muted-foreground">File uploads only when you press Publish.</p>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Description</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleGenerate(false)}
                      disabled={isGenerating || isPublishing}
                      className="gap-1.5 h-7 px-2 text-xs font-bold border-primary/20 text-primary hover:bg-primary/5">
                      {isGenerating
                        ? <><Sparkles className="h-3 w-3 animate-pulse" /> Generating…</>
                        : <><Sparkles className="h-3 w-3" /> AI Autofill</>}
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Brief overview of the document's purpose…"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    disabled={isPublishing}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                {!pickedFile && <span className="text-xs text-muted-foreground">Select a file to enable Publish</span>}
                {!title.trim() && pickedFile && <span className="text-xs text-muted-foreground">Enter a title to enable Publish</span>}
                <Button
                  type="button"
                  onClick={handlePublish}
                  disabled={!canPublish}
                  className="min-w-[180px]"
                >
                  {isPublishing
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading & Publishing…</>
                    : <><Plus className="h-4 w-4 mr-2" /> Publish to Repository</>}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or description…"
          className="pl-10 h-12 text-lg shadow-sm border-none bg-white"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading repository…</p>
        </div>
      ) : filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntries.map(entry => (
            <Card key={entry.id} className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white overflow-hidden flex flex-col">
              <div className={cn("h-2",
                entry.fileType === 'pdf'  ? "bg-red-500" :
                (entry.fileType === 'doc' || entry.fileType === 'docx') ? "bg-blue-600" :
                (entry.fileType === 'ppt' || entry.fileType === 'pptx') ? "bg-orange-500" : "bg-slate-400"
              )} />
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="p-3 bg-muted rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    {getFileIcon(entry.fileType)}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => openEdit(entry)}
                        title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setEntryToDelete(entry.id)}
                        title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-black text-primary leading-tight mb-2 uppercase tracking-tight line-clamp-2">
                  {entry.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-3 mb-6 flex-1">
                  {entry.description || 'No description provided.'}
                </p>
                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span>{format(new Date(entry.createdAt), 'MMM dd, yyyy')}</span>
                    <span className="bg-muted px-2 py-0.5 rounded">{entry.fileType.toUpperCase()}</span>
                  </div>
                  <Button variant="outline"
                    className="w-full gap-2 font-bold group-hover:bg-primary group-hover:text-white transition-colors"
                    onClick={() => downloadFile(entry)}>
                    <Download className="h-4 w-4" /> Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed bg-transparent h-64 flex flex-col items-center justify-center text-center p-8">
          <div className="p-4 bg-muted/50 rounded-full mb-4">
            <File className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-lg">No documents found</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {search ? 'Try adjusting your search.' : 'The repository is currently empty.'}
          </p>
        </Card>
      )}

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      <Dialog open={!!editEntry} onOpenChange={open => !open && setEditEntry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-black text-primary uppercase tracking-tight">Edit Document</DialogTitle>
            <DialogDescription>Update the title, description, or replace the file.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-2">
              <Label>Document Title <span className="text-destructive">*</span></Label>
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} disabled={isSaving} />
            </div>
            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Description</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => handleGenerate(true)}
                  disabled={isEditGenerating || isSaving}
                  className="gap-1.5 h-7 px-2 text-xs font-bold border-primary/20 text-primary hover:bg-primary/5">
                  {isEditGenerating
                    ? <><Sparkles className="h-3 w-3 animate-pulse" /> Generating…</>
                    : <><Sparkles className="h-3 w-3" /> AI Autofill</>}
                </Button>
              </div>
              <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} disabled={isSaving} rows={3} />
            </div>
            {/* Replace file */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5" /> Replace File
                <span className="text-[10px] text-muted-foreground font-normal">(optional — leave blank to keep existing)</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  ref={editFileRef}
                  onChange={handleEditFilePick}
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  disabled={isSaving}
                  className="cursor-pointer"
                />
                {editPickedFile && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
              </div>
              {editEntry && !editPickedFile && (
                <p className="text-[11px] text-muted-foreground">
                  Current file: <span className="font-semibold">{editEntry.fileName}</span>
                </p>
              )}
              {editPickedFile && (
                <p className="text-[11px] text-emerald-600 font-semibold truncate">
                  ✓ {editPickedFile.name} — will replace on Save
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditEntry(null)} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving} className="min-w-[120px]">
              {isSaving
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving…</>
                : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ─────────────────────────────────────────────────── */}
      <AlertDialog open={!!entryToDelete} onOpenChange={open => !open && setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the file and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => { e.preventDefault(); handleDelete(); }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
              disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
