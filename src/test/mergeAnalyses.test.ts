import { describe, it, expect } from 'vitest';
import {
  mergeAnalyses,
  CATEGORY_GROUPS,
  DEFAULT_MERGE_CAPS,
} from '../../supabase/functions/_shared/mergeAnalyses';

type AnyRecord = Record<string, unknown>;

function pass(overrides: AnyRecord = {}): AnyRecord {
  return {
    executiveSummary: {
      topThreeRisks: [],
      riskScore: 0,
      totalIssueCount: 0,
      criticalCount: 0,
      highCount: 0,
    },
    capabilities: [],
    misuseScenarios: [],
    issues: [],
    riskChains: [],
    ...overrides,
  };
}

describe('mergeAnalyses', () => {
  it('combines issues from multiple passes', () => {
    const a = pass({ issues: [{ id: '1', category: 'surveillance', title: 'Track location', severity: 'high' }] });
    const b = pass({ issues: [{ id: '2', category: 'false-authority', title: 'AI as doctor', severity: 'critical' }] });

    const merged = mergeAnalyses([a, b], 'health');
    expect(merged.issues).toHaveLength(2);
    expect(merged.executiveSummary).toMatchObject({ totalIssueCount: 2, criticalCount: 1, highCount: 1 });
  });

  it('dedupes issues with the same category + title', () => {
    const a = pass({ issues: [{ id: '1', category: 'surveillance', title: 'Track Location', severity: 'high' }] });
    const b = pass({ issues: [{ id: '2', category: 'surveillance', title: 'track location', severity: 'medium' }] });

    const merged = mergeAnalyses([a, b], 'general');
    expect(merged.issues).toHaveLength(1);
    // keeps the first occurrence
    expect((merged.issues as AnyRecord[])[0].id).toBe('1');
  });

  it('sorts merged issues by severity (critical first)', () => {
    const a = pass({ issues: [{ id: 'low', category: 'dark-patterns', title: 'Low one', severity: 'low' }] });
    const b = pass({ issues: [{ id: 'crit', category: 'admin-abuse', title: 'Crit one', severity: 'critical' }] });

    const merged = mergeAnalyses([a, b], 'general');
    expect((merged.issues as AnyRecord[]).map((i) => i.id)).toEqual(['crit', 'low']);
  });

  it('takes the highest riskScore across passes', () => {
    const a = pass({ executiveSummary: { riskScore: 3, topThreeRisks: [] } });
    const b = pass({ executiveSummary: { riskScore: 7, topThreeRisks: [] } });
    expect((mergeAnalyses([a, b], 'general').executiveSummary as AnyRecord).riskScore).toBe(7);
  });

  it('dedupes capabilities by name and scenarios by title', () => {
    const a = pass({
      capabilities: [{ id: 'c1', name: 'Location', riskLevel: 'high' }],
      misuseScenarios: [{ id: 's1', title: 'Stalking', severity: 'high' }],
    });
    const b = pass({
      capabilities: [{ id: 'c2', name: 'location', riskLevel: 'medium' }],
      misuseScenarios: [{ id: 's2', title: 'Stalking', severity: 'high' }],
    });
    const merged = mergeAnalyses([a, b], 'general');
    expect(merged.capabilities).toHaveLength(1);
    expect(merged.misuseScenarios).toHaveLength(1);
  });

  it('builds topThreeRisks from the highest-severity merged issues', () => {
    const a = pass({
      issues: [
        { id: '1', category: 'admin-abuse', title: 'Crit', severity: 'critical', description: 'bad' },
        { id: '2', category: 'dark-patterns', title: 'Med', severity: 'medium', description: 'meh' },
      ],
      executiveSummary: {
        riskScore: 5,
        topThreeRisks: [{ title: 'Crit', severity: 'critical', effortToFix: 'high', summary: 'authored summary' }],
      },
    });
    const merged = mergeAnalyses([a], 'general');
    const risks = (merged.executiveSummary as AnyRecord).topThreeRisks as AnyRecord[];
    expect(risks[0]).toMatchObject({ title: 'Crit', effortToFix: 'high', summary: 'authored summary' });
    // second risk synthesized from the issue when no authored risk exists
    expect(risks[1]).toMatchObject({ title: 'Med', effortToFix: 'medium' });
  });

  it('respects the issue cap', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      id: `i${i}`, category: 'dark-patterns', title: `Issue ${i}`, severity: 'medium',
    }));
    const merged = mergeAnalyses([pass({ issues: many })], 'general');
    expect((merged.issues as AnyRecord[]).length).toBe(DEFAULT_MERGE_CAPS.issues);
  });

  it('handles a single successful pass (degraded mode)', () => {
    const a = pass({ issues: [{ id: '1', category: 'surveillance', title: 'Only one', severity: 'high' }] });
    const merged = mergeAnalyses([a], 'general');
    expect(merged.issues).toHaveLength(1);
    expect(merged.detectedCategory).toBe('general');
  });

  it('tolerates malformed passes without throwing', () => {
    const merged = mergeAnalyses(
      [pass(), { issues: null, capabilities: 'nope', executiveSummary: 5 } as unknown as AnyRecord],
      'general',
    );
    expect(merged.issues).toHaveLength(0);
    expect((merged.executiveSummary as AnyRecord).totalIssueCount).toBe(0);
  });

  it('covers all 8 harm categories across the groups with no overlap', () => {
    const all = CATEGORY_GROUPS.flatMap((g) => g.categories);
    expect(new Set(all).size).toBe(all.length); // no duplicates
    expect(all).toEqual(expect.arrayContaining([
      'surveillance', 'manipulation', 'admin-abuse', 'dark-patterns',
      'false-authority', 'ai-hallucination', 'restrictive-masculinity', 'environmental-impact',
    ]));
    expect(all).toHaveLength(8);
  });
});
