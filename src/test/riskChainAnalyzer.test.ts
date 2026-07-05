import { describe, it, expect } from 'vitest';
import {
  analyzeRiskChains,
  getChainsAffectedByFix,
  calculateTotalChainRisk,
} from '@/services/riskChainAnalyzer';
import { DetectedCapability, MisuseScenario } from '@/types/misuse';

function cap(id: string, riskLevel: DetectedCapability['riskLevel'] = 'high'): DetectedCapability {
  return { id, name: id, description: '', riskLevel, detectedIn: [] };
}

describe('analyzeRiskChains', () => {
  it('detects a known dangerous capability combination', () => {
    const chains = analyzeRiskChains([cap('location-tracking'), cap('user-profiles')], []);
    expect(chains).toHaveLength(1);
    expect(chains[0].capabilities.sort()).toEqual(['location-tracking', 'user-profiles']);
    expect(chains[0].severity).toBe('critical');
    // severityWeight critical (4.0) * (1 + 2 high caps * 0.3) = 4.0 * 1.6 = 6.4
    expect(chains[0].riskContribution).toBeCloseTo(6.4, 1);
    expect(chains[0].mitigationRequires).toMatch(/BOTH/);
  });

  it('returns no chains when required capabilities are absent', () => {
    expect(analyzeRiskChains([cap('location-tracking')], [])).toEqual([]);
  });

  it('does not duplicate a chain and sorts by risk contribution descending', () => {
    const scenario: MisuseScenario = {
      id: 's1',
      title: 'S',
      description: 'd',
      capabilities: ['messaging', 'user-search'],
      severity: 'high',
      mitigations: [],
    };
    const chains = analyzeRiskChains([cap('messaging'), cap('user-search')], [scenario]);
    // The known chain (messaging + user-search) is matched once; the scenario
    // with the same pair is deduped by chain key.
    expect(chains).toHaveLength(1);
    for (let i = 1; i < chains.length; i++) {
      expect(chains[i - 1].riskContribution).toBeGreaterThanOrEqual(chains[i].riskContribution);
    }
  });
});

describe('getChainsAffectedByFix', () => {
  it('returns chains that include the fixed capability', () => {
    const chains = analyzeRiskChains([cap('location-tracking'), cap('user-profiles')], []);
    expect(getChainsAffectedByFix('location-tracking', chains)).toHaveLength(1);
    expect(getChainsAffectedByFix('nonexistent', chains)).toHaveLength(0);
  });
});

describe('calculateTotalChainRisk', () => {
  it('applies diminishing returns to overlapping chains', () => {
    const chains = analyzeRiskChains(
      [cap('location-tracking'), cap('user-profiles'), cap('messaging'), cap('ai-image-gen'), cap('image-upload')],
      [],
    );
    const total = calculateTotalChainRisk(chains);
    const naiveSum = chains.reduce((s, c) => s + c.riskContribution, 0);
    expect(chains.length).toBeGreaterThan(1);
    // diminishing factor 0.8^index means the total is strictly below the naive sum
    expect(total).toBeLessThan(naiveSum);
    expect(total).toBeGreaterThan(0);
  });

  it('returns 0 for no chains', () => {
    expect(calculateTotalChainRisk([])).toBe(0);
  });
});
