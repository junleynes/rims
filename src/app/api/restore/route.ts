import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { existsSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

const ROOT = process.cwd();
const DB_PATH = path.join(ROOT, 'data.db');
const UPLOADS_PATH = path.join(ROOT, 'uploads');

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No backup file was uploaded.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch {
      return NextResponse.json({ error: 'That file is not a valid zip archive.' }, { status: 400 });
    }

    const dbEntry = zip.getEntry('data.db');
    if (!dbEntry) {
      return NextResponse.json(
        { error: "This doesn't look like a R.I.M.S backup — no data.db was found inside the zip." },
        { status: 400 }
      );
    }

    // Safety net: keep a copy of the current database before overwriting it,
    // in case the uploaded backup turns out to be the wrong one.
    if (existsSync(DB_PATH)) {
      const safetyCopyPath = path.join(ROOT, `data.db.before-restore-${Date.now()}.bak`);
      copyFileSync(DB_PATH, safetyCopyPath);

      // Unlink rather than truncate-in-place. The live process still has
      // this exact file open via better-sqlite3 — truncating that same
      // inode out from under an active connection risks corrupting
      // whatever it's reading or writing at that moment. Deleting the path
      // instead leaves the running connection's open handle untouched
      // (Linux keeps unlinked-but-open inodes alive) and lets the restored
      // file land at a clean new inode, fully isolated until restart.
      rmSync(DB_PATH);
    }

    writeFileSync(DB_PATH, dbEntry.getData());

    // The live process may still be holding an open WAL/SHM pair tied to the
    // database file we just replaced — clear them out so a restarted process
    // starts clean against the restored data.db rather than stale sidecar
    // files left over from before the restore.
    for (const suffix of ['-wal', '-shm']) {
      const sidecar = `${DB_PATH}${suffix}`;
      if (existsSync(sidecar)) {
        try { rmSync(sidecar); } catch { /* best effort */ }
      }
    }

    // Restore uploads, if the backup included any.
    const uploadEntries = zip.getEntries().filter(e => !e.isDirectory && e.entryName.startsWith('uploads/'));
    for (const entry of uploadEntries) {
      const relativePath = entry.entryName.replace(/^uploads\//, '');
      if (!relativePath) continue;
      const destPath = path.join(UPLOADS_PATH, relativePath);
      mkdirSync(path.dirname(destPath), { recursive: true });
      writeFileSync(destPath, entry.getData());
    }

    return NextResponse.json({
      success: true,
      uploadsRestored: uploadEntries.length,
    });
  } catch (err: any) {
    console.error('Restore error:', err);
    return NextResponse.json({ error: `Restore failed: ${err.message}` }, { status: 500 });
  }
}
