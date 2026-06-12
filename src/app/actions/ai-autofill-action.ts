'use server';

import * as db from '@/lib/server-db';
import { callAi } from '@/lib/ai-provider';
import { requireSession } from '@/lib/session';

export async function autofillBudgetFields(params: {
  category: string;
  classification: string;
  account: string;
  projectTitle?: string;
}): Promise<{ projectTitle?: string; itemDescription?: string; error?: string }> {
  await requireSession();
  const config = await db.getAiConfig();

  if (!config.enabled) {
    return { error: 'AI is not enabled. Go to Admin → Settings → AI to configure it.' };
  }

  const { category, classification, account, projectTitle } = params;

  const prompt = `You are helping fill out a budget entry form for a broadcast/media organization's IT resource management system (Philippine setting, amounts in PHP).

Given:
- Category: ${category}
- Classification: ${classification}
- Account/Sub-category: ${account}
${projectTitle ? `- Partial project title: "${projectTitle}"` : ''}

Generate a realistic budget entry. Respond ONLY with a valid JSON object with these two fields:
{
  "projectTitle": "a concise professional title for this resource (max 10 words)",
  "itemDescription": "a detailed technical description including brand/model suggestions, specifications, and purpose (2-3 sentences)"
}

No markdown, no preamble, only the JSON object.`;

  try {
    const response = await callAi(config, [{ role: 'user', content: prompt }]);
    const clean = response.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return {
      projectTitle: parsed.projectTitle ?? undefined,
      itemDescription: parsed.itemDescription ?? undefined,
    };
  } catch (err: any) {
    return { error: err.message ?? 'AI autofill failed. Try again.' };
  }
}
