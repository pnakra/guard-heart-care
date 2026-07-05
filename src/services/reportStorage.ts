import { supabase } from '@/integrations/supabase/client';
import { edgeFunctionHeaders, extractEdgeError } from '@/lib/edgeFunctions';
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
// the report table can't be enumerated. Inserts go through the `save-report`
// edge function (token + per-IP rate limiter) so anon can't write scan_reports
// directly. Returns the share token to link to.
export async function saveReport(
  result: EthicsReviewResult,
  capabilities: DetectedCapability[],
  misuseScenarios: MisuseScenario[],
): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke<{ shareToken: string }>(
    'save-report',
    {
      headers: edgeFunctionHeaders(),
      body: {
        projectName: result.projectName,
        detectedCategory: result.detectedCategory || null,
        riskScore: result.executiveSummary.riskScore,
        overallStatus: result.overallStatus,
        totalIssues: result.executiveSummary.totalIssueCount,
        criticalCount: result.executiveSummary.criticalCount,
        highCount: result.executiveSummary.highCount,
        result,
        capabilities,
        misuseScenarios,
      },
    },
  );

  if (error || !data?.shareToken) {
    const message = await extractEdgeError(error, 'Failed to save report.');
    console.error('Failed to save report:', message);
    return null;
  }

  return data.shareToken;
}

// Reads go through the token-scoped SECURITY DEFINER function; there is no
// direct anon SELECT on scan_reports.
export async function loadReport(shareToken: string): Promise<SavedReport | null> {
  const { data, error } = await supabase
    .rpc('get_scan_report', { p_share_token: shareToken });

  if (error) {
    console.error('Failed to load report:', error);
    return null;
  }

  const raw = data as unknown;
  const record = Array.isArray(raw) ? raw[0] : raw;
  return (record ?? null) as SavedReport | null;
}

// Feedback inserts go through an edge function so the anon insert policy can
// stay closed; the function validates the referenced report exists.
export async function submitFeedback(
  reportId: string,
  issueId: string,
  isHelpful: boolean,
): Promise<boolean> {
  const { error } = await supabase.functions.invoke('submit-feedback', {
    headers: edgeFunctionHeaders(),
    body: { reportId, issueId, isHelpful },
  });

  if (error) {
    const message = await extractEdgeError(error, 'Failed to submit feedback.');
    console.error('Failed to submit feedback:', message);
    return false;
  }

  return true;
}
