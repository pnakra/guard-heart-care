import { HarmCategory, SeverityLevel } from '@/types/ethics';

// Plain language category labels — for non-technical readers (social impact pros)
export const PLAIN_CATEGORY_LABELS: Record<HarmCategory, string> = {
  'restrictive-masculinity': 'Harmful Masculinity Patterns',
  'false-authority': 'Pretending to Be an Expert',
  'manipulation': 'Pressure & Coercion',
  'surveillance': 'Tracking & Monitoring',
  'admin-abuse': 'Too Much Admin Power',
  'ai-hallucination': 'AI Acting Too Sure of Itself',
  'dark-patterns': 'Sneaky or Misleading Design',
  'environmental-impact': 'Environmental Cost',
};

// Short one-line descriptions of each category for vibe mode context
export const PLAIN_CATEGORY_DESCRIPTIONS: Record<HarmCategory, string> = {
  'restrictive-masculinity': 'Designs that reinforce narrow or harmful ideas about how men should think, feel, or act.',
  'false-authority': 'Telling users something is expert advice when it isn\'t — e.g. medical, legal, or financial guidance from an AI.',
  'manipulation': 'Pushing people into choices they wouldn\'t freely make — fake urgency, guilt prompts, hard-to-leave flows.',
  'surveillance': 'Watching, recording, or tracking people in ways they don\'t fully understand or consent to.',
  'admin-abuse': 'Giving owners or admins power over users without checks — silent edits, hidden access, no audit trail.',
  'ai-hallucination': 'AI presenting made-up or uncertain answers with confidence, with no warning to the user.',
  'dark-patterns': 'Interface tricks that nudge users into actions that benefit the product, not them.',
  'environmental-impact': 'Designs that quietly run up large energy or compute costs for little user benefit.',
};

// Plain language severity labels
export const PLAIN_SEVERITY_LABELS: Record<SeverityLevel, string> = {
  critical: 'Fix immediately',
  high: 'Fix before launch',
  medium: 'Fix soon',
  low: 'Worth noting',
  safe: 'All clear',
};

// Plain language mitigation type labels — replaces "UI Language Change" etc.
export const PLAIN_MITIGATION_TYPE_LABELS: Record<string, string> = {
  'ui-language': 'Change the wording',
  'interaction-model': 'Change how it works',
  'feature-removal': 'Remove the feature',
  'reframing': 'Reframe the purpose',
};

// Plain language effort labels
export const PLAIN_EFFORT_LABELS: Record<string, string> = {
  low: 'Quick fix (an hour or two)',
  medium: 'Moderate effort (a day or so)',
  high: 'Bigger project (a week or more)',
};

// Known issue title mappings (extend as needed)
export const PLAIN_TITLE_MAP: Record<string, string> = {
  // Add known AI-generated titles here for exact rewrites
};

export function getPlainTitle(issueId: string, originalTitle: string): string {
  if (PLAIN_TITLE_MAP[issueId]) return PLAIN_TITLE_MAP[issueId];
  return originalTitle;
}
