import { NextRequest, NextResponse } from 'next/server';
import { callAi } from '@/lib/ai-provider';
import { requireAdmin } from '@/lib/session';
import { checkRateLimit } from '@/lib/rate-limit';
import type { AiConfig } from '@/lib/types';

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimit = checkRateLimit(`ai-test:${admin.id}`, 5, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false, error: `Too many requests. Try again in ${rateLimit.retryAfterSeconds}s.` }, { status: 429 });
  }

  try {
    const config: AiConfig = await req.json();
    const reply = await callAi(
      { ...config, enabled: true },
      [{ role: 'user', content: 'Reply with exactly: "RIMS AI connection OK"' }]
    );
    return NextResponse.json({ ok: true, reply: reply.trim().slice(0, 80) });
  } catch (err: any) {
    console.error('AI test error:', err);
    return NextResponse.json({ ok: false, error: 'AI connection test failed. Check your configuration and API key.' }, { status: 200 });
  }
}
