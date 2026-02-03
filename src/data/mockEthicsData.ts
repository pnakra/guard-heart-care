import { EthicsReviewResult, EthicsIssue, CategorySummary, SeverityLevel } from '@/types/ethics';

export const mockIssues: EthicsIssue[] = [
  {
    id: '1',
    category: 'manipulation',
    title: 'Urgency Pattern Detected',
    description: 'A countdown timer is being used alongside a purchase action. This creates artificial urgency that may pressure users into decisions they wouldn\'t otherwise make.',
    severity: 'medium',
    location: 'src/components/PricingCard.tsx:42',
    recommendation: 'Consider removing the countdown or ensuring it reflects a genuine deadline. If time-limited, clearly communicate what happens when the timer expires.',
    learnMoreUrl: 'https://darkpatterns.org/types-of-dark-pattern/urgency'
  },
  {
    id: '2',
    category: 'dark-patterns',
    title: 'Confirmshaming Language',
    description: 'The opt-out option uses negative language ("No, I don\'t want to save money") that may shame users into making a particular choice.',
    severity: 'high',
    location: 'src/components/NewsletterModal.tsx:28',
    recommendation: 'Use neutral language for all options. Replace with something like "No thanks" or "Skip for now".',
    learnMoreUrl: 'https://darkpatterns.org/types-of-dark-pattern/confirmshaming'
  },
  {
    id: '3',
    category: 'privacy',
    title: 'Pre-selected Marketing Consent',
    description: 'Marketing email consent checkbox is pre-selected by default, which may violate GDPR and similar regulations.',
    severity: 'high',
    location: 'src/components/SignupForm.tsx:67',
    recommendation: 'Ensure all consent checkboxes are unchecked by default. Users should actively opt-in to marketing communications.',
  },
  {
    id: '4',
    category: 'accessibility',
    title: 'Motion Without Preference Check',
    description: 'Animated elements do not respect the prefers-reduced-motion media query, which may cause issues for users with vestibular disorders.',
    severity: 'low',
    location: 'src/components/HeroSection.tsx:15',
    recommendation: 'Wrap animations in a check for prefers-reduced-motion: reduce and provide static alternatives.',
  },
  {
    id: '5',
    category: 'addiction',
    title: 'Infinite Scroll Pattern',
    description: 'Content feed uses infinite scroll without natural stopping points, which can encourage compulsive usage patterns.',
    severity: 'medium',
    location: 'src/components/Feed.tsx:89',
    recommendation: 'Consider adding pagination, "You\'re all caught up" messages, or usage time reminders.',
  },
  {
    id: '6',
    category: 'transparency',
    title: 'Hidden Costs',
    description: 'Additional fees (service fee, processing fee) are only revealed at the final checkout step.',
    severity: 'high',
    location: 'src/components/Checkout.tsx:134',
    recommendation: 'Display total cost including all fees earlier in the user journey, ideally on product pages.',
  },
  {
    id: '7',
    category: 'discrimination',
    title: 'Potentially Biased Content Personalization',
    description: 'Content recommendation algorithm may create filter bubbles or reinforce existing biases in content consumption.',
    severity: 'low',
    location: 'src/utils/recommendations.ts:45',
    recommendation: 'Consider adding diversity factors to recommendations and providing transparency about why content is suggested.',
  },
  {
    id: '8',
    category: 'manipulation',
    title: 'Scarcity Indicator',
    description: '"Only 3 left!" messaging may be artificial and designed to pressure purchases.',
    severity: 'medium',
    location: 'src/components/ProductCard.tsx:23',
    recommendation: 'Ensure scarcity indicators reflect real inventory levels. Consider removing if not genuinely limited.',
  },
];

export const mockCategories: CategorySummary[] = [
  {
    category: 'manipulation',
    label: 'Manipulation',
    description: 'Patterns that exploit psychological biases to influence user behavior',
    icon: 'brain',
    issueCount: 2,
    highestSeverity: 'medium',
  },
  {
    category: 'dark-patterns',
    label: 'Dark Patterns',
    description: 'Deceptive UX patterns that trick users into unintended actions',
    icon: 'eye-off',
    issueCount: 1,
    highestSeverity: 'high',
  },
  {
    category: 'privacy',
    label: 'Privacy',
    description: 'Concerns related to data collection, consent, and user privacy',
    icon: 'shield',
    issueCount: 1,
    highestSeverity: 'high',
  },
  {
    category: 'accessibility',
    label: 'Accessibility',
    description: 'Issues that may exclude users with disabilities',
    icon: 'accessibility',
    issueCount: 1,
    highestSeverity: 'low',
  },
  {
    category: 'addiction',
    label: 'Addiction Mechanics',
    description: 'Features that may encourage compulsive or excessive usage',
    icon: 'refresh-cw',
    issueCount: 1,
    highestSeverity: 'medium',
  },
  {
    category: 'transparency',
    label: 'Transparency',
    description: 'Hidden information or misleading representations',
    icon: 'search',
    issueCount: 1,
    highestSeverity: 'high',
  },
  {
    category: 'discrimination',
    label: 'Discrimination',
    description: 'Potential for bias or unfair treatment of user groups',
    icon: 'users',
    issueCount: 1,
    highestSeverity: 'low',
  },
  {
    category: 'misinformation',
    label: 'Misinformation',
    description: 'Risk of spreading false or misleading information',
    icon: 'alert-triangle',
    issueCount: 0,
    highestSeverity: 'safe',
  },
];

export const calculateOverallStatus = (issues: EthicsIssue[]): SeverityLevel => {
  if (issues.some(i => i.severity === 'critical')) return 'critical';
  if (issues.some(i => i.severity === 'high')) return 'high';
  if (issues.some(i => i.severity === 'medium')) return 'medium';
  if (issues.some(i => i.severity === 'low')) return 'low';
  return 'safe';
};

export const mockReviewResult: EthicsReviewResult = {
  overallStatus: calculateOverallStatus(mockIssues),
  issues: mockIssues,
  categories: mockCategories,
  timestamp: new Date().toISOString(),
  projectName: 'E-commerce Platform',
};
