// ============================================================
// Remediation Impact Service - Quantifies fix impact for each issue
// ============================================================

import { 
  RemediationImpact, 
  FixComplexity, 
  TimeToFix,
  EthicsIssueV2 
} from '@/types/ethicsV2';
import { EthicsIssue, SeverityLevel } from '@/types/ethics';
import { MisuseScenario } from '@/data/mockMisuseData';

// Time estimates by mitigation type (in hours)
const TIME_ESTIMATES: Record<string, { design: number; implementation: number; testing: number }> = {
  'ui-language': { design: 2, implementation: 4, testing: 2 },
  'interaction-model': { design: 8, implementation: 16, testing: 8 },
  'feature-removal': { design: 4, implementation: 8, testing: 4 },
  'reframing': { design: 6, implementation: 8, testing: 4 },
  'architecture': { design: 16, implementation: 32, testing: 16 },
};

// Severity weights for risk contribution
const SEVERITY_WEIGHTS: Record<SeverityLevel, number> = {
  critical: 3.0,
  high: 2.0,
  medium: 1.0,
  low: 0.5,
  safe: 0,
};

/**
 * Calculate how much risk an issue contributes to the overall score
 */
function calculateRiskContribution(
  issue: EthicsIssue,
  totalScore: number,
  allIssues: EthicsIssue[],
  scenarios: MisuseScenario[]
): number {
  const severityWeight = SEVERITY_WEIGHTS[issue.severity];
  
  // Count how many scenarios reference this issue's category
  const linkedScenarios = scenarios.filter(s => 
    s.mitigations.some(m => m.toLowerCase().includes(issue.category.replace('-', ' ')))
  ).length;
  
  const scenarioMultiplier = 1 + (linkedScenarios * 0.2);
  
  // Calculate base contribution
  const totalWeight = allIssues.reduce((sum, i) => sum + SEVERITY_WEIGHTS[i.severity], 0);
  const baseContribution = totalWeight > 0 
    ? (severityWeight / totalWeight) * totalScore 
    : severityWeight;
  
  return Math.round(baseContribution * scenarioMultiplier * 10) / 10;
}

/**
 * Detect dependencies between issues based on file locations
 */
function detectDependencies(
  issue: EthicsIssue,
  allIssues: EthicsIssue[]
): string[] {
  if (!issue.location) return [];
  
  const issueFile = issue.location.split(':')[0];
  
  return allIssues
    .filter(i => i.id !== issue.id && i.location?.startsWith(issueFile))
    .map(i => i.id);
}

/**
 * Identify ripple effects from fixing an issue
 */
function identifyRippleEffects(
  issue: EthicsIssue,
  allIssues: EthicsIssue[],
  scenarios: MisuseScenario[]
): string[] {
  const effects: string[] = [];
  
  // Check if fixing this issue affects other issues in the same file
  const sameFileIssues = allIssues.filter(i => 
    i.id !== issue.id && 
    i.location?.split(':')[0] === issue.location?.split(':')[0]
  );
  
  if (sameFileIssues.length > 0) {
    effects.push(`Fixing this will also address ${sameFileIssues.length} related issue(s) in the same file`);
  }
  
  // Check if this is part of a larger pattern
  const sameCategoryIssues = allIssues.filter(i => 
    i.id !== issue.id && i.category === issue.category
  );
  
  if (sameCategoryIssues.length > 0) {
    effects.push(`Part of a ${issue.category} pattern - fixing may inform solutions for ${sameCategoryIssues.length} similar issues`);
  }
  
  // Check for scenario connections
  const linkedScenarios = scenarios.filter(s =>
    s.mitigations.some(m => 
      m.toLowerCase().includes(issue.title.toLowerCase().split(' ')[0])
    )
  );
  
  if (linkedScenarios.length > 0) {
    effects.push(`Reduces risk in ${linkedScenarios.length} misuse scenario(s)`);
  }
  
  return effects;
}

/**
 * Estimate time to fix based on mitigation type and complexity
 */
