import * as vscode from 'vscode';
import * as path from 'path';
import { DebtCache } from './debtCache';

export class HeatmapDecorationProvider
  implements vscode.FileDecorationProvider {

  private _onDidChangeFileDecorations =
    new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
  readonly onDidChangeFileDecorations =
    this._onDidChangeFileDecorations.event;

  constructor(private cache: DebtCache) {
    cache.onDidChange(() => {
      this._onDidChangeFileDecorations.fire(undefined);
    });
  }

  provideFileDecoration(
    uri: vscode.Uri
  ): vscode.FileDecoration | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) { return undefined; }

    const root = workspaceFolders[0].uri.fsPath;

    // Always use forward slashes — critical on Windows
    const normUri  = uri.fsPath.replace(/\\/g, '/');
    const normRoot = root.replace(/\\/g, '/').replace(/\/$/, '');

    // Get path relative to workspace root
    let relPath = normUri.startsWith(normRoot)
      ? normUri.slice(normRoot.length).replace(/^\//, '')
      : path.basename(uri.fsPath);

    const score = this.cache.get(relPath);

    if (!score || score.score === 0) { return undefined; }

    return {
      badge: getBadge(score.score),
      color: new vscode.ThemeColor(getThemeColor(score.level)),
      tooltip:
        `DebtLens: ${score.level} debt (${score.score}/100)\n` +
        `Age: ${score.breakdown.age}  ` +
        `TODOs: ${score.breakdown.todos}  ` +
        `API: ${score.breakdown.apiSmells}`,
    };
  }
}

function getBadge(score: number): string {
  if (score >= 80) { return '●'; }
  if (score >= 60) { return '●'; }
  if (score >= 40) { return '◐'; }
  if (score >= 20) { return '·'; }
  return '';
}

function getThemeColor(level: string): string {
  switch (level) {
    case 'critical': return 'errorForeground';
    case 'high':     return 'problemsWarningIcon.foreground';
    case 'moderate': return 'problemsWarningIcon.foreground';
    case 'minor':    return 'problemsInfoIcon.foreground';
    default:         return 'foreground';
  }
}