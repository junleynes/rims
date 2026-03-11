
"use client";

import React, { useState } from 'react';
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
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OrganizationPage() {
  const { 
    divisions, sections, locations,
    addDivision, updateDivision, deleteDivision,
    addSection, updateSection, deleteSection,
    addLocation, updateLocation, deleteLocation
  } = useSystemData();
  const { toast } = useToast();

  const [newDivName, setNewDivName] = useState('');
  const [newLocName, setNewLocName] = useState('');
  const [newSecName, setNewSecName] = useState('');
  const [newSecDivId, setNewSecDivId] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Organization Management</h1>
        <p className="text-muted-foreground">Manage Divisions, Sections, and physical Locations.</p>
      </div>

      <Tabs defaultValue="divisions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="divisions">Divisions</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="divisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Divisions</CardTitle>
              <CardDescription>Create or edit the main operational divisions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="New Division Name" 
                  value={newDivName} 
                  onChange={(e) => setNewDivName(e.target.value)} 
                />
                <Button onClick={handleAddDivision} className="gap-2">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {divisions.map((div) => (
                    <TableRow key={div.id}>
                      <TableCell>
                        {editingId === div.id ? (
                          <Input 
                            value={editingName} 
                            onChange={(e) => setEditingName(e.target.value)} 
                          />
                        ) : div.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === div.id ? (
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => { updateDivision(div.id, editingName); setEditingId(null); }}>
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => { setEditingId(div.id); setEditingName(div.name); }}>
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
                <Button onClick={handleAddSection} className="gap-2">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section Name</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                <Button onClick={handleAddLocation} className="gap-2">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell>{loc.name}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => deleteLocation(loc.id)}>
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
      </Tabs>
    </div>
  );
}
