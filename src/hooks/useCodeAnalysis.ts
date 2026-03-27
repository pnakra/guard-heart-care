import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EthicsReviewResult, EthicsIssue, CategorySummary, HarmCategory, SeverityLevel, ExecutiveSummary } from '@/types/ethics';
import { 
  EthicsReviewResultV2, 
  EthicsIssueV2, 
  MisuseScenarioV2, 
  DetectedCapabilityV2,
  DeploymentContext,
  RiskChain,
  VersionComparison,
  ExecutiveSummaryV2,
  EnhancedMitigation,
  IssueConfidence,
  DefensiveUse,
} from '@/types/ethicsV2';
import { DetectedCapability, MisuseScenario } from '@/data/mockMisuseData';
import { calculateRemediationImpact } from '@/services/remediationImpact';
import { calculateIssueConfidence, calculateScenarioConfidence } from '@/services/confidenceScoring';
import { detectDeploymentContext } from '@/services/deploymentDetector';
import { analyzeRiskChains } from '@/services/riskChainAnalyzer';
import { analyzeDefensiveUse } from '@/services/defensiveUseAnalyzer';
import { compareWithPreviousScan, ScanHistoryEntry } from '@/services/versionComparator';

interface UploadedFile {
  name: string;
  content: string;
}

interface AnalysisResult {
  result: EthicsReviewResult;
  resultV2: EthicsReviewResultV2;
  capabilities: DetectedCapability[];
  misuseScenarios: MisuseScenario[];
}

const CATEGORY_LABELS: Record<HarmCategory, { label: string; description: string; icon: string }> = {
  'restrictive-masculinity': { label: 'Restrictive Masculinity Patterns', description: 'Design that reinforces narrow definitions of manhood, suppresses help-seeking, or exploits identity-linked shame', icon: 'shield-alert-masc' },
  'false-authority': { label: 'False Authority', description: 'AI or UI positioned as moral/legal/medical authority', icon: 'scale' },
  'manipulation': { label: 'Manipulation', description: 'Features that help users coerce or pressure others', icon: 'brain' },
  'surveillance': { label: 'Surveillance', description: 'Tracking features exploitable in abuse contexts', icon: 'eye' },
  'admin-abuse': { label: 'Admin Abuse', description: 'Platform powers that could harm users', icon: 'shield-alert' },
  'ai-hallucination': { label: 'AI Hallucination', description: 'AI framed as expertise it cannot provide', icon: 'sparkles' },
  'dark-patterns': { label: 'Dark Patterns', description: 'Coercive UX that manipulates users into unintended actions', icon: 'zap' },
  'environmental-impact': { label: 'Environmental & Ecological Impact', description: 'Design decisions imposing unacknowledged environmental costs on communities', icon: 'leaf' },
};

// Storage key for scan history
const SCAN_HISTORY_KEY = 'ethical-review-history';

