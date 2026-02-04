// ============================================================
// Confidence Scoring Service - Calibrated confidence metrics
// ============================================================

import { IssueConfidence, ScenarioConfidence } from '@/types/ethicsV2';
import { EthicsIssue, SeverityLevel } from '@/types/ethics';
import { MisuseScenario, DetectedCapability } from '@/data/mockMisuseData';

// Confidence factors based on detection method
const DETECTION_CONFIDENCE_FACTORS = {
  explicitCode: 0.95,      // Found explicit code pattern
  inferredFromApi: 0.80,   // Inferred from API usage
  keywordMatch: 0.65,      // Matched keywords only
  heuristic: 0.50,         // Heuristic/rule-based
};

// Confidence factors based on precedent strength
const MISUSE_PRECEDENT_FACTORS = {
  documented: 0.90,        // Well-documented misuse cases
  inferred: 0.70,          // Inferred from similar systems
  theoretical: 0.50,       // Theoretical risk
};

// Severity confidence based on affected population
const SEVERITY_POPULATION_FACTORS = {
  vulnerable: 0.95,        // Children, abuse victims, etc.
  general: 0.80,           // General population
  limited: 0.60,           // Limited affected population
};

/**
 * Analyze code location to determine detection confidence
 */
function analyzeDetectionConfidence(issue: EthicsIssue): { confidence: number; rationale: string } {
  const location = issue.location?.toLowerCase() || '';
  const description = issue.description.toLowerCase();
  
  // Check for explicit patterns
  if (location.includes('component') || location.includes('.tsx')) {
    if (description.includes('explicit') || description.includes('direct')) {
      return {
        confidence: DETECTION_CONFIDENCE_FACTORS.explicitCode,
        rationale: `Explicit pattern found in component code at ${issue.location}`,
      };
    }
    return {
      confidence: DETECTION_CONFIDENCE_FACTORS.inferredFromApi,
      rationale: `Pattern detected through component analysis at ${issue.location}`,
    };
  }
  
  if (location.includes('hook') || location.includes('util')) {
    return {
      confidence: DETECTION_CONFIDENCE_FACTORS.inferredFromApi,
      rationale: `Inferred from utility/hook implementation at ${issue.location}`,
    };
  }
  
  if (location) {
    return {
      confidence: DETECTION_CONFIDENCE_FACTORS.keywordMatch,
      rationale: `Detected through keyword analysis in ${issue.location}`,
    };
  }
  
  return {
    confidence: DETECTION_CONFIDENCE_FACTORS.heuristic,
    rationale: 'Detected through heuristic pattern matching',
  };
}

/**
 * Analyze misuse scenario for confidence
 */
function analyzeMisuseConfidence(issue: EthicsIssue): { confidence: number; rationale: string } {
  const scenario = issue.misuseScenario?.toLowerCase() || '';
  const why = issue.whyMisuseByDesign?.toLowerCase() || '';
  
  // Check for documented precedent indicators
  const hasDocumentedPrecedent = 
    scenario.includes('documented') ||
    scenario.includes('reported') ||
    why.includes('studies show') ||
    why.includes('research indicates');
    
  if (hasDocumentedPrecedent) {
    return {
      confidence: MISUSE_PRECEDENT_FACTORS.documented,
      rationale: 'Based on documented misuse patterns with real-world precedent',
    };
  }
  
  // Check for inferred patterns
  const hasInferredPattern =
    scenario.includes('could') ||
    scenario.includes('enable') ||
    why.includes('similar systems');
    
  if (hasInferredPattern) {
    return {
      confidence: MISUSE_PRECEDENT_FACTORS.inferred,
      rationale: 'Inferred from patterns in similar systems',
    };
  }
  
  return {
    confidence: MISUSE_PRECEDENT_FACTORS.theoretical,
    rationale: 'Theoretical risk based on capability analysis',
  };
}

/**
 * Analyze severity confidence
 */
function analyzeSeverityConfidence(issue: EthicsIssue): { confidence: number; rationale: string } {
  const description = issue.description.toLowerCase();
  const scenario = issue.misuseScenario?.toLowerCase() || '';
  
  // Check for vulnerable population indicators
  const vulnerableKeywords = [
    'abuse', 'victim', 'child', 'minor', 'vulnerable', 'domestic',
    'stalking', 'coercion', 'manipulation', 'exploitation'
  ];
  
  const hasVulnerablePopulation = vulnerableKeywords.some(kw => 
    description.includes(kw) || scenario.includes(kw)
  );
  
  if (hasVulnerablePopulation) {
    return {
      confidence: SEVERITY_POPULATION_FACTORS.vulnerable,
      rationale: `High confidence due to potential impact on vulnerable populations`,
    };
  }
  
  // Check for general impact
  const generalKeywords = ['user', 'people', 'anyone', 'public'];
  const hasGeneralImpact = generalKeywords.some(kw =>
    description.includes(kw) || scenario.includes(kw)
  );
  
  if (hasGeneralImpact) {
    return {
      confidence: SEVERITY_POPULATION_FACTORS.general,
      rationale: 'Moderate confidence based on general user impact',
    };
  }
  
  return {
    confidence: SEVERITY_POPULATION_FACTORS.limited,
    rationale: 'Lower confidence due to limited or unclear affected population',
  };
}

