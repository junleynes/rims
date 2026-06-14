'use server';

import * as db from '@/lib/server-db';
import { callAi } from '@/lib/ai-provider';
import { requireSession } from '@/lib/session';

export async function autofillBudgetFields(params: {
  category: string;
  classification: string;
  account: string;
  projectTitle: string;
}): Promise<{ itemDescription?: string; error?: string }> {
  await requireSession();

  const { category, classification, account, projectTitle } = params;

  if (!projectTitle?.trim()) {
    return { error: 'Enter a project name or item first.' };
  }

  const config = await db.getAiConfig();
  if (!config.enabled) {
    return { error: 'AI is not enabled. Go to Admin → Settings → AI to configure it.' };
  }

  const prompt = `You are helping fill out a budget entry form for a broadcast/media organization's IT resource management system (Philippine setting).

Item/Project: "${projectTitle}"
Category: ${category}
Classification: ${classification}
Account: ${account}

Write a detailed technical item description for procurement purposes. Include:
- What it is and its specific purpose in a broadcast/media environment
- Suggested brand and model (realistic for Philippine IT procurement, e.g. Dell, HP, Cisco, Ubiquiti, etc.)
- Key technical specifications relevant to the item type
- How it fits the ${category} ${classification} classification

Keep it to 2-3 sentences, professional and specific.

Respond ONLY with a JSON object:
{"itemDescription": "your description here"}

No markdown, no preamble.`;

  try {
    const response = await callAi(config, [{ role: 'user', content: prompt }]);
    const clean = response.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { itemDescription: parsed.itemDescription ?? undefined };
  } catch (err: any) {
    return { error: err.message ?? 'AI generation failed. Try again.' };
  }
}
