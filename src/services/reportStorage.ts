import { supabase } from '@/integrations/supabase/client';
import { EthicsReviewResult } from '@/types/ethics';
import { DetectedCapability, MisuseScenario } from '@/data/mockMisuseData';

export interface SavedReport {
  id: string;
  project_name: string;
  detected_category: string | null;
  risk_score: number;
  overall_status: string;
  total_issues: number;
  critical_count: number;
  high_count: number;
  result_json: EthicsReviewResult;
  capabilities_json: DetectedCapability[];
  misuse_scenarios_json: MisuseScenario[];
  created_at: string;
}

export async function saveReport(
  result: EthicsReviewResult,
  capabilities: DetectedCapability[],
  misuseScenarios: MisuseScenario[],
): Promise<string | null> {
  const { data, error } = await supabase
    .from('scan_reports')
    .insert({
      project_name: result.projectName,
      detected_category: result.detectedCategory || null,
      risk_score: result.executiveSummary.riskScore,
      overall_status: result.overallStatus,
      total_issues: result.executiveSummary.totalIssueCount,
      critical_count: result.executiveSummary.criticalCount,
      high_count: result.executiveSummary.highCount,
      result_json: result as any,
      capabilities_json: capabilities as any,
      misuse_scenarios_json: misuseScenarios as any,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to save report:', error);
    return null;
  }

  return data.id;
}

export async function loadReport(id: string): Promise<SavedReport | null> {
  const { data, error } = await supabase
    .from('scan_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to load report:', error);
    return null;
  }

  return data as unknown as SavedReport;
}

export async function submitFeedback(
  reportId: string,
  issueId: string,
  isHelpful: boolean,
): Promise<boolean> {
  const { error } = await supabase
    .from('finding_feedback')
    .insert({
      report_id: reportId,
      issue_id: issueId,
      is_helpful: isHelpful,
    });

  if (error) {
    console.error('Failed to submit feedback:', error);
    return false;
  }

  return true;
}
