-- Close the report-enumeration hole. Previously "Anyone can read scan reports"
-- allowed anon to SELECT every row (and every embedded code excerpt). Reports
-- are now readable only by someone holding the row's unguessable share_token.

-- 1. Unguessable share token used in /report/:token links (existing rows get one
--    via the default; old PK-based links stop resolving, which is intended).
ALTER TABLE public.scan_reports
  ADD COLUMN share_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX scan_reports_share_token_idx ON public.scan_reports (share_token);

-- 2. Remove the permissive anon/authenticated SELECT policies (no direct reads).
DROP POLICY IF EXISTS "Anyone can read scan reports" ON public.scan_reports;
DROP POLICY IF EXISTS "Anyone can read finding feedback" ON public.finding_feedback;

-- 3. Keep insert open (anonymous scans) but bound the payloads so the open
--    endpoint can't be used to dump unbounded data into the table.
ALTER TABLE public.scan_reports
  ADD CONSTRAINT scan_reports_project_name_len   CHECK (char_length(project_name) <= 300),
  ADD CONSTRAINT scan_reports_result_json_size   CHECK (char_length(result_json::text) <= 1000000),
  ADD CONSTRAINT scan_reports_caps_json_size     CHECK (char_length(capabilities_json::text) <= 300000),
  ADD CONSTRAINT scan_reports_misuse_json_size   CHECK (char_length(misuse_scenarios_json::text) <= 300000);

ALTER TABLE public.finding_feedback
  ADD CONSTRAINT finding_feedback_issue_id_len   CHECK (char_length(issue_id) <= 200);

-- 4. Token-scoped read path. SECURITY DEFINER bypasses RLS to return exactly the
--    one report whose share_token matches — knowing the token is the only way in.
CREATE OR REPLACE FUNCTION public.get_scan_report(p_share_token UUID)
RETURNS public.scan_reports
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.scan_reports WHERE share_token = p_share_token LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_scan_report(UUID) TO anon, authenticated;
