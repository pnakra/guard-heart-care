import { HarmCategory } from '@/types/ethics';
import { AppCategory } from '@/services/categoryDetector';

export interface VerticalProfile {
  elevatedCategories: HarmCategory[];
  additionalHarmPatterns: string[];
  standardMitigations: string[];
  populationNotes: string;
}

export const VERTICAL_PROFILES: Record<Exclude<AppCategory, 'unknown'>, VerticalProfile> = {
  fitness: {
    elevatedCategories: ['ai-hallucination', 'manipulation'],
    additionalHarmPatterns: [
      'Body image distortion through "ideal" metrics or comparisons',
      'Calorie restriction encouragement without medical context',
      'Progress shaming or guilt-based engagement (streaks, "you missed a day")',
      'AI-generated meal plans or supplement advice framed as professional guidance',
      'Before/after framing that normalizes disordered body image',
      'Competitive leaderboards that could trigger compulsive exercise',
    ],
    standardMitigations: [
      'Disclaimer that fitness advice is not a substitute for medical guidance',
      'Avoid absolute language in health metrics ("unhealthy", "bad")',
      'Opt-out from social comparison features',
      'Content warnings on calorie tracking for users with eating disorder history',
    ],
    populationNotes:
      'Fitness apps are disproportionately used by people vulnerable to eating disorders, body dysmorphia, and exercise addiction. Teens and young adults are especially at risk. Any feature that quantifies body metrics or encourages restriction must be evaluated for potential to trigger or reinforce harmful behaviors.',
  },

  dating: {
    elevatedCategories: ['surveillance', 'manipulation'],
    additionalHarmPatterns: [
      'Location sharing that could enable stalking after a date',
      'Message read receipts or "last seen" enabling controlling behavior',
      'Profile information that could be used to locate someone offline',
      'Features that help bypass someone setting a boundary (unmatch, block)',
      'AI-assisted messaging that manufactures false intimacy or consent',
      'Algorithmic matching that reinforces racial or body-type bias',
      'Screenshot or data export of private conversations',
    ],
    standardMitigations: [
      'Robust block/report that fully removes visibility in both directions',
      'Fuzzy location (neighborhood-level, not precise)',
      'No read receipts by default',
      'Clear consent language before sharing photos or personal info',
      'Easy unmatch with no notification to the other party',
    ],
    populationNotes:
      'Dating apps are used in contexts of extreme interpersonal vulnerability. Users include survivors of domestic violence, people being stalked, and LGBTQ+ individuals in hostile regions. Any feature that reveals identity, location, or activity patterns can be weaponized. Power dynamics between matches are inherently asymmetric.',
  },

  fintech: {
    elevatedCategories: ['manipulation', 'false-authority'],
    additionalHarmPatterns: [
      'Dark patterns in subscription cancellation flows',
      'Urgency or scarcity language pressuring financial decisions',
      'AI financial advice framed as professional recommendation',
      'Hidden fees or unclear pricing structures',
      'Automatic recurring charges without prominent disclosure',
      'Debt normalization or "buy now pay later" without risk framing',
      'Access to transaction history by admin without user knowledge',
    ],
    standardMitigations: [
      'Clear, upfront pricing with no hidden fees',
      'One-click subscription cancellation',
      'Disclaimer that financial information is not professional advice',
      'Transaction confirmation with cooling-off period for large amounts',
      'Transparent billing history accessible to users',
    ],
    populationNotes:
      'Fintech apps handle users\' financial livelihood. Vulnerable populations include people in debt, financially illiterate users, and those in economic distress. Dark patterns in payment flows can cause real financial harm. Subscription traps disproportionately affect elderly users and those with cognitive disabilities.',
  },

  health: {
    elevatedCategories: ['false-authority', 'ai-hallucination'],
    additionalHarmPatterns: [
      'AI-generated diagnoses or symptom assessments framed as clinical',
      'Mood tracking used to infer mental health conditions without clinical validity',
      'Dosage calculators or medication reminders without pharmacist review',
      'Crisis detection (suicidal ideation) without proper escalation protocols',
      'Health data shared with third parties or visible to non-clinical admin',
      'Clinical language ("diagnosis", "prescription", "treatment") used by non-medical AI',
      'Wellness scores that mimic clinical assessments',
    ],
    standardMitigations: [
      'Prominent disclaimer: "This is not medical advice"',
      'Crisis resources (988, emergency services) surfaced when risk detected',
      'No clinical language in AI-generated content',
      'Data encryption and strict access controls on health information',
      'Clear distinction between tracking tools and clinical assessments',
    ],
    populationNotes:
      'Health apps serve people at their most vulnerable: those experiencing symptoms, managing chronic conditions, or in mental health crises. Misplaced authority can delay real medical care or cause harm through incorrect self-treatment. Users with health anxiety may over-rely on app assessments. Mental health features carry risk of self-harm if crisis protocols are absent.',
  },

  productivity: {
    elevatedCategories: ['surveillance', 'admin-abuse'],
    additionalHarmPatterns: [
      'Activity monitoring that enables micromanagement of employees',
      'Productivity scores visible to managers creating pressure',
      'Time tracking that penalizes breaks or non-linear work patterns',
      'Task assignment without workload visibility creating burnout',
      'Calendar transparency revealing personal appointments to employers',
      'Automated performance reports based on activity metrics',
    ],
    standardMitigations: [
      'User control over what activity data is shared with team/manager',
      'No productivity scoring visible to others by default',
      'Right to disconnect: no notifications outside configured hours',
      'Workload visibility to prevent over-assignment',
    ],
    populationNotes:
      'Productivity apps are used in employer-employee power dynamics where workers may have no real choice about adoption. Features that monitor activity or measure productivity can enable workplace surveillance and create toxic pressure. Remote workers and gig economy participants are especially vulnerable to always-on monitoring.',
  },

  social: {
    elevatedCategories: ['manipulation', 'surveillance'],
    additionalHarmPatterns: [
      'Algorithmic amplification of outrage or divisive content',
      'Engagement metrics (likes, followers) enabling social comparison harm',
      'Content recommendation that creates filter bubbles or radicalization paths',
      'Harassment infrastructure: mass tagging, pile-on mechanics, quote-dunking',
      'Doxxing vectors: location tags, workplace info, real name requirements',
      'Addictive patterns: infinite scroll, pull-to-refresh, notification urgency',
      'Minor safety: age-inappropriate content exposure, predator contact vectors',
    ],
    standardMitigations: [
      'Robust block/mute that prevents all interaction paths',
      'Option to hide engagement metrics',
      'Content warnings and sensitive content filters',
      'Anti-harassment: rate limiting on mentions, replies, and DMs',
      'Age verification and minor-specific protections',
    ],
    populationNotes:
      'Social platforms are used by minors, people experiencing bullying, those with social anxiety, and individuals targeted for harassment. Engagement-maximizing features can cause addiction, depression, and real-world harm through coordinated abuse. Marginalized communities face disproportionate harassment.',
  },

  b2b: {
    elevatedCategories: ['admin-abuse'],
    additionalHarmPatterns: [
      'Admin ability to read private user messages or data without audit trail',
      'User impersonation features without consent or notification',
      'Silent content modification: editing user submissions without record',
      'Data export of individual user activity for surveillance purposes',
      'Role escalation without notification to affected users',
      'Tenant data isolation failures enabling cross-org data access',
      'Punishment mechanics: feature restrictions, visibility changes without transparency',
    ],
    standardMitigations: [
      'Audit logging for all admin actions visible to affected users',
      'No silent content editing: all changes tracked and attributed',
      'Admin impersonation requires user notification',
      'Data export controls with user consent requirements',
      'Role change notifications to affected users',
    ],
    populationNotes:
      'B2B platforms create power asymmetries between administrators and users. Employees using company-mandated tools have no choice about platform use and limited ability to object to surveillance. Admin features that lack transparency can be used for workplace retaliation, discrimination, and privacy violations.',
  },

  gaming: {
    elevatedCategories: ['manipulation', 'ai-hallucination'],
    additionalHarmPatterns: [
      'Loot box or gacha mechanics with obscured odds',
      'Pay-to-win mechanics creating unfair advantages',
      'FOMO-driven limited-time events pressuring spending',
      'Social pressure mechanics: gifting, clan obligations, daily login streaks',
      'Leaderboards that enable targeted harassment of low-ranked players',
      'AI opponents that adapt difficulty to maximize engagement (not fun)',
      'Child-accessible spending without parental controls',
    ],
    standardMitigations: [
      'Transparent odds disclosure for randomized purchases',
      'Spending limits and purchase cooldowns',
      'Parental controls for minor accounts',
      'Option to hide from leaderboards',
      'Play time reminders and session limits',
    ],
    populationNotes:
      'Gaming apps are heavily used by minors and people vulnerable to gambling-like mechanics. Randomized reward systems exploit the same psychological vulnerabilities as slot machines. Social pressure mechanics can create obligation spending. Players with addictive tendencies are specifically targeted by engagement optimization.',
  },
};
