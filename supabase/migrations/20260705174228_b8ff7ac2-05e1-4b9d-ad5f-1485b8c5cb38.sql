
-- Migration 1: rate_limit_counters
CREATE TABLE public.rate_limit_counters (
  bucket        TEXT NOT NULL,
  identifier    TEXT NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT now(),
  count         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, identifier)
);

ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_bucket          TEXT,
  p_identifier      TEXT,
  p_max             INTEGER,
  p_window_seconds  INTEGER
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, retry_after_seconds INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now          TIMESTAMPTZ := now();
  v_count        INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  INSERT INTO public.rate_limit_counters AS rlc (bucket, identifier, window_start, count)
  VALUES (p_bucket, p_identifier, v_now, 1)
  ON CONFLICT (bucket, identifier) DO UPDATE
    SET
      count = CASE
        WHEN rlc.window_start < v_now - make_interval(secs => p_window_seconds) THEN 1
        ELSE rlc.count + 1
      END,
      window_start = CASE
        WHEN rlc.window_start < v_now - make_interval(secs => p_window_seconds) THEN v_now
        ELSE rlc.window_start
      END
  RETURNING rlc.count, rlc.window_start INTO v_count, v_window_start;

  allowed := v_count <= p_max;
  remaining := GREATEST(0, p_max - v_count);
  retry_after_seconds := CASE
    WHEN v_count <= p_max THEN 0
    ELSE GREATEST(
      1,
      CEIL(EXTRACT(EPOCH FROM (v_window_start + make_interval(secs => p_window_seconds) - v_now)))::INTEGER
    )
  END;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM anon, authenticated;

-- Migration 2: report access hardening
ALTER TABLE public.scan_reports
  ADD COLUMN share_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX scan_reports_share_token_idx ON public.scan_reports (share_token);

DROP POLICY IF EXISTS "Anyone can read scan reports" ON public.scan_reports;
DROP POLICY IF EXISTS "Anyone can read finding feedback" ON public.finding_feedback;

ALTER TABLE public.scan_reports
  ADD CONSTRAINT scan_reports_project_name_len   CHECK (char_length(project_name) <= 300),
  ADD CONSTRAINT scan_reports_result_json_size   CHECK (char_length(result_json::text) <= 1000000),
  ADD CONSTRAINT scan_reports_caps_json_size     CHECK (char_length(capabilities_json::text) <= 300000),
  ADD CONSTRAINT scan_reports_misuse_json_size   CHECK (char_length(misuse_scenarios_json::text) <= 300000);

ALTER TABLE public.finding_feedback
  ADD CONSTRAINT finding_feedback_issue_id_len   CHECK (char_length(issue_id) <= 200);

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
