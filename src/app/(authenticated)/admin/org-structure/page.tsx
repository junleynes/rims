"use client";

import React, { useRef, useState, useCallback } from 'react';
import { useSystemData } from '@/components/system-data-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Building2, LayoutGrid, Shield, Users,
  UserCheck, Network, Waypoints,
  ZoomIn, ZoomOut, Maximize2, GripHorizontal,
  ArrowRight, ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from '@/lib/types';

// ─── Node dimensions ──────────────────────────────────────────────────────────
const NW = 220;   // node width
const NH = 88;    // node height
const GAP_MAIN = 60;   // gap along the main axis (between parent and children)
const GAP_CROSS = 20;  // gap between siblings on the cross axis

// ─── Tree types ───────────────────────────────────────────────────────────────
interface TreeNode {
  user: User;
  children: TreeNode[];
  x: number;
  y: number;
  subtreeSpan: number; // total size on the CROSS axis
}

type Orientation = 'horizontal' | 'vertical';

// ─── Layout engine ─────────────────────────────────────────────────────────────
// "main axis" = direction of parent → child
// "cross axis" = direction siblings are stacked

function measureSubtree(node: TreeNode): number {
  if (node.children.length === 0) {
    node.subtreeSpan = (/* horizontal: */ NW > NH ? NH : NW); // updated per orientation below
    return node.subtreeSpan;
  }
  // Will be set by the caller
  return 0;
}

function layout(node: TreeNode, mainPos: number, crossPos: number, orientation: Orientation) {
  const crossSize = orientation === 'horizontal' ? NH : NW;
  const mainSize  = orientation === 'horizontal' ? NW : NH;

  // Measure subtree span for all children first
  function measure(n: TreeNode): number {
    if (n.children.length === 0) {
      n.subtreeSpan = crossSize;
      return crossSize;
    }
    const total = n.children.reduce((s, c) => s + measure(c), 0)
      + GAP_CROSS * (n.children.length - 1);
    n.subtreeSpan = Math.max(crossSize, total);
    return n.subtreeSpan;
  }
  measure(node);

  function place(n: TreeNode, main: number, cross: number) {
    if (orientation === 'horizontal') {
      // main axis = X (left→right), cross axis = Y (top→bottom)
      n.x = main;
      n.y = cross + (n.subtreeSpan - crossSize) / 2;
    } else {
      // main axis = Y (top→bottom), cross axis = X (left→right)
      n.x = cross + (n.subtreeSpan - crossSize) / 2;
      n.y = main;
    }

    let childCross = cross;
    for (const child of n.children) {
      place(child, main + mainSize + GAP_MAIN, childCross);
      childCross += child.subtreeSpan + GAP_CROSS;
    }
  }

  place(node, mainPos, crossPos);
}

function collectNodes(node: TreeNode, acc: TreeNode[] = []): TreeNode[] {
  acc.push(node);
  node.children.forEach(c => collectNodes(c, acc));
  return acc;
}

function collectEdges(node: TreeNode, orientation: Orientation,
  acc: { x1: number; y1: number; x2: number; y2: number }[] = []) {
  for (const child of node.children) {
    if (orientation === 'horizontal') {
      const x1 = node.x + NW;
      const y1 = node.y + NH / 2;
      const x2 = child.x;
      const y2 = child.y + NH / 2;
      acc.push({ x1, y1, x2, y2 });
    } else {
      const x1 = node.x + NW / 2;
      const y1 = node.y + NH;
      const x2 = child.x + NW / 2;
      const y2 = child.y;
      acc.push({ x1, y1, x2, y2 });
    }
    collectEdges(child, orientation, acc);
  }
  return acc;
}

// ─── Role colours ─────────────────────────────────────────────────────────────
const ROLE_COLOR: Record<string, string> = {
  Admin:   '#6366f1',
  VP:      '#8b5cf6',
  AVP:     '#0ea5e9',
  Manager: '#10b981',
  Viewer:  '#64748b',
};
const roleColor = (role?: string) => ROLE_COLOR[role || ''] || '#64748b';

