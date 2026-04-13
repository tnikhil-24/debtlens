import { GitResult } from './gitAnalyser';
import { TodoResult } from './todoScanner';

export interface DebtScore {
  filePath: string;
  score: number;
  level: 'clean' | 'minor' | 'moderate' | 'high' | 'critical';
  color: string;
  breakdown: {
    age: number;
    todos: number;
    apiSmells: number;
  };
}

const WEIGHTS = { age: 0.35, todos: 0.40, apiSmells: 0.25 };

export function computeDebtScore(
  filePath: string,
  git?: GitResult,
  todo?: TodoResult,
  apiSmellScore: number = 0
): DebtScore {
  const age   = git?.normalizedAge       ?? 0;
  const todos = todo?.normalizedDensity  ?? 0;
  const smells = Math.min(apiSmellScore, 1);

  const raw =
    age    * WEIGHTS.age +
    todos  * WEIGHTS.todos +
    smells * WEIGHTS.apiSmells;

  const score = Math.round(raw * 100);

  return {
    filePath,
    score,
    level: getLevel(score),
    color: getColor(score),
    breakdown: {
      age:       Math.round(age    * 100),
      todos:     Math.round(todos  * 100),
      apiSmells: Math.round(smells * 100),
    },
  };
}

function getLevel(score: number): DebtScore['level'] {
  if (score >= 80) {return 'critical';}
  if (score >= 60) {return 'high';}
  if (score >= 40) {return 'moderate';}
  if (score >= 20) {return 'minor';}
  return 'clean';
}

function getColor(score: number): string {
  if (score >= 80) {return '#A32D2D';}
  if (score >= 60) {return '#D85A30';}
  if (score >= 40) {return '#BA7517';}
  if (score >= 20) {return '#3B6D11';}
  return '#0F6E56';
}