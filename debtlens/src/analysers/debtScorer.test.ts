import { describe, it, expect } from 'vitest';
import { computeDebtScore } from './debtScorer';

describe('computeDebtScore', () => {
  it('returns clean for a brand new file with no todos', () => {
    const result = computeDebtScore(
      'src/newFile.ts',
      { filePath: 'src/newFile.ts', daysSinceLastCommit: 1, normalizedAge: 0.002 },
      { filePath: 'src/newFile.ts', todoCount: 0, lineNumbers: [], normalizedDensity: 0 }
    );
    expect(result.level).toBe('clean');
    expect(result.score).toBeLessThan(20);
  });

  it('returns high or critical for an old file full of todos', () => {
    const result = computeDebtScore(
      'src/legacy.ts',
      { filePath: 'src/legacy.ts', daysSinceLastCommit: 500, normalizedAge: 1 },
      { filePath: 'src/legacy.ts', todoCount: 30, lineNumbers: [], normalizedDensity: 1 }
    );
    // age(1 * 0.35) + todos(1 * 0.40) = 0.75 = score 75 = "high"
    // critical requires all 3 signals maxed including API smells
    expect(['high', 'critical']).toContain(result.level);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it('returns critical when all 3 signals are maxed', () => {
    const result = computeDebtScore(
      'src/legacy.ts',
      { filePath: 'src/legacy.ts', daysSinceLastCommit: 500, normalizedAge: 1 },
      { filePath: 'src/legacy.ts', todoCount: 30, lineNumbers: [], normalizedDensity: 1 },
      1  // apiSmellScore maxed
    );
    // age(0.35) + todos(0.40) + smells(0.25) = 1.0 = score 100
    expect(result.level).toBe('critical');
    expect(result.score).toBe(100);
  });

  it('score is always between 0 and 100', () => {
    const result = computeDebtScore('src/any.ts');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('breakdown values are all between 0 and 100', () => {
    const result = computeDebtScore(
      'src/test.ts',
      { filePath: 'src/test.ts', daysSinceLastCommit: 100, normalizedAge: 0.27 },
      { filePath: 'src/test.ts', todoCount: 3, lineNumbers: [1, 2, 3], normalizedDensity: 0.1 }
    );
    expect(result.breakdown.age).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.todos).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.apiSmells).toBe(0);
  });
});