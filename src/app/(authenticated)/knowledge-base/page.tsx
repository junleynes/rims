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
  FileText, Search, Upload, Download, Trash2, File,
  BookOpen, Plus, X, FileCode, Loader2, Sparkles, FilePlus2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchKnowledgeBaseEntries, createKnowledgeBaseEntry, removeKnowledgeBaseEntry } from '@/app/actions/db-actions';
import { generateContentFromTitle } from '@/app/actions/ai-autofill-action';
import { KnowledgeBaseEntry } from '@/lib/types';
import { uploadFile, deleteFile, getFileUrl } from '@/lib/file-upload';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const { systemConfig } = useSystemData();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBusy, setIsBusy] = useState(false);   // covers both upload phase and publish phase
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'uploading' | 'ready' | 'publishing'>('idle');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  // Single source of truth for the staged file — avoids stale closure bugs
  const [stagedFile, setStagedFile] = useState<{
    fileName: string;
    fileType: string;
    filePath: string;
  } | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const isAdmin = user?.role === 'Admin';
  const MAX_FILE_SIZE = (systemConfig.maxUploadSize || 20) * 1024 * 1024;

  useEffect(() => { loadEntries(); }, []);

  async function loadEntries() {
    setIsLoading(true);
    try {
      const data = await fetchKnowledgeBaseEntries();
      setEntries(data);
    } catch {
      toast({ title: 'Load Error', description: 'Failed to load knowledge base entries.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  const handleGenerateDescription = async () => {
    if (!title) {
      toast({ title: 'Add a title first', description: 'Enter a document title before generating a description.', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    const result = await generateContentFromTitle({ title, context: 'knowledge-base' });
    setIsGenerating(false);
    if (result.error) {
      toast({ title: 'Generation Failed', description: result.error, variant: 'destructive' });
    } else if (result.content) {
      setDescription(result.content);
      toast({ title: 'Description Generated', description: 'AI description added. Review before saving.' });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${systemConfig.maxUploadSize || 20}MB.`,
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setStagedFile(null);
    setUploadPhase('uploading');
    setIsBusy(true);

    try {
      const result = await uploadFile(file, 'knowledge-base');
      setStagedFile({
        fileName: result.fileName,
        fileType: result.fileType,
        filePath: result.filePath,
      });
      setUploadPhase('ready');
      toast({ title: 'File ready', description: `${file.name} staged successfully.` });
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
      setUploadPhase('idle');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsBusy(false);
    }
  };

  // stagedFile from useState is always current at the time this function runs
  // because React guarantees state is flushed before the next render's event handlers.
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter a document title.', variant: 'destructive' });
      return;
    }
    if (!stagedFile) {
      toast({ title: 'Validation Error', description: 'Please select a file and wait for it to finish uploading.', variant: 'destructive' });
      return;
    }

    setUploadPhase('publishing');
    setIsBusy(true);

    const newEntry: KnowledgeBaseEntry = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      fileName: stagedFile.fileName,
      fileType: stagedFile.fileType,
      filePath: stagedFile.filePath,
      uploadedBy: user?.name || 'Admin',
      createdAt: new Date().toISOString(),
    };

    try {
      await createKnowledgeBaseEntry(newEntry);
      toast({ title: 'Document Published', description: 'The document is now available to all users.' });
      resetForm();
      setShowUploadForm(false);
      await loadEntries();
    } catch (error: any) {
      console.error('KB publish error:', error);
      toast({
        title: 'Publish Failed',
        description: error?.message || 'An error occurred while saving the document.',
        variant: 'destructive',
      });
    } finally {
      setIsBusy(false);
      setUploadPhase(stagedFile ? 'ready' : 'idle');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStagedFile(null);
    setUploadPhase('idle');
    setIsBusy(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCancelUpload = () => {
    resetForm();
    setShowUploadForm(false);
  };

  const handleDelete = async () => {
    if (!entryToDelete) return;
    setIsDeleting(true);
    try {
      const entry = entries.find(e => e.id === entryToDelete);
      if (entry?.filePath && !entry.filePath.startsWith('data:')) {
        await deleteFile(entry.filePath);
      }
      await removeKnowledgeBaseEntry(entryToDelete);
      toast({ title: 'Document Removed', description: 'The document has been permanently deleted.' });
      await loadEntries();
    } catch {
      toast({ title: 'Delete Failed', description: 'Could not remove the document. Please try again.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setEntryToDelete(null);
    }
  };

  const downloadFile = (entry: KnowledgeBaseEntry) => {
    const url = getFileUrl(entry.filePath);
    const link = document.createElement('a');
    link.href = url;
    link.download = entry.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEntries = entries.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':  return <FileText className="h-8 w-8 text-red-500" />;
      case 'doc':
      case 'docx': return <FileCode className="h-8 w-8 text-blue-600" />;
      case 'ppt':
      case 'pptx': return <FilePlus2 className="h-8 w-8 text-orange-500" />;
      default:     return <File className="h-8 w-8 text-slate-400" />;
    }
  };

  const publishBtnLabel = () => {
    if (uploadPhase === 'uploading')   return <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading…</>;
    if (uploadPhase === 'publishing')  return <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Publishing…</>;
    return <><Plus className="h-4 w-4 mr-2" /> Publish to Repository</>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
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
          <Button onClick={() => showUploadForm ? handleCancelUpload() : setShowUploadForm(true)} className="gap-2">
            {showUploadForm ? <X className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {showUploadForm ? 'Cancel' : 'Upload Manual'}
          </Button>
        )}
      </div>

      {showUploadForm && (
        <Card className="border-none shadow-xl bg-white overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className="h-1.5 bg-primary" />
          <CardHeader>
            <CardTitle className="text-lg">New Document Upload</CardTitle>
            <CardDescription>
              Upload procedures in PDF, Word, or PowerPoint formats (Limit: {systemConfig.maxUploadSize || 20}MB).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePublish} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label>Document Title <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="e.g. Video Suite Operation Procedure"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    disabled={isBusy && uploadPhase === 'publishing'}
                  />
                </div>

                {/* File picker */}
                <div className="space-y-2">
                  <Label>Select File <span className="text-destructive">*</span></Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      className="cursor-pointer"
                      disabled={uploadPhase === 'uploading' || uploadPhase === 'publishing'}
                    />
                    {uploadPhase === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                    )}
                    {uploadPhase === 'ready' && (
                      <span className="text-xs text-emerald-600 font-bold shrink-0">✓ Ready</span>
                    )}
                  </div>
                  {stagedFile && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      {stagedFile.fileName} · {stagedFile.fileType.toUpperCase()}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Description</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateDescription}
                      disabled={isGenerating || isBusy}
                      className="gap-1.5 border-primary/20 text-primary hover:bg-primary/5 font-bold text-xs h-7 px-2"
                    >
                      {isGenerating
                        ? <><Sparkles className="h-3 w-3 animate-pulse" /> Generating…</>
                        : <><Sparkles className="h-3 w-3" /> AI Autofill</>}
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Brief overview of the document's purpose…"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    disabled={uploadPhase === 'publishing'}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isBusy || uploadPhase === 'idle' || uploadPhase === 'uploading'}
                  className="min-w-[200px]"
                >
                  {publishBtnLabel()}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documentation by title or content keywords…"
          className="pl-10 h-12 text-lg shadow-sm border-none bg-white"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Document grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Scanning document repository…</p>
        </div>
      ) : filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntries.map(entry => (
            <Card key={entry.id} className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white overflow-hidden flex flex-col">
              <div className={cn(
                "h-2",
                entry.fileType === 'pdf'  ? "bg-red-500"  :
                (entry.fileType === 'doc' || entry.fileType === 'docx') ? "bg-blue-600" :
                (entry.fileType === 'ppt' || entry.fileType === 'pptx') ? "bg-orange-500" : "bg-slate-400"
              )} />
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="p-3 bg-muted rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    {getFileIcon(entry.fileType)}
                  </div>
                  {isAdmin && (
                    <Button
                      size="icon" variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setEntryToDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
                    <span>Uploaded {format(new Date(entry.createdAt), 'MMM dd, yyyy')}</span>
                    <span className="bg-muted px-2 py-0.5 rounded">{entry.fileType}</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-2 font-bold group-hover:bg-primary group-hover:text-white transition-colors"
                    onClick={() => downloadFile(entry)}
                  >
                    <Download className="h-4 w-4" /> Download Manual
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
            {search ? 'Try adjusting your search terms.' : 'The organizational repository is currently empty.'}
          </p>
        </Card>
      )}

      <AlertDialog open={!!entryToDelete} onOpenChange={open => !open && setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the manual from the departmental repository.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => { e.preventDefault(); handleDelete(); }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
