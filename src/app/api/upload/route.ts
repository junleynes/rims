import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import * as db from '@/lib/server-db';

export const dynamic = 'force-dynamic';

// Files stored outside public/ so they are NOT directly accessible via URL.
// Served through /api/files-serve which checks session first.
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/**
 * Convert any string to a lowercase hyphen-slug, stripping everything
 * that isn't a letter, digit, or hyphen, and collapsing runs of hyphens.
 */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Build the stored filename on disk:
 *
 *   {section-or-division}_{uploader}_{original-basename}_{YYYYMMDD-HHmm}.{ext}
 *
 * The display name returned to the client stays as the original file.name
 * so the Knowledge Base card, resource log, and download prompt are unchanged.
 */
function buildStoredName(
  originalName: string,
  uploaderName: string,
  section: string,
  division: string,
): string {
  const ext      = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, path.extname(originalName));

  const sectionSlug  = slugify(section && section !== 'None' ? section : division || 'general');
  const uploaderSlug = slugify(uploaderName || 'unknown');
  const fileSlug     = slugify(baseName).slice(0, 40); // cap to keep paths sane

  // Local timestamp — YYYYMMDD-HHmm
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts  = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;

  return `${sectionSlug}_${uploaderSlug}_${fileSlug}_${ts}${ext}`;
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireSession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file     = formData.get('file') as File | null;
    const folder   = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Enforce server-side size limit (client check is bypassable)
    const { maxUploadSize } = await db.getSystemConfig();
    const maxBytes = (maxUploadSize || 20) * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File exceeds the ${maxUploadSize || 20}MB limit set by the administrator.` },
        { status: 413 },
      );
    }

    // Sanitize folder name
    const safeFolder = folder.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();

    // Build the meaningful stored filename
    const storedName = buildStoredName(
      file.name,
      user.name || user.username,
      user.section  || '',
      user.division || '',
    );

    // Ensure upload directory exists
    const targetDir = path.join(UPLOAD_DIR, safeFolder);
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }

    // Write file to disk under the renamed slug
    const bytes    = await file.arrayBuffer();
    const buffer   = Buffer.from(bytes);
    await writeFile(path.join(targetDir, storedName), buffer);

    const relativePath = `${safeFolder}/${storedName}`;

    return NextResponse.json({
      success:  true,
      filePath: relativePath,   // slug path used internally for serving/deleting
      fileName: file.name,      // original name shown in UI, logs, and download prompt
      fileType: path.extname(file.name).replace('.', '').toLowerCase(),
      size:     file.size,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
