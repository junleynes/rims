import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Files stored outside public/ so they are NOT directly accessible via URL
// They are served through /api/files/[...path] which checks session first
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function POST(req: NextRequest) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Sanitize folder name
    const safeFolder = folder.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();

    // Generate unique filename preserving extension
    const ext = path.extname(file.name).toLowerCase();
    const safeName = path.basename(file.name, ext).replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const fileName = `${safeName}_${uniqueId}${ext}`;

    // Ensure upload directory exists
    const targetDir = path.join(UPLOAD_DIR, safeFolder);
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(targetDir, fileName);
    await writeFile(filePath, buffer);

    // Return the relative path (used to retrieve via /api/files/...)
    const relativePath = `${safeFolder}/${fileName}`;

    return NextResponse.json({
      success: true,
      filePath: relativePath,
      fileName: file.name,
      fileType: ext.replace('.', ''),
      size: file.size,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message ?? 'Upload failed' }, { status: 500 });
  }
}
