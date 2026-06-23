"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSystemData } from '@/components/system-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Building2, 
  LayoutGrid, 
  Shield, 
  Users,
  Briefcase,
  UserCheck,
  Network,
  Waypoints,
  ZoomIn,
  ZoomOut,
  Maximize2,
  GripHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from '@/lib/types';

// ─── Tree layout constants ──────────────────────────────────────────────────
const NODE_W = 220;
const NODE_H = 88;
const H_GAP  = 60;   // horizontal gap between parent right-edge and child left-edge
const V_GAP  = 20;   // vertical gap between sibling nodes

// ─── Tree node type ──────────────────────────────────────────────────────────
interface TreeNode {
  user: User;
  children: TreeNode[];
  x: number;  // top-left x
  y: number;  // top-left y
  subtreeH: number;
}

// ─── Measure subtree height then set x/y coordinates ────────────────────────
function measureSubtree(node: TreeNode): number {
  if (node.children.length === 0) {
    node.subtreeH = NODE_H;
    return NODE_H;
  }
  const childrenH = node.children.reduce((sum, c) => sum + measureSubtree(c), 0)
    + V_GAP * (node.children.length - 1);
  node.subtreeH = Math.max(NODE_H, childrenH);
  return node.subtreeH;
}

function placeNodes(node: TreeNode, x: number, y: number) {
  node.x = x;
  // Centre this node vertically within its subtree
  node.y = y + (node.subtreeH - NODE_H) / 2;

  let childY = y;
  for (const child of node.children) {
    placeNodes(child, x + NODE_W + H_GAP, childY);
    childY += child.subtreeH + V_GAP;
  }
}

function collectNodes(node: TreeNode, acc: TreeNode[] = []): TreeNode[] {
  acc.push(node);
  node.children.forEach(c => collectNodes(c, acc));
  return acc;
}

function collectEdges(node: TreeNode, acc: { x1:number; y1:number; x2:number; y2:number }[] = []) {
  const px = node.x + NODE_W;
  const py = node.y + NODE_H / 2;
  for (const child of node.children) {
    const cx = child.x;
    const cy = child.y + NODE_H / 2;
    const mx = px + H_GAP / 2;
    acc.push({ x1: px, y1: py, x2: cx, y2: cy });
    collectEdges(child, acc);
  }
  return acc;
}

// ─── Role colours ────────────────────────────────────────────────────────────
const roleColor: Record<string, string> = {
  Admin:   '#6366f1',
  VP:      '#8b5cf6',
  AVP:     '#0ea5e9',
  Manager: '#10b981',
  Viewer:  '#64748b',
};

function getRoleColor(role?: string) {
  return roleColor[role || ''] || '#64748b';
}

