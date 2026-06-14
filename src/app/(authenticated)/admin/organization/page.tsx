"use client";

import React, { useState, useRef } from 'react';
import { useSystemData } from '@/components/system-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Plus, Trash2, Edit2, Check, X, Building2, Download, Upload, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OrganizationPage() {
  const { 
    divisions, sections, locations, statusOptions, positions,
    addDivision, updateDivision, deleteDivision,
    addSection, updateSection, deleteSection,
    addLocation, updateLocation, deleteLocation,
    addStatusOption, updateStatusOption, deleteStatusOption,
    addPosition, updatePosition, deletePosition
  } = useSystemData();
  const { toast } = useToast();

  const [newDivName, setNewDivName] = useState('');
  const [newLocName, setNewLocName] = useState('');
  const [newSecName, setNewSecName] = useState('');
  const [newSecDivId, setNewSecDivId] = useState('');
  const [newStatusName, setNewStatusName] = useState('');
  const [newPosName, setNewPosName] = useState('');
  const csvImportRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState<'division' | 'location' | 'status' | 'position' | null>(null);

  // ── CSV Export ──────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const rows: string[] = ['Division,Section'];
    for (const div of divisions) {
      const divSections = sections.filter(s => s.divisionId === div.id);
      if (divSections.length === 0) {
        rows.push(`"${div.name}",""`);
      } else {
        for (const sec of divSections) {
          rows.push(`"${div.name}","${sec.name}"`);
        }
      }
    }
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rims-divisions-sections-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Divisions and sections exported to CSV.' });
  };

  // ── CSV Import ──────────────────────────────────────────────────────────
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

      // Skip header row if present
      const dataLines = lines[0]?.toLowerCase().startsWith('division') ? lines.slice(1) : lines;

      let divsAdded = 0;
      let secsAdded = 0;
      const errors: string[] = [];

      for (const line of dataLines) {
        // Parse CSV line (handle quoted values)
        const cols = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/^"|"$/g, '').trim()) ?? [];
        const [divName, secName] = cols;

        if (!divName) continue;

        // Add division if it doesn't exist
        let div = divisions.find(d => d.name.toLowerCase() === divName.toLowerCase());
        if (!div) {
          try {
            addDivision(divName);
            divsAdded++;
            // Re-read from context — find the newly added one
            div = divisions.find(d => d.name.toLowerCase() === divName.toLowerCase());
          } catch (err) {
            errors.push(`Division "${divName}": ${err}`);
            continue;
          }
        }

        // Add section if provided and doesn't exist
        if (secName && div) {
          const exists = sections.some(s => s.divisionId === div!.id && s.name.toLowerCase() === secName.toLowerCase());
          if (!exists) {
            try {
              addSection(secName, div.id);
              secsAdded++;
            } catch (err) {
              errors.push(`Section "${secName}": ${err}`);
            }
          }
        }
      }

      if (errors.length > 0) {
        toast({ title: 'Import Partial', description: `Added ${divsAdded} divisions, ${secsAdded} sections. ${errors.length} error(s).`, variant: 'destructive' });
      } else {
        toast({ title: 'Import Complete', description: `Added ${divsAdded} new divisions and ${secsAdded} new sections.` });
      }
    };
    reader.readAsText(file);
    if (csvImportRef.current) csvImportRef.current.value = '';
  };

  const handleAddDivision = () => {
    if (!newDivName) return;
    addDivision(newDivName);
    setNewDivName('');
    toast({ title: "Division Added" });
  };

  const handleAddLocation = () => {
    if (!newLocName) return;
    addLocation(newLocName);
    setNewLocName('');
    toast({ title: "Location Added" });
  };

  const handleAddSection = () => {
    if (!newSecName || !newSecDivId) return;
    addSection(newSecName, newSecDivId);
    setNewSecName('');
    toast({ title: "Section Added" });
  };

  const handleAddStatus = () => {
    if (!newStatusName) return;
    addStatusOption(newStatusName);
    setNewStatusName('');
    toast({ title: "Status Option Added" });
  };

  const handleAddPosition = () => {
    if (!newPosName) return;
    addPosition(newPosName);
    setNewPosName('');
    toast({ title: "Position Added" });
  };

  const startEditing = (id: string, name: string, type: 'division' | 'location' | 'status' | 'position') => {
    setEditingId(id);
    setEditingName(name);
    setEditingType(type);
  };

  const saveEdit = () => {
    if (!editingId || !editingType) return;
    if (editingType === 'division') updateDivision(editingId, editingName);
    if (editingType === 'location') updateLocation(editingId, editingName);
    if (editingType === 'status') updateStatusOption(editingId, editingName);
    if (editingType === 'position') updatePosition(editingId, editingName);
    setEditingId(null);
    setEditingType(null);
    toast({ title: "Updated successfully" });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Organization Management</h1>
          <p className="text-muted-foreground font-medium">Manage Divisions, Sections, Job Positions, and system dropdowns.</p>
        </div>
      </div>

      <Tabs defaultValue="divisions" className="space-y-4">
        <TabsList className="bg-white border shadow-sm p-1 rounded-xl h-11 inline-flex">
          <TabsTrigger value="divisions" className="px-6 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Divisions</TabsTrigger>
          <TabsTrigger value="sections" className="px-6 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Sections</TabsTrigger>
          <TabsTrigger value="positions" className="px-6 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Positions</TabsTrigger>
          <TabsTrigger value="locations" className="px-6 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Locations</TabsTrigger>
          <TabsTrigger value="statuses" className="px-6 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Statuses</TabsTrigger>
        </TabsList>

        <TabsContent value="divisions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Manage Divisions & Sections</CardTitle>
                  <CardDescription>Create or edit divisions and sections, or export/import via CSV.</CardDescription>
                </div>
                <div className="flex gap-2 shrink-0">
                  <input ref={csvImportRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
                  <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 font-bold border-primary/20 text-primary hover:bg-primary/5">
                    <Download className="h-4 w-4" /> Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => csvImportRef.current?.click()} className="gap-2 font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                    <Upload className="h-4 w-4" /> Import CSV
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 border border-dashed mt-1">
                CSV format: <code className="font-mono">Division,Section</code> — one row per section. Division-only rows leave Section blank.
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="New Division Name" 
                  value={newDivName} 
                  onChange={(e) => setNewDivName(e.target.value)} 
                />
                <Button onClick={handleAddDivision} className="gap-2 font-bold">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Name</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {divisions.map((div) => (
                    <TableRow key={div.id}>
                      <TableCell>
                        {editingId === div.id && editingType === 'division' ? (
                          <Input 
                            value={editingName} 
                            onChange={(e) => setEditingName(e.target.value)} 
                          />
                        ) : div.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === div.id && editingType === 'division' ? (
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={saveEdit}>
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => startEditing(div.id, div.name, 'division')}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteDivision(div.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Sections</CardTitle>
              <CardDescription>Assign sections to divisions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input 
                  placeholder="New Section Name" 
                  value={newSecName} 
                  onChange={(e) => setNewSecName(e.target.value)} 
                />
                <Select value={newSecDivId} onValueChange={setNewSecDivId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Division" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddSection} className="gap-2 font-bold">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Section Name</TableHead>
                    <TableHead className="font-bold">Division</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.map((sec) => (
                    <TableRow key={sec.id}>
                      <TableCell>{sec.name}</TableCell>
                      <TableCell>{divisions.find(d => d.id === sec.divisionId)?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => deleteSection(sec.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Positions</CardTitle>
              <CardDescription>Manage available job titles for system accounts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="New Position Name (e.g. VP)" 
                  value={newPosName} 
                  onChange={(e) => setNewPosName(e.target.value)} 
                />
                <Button onClick={handleAddPosition} className="gap-2 font-bold">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Position Name</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((pos) => (
                    <TableRow key={pos.id}>
                      <TableCell>
                        {editingId === pos.id && editingType === 'position' ? (
                          <Input 
                            value={editingName} 
                            onChange={(e) => setEditingName(e.target.value)} 
                          />
                        ) : pos.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === pos.id && editingType === 'position' ? (
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={saveEdit}>
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => startEditing(pos.id, pos.name, 'position')}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => deletePosition(pos.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Locations</CardTitle>
              <CardDescription>Manage physical sites or office locations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="New Location Name" 
                  value={newLocName} 
                  onChange={(e) => setNewLocName(e.target.value)} 
                />
                <Button onClick={handleAddLocation} className="gap-2 font-bold">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Location Name</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell>
                        {editingId === loc.id && editingType === 'location' ? (
                          <Input 
                            value={editingName} 
                            onChange={(e) => setEditingName(e.target.value)} 
                          />
                        ) : loc.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === loc.id && editingType === 'location' ? (
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={saveEdit}>
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => startEditing(loc.id, loc.name, 'location')}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteLocation(loc.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statuses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Status Options</CardTitle>
              <CardDescription>Manage the options available in the budget status dropdown.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="New Status Name (e.g. working)" 
                  value={newStatusName} 
                  onChange={(e) => setNewStatusName(e.target.value)} 
                />
                <Button onClick={handleAddStatus} className="gap-2 font-bold">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Status Name</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statusOptions.map((status) => (
                    <TableRow key={status.id}>
                      <TableCell>
                        {editingId === status.id && editingType === 'status' ? (
                          <Input 
                            value={editingName} 
                            onChange={(e) => setEditingName(e.target.value)} 
                          />
                        ) : status.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === status.id && editingType === 'status' ? (
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={saveEdit}>
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => startEditing(status.id, status.name, 'status')}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteStatusOption(status.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