/**
 * Identify uncertainty factors
 */
function identifyUncertaintyFactors(issue: EthicsIssue): string[] {
  const factors: string[] = [];
  
  // Context-dependent uncertainty
  if (issue.category === 'false-authority') {
    factors.push('Context of use may mitigate perceived authority');
  }
  
  if (issue.mitigationType === 'reframing') {
    factors.push('Effectiveness of reframing depends on user interpretation');
  }
  
  if (!issue.location) {
    factors.push('Unable to verify exact code location');
  }
  
  if (issue.severity === 'critical' || issue.severity === 'high') {
    factors.push('Requires user research to validate psychological impact');
  }
  
  if (issue.category === 'manipulation') {
    factors.push('Intent of use cannot be determined from code alone');
  }
  
  return factors.slice(0, 3); // Limit to 3 uncertainty factors
}

/**
 * Main function - calculate confidence scores for an issue
 */
export function calculateIssueConfidence(issue: EthicsIssue): IssueConfidence {
  const detection = analyzeDetectionConfidence(issue);
  const misuse = analyzeMisuseConfidence(issue);
  const severity = analyzeSeverityConfidence(issue);
  
  // Weighted average for overall confidence
  const overallConfidence = (
    detection.confidence * 0.3 +
    misuse.confidence * 0.4 +
    severity.confidence * 0.3
  );
  
  const uncertaintyFactors = identifyUncertaintyFactors(issue);
  
  return {
    detectionConfidence: detection.confidence,
    detectionRationale: detection.rationale,
    misuseConfidence: misuse.confidence,
    misuseRationale: misuse.rationale,
    severityConfidence: severity.confidence,
    severityRationale: severity.rationale,
    overallConfidence: Math.round(overallConfidence * 100) / 100,
    uncertaintyFactors,
  };
}

/**
 * Calculate confidence for a misuse scenario
 */
export function calculateScenarioConfidence(
  scenario: MisuseScenario,
  capabilities: DetectedCapability[]
): ScenarioConfidence {
  // Likelihood based on how many capabilities are needed and their risk levels
  const capabilityRisks = scenario.capabilities.map(capId => {
    const cap = capabilities.find(c => c.id === capId);
    return cap ? { low: 0.3, medium: 0.6, high: 0.9 }[cap.riskLevel] : 0.5;
  });
  
  const avgCapabilityRisk = capabilityRisks.length > 0
    ? capabilityRisks.reduce((a, b) => a + b, 0) / capabilityRisks.length
    : 0.5;
  
  // More capabilities needed = lower likelihood (harder to exploit)
  const capabilityCountModifier = Math.max(0.5, 1 - (scenario.capabilities.length - 1) * 0.1);
  
  const likelihoodScore = Math.round(avgCapabilityRisk * capabilityCountModifier * 100) / 100;
  
  // Impact based on severity
  const impactMap = { critical: 0.95, high: 0.80, medium: 0.60 };
  const impactScore = impactMap[scenario.severity] || 0.60;
  
  // Combined risk (not simple multiplication - use a more nuanced formula)
  const combinedRisk = Math.round(
    Math.sqrt(likelihoodScore * impactScore) * 100
  ) / 100;
  
  // Generate rationales
  const likelihoodRationale = scenario.capabilities.length > 2
    ? `Requires ${scenario.capabilities.length} capabilities to exploit, reducing likelihood`
    : `Exploitable with ${scenario.capabilities.length} readily available capability(ies)`;
    
  const impactRationale = scenario.realWorldExample
    ? `Real-world precedent confirms potential for ${scenario.severity} harm`
    : `${scenario.severity.charAt(0).toUpperCase() + scenario.severity.slice(1)} impact based on harm type analysis`;
  
  return {
    likelihoodScore,
    likelihoodRationale,
    impactScore,
    impactRationale,
    combinedRisk,
  };
}

/**
 * Flag issues with low confidence for human review
 */
export function flagLowConfidenceIssues(
  issues: Array<{ id: string; confidence: IssueConfidence }>
): string[] {
  return issues
    .filter(i => i.confidence.overallConfidence < 0.6)
    .map(i => i.id);
}
