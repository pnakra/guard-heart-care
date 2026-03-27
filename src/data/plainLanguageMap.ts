import { HarmCategory, SeverityLevel } from '@/types/ethics';

// Plain language category labels
export const PLAIN_CATEGORY_LABELS: Record<HarmCategory, string> = {
  'false-authority': 'Fake Expert Claims',
  'manipulation': 'Pressure & Coercion',
  'surveillance': 'Tracking & Monitoring',
  'admin-abuse': 'Admin Overreach',
  'ai-hallucination': 'AI Overconfidence',
  'dark-patterns': 'Sneaky UX',
  'environmental-impact': 'Environmental Cost',
};

// Plain language severity labels
export const PLAIN_SEVERITY_LABELS: Record<SeverityLevel, string> = {
  critical: 'Fix immediately',
  high: 'Fix before launch',
  medium: 'Fix soon',
  low: 'Worth noting',
  safe: 'All clear',
};

// Known issue title mappings (extend as needed)
export const PLAIN_TITLE_MAP: Record<string, string> = {
  // Add known AI-generated titles here for exact rewrites
};

export function getPlainTitle(issueId: string, originalTitle: string): string {
  if (PLAIN_TITLE_MAP[issueId]) return PLAIN_TITLE_MAP[issueId];
  return `${originalTitle} (simplified)`;
}
