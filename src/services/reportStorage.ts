import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { EthicsReviewResult } from '@/types/ethics';
import { DetectedCapability, MisuseScenario } from '@/types/misuse';

export interface SavedReport {
  id: string;
  share_token: string;
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

// Reports are keyed in the URL by their unguessable share_token, not the PK, so
// the report table can't be enumerated. saveReport returns the token to link to.
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
      result_json: result as unknown as Json,
      capabilities_json: capabilities as unknown as Json,
      misuse_scenarios_json: misuseScenarios as unknown as Json,
    })
    .select('share_token')
    .single();

  if (error) {
    console.error('Failed to save report:', error);
    return null;
  }

  return data.share_token;
}

// Reads go through the token-scoped SECURITY DEFINER function; there is no
// direct anon SELECT on scan_reports anymore.
export async function loadReport(shareToken: string): Promise<SavedReport | null> {
  const { data, error } = await supabase
    .rpc('get_scan_report', { p_share_token: shareToken });

  if (error) {
    console.error('Failed to load report:', error);
    return null;
  }

  // PostgREST may return the composite row as an object or a single-element
  // array depending on version; normalize to the row (or null when not found).
  const raw = data as unknown;
  const record = Array.isArray(raw) ? raw[0] : raw;
  return (record ?? null) as SavedReport | null;
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
