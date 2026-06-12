import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

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

export async function GET(
  req: NextRequest,
  { params }: { params: { filePath: string[] } }
) {
  // Require valid session to serve any file
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const filePath = params.filePath;

  // Prevent path traversal attacks
  const relativePath = filePath.join('/');
  if (relativePath.includes('..') || relativePath.includes('~')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const absolutePath = path.join(UPLOAD_DIR, relativePath);

  // Ensure resolved path is inside UPLOAD_DIR
  if (!absolutePath.startsWith(UPLOAD_DIR)) {
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

    // Inline for images and PDFs, attachment for others
    const inline = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
    const disposition = inline
      ? `inline; filename="${fileName}"`
      : `attachment; filename="${fileName}"`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': disposition,
        'Cache-Control': 'private, max-age=3600',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { filePath: string[] } }
) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const relativePath = params.filePath.join('/');
  if (relativePath.includes('..') || relativePath.includes('~')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const absolutePath = path.join(UPLOAD_DIR, relativePath);
  if (!absolutePath.startsWith(UPLOAD_DIR)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  if (existsSync(absolutePath)) {
    const { unlink } = await import('fs/promises');
    await unlink(absolutePath);
  }

  return NextResponse.json({ success: true });
}
