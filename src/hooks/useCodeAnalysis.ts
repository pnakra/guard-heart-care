import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EthicsReviewResult, EthicsIssue, CategorySummary, HarmCategory, SeverityLevel, ExecutiveSummary } from '@/types/ethics';
import { DetectedCapability, MisuseScenario } from '@/data/mockMisuseData';

interface UploadedFile {
  name: string;
  content: string;
}

interface AnalysisResult {
  result: EthicsReviewResult;
  capabilities: DetectedCapability[];
  misuseScenarios: MisuseScenario[];
}

const CATEGORY_LABELS: Record<HarmCategory, { label: string; description: string; icon: string }> = {
  'false-authority': { label: 'False Authority', description: 'AI or UI positioned as moral/legal/medical authority', icon: 'scale' },
  'manipulation': { label: 'Manipulation', description: 'Features that help users coerce or pressure others', icon: 'brain' },
  'surveillance': { label: 'Surveillance', description: 'Tracking features exploitable in abuse contexts', icon: 'eye' },
  'admin-abuse': { label: 'Admin Abuse', description: 'Platform powers that could harm users', icon: 'shield-alert' },
  'ai-hallucination': { label: 'AI Hallucination', description: 'AI framed as expertise it cannot provide', icon: 'sparkles' },
};

export function useCodeAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeCode = async (files: UploadedFile[], projectName: string): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-code', {
        body: { files, projectName },
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
        mitigation: i.mitigation || i.recommendation || '',
        mitigationType: i.mitigationType || 'ui-language',
      }));

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

      // Build executive summary
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
        riskScore: analysis.executiveSummary?.riskScore ?? calculateRiskScore(issues),
        totalIssueCount: issues.length,
        criticalCount: issues.filter(i => i.severity === 'critical').length,
        highCount: issues.filter(i => i.severity === 'high').length,
      };

      const result: EthicsReviewResult = {
        executiveSummary,
        overallStatus: (analysis.summary?.overallStatus as SeverityLevel) || 
          (executiveSummary.criticalCount > 0 ? 'critical' : 
           executiveSummary.highCount > 0 ? 'high' : 
           issues.length > 0 ? 'medium' : 'safe'),
        issues,
        categories,
        timestamp: data.timestamp,
        projectName: data.projectName,
      };

      toast.success('Analysis complete', {
        description: `Found ${issues.length} misuse-by-design issues and ${misuseScenarios.length} potential misuse scenarios.`,
      });

      return { result, capabilities, misuseScenarios };
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
  
  return Math.min(10, (totalWeight / maxPossible) * 10);
}
