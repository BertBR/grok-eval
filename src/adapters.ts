import { GoogleGenAI } from '@google/genai';
import { geminiAdapter } from '@bertbr/gauntlet/adapters/gemini';
import { openaiAdapter } from '@bertbr/gauntlet/adapters/openai';
import OpenAI from 'openai';
import type { ModelAdapter } from '@bertbr/gauntlet';

export function adapterFromEnv(): ModelAdapter {
  const provider = process.env.GAUNTLET_PROVIDER ?? 'xai';
  const model = process.env.GAUNTLET_MODEL ?? 'grok-4-fast';

  if (provider === 'xai') {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new Error('XAI_API_KEY is required for provider=xai');
    const client = new OpenAI({ apiKey, baseURL: 'https://api.x.ai/v1' });
    return openaiAdapter({ client, model });
  }

  if (provider === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is required for provider=openrouter');
    const client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/BertBR/grok-eval',
        'X-Title': 'grok-eval',
      },
    });
    return openaiAdapter({ client, model });
  }

  if (provider === 'google') {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is required for provider=google');
    return geminiAdapter({ client: new GoogleGenAI({ apiKey }), model });
  }

  throw new Error(`unknown provider: ${provider} (expected xai | openrouter | google)`);
}
