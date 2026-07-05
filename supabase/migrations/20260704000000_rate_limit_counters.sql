-- Per-IP rate limiting for edge functions (analyze-code, fetch-github-repo).
-- The edge functions call check_rate_limit() with the service-role key; the
-- table is never touched directly by clients.

CREATE TABLE public.rate_limit_counters (
  bucket        TEXT NOT NULL,
  identifier    TEXT NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT now(),
  count         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, identifier)
);

-- RLS on with no policies: only the service role (which bypasses RLS) can read
-- or write these counters. anon/authenticated get nothing.
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;

-- Atomic fixed-window check-and-increment. Returns whether the caller is under
-- the cap, how many requests remain in the window, and when the window resets.
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

-- Only the service role should invoke this. Revoke the default PUBLIC/anon grant.
REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM anon, authenticated;
