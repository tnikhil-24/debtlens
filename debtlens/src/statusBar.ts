import * as vscode from 'vscode';
import { DebtCache } from './debtCache';

export function createStatusBar(
  cache: DebtCache,
  context: vscode.ExtensionContext
): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );

  item.command = 'debtlens.scan';
  item.text = '$(search) DebtLens';
  item.tooltip = 'Click to scan workspace for tech debt';
  item.show();

  cache.onDidChange(() => {
    const scores = cache.getAll();
    if (scores.length === 0) {
      item.text = '$(search) DebtLens';
      return;
    }

    const avg = Math.round(
      scores.reduce((sum, s) => sum + s.score, 0) / scores.length
    );
    const critical = scores.filter(s => s.level === 'critical').length;
    const high     = scores.filter(s => s.level === 'high').length;

    if (critical > 0) {
      item.text = `$(error) DebtLens ${avg}/100 — ${critical} critical`;
      item.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.errorBackground'
      );
    } else if (high > 0) {
      item.text = `$(warning) DebtLens ${avg}/100 — ${high} high`;
      item.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.warningBackground'
      );
    } else {
      item.text = `$(check) DebtLens ${avg}/100`;
      item.backgroundColor = undefined;
    }
  });

  context.subscriptions.push(item);
  return item;
}