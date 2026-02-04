// ============================================================
// Defensive Use Analyzer - Identifies harm-benefit tradeoffs
// ============================================================

import { DefensiveUse } from '@/types/ethicsV2';
import { EthicsIssue, HarmCategory } from '@/types/ethics';

interface DefensiveUsePattern {
  category: HarmCategory;
  keywords: string[];
  defensiveTitle: string;
  benefitedPopulation: string;
  tradeoffTemplate: string;
  alternativeTemplate: string;
}

// Patterns where features have legitimate defensive uses
const DEFENSIVE_PATTERNS: DefensiveUsePattern[] = [
  {
    category: 'surveillance',
    keywords: ['location', 'tracking', 'monitor', 'find'],
    defensiveTitle: 'Safety tracking for vulnerable individuals',
    benefitedPopulation: 'Parents of children, elderly care providers, safety-conscious individuals',
    tradeoffTemplate: 'Same tracking that enables abuse also enables safety monitoring for consenting parties',
    alternativeTemplate: 'Implement mutual consent verification, regular re-consent, and visible indicators when tracking is active',
  },
  {
    category: 'false-authority',
    keywords: ['advice', 'recommend', 'suggest', 'help'],
    defensiveTitle: 'Guidance for users seeking direction',
    benefitedPopulation: 'Users genuinely seeking advice or information',
    tradeoffTemplate: 'Authoritative framing that can mislead also provides clear guidance for those who need it',
    alternativeTemplate: 'Frame as options/considerations rather than directives; add explicit uncertainty language',
  },
  {
    category: 'manipulation',
    keywords: ['persuade', 'convince', 'escalat', 'ladder', 'progress'],
    defensiveTitle: 'Educational framework for recognizing manipulation tactics',
    benefitedPopulation: 'Potential victims learning to identify manipulation',
    tradeoffTemplate: 'Same patterns that enable manipulation can educate victims about tactics used against them',
    alternativeTemplate: 'Provide education through case studies and recognition training, not interactive optimization tools',
  },
  {
    category: 'admin-abuse',
    keywords: ['admin', 'moderate', 'edit', 'remove', 'ban'],
    defensiveTitle: 'Content moderation to protect community safety',
    benefitedPopulation: 'Community members protected from harmful content',
    tradeoffTemplate: 'Admin powers that could silence users also enable removal of genuinely harmful content',
    alternativeTemplate: 'Add transparency logs, appeal processes, and multiple-moderator requirements for actions',
  },
  {
    category: 'ai-hallucination',
    keywords: ['diagnos', 'symptom', 'health', 'medical', 'therapy'],
    defensiveTitle: 'Accessible health information for underserved populations',
    benefitedPopulation: 'People without access to healthcare professionals',
    tradeoffTemplate: 'AI health guidance that could mislead also provides initial guidance for those with no alternatives',
    alternativeTemplate: 'Position as triage/education tool with strong disclaimers and always recommend professional consultation',
  },
];

/**
 * Check if issue description matches defensive use patterns
 */
function matchesDefensivePattern(
  issue: EthicsIssue
): DefensiveUsePattern | null {
  const searchText = [
    issue.description,
    issue.title,
    issue.misuseScenario,
    issue.mitigation,
  ].join(' ').toLowerCase();
  
  // First check category-specific patterns
  const categoryPatterns = DEFENSIVE_PATTERNS.filter(p => p.category === issue.category);
  
  for (const pattern of categoryPatterns) {
    if (pattern.keywords.some(kw => searchText.includes(kw))) {
      return pattern;
    }
  }
  
  // Then check all patterns
  for (const pattern of DEFENSIVE_PATTERNS) {
    if (pattern.keywords.some(kw => searchText.includes(kw))) {
      return pattern;
    }
  }
  
  return null;
}

/**
 * Analyze whether harm potential outweighs benefits
 */
function assessNetHarmBenefit(
  issue: EthicsIssue,
  pattern: DefensiveUsePattern
): string {
  // Critical severity almost always means harm outweighs benefit
  if (issue.severity === 'critical') {
    return 'Harm potential significantly outweighs benefit due to severity and lack of safeguards';
  }
  
  // Check for safeguard keywords that might tip the balance
  const safeguardKeywords = ['consent', 'confirm', 'verify', 'warn', 'opt-in', 'explicit'];
  const hasSafeguards = safeguardKeywords.some(kw => 
    issue.mitigation?.toLowerCase().includes(kw)
  );
  
  if (issue.severity === 'high') {
    if (hasSafeguards) {
      return 'Harm potential likely outweighs benefit, but proposed mitigations could improve balance';
    }
    return 'Harm potential outweighs benefit in current implementation';
  }
  
  if (issue.severity === 'medium') {
    if (hasSafeguards) {
      return 'Benefits may be preserved with proper safeguards; implement mitigations before shipping';
    }
    return 'Harm and benefit are roughly balanced; lean toward caution without safeguards';
  }
  
  return 'Benefits likely preserved with standard safeguards; low-priority concern';
}

/**
 * Generate alternative design suggestion
 */
function generateAlternativeDesign(
  issue: EthicsIssue,
  pattern: DefensiveUsePattern
): string {
  // Customize based on mitigation type
  switch (issue.mitigationType) {
    case 'feature-removal':
      return `Remove the harmful affordance entirely. ${pattern.alternativeTemplate}`;
    case 'ui-language':
      return `Reframe the feature language. ${pattern.alternativeTemplate}`;
    case 'interaction-model':
      return `Add friction and consent. ${pattern.alternativeTemplate}`;
    case 'reframing':
      return `Change how the feature is positioned. ${pattern.alternativeTemplate}`;
    default:
      return pattern.alternativeTemplate;
  }
}

/**
 * Main function - analyze defensive use for an issue
 */
export function analyzeDefensiveUse(issue: EthicsIssue): DefensiveUse {
  const pattern = matchesDefensivePattern(issue);
  
  if (!pattern) {
    return {
      exists: false,
      reason: 'No legitimate defensive or beneficial use case identified for this design pattern',
    };
  }
  
  const netAssessment = assessNetHarmBenefit(issue, pattern);
  const alternativeDesign = generateAlternativeDesign(issue, pattern);
  
  return {
    exists: true,
    title: pattern.defensiveTitle,
    benefitedPopulation: pattern.benefitedPopulation,
    tradeoff: pattern.tradeoffTemplate,
    netAssessment,
    alternativeDesign,
  };
}

/**
 * Batch analyze all issues for defensive uses
 */
export function analyzeAllDefensiveUses(
  issues: EthicsIssue[]
): Map<string, DefensiveUse> {
  const results = new Map<string, DefensiveUse>();
  
  for (const issue of issues) {
    results.set(issue.id, analyzeDefensiveUse(issue));
  }
  
  return results;
}

/**
 * Get count of issues with legitimate defensive uses
 */
export function countDefensiveUses(issues: EthicsIssue[]): {
  withDefensiveUse: number;
  withoutDefensiveUse: number;
} {
  const analyzed = analyzeAllDefensiveUses(issues);
  let withDefensiveUse = 0;
  let withoutDefensiveUse = 0;
  
  for (const defensiveUse of analyzed.values()) {
    if (defensiveUse.exists) {
      withDefensiveUse++;
    } else {
      withoutDefensiveUse++;
    }
  }
  
  return { withDefensiveUse, withoutDefensiveUse };
}
