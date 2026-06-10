import type { AiConfig } from './types';

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function callAi(config: AiConfig, messages: AiMessage[], systemPrompt?: string): Promise<string> {
  if (!config.enabled) throw new Error('AI is not enabled. Configure it in Settings > AI.');
  if (!config.apiKey && config.provider !== 'ollama') throw new Error('AI API key is not configured.');

  switch (config.provider) {
    case 'anthropic': return callAnthropic(config, messages, systemPrompt);
    case 'openai': return callOpenAI(config, messages, systemPrompt);
    case 'ollama': return callOllama(config, messages, systemPrompt);
    default: throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}

async function callAnthropic(config: AiConfig, messages: AiMessage[], systemPrompt?: string): Promise<string> {
  const body: any = {
    model: config.model || 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages,
  };
  if (systemPrompt) body.system = systemPrompt;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

async function callOpenAI(config: AiConfig, messages: AiMessage[], systemPrompt?: string): Promise<string> {
  const allMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o',
      max_tokens: 1500,
      messages: allMessages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callOllama(config: AiConfig, messages: AiMessage[], systemPrompt?: string): Promise<string> {
  const baseUrl = (config.ollamaBaseUrl || 'http://localhost:11434').replace(/\/$/, '');
  const allMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model || 'llama3',
      messages: allMessages,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.message?.content ?? '';
}
