import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import * as db from '@/lib/server-db';

const ROOT = process.cwd();

function addDirToZip(zip: AdmZip, dirPath: string, zipPrefix: string) {
  if (!existsSync(dirPath)) return;
  const entries = readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      addDirToZip(zip, fullPath, `${zipPrefix}/${entry}`);
    } else {
      const content = readFileSync(fullPath);
      zip.addFile(`${zipPrefix}/${entry}`, content);
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const zip = new AdmZip();
    const date = new Date().toISOString().split('T')[0];

    // The connection runs in WAL mode, so recently committed transactions
    // may still be sitting in data.db-wal rather than data.db itself.
    // Checkpoint first so the file we're about to zip is self-contained.
    db.checkpointWal();

    // Add data.db
    const dbPath = path.join(ROOT, 'data.db');
    if (existsSync(dbPath)) {
      zip.addFile('data.db', readFileSync(dbPath));
    }

    // Add uploads directory
    const uploadsPath = path.join(ROOT, 'uploads');
    addDirToZip(zip, uploadsPath, 'uploads');

    // Add settings JSON (redact secrets)
    const [branding, systemConfig, smtp, aiConfig] = await Promise.all([
      db.getBranding(),
      db.getSystemConfig(),
      db.getSmtpConfig(),
      db.getAiConfig(),
    ]);

    const settings = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      branding,
      systemConfig,
      smtp: { ...smtp, password: '[REDACTED]' },
      aiConfig: { ...aiConfig, apiKey: '[REDACTED]' },
    };
    zip.addFile('settings.json', Buffer.from(JSON.stringify(settings, null, 2)));

    const zipBuffer = zip.toBuffer();
    const zipName = `rims-backup-${date}.zip`;

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipName}"`,
        'Content-Length': zipBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('Backup error:', err);
    return NextResponse.json({ error: `Backup failed: ${err.message}` }, { status: 500 });
  }
}
