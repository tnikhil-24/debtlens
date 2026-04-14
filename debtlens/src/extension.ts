import * as vscode from 'vscode';
import { analyseGitAge } from './analysers/gitAnalyser';
import { scanTodos } from './analysers/todoScanner';
import { computeDebtScore, DebtScore } from './analysers/debtScorer';
import { DebtCache } from './debtCache';
import { HeatmapDecorationProvider } from './heatmapDecorationProvider';
import { createStatusBar } from './statusBar';
import { ApiKeyManager } from './apiKeyManager';
import { openAiPanel }   from './aiPanel';
import { getMachineId }  from './machineId';

export async function activate(context: vscode.ExtensionContext) {
  console.log('DebtLens is now active');

  const cache = new DebtCache();
  const keyManager = new ApiKeyManager(context.secrets);
  const machineId  = await getMachineId(context);
  const decorationProvider = new HeatmapDecorationProvider(cache);
  createStatusBar(cache, context);

  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(decorationProvider)
  );

  const runScan = async () => {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root) {
      vscode.window.showErrorMessage(
        'DebtLens: Please open a folder first.'
      );
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'DebtLens: Scanning workspace...',
        cancellable: false,
      },
      async () => {
        const [gitMap, todoMap] = await Promise.all([
          analyseGitAge(root),
          scanTodos(root),
        ]);

        const allFiles = new Set([
          ...gitMap.keys(),
          ...todoMap.keys(),
        ]);

        const scores: DebtScore[] = [];
        for (const filePath of allFiles) {
          const score = computeDebtScore(
            filePath,
            gitMap.get(filePath),
            todoMap.get(filePath)
          );
          scores.push(score);
        }

        scores.sort((a, b) => b.score - a.score);
        cache.setAll(scores);

        const critical = scores.filter(s => s.level === 'critical').length;
        const high     = scores.filter(s => s.level === 'high').length;
        const msg = `DebtLens: ${scores.length} files scanned. ` +
          `${critical} critical, ${high} high debt files.`;

        vscode.window.showInformationMessage(msg);
        console.log('=== DebtLens Results ===');
        scores.slice(0, 10).forEach(s => {
          console.log(
            `[${s.level.toUpperCase().padEnd(8)}] ` +
            `${s.score.toString().padStart(3)}/100  ${s.filePath}`
          );
        });
      }
    );
  };

  const scanCommand = vscode.commands.registerCommand(  
    'debtlens.scan', runScan
  );

  const clearCommand = vscode.commands.registerCommand(
    'debtlens.clear', () => {
      cache.clear();
      vscode.window.showInformationMessage('DebtLens: Heatmap cleared.');
    }
  );

  context.subscriptions.push(scanCommand, clearCommand);

   const explainCommand = vscode.commands.registerCommand(
    'debtlens.explain',
    async () => {
      const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!root) { return; }

      const normRoot = root.replace(/\\/g, '/');
      const activeUri = vscode.window.activeTextEditor?.document.uri.fsPath;
      const relPath = activeUri
        ? activeUri.replace(/\\/g, '/').split(normRoot + '/')[1]
        : undefined;

      if (!relPath) {
        vscode.window.showErrorMessage(
          'DebtLens: Open a file first, then run Explain.'
        );
        return;
      }

      const score = cache.get(relPath);
      if (!score) {
        vscode.window.showWarningMessage(
          'DebtLens: No debt data for this file. Run a scan first.'
        );
        return;
      }

      await openAiPanel(score, root, keyManager, machineId);
    }
  );

  const setKeyCommand = vscode.commands.registerCommand(
    'debtlens.setApiKey', () => keyManager.promptForKey()
  );

  const clearKeyCommand = vscode.commands.registerCommand(
    'debtlens.clearApiKey', () => keyManager.clearKey()
  );

  context.subscriptions.push(explainCommand, setKeyCommand, clearKeyCommand);

   // Re-scan when any TS/JS file is saved
  const watcher = vscode.workspace.createFileSystemWatcher(
    '**/*.{ts,tsx,js,jsx}'
  );

  let debounceTimer: NodeJS.Timeout;
  watcher.onDidChange(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runScan, 2000);
  });
  watcher.onDidCreate(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runScan, 2000);
  });
  watcher.onDidDelete(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runScan, 2000);
  });

  context.subscriptions.push(watcher);

  // Auto-scan on startup if workspace has files
  if (vscode.workspace.workspaceFolders?.length) {
    await runScan();
  }
}

export function deactivate() {}