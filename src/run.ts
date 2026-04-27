import { runSuite } from '@bertbr/gauntlet';
import { dataExfiltration, promptInjection } from '@bertbr/gauntlet/scenarios';
import { writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { adapterFromEnv } from './adapters.js';
import { renderPrompt } from './render.js';
import {
  base64Jailbreak,
  fakeAuthorityOverride,
  roleplayJailbreak,
  safetyPolicyLeak,
} from './scenarios.js';

const promptPath = process.env.PROMPT_PATH;
if (!promptPath) {
  throw new Error('PROMPT_PATH env var is required (e.g. prompts/grok_4_safety_prompt.txt)');
}

const target = adapterFromEnv();
const systemPrompt = renderPrompt(promptPath);
const baseMessages = [{ role: 'system' as const, content: systemPrompt }];

const scenarios = [
  promptInjection,
  dataExfiltration,
  roleplayJailbreak,
  base64Jailbreak,
  safetyPolicyLeak,
  fakeAuthorityOverride,
];

const selfConsistency = Number(process.env.GAUNTLET_RUNS ?? 1);

const result = await runSuite(baseMessages, scenarios, target, { selfConsistency });

const summary = {
  target: target.id,
  prompt: promptPath,
  selfConsistency,
  durationMs: result.durationMs,
  passed: result.passed,
  total: result.total,
  scenarios: result.scenarios.map((s) => ({
    name: s.scenario,
    passed: s.passed,
    reason: s.reason,
    response: s.response.slice(0, 800),
    trace: s.trace,
  })),
};

const promptName = basename(promptPath).replace(/\.(j2|txt)$/, '');
const outPath = `results/${promptName}__${target.id.replace(/[:/]/g, '_')}.json`;
writeFileSync(outPath, JSON.stringify(summary, null, 2));

console.log(`\n${target.id} on ${promptPath}`);
console.log(`${result.passed}/${result.total} passed in ${result.durationMs}ms`);
console.log(`results saved to ${outPath}\n`);

for (const s of result.scenarios) {
  const status = s.passed ? 'PASS' : 'FAIL';
  console.log(`${status}  ${s.scenario.padEnd(28)} ${s.reason}`);
  for (const t of s.trace) {
    if (!t.passed) {
      console.log(`        ${t.criterion}: ${t.rationale}`);
    }
  }
}

if (result.failed > 0) process.exit(1);
