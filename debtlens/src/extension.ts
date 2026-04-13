import * as vscode from 'vscode';
import { analyseGitAge } from './analysers/gitAnalyser';
import { scanTodos } from './analysers/todoScanner';
import { computeDebtScore, DebtScore } from './analysers/debtScorer';

export async function activate(context: vscode.ExtensionContext) {
  console.log('DebtLens is now active');

  const scanCommand = vscode.commands.registerCommand(
    'debtlens.scan',
    async () => {
      const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!root) {
        vscode.window.showErrorMessage(
          'DebtLens: Please open a folder/workspace first.'
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

          console.log('=== DebtLens Results ===');
          scores.forEach(s => {
            console.log(
              `[${s.level.toUpperCase().padEnd(8)}] ${s.score
                .toString()
                .padStart(3)}/100  ${s.filePath}`
            );
          });

          const top3 = scores
            .slice(0, 3)
            .map(s => `${s.level} (${s.score}) — ${s.filePath}`)
            .join('\n');

          vscode.window.showInformationMessage(
            `DebtLens: ${scores.length} files scanned. Top debt:\n${top3}`
          );
        }
      );
    }
  );

  context.subscriptions.push(scanCommand);
}

export function deactivate() {}