function getScanHistory(): ScanHistoryEntry[] {
  try {
    const stored = localStorage.getItem(SCAN_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveScanHistory(entry: ScanHistoryEntry): void {
  try {
    const history = getScanHistory();
    history.push(entry);
    // Keep only last 30 scans
    const trimmed = history.slice(-30);
    localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    console.warn('Failed to save scan history');
  }
}

function getLatestScan(): ScanHistoryEntry | null {
  const history = getScanHistory();
  return history.length > 0 ? history[history.length - 1] : null;
}

export function useCodeAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeCode = async (files: UploadedFile[], projectName: string, customRules?: any, populationModifiers?: string[], forkData?: any, categoryOverride?: string): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true);

    try {
      const previousScan = getLatestScan();
      
      const body: any = { 
        files, 
        projectName,
        customRules: customRules || null,
        populationModifiers: populationModifiers || null,
        categoryOverride: categoryOverride || null,
        previousScan: previousScan ? {
          timestamp: previousScan.timestamp,
          riskScore: previousScan.riskScore,
          issueIds: previousScan.issueIds,
        } : null,
      };

      // Fork comparison mode
      if (forkData) {
        body.forkMode = true;
        body.upstreamFiles = forkData.upstreamFiles;
      }

      const { data, error } = await supabase.functions.invoke('analyze-code', {
        body,
      });

      if (error) {
        console.error('Analysis error:', error);
        toast.error('Analysis failed', {
          description: error.message || 'Failed to analyze code. Please try again.',
        });
        return null;
      }

      if (data.error) {
        toast.error('Analysis failed', {
          description: data.error,
        });
        return null;
      }

      const analysis = data.analysis;
      const timestamp = data.timestamp;

      // Transform AI response to our types
      const capabilities: DetectedCapability[] = (analysis.capabilities || []).map((c: any) => ({
        id: c.id || crypto.randomUUID(),
        name: c.name,
        description: c.description,
        riskLevel: c.riskLevel || 'medium',
        detectedIn: c.detectedIn || [],
      }));

      const misuseScenarios: MisuseScenario[] = (analysis.misuseScenarios || []).map((s: any) => ({
        id: s.id || crypto.randomUUID(),
        title: s.title,
        description: s.description,
        capabilities: s.capabilities || [],
        severity: s.severity || 'medium',
        realWorldExample: s.realWorldExample,
        mitigations: s.mitigations || [],
      }));

      const issues: EthicsIssue[] = (analysis.issues || []).map((i: any) => ({
        id: i.id || crypto.randomUUID(),
        category: i.category as HarmCategory,
        title: i.title,
        description: i.description,
        severity: i.severity as SeverityLevel,
        location: i.location,
        misuseScenario: i.misuseScenario || '',
        whyMisuseByDesign: i.whyMisuseByDesign || '',
        mitigation: typeof i.mitigation === 'string' ? i.mitigation : i.mitigation?.summary || i.recommendation || '',
        mitigationType: i.mitigationType || 'ui-language',
        customRule: i.customRule || false,
        customRuleName: i.customRuleName || undefined,
        populationTags: Array.isArray(i.populationTags) ? i.populationTags : undefined,
        forkClassification: i.forkClassification || undefined,
      }));

      // Calculate base risk score
      const baseRiskScore = analysis.executiveSummary?.riskScore ?? calculateRiskScore(issues);

      // --- V2 ENHANCEMENTS (all derived from actual code analysis) ---

      // 1. Detect deployment context from actual files
      const deploymentContext: DeploymentContext = detectDeploymentContext(files, projectName, baseRiskScore);

      // 2. Analyze risk chains from detected capabilities
      const riskChains: RiskChain[] = analyzeRiskChains(capabilities, misuseScenarios);

      // 3. Version comparison with previous scans
      const versionComparison: VersionComparison = compareWithPreviousScan(
        issues,
        baseRiskScore,
        previousScan,
        timestamp
      );

      // 4. Enhanced issues with confidence, remediation impact, defensive use
      const enhancedIssues: EthicsIssueV2[] = issues.map((issue) => {
        // Get confidence from AI response or calculate
        const aiConfidence = (analysis.issues || []).find((i: any) => i.id === issue.id)?.confidence;
        const confidence: IssueConfidence = aiConfidence || calculateIssueConfidence(issue);

        // Get defensive use from AI response or analyze
        const aiDefensiveUse = (analysis.issues || []).find((i: any) => i.id === issue.id)?.defensiveUse;
        const defensiveUse: DefensiveUse = aiDefensiveUse || analyzeDefensiveUse(issue);

        // Calculate remediation impact
        const { remediationImpact, fixComplexity } = calculateRemediationImpact(
          issue,
          baseRiskScore,
          issues,
          misuseScenarios
        );

        // Get enhanced mitigation from AI or create default
        const aiMitigation = (analysis.issues || []).find((i: any) => i.id === issue.id)?.mitigation;
        const enhancedMitigation: EnhancedMitigation = typeof aiMitigation === 'object' && aiMitigation !== null ? {
          summary: aiMitigation.summary || issue.mitigation,
          codeChanges: aiMitigation.codeChanges || [],
          designChanges: aiMitigation.designChanges || [],
          contentChanges: aiMitigation.contentChanges || [],
          testingRequirements: aiMitigation.testingRequirements || [],
          estimatedEffort: aiMitigation.estimatedEffort || remediationImpact.timeToFix.estimate,
        } : {
          summary: typeof issue.mitigation === 'string' ? issue.mitigation : '',
          codeChanges: [],
          designChanges: [],
          contentChanges: [],
          testingRequirements: [],
          estimatedEffort: remediationImpact.timeToFix.estimate,
        };

        const aiIssue = (analysis.issues || []).find((i: any) => i.id === issue.id);
        const mitigationsFound: string[] = aiIssue?.mitigationsFound || [];
        const mitigationGaps: string[] = aiIssue?.mitigationGaps || [];

        return {
          ...issue,
          confidence,
          remediationImpact,
          fixComplexity,
          defensiveUse,
          mitigation: enhancedMitigation,
          mitigationsFound,
          mitigationGaps,
        };
      });

      // 5. Enhanced scenarios with confidence scores
      const enhancedScenarios: MisuseScenarioV2[] = misuseScenarios.map((scenario) => {
        const aiScenario = (analysis.misuseScenarios || []).find((s: any) => s.id === scenario.id);
        const scenarioConfidence = calculateScenarioConfidence(scenario, capabilities);

        return {
          ...scenario,
          likelihoodScore: aiScenario?.likelihoodScore ?? scenarioConfidence.likelihoodScore,
          likelihoodRationale: aiScenario?.likelihoodRationale ?? scenarioConfidence.likelihoodRationale,
          impactScore: aiScenario?.impactScore ?? scenarioConfidence.impactScore,
          impactRationale: aiScenario?.impactRationale ?? scenarioConfidence.impactRationale,
          combinedRisk: aiScenario?.combinedRisk ?? scenarioConfidence.combinedRisk,
        };
      });

      // 6. Enhanced capabilities with chain info
      const enhancedCapabilities: DetectedCapabilityV2[] = capabilities.map((cap) => {
        const aiCap = (analysis.capabilities || []).find((c: any) => c.id === cap.id);
        return {
          ...cap,
          detectionConfidence: aiCap?.detectionConfidence ?? 0.8,
          chainedWith: riskChains
            .filter(chain => chain.capabilities.includes(cap.id))
            .flatMap(chain => chain.capabilities.filter(c => c !== cap.id)),
        };
      });

      // Build category summaries
      const categoryMap = new Map<HarmCategory, EthicsIssue[]>();
      for (const issue of issues) {
        if (CATEGORY_LABELS[issue.category]) {
          const existing = categoryMap.get(issue.category) || [];
          categoryMap.set(issue.category, [...existing, issue]);
        }
      }

      const categories: CategorySummary[] = Array.from(categoryMap.entries()).map(([category, catIssues]) => {
        const meta = CATEGORY_LABELS[category];
        const severityOrder: SeverityLevel[] = ['critical', 'high', 'medium', 'low', 'safe'];
        const highestSeverity = catIssues.reduce<SeverityLevel>((highest, issue) => {
          return severityOrder.indexOf(issue.severity) < severityOrder.indexOf(highest)
            ? issue.severity
            : highest;
        }, 'safe');

        return {
          category,
          label: meta.label,
          description: meta.description,
          icon: meta.icon,
          issueCount: catIssues.length,
          highestSeverity,
        };
      });

      // Build executive summary (v1 format)
      const executiveSummary: ExecutiveSummary = analysis.executiveSummary || {
        topThreeRisks: issues
          .filter(i => i.severity === 'critical' || i.severity === 'high')
          .slice(0, 3)
          .map(i => ({
            title: i.title,
            severity: i.severity,
            effortToFix: 'medium' as const,
            summary: i.description,
          })),
        riskScore: baseRiskScore,
        totalIssueCount: issues.length,
        criticalCount: issues.filter(i => i.severity === 'critical').length,
        highCount: issues.filter(i => i.severity === 'high').length,
      };

      // Build v2 executive summary with risk contributions
      const executiveSummaryV2: ExecutiveSummaryV2 = {
        topThreeRisks: enhancedIssues
          .filter(i => i.severity === 'critical' || i.severity === 'high')
          .sort((a, b) => b.remediationImpact.currentRiskContribution - a.remediationImpact.currentRiskContribution)
          .slice(0, 3)
          .map(i => ({
            title: i.title,
            severity: i.severity,
            effortToFix: i.fixComplexity.technical as 'low' | 'medium' | 'high',
            summary: i.description,
            riskContribution: i.remediationImpact.currentRiskContribution,
          })),
        riskScore: baseRiskScore,
        adjustedRiskScore: deploymentContext.riskModifiers.adjustedRiskScore,
        totalIssueCount: issues.length,
        criticalCount: issues.filter(i => i.severity === 'critical').length,
        highCount: issues.filter(i => i.severity === 'high').length,
        acknowledgedCount: 0,
      };

      const overallStatus: SeverityLevel = 
        executiveSummary.criticalCount > 0 ? 'critical' : 
        executiveSummary.highCount > 0 ? 'high' : 
        issues.length > 0 ? 'medium' : 'safe';

      // Backfill confidence data into v1 issues for UI display
      const issuesWithConfidence: EthicsIssue[] = issues.map((issue) => {
        const enhanced = enhancedIssues.find(e => e.id === issue.id);
        if (enhanced?.confidence) {
          return {
            ...issue,
            confidence: {
              detectionConfidence: enhanced.confidence.detectionConfidence,
              detectionRationale: enhanced.confidence.detectionRationale,
              misuseConfidence: enhanced.confidence.misuseConfidence,
              misuseRationale: enhanced.confidence.misuseRationale,
              severityConfidence: enhanced.confidence.severityConfidence,
              severityRationale: enhanced.confidence.severityRationale,
              overallConfidence: enhanced.confidence.overallConfidence,
            },
          };
        }
        return issue;
      });

      // Build fork summary if in fork mode
      const isForkAnalysis = !!forkData;
      const forkSummary = isForkAnalysis ? {
        introducedCount: issuesWithConfidence.filter(i => i.forkClassification === 'introduced').length,
        inheritedCount: issuesWithConfidence.filter(i => i.forkClassification === 'inherited').length,
        remediatedCount: issuesWithConfidence.filter(i => i.forkClassification === 'remediated').length,
        upstreamRepo: forkData.upstreamRepo || 'upstream',
        forkRepo: forkData.forkRepo || 'fork',
      } : undefined;

      // V1 result (backwards compatible)
      const result: EthicsReviewResult = {
        executiveSummary,
        overallStatus,
        issues: issuesWithConfidence,
        categories,
        timestamp,
        projectName: data.projectName,
        detectedCategory: data.detectedCategory || 'unknown',
        isForkAnalysis,
        forkSummary,
      };

      // V2 result (enhanced - all derived from actual code)
      const resultV2: EthicsReviewResultV2 = {
        executiveSummary: executiveSummaryV2,
        overallStatus,
        issues: enhancedIssues,
        capabilities: enhancedCapabilities,
        misuseScenarios: enhancedScenarios,
        deploymentContext,
        riskChains,
        versionComparison,
        timestamp,
        projectName: data.projectName,
        scanVersion: 2,
        categories,
      };

      // Save to history for future comparisons
      saveScanHistory({
        timestamp,
        riskScore: baseRiskScore,
        issueIds: issues.map(i => i.id),
        issues: issues.map(i => ({ id: i.id, title: i.title, severity: i.severity })),
      });

      toast.success('Analysis complete (v2.0)', {
        description: `Found ${issues.length} issues with ${riskChains.length} risk chains. Risk score: ${baseRiskScore.toFixed(1)}/10`,
      });

      return { result, resultV2, capabilities, misuseScenarios };
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error('Analysis failed', {
        description: 'An unexpected error occurred. Please try again.',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeCode, isAnalyzing };
}

function calculateRiskScore(issues: EthicsIssue[]): number {
  if (issues.length === 0) return 0;
  
  const weights = { critical: 3, high: 2, medium: 1, low: 0.5, safe: 0 };
  const totalWeight = issues.reduce((sum, i) => sum + weights[i.severity], 0);
  const maxPossible = issues.length * 3;
  
  return Math.min(10, Math.round((totalWeight / maxPossible) * 10 * 10) / 10);
}
