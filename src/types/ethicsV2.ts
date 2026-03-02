// ============================================================
// Ethical Review Scanner v2.0 - Complete Type Definitions
// ============================================================

import { SeverityLevel, HarmCategory } from './ethics';

// ============================================================
// REMEDIATION IMPACT MODELING
// ============================================================

export interface TimeBreakdown {
  design: string;
  implementation: string;
  testing: string;
}

export interface TimeToFix {
  estimate: string;
  confidence: 'low' | 'medium' | 'high';
  breakdown: TimeBreakdown;
}

export interface RemediationImpact {
  currentRiskContribution: number;
  projectedScoreAfterFix: number;
  percentageReduction: number;
  timeToFix: TimeToFix;
  dependencies: string[];
  rippleEffects: string[];
}

export interface FixComplexity {
  technical: 'low' | 'medium' | 'high';
  design: 'low' | 'medium' | 'high';
  testing: 'low' | 'medium' | 'high';
}

// ============================================================
// CONFIDENCE SCORING
// ============================================================

export interface IssueConfidence {
  detectionConfidence: number;
  detectionRationale: string;
  misuseConfidence: number;
  misuseRationale: string;
  severityConfidence: number;
  severityRationale: string;
  overallConfidence: number;
  uncertaintyFactors: string[];
}

export interface ScenarioConfidence {
  likelihoodScore: number;
  likelihoodRationale: string;
  impactScore: number;
  impactRationale: string;
  combinedRisk: number;
}

// ============================================================
// HARM-BENEFIT TRADEOFF
// ============================================================

export interface DefensiveUse {
  exists: boolean;
  title?: string;
  benefitedPopulation?: string;
  tradeoff?: string;
  netAssessment?: string;
  alternativeDesign?: string;
  reason?: string; // For when exists = false
}

// ============================================================
// DEPLOYMENT CONTEXT
// ============================================================

export interface DetectionResult {
  detected: string;
  confidence: number;
  evidence: string[];
  risk?: string;
}

export interface RiskModifiers {
  vulnerablePopulation: number;
  sensitiveContent: number;
  lackOfAuth: number;
  totalModifier: number;
  adjustedRiskScore: number;
}

export interface DeploymentContext {
  platform: DetectionResult;
  dataResidency: DetectionResult;
  targetAudience: DetectionResult;
  authenticationModel: DetectionResult;
  riskModifiers: RiskModifiers;
}

// ============================================================
// RISK CHAINS
// ============================================================

export interface RiskChain {
  id: string;
  capabilities: string[];
  emergentRisk: string;
  severity: SeverityLevel;
  whyWorse: string;
  affectedScenarios: string[];
  mitigationRequires: string;
  riskContribution: number;
  visualChain: string;
}

// ============================================================
// ENHANCED MITIGATION
// ============================================================

export interface CodeChange {
  file: string;
  lineNumbers?: number[];
  currentCode?: string;
  suggestedCode?: string;
  action: string;
  diffPreview?: string;
  impact?: string;
}

export interface DesignChange {
  component: string;
  currentDesign: string;
  suggestedDesign: string;
  rationale: string;
  mockupNeeded: boolean;
}

export interface ContentChange {
  location: string;
  currentText: string;
  suggestedText: string;
  rationale: string;
}

export interface EnhancedMitigation {
  summary: string;
  codeChanges: CodeChange[];
  designChanges: DesignChange[];
  contentChanges: ContentChange[];
  testingRequirements: string[];
  estimatedEffort: string;
}

// ============================================================
// VERSION TRACKING
// ============================================================

export interface ResolvedIssue {
  id: string;
  title: string;
  resolvedAt: string;
  howFixed: string;
}

export interface UnchangedIssue {
  id: string;
  ageInDays: number;
  status: 'new' | 'acknowledged' | 'in-progress' | 'wont-fix';
}

export interface TrendAnalysis {
  last7Days: string;
  velocity: string;
  projectedTimeTo5: string;
}

export interface VersionComparison {
  currentScan: string;
  previousScan: string | null;
  scoreChange: number | null;
  scoreChangeInterpretation: string | null;
  resolvedIssues: ResolvedIssue[];
  newIssues: string[];
  regressedIssues: string[];
  unchangedIssues: UnchangedIssue[];
  trendAnalysis: TrendAnalysis | null;
}

