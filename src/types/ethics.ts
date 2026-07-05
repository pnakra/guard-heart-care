export type SeverityLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';
export type ForkClassification = 'inherited' | 'introduced' | 'remediated';

export type HarmCategory = 
  | 'restrictive-masculinity'
  | 'false-authority'
  | 'manipulation'
  | 'surveillance'
  | 'admin-abuse'
  | 'ai-hallucination'
  | 'dark-patterns'
  | 'environmental-impact';

export interface IssueConfidenceSummary {
  detectionConfidence: number;
  detectionRationale: string;
  misuseConfidence: number;
  misuseRationale: string;
  severityConfidence: number;
  severityRationale: string;
  overallConfidence: number;
}

export interface CodeChange {
  file: string;
  action: string;
  currentCode: string;
  suggestedCode: string;
  diffPreview?: string; // Raw unified diff, used instead of split view if present
}

export interface EthicsIssue {
  id: string;
  category: HarmCategory;
  title: string;
  description: string;
  severity: SeverityLevel;
  location?: string;
  misuseScenario: string;
  whyMisuseByDesign: string;
  mitigation: string;
  mitigationType: 'ui-language' | 'interaction-model' | 'feature-removal' | 'reframing';
  codeChanges?: CodeChange[];
  isNewSinceLast?: boolean;
  confidence?: IssueConfidenceSummary;
  customRule?: boolean;
  customRuleName?: string;
  populationTags?: string[];
  forkClassification?: ForkClassification;
}

export interface ExecutiveSummary {
  topThreeRisks: {
    title: string;
    severity: SeverityLevel;
    effortToFix: 'low' | 'medium' | 'high';
    summary: string;
  }[];
  riskScore: number; // 0-10 scale
  totalIssueCount: number;
  criticalCount: number;
  highCount: number;
}

export interface CategorySummary {
  category: HarmCategory;
  label: string;
  description: string;
  icon: string;
  issueCount: number;
  highestSeverity: SeverityLevel;
}

/**
 * Records how much of the uploaded codebase the scan actually analyzed. Large
 * repos are sampled to a bounded set of files so the model can return reliable
 * JSON — when that happens we surface it so scores aren't mistaken for a
 * whole-repo verdict.
 */
export interface SamplingInfo {
  /** Total eligible files submitted to the scan */
  totalFileCount: number;
  /** Files actually included in the analysis prompt */
  analyzedFileCount: number;
  /** Files left out of the analysis (totalFileCount - analyzedFileCount) */
  omittedFileCount: number;
}

export interface EthicsReviewResult {
  executiveSummary: ExecutiveSummary;
  overallStatus: SeverityLevel;
  issues: EthicsIssue[];
  categories: CategorySummary[];
  timestamp: string;
  projectName: string;
  scanVersion?: number;
  detectedCategory?: string;
  sampling?: SamplingInfo;
  isForkAnalysis?: boolean;
  forkSummary?: {
    introducedCount: number;
    inheritedCount: number;
    remediatedCount: number;
    upstreamRepo: string;
    forkRepo: string;
  };
}

// Legacy type alias for backwards compat
export type EthicsCategory = HarmCategory;
