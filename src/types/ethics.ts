export type SeverityLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export type EthicsCategory = 
  | 'manipulation'
  | 'dark-patterns'
  | 'privacy'
  | 'accessibility'
  | 'addiction'
  | 'misinformation'
  | 'discrimination'
  | 'transparency';

export interface EthicsIssue {
  id: string;
  category: EthicsCategory;
  title: string;
  description: string;
  severity: SeverityLevel;
  location?: string;
  recommendation: string;
  learnMoreUrl?: string;
}

export interface CategorySummary {
  category: EthicsCategory;
  label: string;
  description: string;
  icon: string;
  issueCount: number;
  highestSeverity: SeverityLevel;
}

export interface EthicsReviewResult {
  overallStatus: SeverityLevel;
  issues: EthicsIssue[];
  categories: CategorySummary[];
  timestamp: string;
  projectName: string;
}