// ─── Node card ─────────────────────────────────────────────────────────────────
function OrgNode({ node }: { node: TreeNode }) {
  const u = node.user;
  const color = roleColor(u.role);
  return (
    <foreignObject x={node.x} y={node.y} width={NW} height={NH} style={{ overflow: 'visible' }}>
      <div style={{
        width: NW, height: NH, borderRadius: 14,
        background: '#fff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.09)',
        border: `2px solid ${color}22`,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 14px', boxSizing: 'border-box',
        cursor: 'default', userSelect: 'none',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: `${color}18`, border: `2.5px solid ${color}55`,
          flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 900, fontSize: 16, color,
          overflow: 'hidden',
        }}>
          {u.profilePicture
            ? <img src={u.profilePicture} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : u.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 11.5, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {u.name}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
            {u.position || '—'}
          </div>
          {u.section && u.section !== 'None' && (
            <div style={{ marginTop: 5, display: 'inline-block', background: `${color}18`, color, fontWeight: 800, fontSize: 9, padding: '2px 7px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%' }}>
              {u.section}
            </div>
          )}
        </div>
      </div>
    </foreignObject>
  );
}

// ─── Elbow connector ──────────────────────────────────────────────────────────
function EdgePath({ x1, y1, x2, y2, orientation }: {
  x1: number; y1: number; x2: number; y2: number; orientation: Orientation;
}) {
  let d: string;
  if (orientation === 'horizontal') {
    const mx = x1 + GAP_MAIN / 2;
    d = `M${x1},${y1} L${mx},${y1} L${mx},${y2} L${x2},${y2}`;
  } else {
    const my = y1 + GAP_MAIN / 2;
    d = `M${x1},${y1} L${x1},${my} L${x2},${my} L${x2},${y2}`;
  }
  return <path d={d} fill="none" stroke="#cbd5e1" strokeWidth={1.8} strokeDasharray="5,3" />;
}

// ─── Canvas ───────────────────────────────────────────────────────────────────
function OrgCanvas({ roots, orientation }: { roots: TreeNode[]; orientation: Orientation }) {
  const [pan, setPan] = useState({ x: 60, y: 40 });
  const [scale, setScale] = useState(1);
  const drag = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const touch = useRef<{ id: number; sx: number; sy: number; px: number; py: number } | null>(null);

  // Run layout
  let crossOffset = 0;
  const TREE_GAP = 48;
  for (const root of roots) {
    layout(root, 0, crossOffset, orientation);
    if (orientation === 'horizontal') {
      crossOffset += root.subtreeSpan + TREE_GAP;
    } else {
      crossOffset += root.subtreeSpan + TREE_GAP;
    }
  }

  const allNodes = roots.flatMap(r => collectNodes(r));
  const allEdges = roots.flatMap(r => collectEdges(r, orientation));

  const maxX = allNodes.reduce((m, n) => Math.max(m, n.x + NW), 0);
  const maxY = allNodes.reduce((m, n) => Math.max(m, n.y + NH), 0);

  const zoomBy = useCallback((d: number) => setScale(s => Math.min(2, Math.max(0.2, s + d))), []);
  const reset  = useCallback(() => { setScale(1); setPan({ x: 60, y: 40 }); }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    drag.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current) return;
    setPan({ x: drag.current.px + e.clientX - drag.current.sx, y: drag.current.py + e.clientY - drag.current.sy });
  };
  const onMouseUp = () => { drag.current = null; };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { id: t.identifier, sx: t.clientX, sy: t.clientY, px: pan.x, py: pan.y };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const t = Array.from(e.touches).find(x => x.identifier === touch.current!.id);
    if (t) setPan({ x: touch.current.px + t.clientX - touch.current.sx, y: touch.current.py + t.clientY - touch.current.sy });
  };
  const onTouchEnd = () => { touch.current = null; };
  const onWheel = (e: React.WheelEvent) => { e.preventDefault(); zoomBy(-e.deltaY * 0.001); };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Controls */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Button size="icon" variant="outline" className="h-8 w-8 shadow-sm" onClick={() => zoomBy(0.15)}><ZoomIn className="h-4 w-4" /></Button>
        <Button size="icon" variant="outline" className="h-8 w-8 shadow-sm" onClick={() => zoomBy(-0.15)}><ZoomOut className="h-4 w-4" /></Button>
        <Button size="icon" variant="outline" className="h-8 w-8 shadow-sm" onClick={reset} title="Reset view"><Maximize2 className="h-4 w-4" /></Button>
      </div>
      {/* Zoom label */}
      <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        {Math.round(scale * 100)}%
      </div>
      {/* Hint */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '3px 10px', fontSize: 10, fontWeight: 600, color: '#94a3b8', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <GripHorizontal className="h-3 w-3" /> Drag to pan · Scroll to zoom
      </div>

      {/* Canvas */}
      <div
        style={{ width: '100%', height: 560, overflow: 'hidden', cursor: drag.current ? 'grabbing' : 'grab', background: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px', borderRadius: 16, border: '1px solid #f1f5f9' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      >
        <svg
          width={maxX + 80} height={maxY + 80}
          style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${scale})`, transformOrigin: '0 0', overflow: 'visible' }}
        >
          {allEdges.map((e, i) => <EdgePath key={i} {...e} orientation={orientation} />)}
          {allNodes.map(n => <OrgNode key={n.user.id} node={n} />)}
        </svg>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OrgStructurePage() {
  const { divisions, sections, users } = useSystemData();
  const [orientation, setOrientation] = useState<Orientation>('vertical');

  const getUsersForSection    = (div: string, sec: string) => users.filter(u => u.division === div && u.section === sec);
  const getUsersForDivisionOnly = (div: string) => users.filter(u => u.division === div && (!u.section || u.section === 'None'));

  const buildTree = (): TreeNode[] => {
    const roots = users.filter(u => !u.reportingTo || u.reportingTo === 'None' || u.reportingTo === 'Board of Directors');
    const makeNode = (user: User): TreeNode => ({
      user, children: users.filter(u => u.reportingTo === user.name).map(makeNode),
      x: 0, y: 0, subtreeSpan: 0,
    });
    return roots.map(makeNode);
  };

  const hierarchy = buildTree();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl rotate-3">
            <Waypoints className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-primary">Table of Organization</h1>
            <p className="text-muted-foreground font-medium">Visualizing functional dependencies and management reporting lines.</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="functional" className="space-y-6">
        <TabsList className="bg-white border shadow-sm p-1 rounded-xl h-12 inline-flex">
          <TabsTrigger value="functional" className="gap-2 px-6 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            <LayoutGrid className="h-4 w-4" /> Functional Tree
          </TabsTrigger>
          <TabsTrigger value="reporting" className="gap-2 px-6 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            <UserCheck className="h-4 w-4" /> Reporting Chart
          </TabsTrigger>
        </TabsList>

        {/* ── Functional Tree ── */}
        <TabsContent value="functional" className="space-y-8 animate-in slide-in-from-bottom-2">
          {divisions.map(div => (
            <div key={div.id} className="space-y-6 p-6 bg-white rounded-3xl border shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Building2 className="h-48 w-48" />
              </div>
              <div className="flex items-center gap-4 border-b pb-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">{div.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Operational Division</span>
                    <Badge variant="outline" className="text-[9px]">{sections.filter(s => s.divisionId === div.id).length} Sections</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {getUsersForDivisionOnly(div.name).length > 0 && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <Shield className="h-3 w-3 text-primary" /> Division Administration
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {getUsersForDivisionOnly(div.name).map(user => (
                        <Card key={user.id} className="border-none shadow-sm bg-primary/[0.03] hover:bg-primary/[0.06] transition-colors">
                          <CardContent className="p-4 flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profilePicture} className="object-cover" />
                              <AvatarFallback className="bg-white text-primary text-xs font-black shadow-sm">{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-primary truncate leading-none uppercase">{user.name}</p>
                              <p className="text-[10px] text-muted-foreground font-bold truncate mt-1">{user.position}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sections.filter(s => s.divisionId === div.id).map(sec => (
                    <Card key={sec.id} className="border border-slate-100 shadow-sm bg-slate-50/30 overflow-hidden group">
                      <div className="h-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs font-black uppercase tracking-tight flex items-center gap-2">
                            <LayoutGrid className="h-3 w-3 text-primary" />{sec.name}
                          </CardTitle>
                          <span className="text-[10px] font-bold text-muted-foreground">{getUsersForSection(div.name, sec.name).length} Staff</span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        {getUsersForSection(div.name, sec.name).length > 0 ? (
                          getUsersForSection(div.name, sec.name).map(user => (
                            <div key={user.id} className="flex items-center gap-2 py-1.5 border-t border-slate-100 first:border-0">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={user.profilePicture} className="object-cover" />
                                <AvatarFallback className="bg-white border text-[9px] font-black text-primary">{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold truncate leading-none">{user.name}</p>
                                <p className="text-[9px] text-muted-foreground truncate">{user.position}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[9px] text-muted-foreground italic py-4 text-center bg-white/50 rounded-lg">Unit personnel pending.</div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ── Reporting Chart ── */}
        <TabsContent value="reporting" className="animate-in slide-in-from-bottom-2">
          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="pb-4 pt-6 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl font-black text-primary tracking-tight uppercase">
                    <Network className="h-5 w-5" /> Management Hierarchy
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">
                    Drag to pan · Scroll to zoom · Toggle orientation below.
                  </p>
                </div>
                {/* Orientation toggle */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl self-start sm:self-auto">
                  <Button
                    size="sm"
                    variant={orientation === 'vertical' ? 'default' : 'ghost'}
                    className="gap-1.5 h-8 px-3 text-xs font-bold"
                    onClick={() => setOrientation('vertical')}
                  >
                    <ArrowDown className="h-3.5 w-3.5" /> Top → Down
                  </Button>
                  <Button
                    size="sm"
                    variant={orientation === 'horizontal' ? 'default' : 'ghost'}
                    className="gap-1.5 h-8 px-3 text-xs font-bold"
                    onClick={() => setOrientation('horizontal')}
                  >
                    <ArrowRight className="h-3.5 w-3.5" /> Left → Right
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {hierarchy.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
                  <Users className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">No reporting relationships configured yet.</p>
                  <p className="text-xs">Set the &ldquo;Reporting To&rdquo; field on user profiles to build the chart.</p>
                </div>
              ) : (
                <OrgCanvas roots={hierarchy} orientation={orientation} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
