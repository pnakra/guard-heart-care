// Server-side insert for scan_reports. Runs behind the shared access token +
// per-IP rate limiter so the table can stay locked down (no anon insert policy);
// service role bypasses RLS to write the row.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";
import { corsHeaders, guardRequest } from "../_shared/security.ts";

const MAX_PROJECT_NAME = 300;
const MAX_RESULT_JSON = 1_000_000;
const MAX_CAPS_JSON = 300_000;
const MAX_MISUSE_JSON = 300_000;

function jsonSize(value: unknown): number {
  try {
    return JSON.stringify(value ?? null).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function bad(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return bad(405, "Method not allowed.");

  const guard = await guardRequest(req, "save-report");
  if (guard) return guard;

  let body: {
    projectName?: unknown;
    detectedCategory?: unknown;
    riskScore?: unknown;
    overallStatus?: unknown;
    totalIssues?: unknown;
    criticalCount?: unknown;
    highCount?: unknown;
    result?: unknown;
    capabilities?: unknown;
    misuseScenarios?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return bad(400, "Invalid JSON body.");
  }

  const projectName = typeof body.projectName === "string" ? body.projectName.trim() : "";
  if (!projectName) return bad(400, "projectName is required.");
  if (projectName.length > MAX_PROJECT_NAME) return bad(400, "projectName too long.");

  const detectedCategory =
    typeof body.detectedCategory === "string" && body.detectedCategory.length <= 100
      ? body.detectedCategory
      : null;
  const overallStatus =
    typeof body.overallStatus === "string" && body.overallStatus.length <= 40
      ? body.overallStatus
      : "medium";
  const riskScore = Number.isFinite(body.riskScore) ? Number(body.riskScore) : 0;
  const totalIssues = Number.isFinite(body.totalIssues) ? Number(body.totalIssues) : 0;
  const criticalCount = Number.isFinite(body.criticalCount) ? Number(body.criticalCount) : 0;
  const highCount = Number.isFinite(body.highCount) ? Number(body.highCount) : 0;

  if (!body.result || typeof body.result !== "object") return bad(400, "result is required.");
  if (jsonSize(body.result) > MAX_RESULT_JSON) return bad(413, "result payload too large.");
  const capabilities = Array.isArray(body.capabilities) ? body.capabilities : [];
  if (jsonSize(capabilities) > MAX_CAPS_JSON) return bad(413, "capabilities payload too large.");
  const misuseScenarios = Array.isArray(body.misuseScenarios) ? body.misuseScenarios : [];
  if (jsonSize(misuseScenarios) > MAX_MISUSE_JSON) return bad(413, "misuseScenarios payload too large.");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return bad(500, "Server storage not configured.");
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data, error } = await supabase
    .from("scan_reports")
    .insert({
      project_name: projectName,
      detected_category: detectedCategory,
      risk_score: riskScore,
      overall_status: overallStatus,
      total_issues: totalIssues,
      critical_count: criticalCount,
      high_count: highCount,
      result_json: body.result,
      capabilities_json: capabilities,
      misuse_scenarios_json: misuseScenarios,
    })
    .select("share_token")
    .single();

  if (error) {
    console.error("save-report insert failed:", error);
    return bad(500, "Failed to save report.");
  }

  return new Response(JSON.stringify({ shareToken: data.share_token }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
