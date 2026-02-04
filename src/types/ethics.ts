export type SeverityLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export type HarmCategory = 
  | 'false-authority'
  | 'manipulation'
  | 'surveillance'
  | 'admin-abuse'
  | 'ai-hallucination';

export interface EthicsIssue {
  id: string;
  category: HarmCategory;
  title: string;
  description: string;
  severity: SeverityLevel;
  location?: string;
  misuseScenario: string; // "A user could use this feature to ___ in order to ___"
  whyMisuseByDesign: string; // Why this is misuse-by-design, not a bug
  mitigation: string;
  mitigationType: 'ui-language' | 'interaction-model' | 'feature-removal' | 'reframing';
  isNewSinceLast?: boolean; // For iteration awareness
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

export interface EthicsReviewResult {
  executiveSummary: ExecutiveSummary;
  overallStatus: SeverityLevel;
  issues: EthicsIssue[];
  categories: CategorySummary[];
  timestamp: string;
  projectName: string;
  scanVersion?: number; // For iteration tracking
}

// Legacy type alias for backwards compat
export type EthicsCategory = HarmCategory;
