import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EthicsReviewResult, EthicsIssue, CategorySummary, EthicsCategory, SeverityLevel } from '@/types/ethics';
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

const CATEGORY_LABELS: Record<EthicsCategory, { label: string; description: string; icon: string }> = {
  'manipulation': { label: 'Manipulation', description: 'Techniques that exploit psychological biases', icon: 'brain' },
  'dark-patterns': { label: 'Dark Patterns', description: 'Deceptive UI/UX designed to trick users', icon: 'eye-off' },
  'privacy': { label: 'Privacy', description: 'Data collection and handling concerns', icon: 'shield' },
  'accessibility': { label: 'Accessibility', description: 'Barriers for users with disabilities', icon: 'accessibility' },
  'addiction': { label: 'Addiction', description: 'Features designed to maximize engagement', icon: 'clock' },
  'misinformation': { label: 'Misinformation', description: 'Potential for spreading false information', icon: 'alert-triangle' },
  'discrimination': { label: 'Discrimination', description: 'Potential for unfair treatment', icon: 'users' },
  'transparency': { label: 'Transparency', description: 'Lack of clear information for users', icon: 'info' },
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
        category: i.category as EthicsCategory,
        title: i.title,
        description: i.description,
        severity: i.severity as SeverityLevel,
        location: i.location,
        recommendation: i.recommendation,
      }));

      // Build category summaries
      const categoryMap = new Map<EthicsCategory, EthicsIssue[]>();
      for (const issue of issues) {
        const existing = categoryMap.get(issue.category) || [];
        categoryMap.set(issue.category, [...existing, issue]);
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

      const result: EthicsReviewResult = {
        overallStatus: (analysis.summary?.overallStatus as SeverityLevel) || 'medium',
        issues,
        categories,
        timestamp: data.timestamp,
        projectName: data.projectName,
      };

      toast.success('Analysis complete', {
        description: `Found ${issues.length} issues and ${misuseScenarios.length} potential misuse scenarios.`,
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
