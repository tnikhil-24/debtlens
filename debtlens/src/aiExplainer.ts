import { DebtScore } from './analysers/debtScorer';
import { UserProvider } from './apiKeyManager';

const WORKER_URL =
  'https://debtlens-worker.debtlens.workers.dev/explain';

export interface ExplainRequest {
  score: DebtScore;
  fileContent: string;
  machineId: string;
  userApiKey?: string;
  userProvider?: UserProvider;
}

function buildPrompt(score: DebtScore, fileContent: string): string {
  const lines   = fileContent.split('\n').length;
  const preview = fileContent.slice(0, 1500);

  return `You are a senior software engineer reviewing code for tech debt.

FILE: ${score.filePath}
DEBT SCORE: ${score.score}/100 (${score.level})
BREAKDOWN:
- Code age signal: ${score.breakdown.age}/100
- TODO/FIXME density: ${score.breakdown.todos}/100
- Deprecated API signal: ${score.breakdown.apiSmells}/100
- Total lines: ${lines}

FILE CONTENT (first 1500 chars):
\`\`\`typescript
${preview}
\`\`\`

Write a concise tech debt report. Include:
1. A 2-sentence plain-English summary of what the debt is
2. A numbered fix list ordered by priority (most impactful first)
3. A rough time estimate per fix (e.g. "~30 min")

Keep under 300 words. Be direct and actionable.`;
}

export async function* explainDebt(
  req: ExplainRequest
): AsyncGenerator<string> {
  const prompt = buildPrompt(req.score, req.fileContent);

  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      machineId:    req.machineId,
      userApiKey:   req.userApiKey,
      userProvider: req.userProvider,
    }),
  });

  // Rate limit hit
  if (response.status === 429) {
    const data = await response.json() as { message: string };
    throw new Error(data.message);
  }

  if (!response.ok || !response.body) {
    throw new Error(`Worker error: ${response.status} ${response.statusText}`);
  }

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) { break; }

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6).trim();
      if (data === '[DONE]') { return; }
      try {
        const json = JSON.parse(data);
        // Groq / OpenAI format
        const text = json.choices?.[0]?.delta?.content;
        if (text) { yield text; continue; }
        // Anthropic format
        if (json.type === 'content_block_delta') {
          const aText = json.delta?.text;
          if (aText) { yield aText; }
        }
      } catch { /* skip malformed chunks */ }
    }
  }
}