// ─── Single node rendered as foreign SVG element ─────────────────────────────
function OrgNode({ node, scale }: { node: TreeNode; scale: number }) {
  const u = node.user;
  const color = getRoleColor(u.role);

  return (
    <foreignObject
      x={node.x}
      y={node.y}
      width={NODE_W}
      height={NODE_H}
      style={{ overflow: 'visible' }}
    >
      <div
        style={{
          width: NODE_W,
          height: NODE_H,
          borderRadius: 14,
          background: '#fff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.09)',
          border: `2px solid ${color}22`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 14px',
          boxSizing: 'border-box',
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: `${color}18`,
          border: `2.5px solid ${color}55`,
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 16, color,
          overflow: 'hidden',
        }}>
          {u.profilePicture
            ? <img src={u.profilePicture} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : u.name.charAt(0).toUpperCase()
          }
        </div>
        {/* Text */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontWeight: 900, fontSize: 11.5, color: '#1e293b',
            textTransform: 'uppercase', letterSpacing: '0.04em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {u.name}
          </div>
          <div style={{
            fontSize: 10, color: '#64748b', fontWeight: 600,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2,
          }}>
            {u.position || u.role}
          </div>
          <div style={{
            marginTop: 5,
            display: 'inline-block',
            background: `${color}18`,
            color,
            fontWeight: 800, fontSize: 9,
            padding: '2px 7px', borderRadius: 99,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            {u.role}
          </div>
        </div>
      </div>
    </foreignObject>
  );
}

// ─── Elbow connector ─────────────────────────────────────────────────────────
function EdgePath({ x1, y1, x2, y2 }: { x1:number; y1:number; x2:number; y2:number }) {
  const mx = x1 + H_GAP / 2;
  const d = `M${x1},${y1} L${mx},${y1} L${mx},${y2} L${x2},${y2}`;
  return <path d={d} fill="none" stroke="#cbd5e1" strokeWidth={1.8} strokeDasharray="5,3" />;
}

// ─── Interactive canvas ───────────────────────────────────────────────────────
function OrgCanvas({ roots }: { roots: TreeNode[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 60, y: 40 });
  const [scale, setScale] = useState(1);
  const drag = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  // Layout all roots stacked vertically
  let totalH = 0;
  const TREE_GAP = 48;
  for (const root of roots) {
    measureSubtree(root);
    placeNodes(root, 0, totalH);
    totalH += root.subtreeH + TREE_GAP;
  }

  const allNodes = roots.flatMap(r => collectNodes(r));
  const allEdges = roots.flatMap(r => collectEdges(r));

  const maxX = allNodes.reduce((m, n) => Math.max(m, n.x + NODE_W), 0);
  const maxY = allNodes.reduce((m, n) => Math.max(m, n.y + NODE_H), 0);
  const svgW = maxX + 80;
  const svgH = maxY + 80;

  // ── Zoom helpers ──
  const zoomBy = useCallback((delta: number) => {
    setScale(s => Math.min(2, Math.max(0.25, s + delta)));
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 60, y: 40 });
  }, []);

  // ── Mouse pan ──
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    drag.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current) return;
    setPan({
      x: drag.current.panX + (e.clientX - drag.current.startX),
      y: drag.current.panY + (e.clientY - drag.current.startY),
    });
  };
  const onMouseUp = () => { drag.current = null; };

  // ── Touch pan ──
  const touch = useRef<{ id: number; startX: number; startY: number; panX: number; panY: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { id: t.identifier, startX: t.clientX, startY: t.clientY, panX: pan.x, panY: pan.y };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const t = Array.from(e.touches).find(t => t.identifier === touch.current!.id);
    if (!t) return;
    setPan({
      x: touch.current.panX + (t.clientX - touch.current.startX),
      y: touch.current.panY + (t.clientY - touch.current.startY),
    });
  };
  const onTouchEnd = () => { touch.current = null; };

  // ── Wheel zoom ──
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomBy(-e.deltaY * 0.001);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Controls */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <Button size="icon" variant="outline" className="h-8 w-8 shadow-sm" onClick={() => zoomBy(0.15)}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" className="h-8 w-8 shadow-sm" onClick={() => zoomBy(-0.15)}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" className="h-8 w-8 shadow-sm" onClick={resetView} title="Reset view">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom badge */}
      <div style={{
        position: 'absolute', bottom: 12, right: 12, zIndex: 10,
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: 8, padding: '3px 10px',
        fontSize: 11, fontWeight: 700, color: '#64748b',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        {Math.round(scale * 100)}%
      </div>

      {/* Drag hint */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, zIndex: 10,
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: 8, padding: '3px 10px',
        fontSize: 10, fontWeight: 600, color: '#94a3b8',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <GripHorizontal className="h-3 w-3" /> Drag to pan · Scroll to zoom
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{
          width: '100%', height: 560,
          overflow: 'hidden',
          cursor: drag.current ? 'grabbing' : 'grab',
          background: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          borderRadius: 16,
          border: '1px solid #f1f5f9',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      >
        <svg
          width={svgW}
          height={svgH}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: drag.current ? 'none' : 'transform 0.05s',
            overflow: 'visible',
          }}
        >
          {/* Edges first (behind nodes) */}
          {allEdges.map((e, i) => (
            <EdgePath key={i} {...e} />
          ))}
          {/* Nodes */}
          {allNodes.map(node => (
            <OrgNode key={node.user.id} node={node} scale={scale} />
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function OrgStructurePage() {
  const { divisions, sections, users } = useSystemData();

  const getUsersForSection = (divisionName: string, sectionName: string) =>
    users.filter(u => u.division === divisionName && u.section === sectionName);

  const getUsersForDivisionOnly = (divisionName: string) =>
    users.filter(u => u.division === divisionName && (!u.section || u.section === 'None'));

  // Build reporting tree
  const buildTree = (): TreeNode[] => {
    const roots = users.filter(u => !u.reportingTo || u.reportingTo === 'None' || u.reportingTo === 'Board of Directors');

    const makeNode = (user: User): TreeNode => {
      const children = users.filter(u => u.reportingTo === user.name).map(makeNode);
      return { user, children, x: 0, y: 0, subtreeH: 0 };
    };

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

        {/* ── Functional Tree (unchanged) ── */}
        <TabsContent value="functional" className="space-y-8 animate-in slide-in-from-bottom-2">
          {divisions.map((div) => (
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
                              <AvatarFallback className="bg-white text-primary text-xs font-black shadow-sm">
                                {user.name.charAt(0)}
                              </AvatarFallback>
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
                            <LayoutGrid className="h-3 w-3 text-primary" />
                            {sec.name}
                          </CardTitle>
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {getUsersForSection(div.name, sec.name).length} Staff
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        {getUsersForSection(div.name, sec.name).length > 0 ? (
                          getUsersForSection(div.name, sec.name).map(user => (
                            <div key={user.id} className="flex items-center gap-2 py-1.5 border-t border-slate-100 first:border-0">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={user.profilePicture} className="object-cover" />
                                <AvatarFallback className="bg-white border text-[9px] font-black text-primary">
                                  {user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold truncate leading-none">{user.name}</p>
                                <p className="text-[9px] text-muted-foreground truncate">{user.position}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[9px] text-muted-foreground italic py-4 text-center bg-white/50 rounded-lg">
                            Unit personnel pending.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ── Reporting Chart — horizontal draggable + zoomable ── */}
        <TabsContent value="reporting" className="animate-in slide-in-from-bottom-2">
          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="pb-4 pt-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl font-black text-primary tracking-tight uppercase">
                    <Network className="h-5 w-5" /> Management Hierarchy
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">
                    Horizontal reporting chart — drag to pan, scroll or use buttons to zoom.
                  </p>
                </div>
                <Badge variant="outline" className="bg-white px-3 py-1 font-black text-[10px] tracking-widest uppercase hidden sm:block">
                  Confidential
                </Badge>
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
                <OrgCanvas roots={hierarchy} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