// ============================================================
// OVERRIDE SYSTEM
// ============================================================

export interface IssueOverride {
  status: 'acknowledged-wont-fix' | 'acknowledged-will-fix' | 'false-positive' | 'accepted-risk';
  justification: string;
  approvedBy: string;
  approvedAt: string;
  expiresAt: string | null;
  reviewRequired: boolean;
  evidence: string[];
  compensatingControls: string[];
}

export interface OverrideConfig {
  overrides: Array<{
    issueId: string;
    status: IssueOverride['status'];
    justification: string;
    approvedBy: string;
    expiresAt: string | null;
  }>;
  customRules: {
    disabledCategories: HarmCategory[];
    severityOverrides: Partial<Record<HarmCategory, SeverityLevel>>;
  };
}

// ============================================================
// V2 ENHANCED ISSUE TYPE
// ============================================================

export interface EthicsIssueV2 {
  id: string;
  category: HarmCategory;
  title: string;
  description: string;
  severity: SeverityLevel;
  location?: string;
  misuseScenario: string;
  whyMisuseByDesign: string;
  mitigationType: 'ui-language' | 'interaction-model' | 'feature-removal' | 'reframing';
  isNewSinceLast?: boolean;
  
  // V2 Additions
  confidence: IssueConfidence;
  remediationImpact: RemediationImpact;
  fixComplexity: FixComplexity;
  defensiveUse: DefensiveUse;
  mitigation: EnhancedMitigation;
  mitigationsFound: string[];
  mitigationGaps: string[];
  override?: IssueOverride;
}

// ============================================================
// V2 ENHANCED MISUSE SCENARIO
// ============================================================

export interface MisuseScenarioV2 {
  id: string;
  title: string;
  description: string;
  capabilities: string[];
  severity: 'medium' | 'high' | 'critical';
  realWorldExample?: string;
  mitigations: string[];
  
  // V2 Additions
  likelihoodScore: number;
  likelihoodRationale: string;
  impactScore: number;
  impactRationale: string;
  combinedRisk: number;
}

// ============================================================
// V2 ENHANCED CAPABILITY
// ============================================================

export interface DetectedCapabilityV2 {
  id: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  detectedIn: string[];
  
  // V2 Additions
  detectionConfidence: number;
  chainedWith?: string[];
}

// ============================================================
// COMPLETE V2 REVIEW RESULT
// ============================================================

export interface ExecutiveSummaryV2 {
  topThreeRisks: {
    title: string;
    severity: SeverityLevel;
    effortToFix: 'low' | 'medium' | 'high';
    summary: string;
    riskContribution: number;
  }[];
  riskScore: number;
  adjustedRiskScore: number;
  totalIssueCount: number;
  criticalCount: number;
  highCount: number;
  acknowledgedCount: number;
}

export interface EthicsReviewResultV2 {
  // Core data
  executiveSummary: ExecutiveSummaryV2;
  overallStatus: SeverityLevel;
  issues: EthicsIssueV2[];
  capabilities: DetectedCapabilityV2[];
  misuseScenarios: MisuseScenarioV2[];
  
  // V2 Additions (derived from actual code analysis)
  deploymentContext: DeploymentContext;
  riskChains: RiskChain[];
  versionComparison: VersionComparison;
  
  // Metadata
  timestamp: string;
  projectName: string;
  scanVersion: number;
  categories: Array<{
    category: HarmCategory;
    label: string;
    description: string;
    icon: string;
    issueCount: number;
    highestSeverity: SeverityLevel;
  }>;
}

// ============================================================
// CI/CD SUMMARY FORMAT
// ============================================================

export interface CISummary {
  riskScore: number;
  scoreChange: number | null;
  status: 'critical' | 'high' | 'medium' | 'low' | 'safe';
  issuesSummary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    topIssue: string;
  };
  topFixes: Array<{
    title: string;
    severity: SeverityLevel;
    impact: number;
    effort: string;
    file: string;
  }>;
  progress: {
    resolved: number;
    remaining: number;
    trend: string;
  };
  markdownSummary: string;
}
