// CANONICAL vertical risk profiles — the single source of truth for both the
// analyze-code edge function (which imports this file) and the frontend
// taxonomy UI (src/data/verticalProfiles.ts mirrors this exactly).
// src/test/profileParity.test.ts fails the build if the two ever drift.
// Pure data + a pure prompt builder — no Deno/browser APIs — so it is safe to
// import from Deno, and to read from Vitest for the parity check.

export interface VerticalProfile {
  elevatedCategories: string[];
  additionalHarmPatterns: string[];
  standardMitigations: string[];
  populationNotes: string;
}

export const VERTICAL_PROFILES: Record<string, VerticalProfile> = {
  fitness: {
    elevatedCategories: ['ai-hallucination', 'manipulation', 'restrictive-masculinity'],
    additionalHarmPatterns: ['Body image distortion through metrics or comparisons', 'Calorie restriction encouragement without medical context', 'Progress shaming or guilt-based engagement', 'AI meal plans or supplement advice framed as professional', 'Competitive leaderboards triggering compulsive exercise', 'Shame-based streak mechanics tying masculine identity to performance outcomes', 'Absence of recovery and rest modeled as strength', 'Leaderboard mechanics framing low performance as personal failure'],
    standardMitigations: ['Disclaimer that fitness advice is not medical guidance', 'Avoid absolute language in health metrics', 'Opt-out from social comparison features', 'Content warnings on calorie tracking for ED history'],
    populationNotes: 'Users vulnerable to eating disorders, body dysmorphia, and exercise addiction. Teens and young adults especially at risk. Young men vulnerable to shame-based performance mechanics.',
  },
  dating: {
    elevatedCategories: ['surveillance', 'manipulation', 'restrictive-masculinity'],
    additionalHarmPatterns: ['Location sharing enabling stalking', 'Read receipts enabling controlling behavior', 'Profile info usable to locate someone offline', 'Features bypassing block/unmatch boundaries', 'AI messaging manufacturing false intimacy or consent', 'Screenshot/export of private conversations', 'Entitlement affordances treating rejection as negotiable', 'AI messaging coaching optimizing for persistence after disinterest', 'Content or persona design modeling adversarial or transactional relationship frameworks', 'Algorithmic pipelines routing lonely or rejected men toward misogynistic worldviews'],
    standardMitigations: ['Robust block/report with full visibility removal', 'Fuzzy location only', 'No read receipts by default', 'Clear consent before sharing photos/info', 'Silent unmatch'],
    populationNotes: 'Includes DV survivors, stalking targets, LGBTQ+ in hostile regions. Any feature revealing identity, location, or activity can be weaponized. Men experiencing loneliness or rejection vulnerable to adversarial gender frameworks.',
  },
  fintech: {
    elevatedCategories: ['manipulation', 'false-authority', 'restrictive-masculinity'],
    additionalHarmPatterns: ['Dark patterns in cancellation flows', 'Urgency/scarcity pressuring financial decisions', 'AI financial advice framed as professional', 'Hidden fees or unclear pricing', 'Auto-recurring charges without disclosure', 'Debt normalization', 'Masculine identity used as hook for high-risk financial products', 'Influencer-style content framing financial risk-taking as test of manhood', 'FOMO and urgency mechanics tied to masculine status', 'Absence of disclaimers on financial content in masculine-coded communities'],
    standardMitigations: ['Clear upfront pricing', 'One-click cancellation', 'Financial info disclaimer', 'Transaction confirmation with cooling-off period'],
    populationNotes: 'Users in debt, financially illiterate, or in economic distress. Subscription traps affect elderly and cognitively disabled disproportionately. Young men vulnerable to masculine-coded financial exploitation.',
  },
  health: {
    elevatedCategories: ['false-authority', 'ai-hallucination', 'restrictive-masculinity'],
    additionalHarmPatterns: ['AI diagnoses framed as clinical', 'Mood tracking inferring conditions without validity', 'Dosage calculators without pharmacist review', 'Crisis detection without escalation protocols', 'Clinical language used by non-medical AI', 'Wellness scores mimicking clinical assessments', 'Features substituting AI support for professional care specifically for men', 'Help-seeking suppression through self-reliance framing', 'Absence of referral pathways in mental health tools marketed to men and boys', 'Design that pathologizes emotional disclosure or help-seeking'],
    standardMitigations: ['Prominent "not medical advice" disclaimer', 'Crisis resources surfaced when risk detected', 'No clinical language in AI content', 'Health data encryption and access controls'],
    populationNotes: 'People experiencing symptoms, chronic conditions, or mental health crises. Misplaced authority can delay real care. Men and boys are the least likely demographic to seek mental health support.',
  },
  productivity: {
    elevatedCategories: ['surveillance', 'admin-abuse', 'restrictive-masculinity'],
    additionalHarmPatterns: ['Activity monitoring enabling micromanagement', 'Productivity scores visible to managers', 'Time tracking penalizing breaks', 'Calendar transparency exposing personal info', 'Automated performance reports from activity', 'Hustle-culture AI personas framing overwork and sacrifice as peak masculine performance', 'Shame mechanics tied to productivity metrics', 'Design equating output with personal worth'],
    standardMitigations: ['User control over shared activity data', 'No productivity scoring visible to others', 'Right to disconnect outside hours', 'Workload visibility'],
    populationNotes: 'Workers with no real choice about tool adoption. Remote and gig workers especially vulnerable to always-on monitoring.',
  },
  social: {
    elevatedCategories: ['manipulation', 'surveillance', 'restrictive-masculinity'],
    additionalHarmPatterns: ['Algorithmic outrage amplification', 'Engagement metrics enabling social comparison harm', 'Filter bubbles and radicalization paths', 'Harassment infrastructure: mass tagging, pile-ons', 'Doxxing vectors', 'Addictive patterns: infinite scroll, notification urgency', 'Minor safety: age-inappropriate content, predator vectors', 'Community norms baked into UI rewarding dominance and bravado', 'Isolation reinforcement through algorithmic filtering', 'Content pipelines routing men experiencing loneliness toward misogynistic or adversarial gender frameworks', 'Absence of features prompting IRL or peer connection'],
    standardMitigations: ['Robust block/mute across all paths', 'Option to hide engagement metrics', 'Content warnings and filters', 'Rate limiting on mentions and DMs', 'Age verification and minor protections'],
    populationNotes: 'Minors, bullying targets, people with social anxiety. Marginalized communities face disproportionate harassment. Men and boys vulnerable to isolation reinforcement and adversarial gender content pipelines.',
  },
  b2b: {
    elevatedCategories: ['admin-abuse'],
    additionalHarmPatterns: ['Admin reading private data without audit trail', 'User impersonation without consent', 'Silent content modification', 'Data export for surveillance', 'Role escalation without notification', 'Tenant data isolation failures', 'Punishment without transparency'],
    standardMitigations: ['Audit logging visible to affected users', 'No silent content editing', 'Impersonation requires notification', 'Data export with consent', 'Role change notifications'],
    populationNotes: 'Employees on company-mandated tools with no opt-out. Admin features without transparency enable retaliation and discrimination.',
  },
  gaming: {
    elevatedCategories: ['manipulation', 'ai-hallucination', 'restrictive-masculinity'],
    additionalHarmPatterns: ['Loot box/gacha with obscured odds', 'Pay-to-win mechanics', 'FOMO limited-time events pressuring spending', 'Social pressure: gifting, clan obligations, streaks', 'Leaderboards enabling targeted harassment', 'Child-accessible spending without parental controls', 'Hypermasculine persona design modeling aggression and dominance as exclusive path to status', 'Shame-based rank mechanics tying male identity to performance', 'Absence of cooperative or connection-based win conditions', 'Financial exploitation mechanics using masculine status framing'],
    standardMitigations: ['Transparent odds disclosure', 'Spending limits and cooldowns', 'Parental controls', 'Option to hide from leaderboards', 'Play time reminders'],
    populationNotes: 'Heavily used by minors and those vulnerable to gambling-like mechanics. Young men vulnerable to shame-based rank mechanics and hypermasculine persona design.',
  },
};

export function getVerticalProfilePrompt(category: string): string {
  const profile = VERTICAL_PROFILES[category];
  if (!profile) return '';
  return `\n\nVERTICAL RISK PROFILE (${category.toUpperCase()}):\n${JSON.stringify(profile, null, 2)}\n\nApply this profile: weight the elevated categories more heavily, actively scan for the additional harm patterns listed, and check whether the standard mitigations are present. Consider the population notes when assessing severity.`;
}
