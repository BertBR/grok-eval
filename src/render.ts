import { readFileSync } from 'node:fs';
import nunjucks from 'nunjucks';

nunjucks.configure({ autoescape: false, throwOnUndefined: false });

const DEFAULT_VARS: Record<string, unknown> = {
  date: new Date().toISOString().slice(0, 10),
  custom_personality: '',
  user_info: '',
  url: '',
  ga_number_of_bullet_points: '3',
  is_subjective: false,
  enable_citation: false,
  chart_tool_enabled: false,
};

export function renderPrompt(path: string, overrides: Record<string, unknown> = {}): string {
  const source = readFileSync(path, 'utf-8');
  if (!path.endsWith('.j2')) return source;
  return nunjucks.renderString(source, { ...DEFAULT_VARS, ...overrides });
}
