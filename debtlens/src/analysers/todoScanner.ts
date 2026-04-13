import * as fs from 'fs';
import * as path from 'path';

export interface TodoResult {
  filePath: string;
  todoCount: number;
  lineNumbers: number[];
  normalizedDensity: number;
}

const IGNORE_DIRS = [
  'node_modules', '.git', 'dist', 'out', 'build', '.debtlens'
];

export async function scanTodos(
  workspaceRoot: string
): Promise<Map<string, TodoResult>> {
  const results = new Map<string, TodoResult>();
  const files = getAllTsFiles(workspaceRoot);

  for (const absPath of files) {
    try {
      const content = fs.readFileSync(absPath, 'utf8');
      const lines = content.split('\n');
      const todoLines: number[] = [];
      const TODO_PATTERN = /\/\/\s*(TODO|FIXME|HACK|XXX|BUG)[\s:]/gi;

      lines.forEach((line, idx) => {
        if (TODO_PATTERN.test(line)) {
          todoLines.push(idx + 1);
        }
        TODO_PATTERN.lastIndex = 0;
      });

      const relPath = path
        .relative(workspaceRoot, absPath)
        .replace(/\\/g, '/');

      const totalLines = Math.max(lines.length, 1);
      const rawDensity = todoLines.length / totalLines;

      results.set(relPath, {
        filePath: relPath,
        todoCount: todoLines.length,
        lineNumbers: todoLines,
        normalizedDensity: Math.min(rawDensity * 20, 1),
      });
    } catch {
      // skip unreadable files
    }
  }

  return results;
}

function getAllTsFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(current: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (IGNORE_DIRS.includes(entry.name)) {continue;}
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(full);
      }
    }
  }

  walk(dir);
  return files;
}