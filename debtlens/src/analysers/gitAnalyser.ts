import simpleGit from 'simple-git';
import * as path from 'path';

export interface GitResult {
  filePath: string;
  daysSinceLastCommit: number;
  normalizedAge: number;
}

const MAX_AGE_DAYS = 365;

export async function analyseGitAge(
  workspaceRoot: string
): Promise<Map<string, GitResult>> {
  const git = simpleGit(workspaceRoot);
  const results = new Map<string, GitResult>();

  try {
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      console.warn('DebtLens: workspace is not a git repo');
      return results;
    }

    const fileList = await git.raw([
      'ls-files'
    ]);

    const files = fileList.split('\n').filter(Boolean);
    const now = Date.now();

    for (const filePath of files) {
      if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) {continue;}

      try {
        const dateStr = await git.raw([
          'log', '-1', '--format=%ai', '--', filePath
        ]);

        if (!dateStr.trim()) {continue;}

        const lastCommitDate = new Date(dateStr.trim()).getTime();
        const daysSince = Math.floor(
          (now - lastCommitDate) / (1000 * 60 * 60 * 24)
        );
        const normalized = Math.min(daysSince / MAX_AGE_DAYS, 1);

        results.set(filePath, {
          filePath,
          daysSinceLastCommit: daysSince,
          normalizedAge: normalized,
        });
      } catch {
        // skip files with no history
      }
    }
  } catch (err) {
    console.error('DebtLens GitAnalyser error:', err);
  }

  return results;
}