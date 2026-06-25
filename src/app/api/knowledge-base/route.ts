import { NextRequest, NextResponse } from 'next/server';
import { requireSession, requireAdmin } from '@/lib/session';
import * as db from '@/lib/server-db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const KBEntrySchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  filePath: z.string().min(1),
  uploadedBy: z.string().default(''),
  createdAt: z.string(),
});

// POST — create a new KB entry
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireSession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  let validated;
  try {
    validated = KBEntrySchema.parse(body);
  } catch (e: any) {
    return NextResponse.json(
      { error: `Validation failed: ${e?.errors?.[0]?.message || e?.message}` },
      { status: 422 }
    );
  }

  try {
    db.saveKnowledgeBaseEntry(validated);
  } catch (e: any) {
    console.error('KB save error:', e);
    return NextResponse.json({ error: 'Failed to save entry to database.' }, { status: 500 });
  }

  try {
    db.logAudit({
      userId: user.id,
      username: user.username,
      action: 'kb_document_uploaded',
      details: `Uploaded "${validated.title}" (${validated.fileType.toUpperCase()}, ${validated.fileName})`,
    });
  } catch { /* audit must never block */ }

  return NextResponse.json({ success: true });
}

// DELETE — remove a KB entry (Admin only)
export async function DELETE(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    const existing = (await db.getAllKnowledgeBaseEntries()).find((e: any) => e.id === id);
    await db.deleteKnowledgeBaseEntry(id);
    db.logAudit({
      userId: admin.id,
      username: admin.username,
      action: 'kb_document_deleted',
      details: `Deleted "${existing?.title ?? id}" (${existing?.fileName ?? ''})`,
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('KB delete error:', e);
    return NextResponse.json({ error: 'Failed to delete entry.' }, { status: 500 });
  }
}

// PATCH — update title, description, and optionally the file
export async function PATCH(req: NextRequest) {
  let user;
  try { user = await requireSession(); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }

  if (!body?.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  if (!body?.title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 422 });

  try {
    db.updateKnowledgeBaseEntry({
      id:          body.id,
      title:       body.title.trim(),
      description: body.description?.trim() || '',
      fileName:    body.fileName,
      fileType:    body.fileType,
      filePath:    body.filePath,
    });
    try {
      db.logAudit({
        userId: user.id, username: user.username,
        action: 'kb_document_updated',
        details: `Updated "${body.title}"`,
      });
    } catch { /* audit must never block */ }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('KB update error:', e);
    return NextResponse.json({ error: 'Failed to update entry.' }, { status: 500 });
  }
}
