import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { readFile } from 'fs/promises';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

const MIME_TYPES: Record<string, string> = {
  pdf:  'application/pdf',
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  gif:  'image/gif',
  webp: 'image/webp',
  doc:  'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls:  'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt:  'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt:  'text/plain',
  csv:  'text/csv',
  zip:  'application/zip',
};

function resolveFilePath(relativePath: string | null): string | null {
  if (!relativePath) return null;
  // Reject traversal attempts before resolving
  if (relativePath.includes('..') || relativePath.includes('~')) return null;
  const absolute = path.resolve(UPLOAD_DIR, relativePath);
  // Confirm path stays inside UPLOAD_DIR after resolution
  if (!absolute.startsWith(UPLOAD_DIR + path.sep) && absolute !== UPLOAD_DIR) return null;
  return absolute;
}

export async function GET(req: NextRequest) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const relativePath = req.nextUrl.searchParams.get('path');
  const absolutePath = resolveFilePath(relativePath);

  if (!absolutePath) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  if (!existsSync(absolutePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    const buffer = await readFile(absolutePath);
    const ext = path.extname(absolutePath).replace('.', '').toLowerCase();
    const mimeType = MIME_TYPES[ext] ?? 'application/octet-stream';
    const fileName = path.basename(absolutePath);
    const inline = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=3600',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const relativePath = req.nextUrl.searchParams.get('path');
  const absolutePath = resolveFilePath(relativePath);

  if (!absolutePath) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  if (existsSync(absolutePath)) {
    unlinkSync(absolutePath);
  }

  return NextResponse.json({ success: true });
}
