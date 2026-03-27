
-- Table to store scan results with shareable IDs
CREATE TABLE public.scan_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name TEXT NOT NULL,
  detected_category TEXT,
  risk_score NUMERIC NOT NULL DEFAULT 0,
  overall_status TEXT NOT NULL DEFAULT 'medium',
  total_issues INTEGER NOT NULL DEFAULT 0,
  critical_count INTEGER NOT NULL DEFAULT 0,
  high_count INTEGER NOT NULL DEFAULT 0,
  result_json JSONB NOT NULL,
  capabilities_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  misuse_scenarios_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to store per-finding feedback
CREATE TABLE public.finding_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.scan_reports(id) ON DELETE CASCADE NOT NULL,
  issue_id TEXT NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scan_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finding_feedback ENABLE ROW LEVEL SECURITY;

-- Public read access for shareable links (anonymous scans)
CREATE POLICY "Anyone can read scan reports" ON public.scan_reports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert scan reports" ON public.scan_reports FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read finding feedback" ON public.finding_feedback FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert finding feedback" ON public.finding_feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
