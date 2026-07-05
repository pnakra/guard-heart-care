import { describe, it, expect } from 'vitest';
import {
  calculateIssueConfidence,
  calculateScenarioConfidence,
  flagLowConfidenceIssues,
} from '@/services/confidenceScoring';
import { EthicsIssue } from '@/types/ethics';
import { MisuseScenario, DetectedCapability } from '@/data/mockMisuseData';

function makeIssue(partial: Partial<EthicsIssue>): EthicsIssue {
  return {
    id: 'i1',
    category: 'surveillance',
    title: 'Issue',
    description: 'A feature',
    severity: 'medium',
    location: '',
    misuseScenario: '',
    whyMisuseByDesign: '',
    mitigation: '',
    mitigationType: 'ui-language',
    ...partial,
  } as unknown as EthicsIssue;
}

describe('calculateIssueConfidence', () => {
  it('scores high confidence for explicit code + documented precedent + vulnerable population', () => {
    const c = calculateIssueConfidence(
      makeIssue({
        location: 'src/Tracker.tsx',
        description: 'explicit stalking-enabling abuse of location',
        misuseScenario: 'documented abuse precedent',
        severity: 'critical',
      }),
    );
    expect(c.detectionConfidence).toBe(0.95);
    expect(c.misuseConfidence).toBe(0.9);
    expect(c.severityConfidence).toBe(0.95);
    // weighted 0.3/0.4/0.3
    expect(c.overallConfidence).toBeCloseTo(0.93, 2);
  });

  it('scores low confidence for a heuristic, theoretical, limited-impact issue', () => {
    const c = calculateIssueConfidence(
      makeIssue({ location: '', description: 'a plain toggle', misuseScenario: '', severity: 'low' }),
    );
    expect(c.detectionConfidence).toBe(0.5);
    expect(c.misuseConfidence).toBe(0.5);
    expect(c.severityConfidence).toBe(0.6);
    expect(c.overallConfidence).toBeLessThan(0.6);
  });

  it('caps uncertainty factors at 3', () => {
    const c = calculateIssueConfidence(
      makeIssue({ category: 'false-authority', mitigationType: 'reframing', location: '', severity: 'critical' }),
    );
    expect(c.uncertaintyFactors.length).toBeLessThanOrEqual(3);
  });
});

describe('calculateScenarioConfidence', () => {
  const caps: DetectedCapability[] = [
    { id: 'a', name: 'A', description: '', riskLevel: 'high', detectedIn: [] },
    { id: 'b', name: 'B', description: '', riskLevel: 'high', detectedIn: [] },
  ];
  const scenario: MisuseScenario = {
    id: 's1',
    title: 'Combo',
    description: 'desc',
    capabilities: ['a', 'b'],
    severity: 'high',
    mitigations: [],
  };

  it('derives likelihood, impact, and combined risk from capability risk and severity', () => {
    const c = calculateScenarioConfidence(scenario, caps);
    expect(c.likelihoodScore).toBeCloseTo(0.81, 2); // avg 0.9 * countModifier 0.9
    expect(c.impactScore).toBe(0.8); // high severity
    expect(c.combinedRisk).toBeGreaterThan(0);
    expect(c.combinedRisk).toBeLessThanOrEqual(1);
  });
});

describe('flagLowConfidenceIssues', () => {
  it('flags only issues with overall confidence below 0.6', () => {
    const flagged = flagLowConfidenceIssues([
      { id: 'low', confidence: { overallConfidence: 0.55 } as never },
      { id: 'high', confidence: { overallConfidence: 0.9 } as never },
    ]);
    expect(flagged).toEqual(['low']);
  });
});
