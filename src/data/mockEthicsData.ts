import { EthicsReviewResult, EthicsIssue, CategorySummary, SeverityLevel, HarmCategory, ExecutiveSummary } from '@/types/ethics';

// New harm-focused mock data aligned with the refined scanner
export const mockIssues: EthicsIssue[] = [
  {
    id: '1',
    category: 'false-authority',
    title: 'AI Framed as Relationship Expert',
    description: 'The AI chatbot provides definitive relationship advice with phrases like "You should definitely..." which could be interpreted as expert guidance.',
    severity: 'high',
    location: 'src/components/ChatInterface.tsx:42',
    misuseScenario: 'A user could use this feature to justify controlling behavior toward a partner by citing the AI\'s "advice" as validation',
    whyMisuseByDesign: 'The AI is positioned as an authority on human relationships without disclaimers, making its outputs appear as expert endorsement',
    mitigation: 'Add prominent disclaimer: "I\'m an AI and cannot provide relationship advice. Please consult a licensed therapist."',
    mitigationType: 'ui-language',
  },
  {
    id: '2',
    category: 'manipulation',
    title: 'Rejection Reframing Feature',
    description: 'The "Craft Response" feature helps users write persuasive messages after someone has declined, optimizing for "conversion".',
    severity: 'critical',
    location: 'src/components/MessageCraft.tsx:28',
    misuseScenario: 'A user could use this feature to pressure someone who said "no" by generating increasingly persuasive follow-up messages',
    whyMisuseByDesign: 'The feature explicitly helps overcome rejection, treating human boundaries as obstacles to optimize around',
    mitigation: 'Remove or reframe: Either remove the post-rejection messaging feature or add friction with "This person has already declined. Are you sure?"',
    mitigationType: 'feature-removal',
  },
  {
    id: '3',
    category: 'surveillance',
    title: 'Real-time Location Sharing Without Consent Renewal',
    description: 'Location sharing is enabled once and runs indefinitely without periodic consent renewal or visibility to the person being tracked.',
    severity: 'critical',
    location: 'src/hooks/useLocation.ts:15',
    misuseScenario: 'An abuser could enable location tracking on a partner\'s device once, then monitor their movements indefinitely without the partner\'s awareness',
    whyMisuseByDesign: 'The one-time consent model assumes ongoing consent, which is exploitable in coercive relationships where initial "consent" was under duress',
    mitigation: 'Require weekly consent renewal with visible indicator that sharing is active. Add easy "stop sharing" in prominent location.',
    mitigationType: 'interaction-model',
  },
  {
    id: '4',
    category: 'admin-abuse',
    title: 'Silent Content Modification by Admins',
    description: 'Admins can edit user-generated content without leaving an edit trail or notifying the original author.',
    severity: 'high',
    location: 'src/utils/adminActions.ts:67',
    misuseScenario: 'An admin could silently change a user\'s post to make them appear to have said something they didn\'t, for retaliation or manipulation',
    whyMisuseByDesign: 'The feature lacks transparency by design, allowing changes without accountability',
    mitigation: 'Add visible edit history and notify users when their content is modified. Consider append-only moderation comments instead.',
    mitigationType: 'interaction-model',
  },
  {
    id: '5',
    category: 'ai-hallucination',
    title: 'Medical Symptom Checker with Confident Language',
    description: 'The symptom checker uses definitive language like "You likely have..." without adequate disclaimers about AI limitations.',
    severity: 'high',
    location: 'src/components/SymptomChecker.tsx:89',
    misuseScenario: 'A user could delay seeking real medical care based on the AI\'s confident but potentially wrong assessment',
    whyMisuseByDesign: 'The confident framing makes AI hallucinations appear as medical diagnoses, which users may trust over professional care',
    mitigation: 'Reframe all outputs: "This is not a diagnosis. Please consult a healthcare provider." Remove confident language like "likely" or "probably".',
    mitigationType: 'reframing',
  },
];

export const mockCategories: CategorySummary[] = [
  {
    category: 'false-authority',
    label: 'False Authority',
    description: 'AI or UI positioned as moral/legal/medical authority',
    icon: 'scale',
    issueCount: 1,
    highestSeverity: 'high',
  },
  {
    category: 'manipulation',
    label: 'Manipulation',
    description: 'Features that help users coerce or pressure others',
    icon: 'brain',
    issueCount: 1,
    highestSeverity: 'critical',
  },
  {
    category: 'surveillance',
    label: 'Surveillance',
    description: 'Tracking features exploitable in abuse contexts',
    icon: 'eye',
    issueCount: 1,
    highestSeverity: 'critical',
  },
  {
    category: 'admin-abuse',
    label: 'Admin Abuse',
    description: 'Platform powers that could harm users',
    icon: 'shield-alert',
    issueCount: 1,
    highestSeverity: 'high',
  },
  {
    category: 'ai-hallucination',
    label: 'AI Hallucination',
    description: 'AI framed as expertise it cannot provide',
    icon: 'sparkles',
    issueCount: 1,
    highestSeverity: 'high',
  },
];

export const mockExecutiveSummary: ExecutiveSummary = {
  topThreeRisks: [
    {
      title: 'Rejection Reframing Feature',
      severity: 'critical',
      effortToFix: 'medium',
      summary: 'Helps users pressure people who have already said no, treating boundaries as obstacles.',
    },
    {
      title: 'Real-time Location Without Consent Renewal',
      severity: 'critical',
      effortToFix: 'medium',
      summary: 'One-time consent model is exploitable in domestic abuse situations.',
    },
    {
      title: 'AI Framed as Medical Authority',
      severity: 'high',
      effortToFix: 'low',
      summary: 'Confident diagnostic language could delay users seeking real medical care.',
    },
  ],
  riskScore: 7.4,
  totalIssueCount: 5,
  criticalCount: 2,
  highCount: 3,
};

export const calculateOverallStatus = (issues: EthicsIssue[]): SeverityLevel => {
  if (issues.some(i => i.severity === 'critical')) return 'critical';
  if (issues.some(i => i.severity === 'high')) return 'high';
  if (issues.some(i => i.severity === 'medium')) return 'medium';
  if (issues.some(i => i.severity === 'low')) return 'low';
  return 'safe';
};

export const mockReviewResult: EthicsReviewResult = {
  executiveSummary: mockExecutiveSummary,
  overallStatus: calculateOverallStatus(mockIssues),
  issues: mockIssues,
  categories: mockCategories,
  timestamp: new Date().toISOString(),
  projectName: 'Social Connection App',
};
