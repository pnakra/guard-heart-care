import { describe, it, expect } from 'vitest';
import { calculateGFS, calculateAdjustedGFS, getGFSBand } from '@/services/gfsCalculator';
import { EthicsReviewResultV2 } from '@/types/ethicsV2';
import { IssueStatus } from '@/contexts/IssueStatusContext';

function makeResult(opts: {
  riskScore: number;
  modifiers?: { vulnerablePopulation: number; sensitiveContent: number; lackOfAuth: number };
  resolvedCount?: number;
}): EthicsReviewResultV2 {
  return {
    executiveSummary: { riskScore: opts.riskScore },
    deploymentContext: opts.modifiers ? { riskModifiers: opts.modifiers } : undefined,
    versionComparison: {
      resolvedIssues: Array.from({ length: opts.resolvedCount ?? 0 }, (_, i) => ({ id: `r${i}` })),
    },
  } as unknown as EthicsReviewResultV2;
}

describe('calculateGFS', () => {
  it('uses riskScore x 10 as the base with neutral modifiers', () => {
    const result = makeResult({ riskScore: 5, modifiers: { vulnerablePopulation: 1, sensitiveContent: 1, lackOfAuth: 1 } });
    expect(calculateGFS(result)).toBe(50);
  });

  it('adds (modifier - 1) x 10 points per deployment modifier', () => {
    const result = makeResult({ riskScore: 5, modifiers: { vulnerablePopulation: 1.3, sensitiveContent: 1, lackOfAuth: 1 } });
    expect(calculateGFS(result)).toBe(53); // 50 + round(3)
  });

  it('subtracts 2 points per resolved issue, capped at 10', () => {
    expect(calculateGFS(makeResult({ riskScore: 5, resolvedCount: 3 }))).toBe(44); // 50 - 6
    expect(calculateGFS(makeResult({ riskScore: 5, resolvedCount: 20 }))).toBe(40); // 50 - min(40,10)
  });

  it('clamps to [0, 100]', () => {
    const high = makeResult({ riskScore: 10, modifiers: { vulnerablePopulation: 2, sensitiveContent: 2, lackOfAuth: 2 } });
    expect(calculateGFS(high)).toBe(100); // 100 + 30 -> clamp
    expect(calculateGFS(makeResult({ riskScore: 0 }))).toBe(0);
  });

  it('works with no deployment context', () => {
    expect(calculateGFS(makeResult({ riskScore: 4 }))).toBe(40);
  });
});

describe('calculateAdjustedGFS', () => {
  const statuses: Record<string, IssueStatus> = {
    a: 'accepted-risk',
    b: 'unreviewed',
    c: 'fixed',
    d: 'wont-fix',
  };

  it('reduces the score by 50% weight per excluded issue', () => {
    // 2 of 4 excluded (accepted-risk + wont-fix) -> factor 0.5 -> raw * (1 - 0.25)
    expect(calculateAdjustedGFS(80, 4, statuses, ['a', 'b', 'c', 'd'])).toBe(60);
  });

  it('returns null when nothing is excluded', () => {
    expect(calculateAdjustedGFS(80, 2, { x: 'fixed', y: 'unreviewed' }, ['x', 'y'])).toBeNull();
  });

  it('returns null when there are no issues', () => {
    expect(calculateAdjustedGFS(80, 0, statuses, [])).toBeNull();
  });
});

describe('getGFSBand', () => {
  it('maps scores to severity bands at the documented boundaries', () => {
    expect(getGFSBand(0)).toBe('low');
    expect(getGFSBand(30)).toBe('low');
    expect(getGFSBand(31)).toBe('moderate');
    expect(getGFSBand(60)).toBe('moderate');
    expect(getGFSBand(61)).toBe('high');
    expect(getGFSBand(85)).toBe('high');
    expect(getGFSBand(86)).toBe('critical');
    expect(getGFSBand(100)).toBe('critical');
  });
});
