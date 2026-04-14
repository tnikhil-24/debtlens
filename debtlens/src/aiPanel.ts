import * as vscode from 'vscode';
import * as fs from 'fs';
import { DebtScore } from './analysers/debtScorer';
import { ApiKeyManager } from './apiKeyManager';
import { explainDebt } from './aiExplainer';

export async function openAiPanel(
  score: DebtScore,
  workspaceRoot: string,
  keyManager: ApiKeyManager,
  machineId: string
): Promise<void> {
  const userApiKey  = await keyManager.getUserKey();
  const userProvider = await keyManager.getUserProvider();

  const absPath = workspaceRoot.replace(/\\/g, '/') + '/' + score.filePath;
  let fileContent = '';
  try { fileContent = fs.readFileSync(absPath, 'utf8'); }
  catch { fileContent = '(file content unavailable)'; }

  const panel = vscode.window.createWebviewPanel(
    'debtlens.ai',
    `DebtLens ◐ ${score.filePath.split('/').pop()}`,
    vscode.ViewColumn.Beside,
    { enableScripts: true }
  );

  panel.webview.html = renderHtml(score, '', 'loading');
  let fullText = '';

  try {
    for await (const chunk of explainDebt({
      score, fileContent, machineId,
      userApiKey,
      userProvider,
    })) {
      fullText += chunk;
      panel.webview.html = renderHtml(score, fullText, 'streaming');
    }
    panel.webview.html = renderHtml(score, fullText, 'done');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    panel.webview.html = renderHtml(score, msg, 'error');
  }
}

function renderHtml(
  score: DebtScore,
  text: string,
  state: 'loading' | 'streaming' | 'done' | 'error'
): string {
  const color =
    score.score >= 80 ? '#A32D2D' :
    score.score >= 60 ? '#D85A30' :
    score.score >= 40 ? '#BA7517' : '#3B6D11';

  const bodyHtml =
    state === 'loading'
      ? `<div class="loading"><div class="spinner"></div><span>Analysing debt signals...</span></div>`
      : state === 'error'
      ? `<div class="error"><strong>Error:</strong> ${esc(text)}
         <p style="margin-top:8px;font-size:12px">Run <code>DebtLens: Set API Key</code> for unlimited use.</p></div>`
      : `<pre class="output">${esc(text)}${state === 'streaming' ? '▌' : ''}</pre>
         ${state === 'done'
           ? `<button onclick="navigator.clipboard.writeText(${JSON.stringify(text)})">Copy fix plan</button>`
           : ''}`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:var(--vscode-font-family);font-size:13px;
       color:var(--vscode-foreground);padding:16px;margin:0}
  .header{border-bottom:1px solid var(--vscode-panel-border);padding-bottom:10px;margin-bottom:14px}
  .filename{font-size:15px;font-weight:600;margin:0 0 3px}
  .meta{font-size:12px;color:var(--vscode-descriptionForeground)}
  .score{color:${color};font-weight:600}
  pre.output{white-space:pre-wrap;line-height:1.6;margin:0;
             font-family:var(--vscode-font-family);font-size:13px}
  button{margin-top:14px;padding:5px 14px;cursor:pointer;
         background:var(--vscode-button-background);
         color:var(--vscode-button-foreground);
         border:none;border-radius:4px;font-size:12px}
  button:hover{background:var(--vscode-button-hoverBackground)}
  .loading{display:flex;align-items:center;gap:10px;
           color:var(--vscode-descriptionForeground)}
  .spinner{width:14px;height:14px;border:2px solid currentColor;
           border-top-color:transparent;border-radius:50%;
           animation:spin 0.8s linear infinite;flex-shrink:0}
  @keyframes spin{to{transform:rotate(360deg)}}
  .error{color:var(--vscode-errorForeground)}
</style></head><body>
<div class="header">
  <p class="filename">${esc(score.filePath.split('/').pop() ?? score.filePath)}</p>
  <div class="meta">
    <span class="score">${score.level} · ${score.score}/100</span>
    &nbsp;·&nbsp;Age: ${score.breakdown.age}
    &nbsp;·&nbsp;TODOs: ${score.breakdown.todos}
    &nbsp;·&nbsp;API: ${score.breakdown.apiSmells}
  </div>
</div>
${bodyHtml}</body></html>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}