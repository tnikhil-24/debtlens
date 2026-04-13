import * as vscode from 'vscode';
import { DebtScore } from './analysers/debtScorer';

export class DebtCache {
  private scores = new Map<string, DebtScore>();
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;

  set(filePath: string, score: DebtScore) {
    this.scores.set(filePath, score);
  }

  get(filePath: string): DebtScore | undefined {
    return this.scores.get(filePath);
  }

  getAll(): DebtScore[] {
    return Array.from(this.scores.values());
  }

  setAll(scores: DebtScore[]) {
    this.scores.clear();
    for (const s of scores) {
      this.scores.set(s.filePath, s);
    }
    this._onDidChange.fire();
  }

  clear() {
    this.scores.clear();
    this._onDidChange.fire();
  }

  get size(): number {
    return this.scores.size;
  }
}