function estimateTimeToFix(
  issue: EthicsIssue,
  complexity: FixComplexity
): TimeToFix {
  const baseTime = TIME_ESTIMATES[issue.mitigationType] || TIME_ESTIMATES['interaction-model'];
  
  // Adjust based on complexity
  const complexityMultipliers = {
    low: 0.7,
    medium: 1.0,
    high: 1.5,
  };
  
  const avgComplexity = (
    complexityMultipliers[complexity.technical] +
    complexityMultipliers[complexity.design] +
    complexityMultipliers[complexity.testing]
  ) / 3;
  
  const adjustedDesign = Math.round(baseTime.design * avgComplexity);
  const adjustedImpl = Math.round(baseTime.implementation * avgComplexity);
  const adjustedTest = Math.round(baseTime.testing * avgComplexity);
  
  const totalHours = adjustedDesign + adjustedImpl + adjustedTest;
  const days = Math.ceil(totalHours / 8);
  
  return {
    estimate: days <= 1 ? '4-8 hours' : days <= 2 ? '1-2 days' : `${days - 1}-${days} days`,
    confidence: avgComplexity < 1 ? 'high' : avgComplexity > 1.2 ? 'low' : 'medium',
    breakdown: {
      design: `${adjustedDesign} hours`,
      implementation: `${adjustedImpl} hours`,
      testing: `${adjustedTest} hours`,
    },
  };
}

/**
 * Determine fix complexity based on mitigation type and issue characteristics
 */
function determineComplexity(issue: EthicsIssue): FixComplexity {
  const complexityMap: Record<string, FixComplexity> = {
    'ui-language': { technical: 'low', design: 'medium', testing: 'low' },
    'interaction-model': { technical: 'medium', design: 'high', testing: 'medium' },
    'feature-removal': { technical: 'medium', design: 'medium', testing: 'medium' },
    'reframing': { technical: 'low', design: 'high', testing: 'medium' },
  };
  
  const base = complexityMap[issue.mitigationType] || complexityMap['interaction-model'];
  
  // Increase complexity for critical issues (they often need more careful handling)
  if (issue.severity === 'critical') {
    return {
      technical: base.technical === 'low' ? 'medium' : 'high',
      design: 'high',
      testing: base.testing === 'low' ? 'medium' : 'high',
    };
  }
  
  return base;
}

/**
 * Main function - calculate remediation impact for an issue
 */
export function calculateRemediationImpact(
  issue: EthicsIssue,
  currentScore: number,
  allIssues: EthicsIssue[],
  scenarios: MisuseScenario[]
): { remediationImpact: RemediationImpact; fixComplexity: FixComplexity } {
  const fixComplexity = determineComplexity(issue);
  const riskContribution = calculateRiskContribution(issue, currentScore, allIssues, scenarios);
  const projectedScore = Math.max(0, Math.round((currentScore - riskContribution) * 10) / 10);
  const percentageReduction = currentScore > 0 
    ? Math.round((riskContribution / currentScore) * 100) 
    : 0;
  
  const remediationImpact: RemediationImpact = {
    currentRiskContribution: riskContribution,
    projectedScoreAfterFix: projectedScore,
    percentageReduction,
    timeToFix: estimateTimeToFix(issue, fixComplexity),
    dependencies: detectDependencies(issue, allIssues),
    rippleEffects: identifyRippleEffects(issue, allIssues, scenarios),
  };
  
  return { remediationImpact, fixComplexity };
}

/**
 * Calculate total remediation effort for all issues
 */
export function calculateTotalRemediationEffort(
  issues: EthicsIssue[]
): { totalDays: number; priorityOrder: string[] } {
  let totalHours = 0;
  
  for (const issue of issues) {
    const complexity = determineComplexity(issue);
    const time = estimateTimeToFix(issue, complexity);
    
    // Parse hours from estimate
    const match = time.estimate.match(/(\d+)/);
    const hours = match ? parseInt(match[1]) * (time.estimate.includes('days') ? 8 : 1) : 8;
    totalHours += hours;
  }
  
  // Priority order: critical first, then by effort (low effort first)
  const priorityOrder = [...issues]
    .sort((a, b) => {
      if (SEVERITY_WEIGHTS[a.severity] !== SEVERITY_WEIGHTS[b.severity]) {
        return SEVERITY_WEIGHTS[b.severity] - SEVERITY_WEIGHTS[a.severity];
      }
      // Within same severity, prefer lower effort
      const effortOrder = ['ui-language', 'reframing', 'feature-removal', 'interaction-model'];
      return effortOrder.indexOf(a.mitigationType) - effortOrder.indexOf(b.mitigationType);
    })
    .map(i => i.id);
  
  return {
    totalDays: Math.ceil(totalHours / 8),
    priorityOrder,
  };
}
