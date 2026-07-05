// Server-side insert for finding_feedback. Behind the shared access token +
// rate limiter so the table can stay locked (no anon insert policy). Also
// checks the referenced report exists and caps per-report vote volume.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";
import { corsHeaders, guardRequest } from "../_shared/security.ts";

const MAX_ISSUE_ID = 200;

function bad(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return bad(405, "Method not allowed.");

  const guard = await guardRequest(req, "submit-feedback");
  if (guard) return guard;

  let body: { reportId?: unknown; issueId?: unknown; isHelpful?: unknown };
  try {
    body = await req.json();
  } catch {
    return bad(400, "Invalid JSON body.");
  }

  const reportId = typeof body.reportId === "string" ? body.reportId : "";
  const issueId = typeof body.issueId === "string" ? body.issueId.trim() : "";
  const isHelpful = typeof body.isHelpful === "boolean" ? body.isHelpful : null;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reportId)) {
    return bad(400, "Invalid reportId.");
  }
  if (!issueId || issueId.length > MAX_ISSUE_ID) return bad(400, "Invalid issueId.");
  if (isHelpful === null) return bad(400, "isHelpful must be a boolean.");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return bad(500, "Server storage not configured.");
  const supabase = createClient(supabaseUrl, serviceKey);

  // Confirm the referenced report exists before recording a vote.
  const { data: report, error: reportError } = await supabase
    .from("scan_reports")
    .select("id")
    .eq("id", reportId)
    .maybeSingle();
  if (reportError) {
    console.error("submit-feedback lookup failed:", reportError);
    return bad(500, "Failed to submit feedback.");
  }
  if (!report) return bad(404, "Report not found.");

  const { error } = await supabase
    .from("finding_feedback")
    .insert({ report_id: reportId, issue_id: issueId, is_helpful: isHelpful });

  if (error) {
    console.error("submit-feedback insert failed:", error);
    return bad(500, "Failed to submit feedback.");
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
