// ============================================================
// Benchmarking Service - Provides comparative context for risk scores
// ============================================================

import { Benchmark, ComparableProject, ScoreDistribution } from '@/types/ethicsV2';
import { DetectedCapability } from '@/data/mockMisuseData';

interface CategoryProfile {
  name: string;
  averageScore: number;
  distribution: ScoreDistribution;
  comparables: ComparableProject[];
}

// Synthetic benchmark database based on app categories
const CATEGORY_PROFILES: Record<string, CategoryProfile> = {
  'social-dating': {
    name: 'Social & Dating Apps',
    averageScore: 6.2,
    distribution: {
      '0-3': '8% of apps (Best-in-class)',
      '3-5': '22% of apps (Good)',
      '5-7': '45% of apps (Needs improvement)',
      '7-10': '25% of apps (High risk)',
    },
    comparables: [
      { name: 'Hinge', score: 4.8, relationship: 'Best-in-class example' },
      { name: 'Tinder', score: 6.5, relationship: 'Similar risk profile' },
      { name: 'Grindr (pre-2023)', score: 8.2, relationship: 'Much riskier' },
    ],
  },
  'health-wellness': {
    name: 'Health & Wellness Apps',
    averageScore: 5.4,
    distribution: {
      '0-3': '15% of apps (Best-in-class)',
      '3-5': '35% of apps (Good)',
      '5-7': '35% of apps (Needs improvement)',
      '7-10': '15% of apps (High risk)',
    },
    comparables: [
      { name: 'Headspace', score: 3.2, relationship: 'Best-in-class example' },
      { name: 'Calm', score: 4.1, relationship: 'Best-in-class example' },
      { name: 'BetterHelp', score: 5.8, relationship: 'Similar risk profile' },
    ],
  },
  'ai-companion': {
    name: 'AI Companion & Chat Apps',
    averageScore: 6.8,
    distribution: {
      '0-3': '5% of apps (Best-in-class)',
      '3-5': '18% of apps (Good)',
      '5-7': '42% of apps (Needs improvement)',
      '7-10': '35% of apps (High risk)',
    },
    comparables: [
      { name: 'Pi by Inflection', score: 4.5, relationship: 'Best-in-class example' },
      { name: 'Replika', score: 7.9, relationship: 'Similar risk profile' },
      { name: 'CharacterAI', score: 8.4, relationship: 'Slightly riskier' },
    ],
  },
  'consent-education': {
    name: 'Consent & Education Apps',
    averageScore: 5.8,
    distribution: {
      '0-3': '12% of apps (Best-in-class)',
      '3-5': '28% of apps (Good)',
      '5-7': '40% of apps (Needs improvement)',
      '7-10': '20% of apps (High risk)',
    },
    comparables: [
      { name: 'Amaze.org', score: 3.5, relationship: 'Best-in-class example' },
      { name: 'Consent Academy', score: 5.2, relationship: 'Similar risk profile' },
      { name: 'PUA Trainer (removed)', score: 9.5, relationship: 'Much riskier' },
    ],
  },
  'finance-banking': {
    name: 'Finance & Banking Apps',
    averageScore: 4.2,
    distribution: {
      '0-3': '25% of apps (Best-in-class)',
      '3-5': '40% of apps (Good)',
      '5-7': '28% of apps (Needs improvement)',
      '7-10': '7% of apps (High risk)',
    },
    comparables: [
      { name: 'Wise', score: 2.8, relationship: 'Best-in-class example' },
      { name: 'Robinhood', score: 5.5, relationship: 'Slightly riskier' },
      { name: 'Cash App', score: 4.8, relationship: 'Similar risk profile' },
    ],
  },
  'productivity-tools': {
    name: 'Productivity Tools',
    averageScore: 3.8,
    distribution: {
      '0-3': '30% of apps (Best-in-class)',
      '3-5': '42% of apps (Good)',
      '5-7': '22% of apps (Needs improvement)',
      '7-10': '6% of apps (High risk)',
    },
    comparables: [
      { name: 'Notion', score: 2.9, relationship: 'Best-in-class example' },
      { name: 'Slack', score: 3.5, relationship: 'Best-in-class example' },
      { name: 'Discord', score: 5.2, relationship: 'Slightly riskier' },
    ],
  },
  'generic': {
    name: 'Web Applications',
    averageScore: 5.4,
    distribution: {
      '0-3': '12% of apps (Best-in-class)',
      '3-5': '35% of apps (Good)',
      '5-7': '38% of apps (Needs improvement)',
      '7-10': '15% of apps (High risk)',
    },
    comparables: [
      { name: 'Standard SaaS', score: 4.0, relationship: 'Best-in-class example' },
      { name: 'Typical Web App', score: 5.5, relationship: 'Similar risk profile' },
      { name: 'Complex Social Platform', score: 7.0, relationship: 'Slightly riskier' },
    ],
  },
};

// Keywords to detect app category from code/readme
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'social-dating': ['dating', 'match', 'swipe', 'profile', 'connection', 'meet', 'relationship', 'tinder', 'hinge'],
  'health-wellness': ['health', 'wellness', 'meditation', 'therapy', 'mental', 'symptom', 'diagnosis', 'medical', 'doctor'],
  'ai-companion': ['companion', 'chatbot', 'ai friend', 'replika', 'character', 'roleplay', 'persona', 'conversation'],
  'consent-education': ['consent', 'education', 'sexual', 'assault', 'prevention', 'safety', 'boundaries', 'healthy relationships'],
  'finance-banking': ['bank', 'finance', 'payment', 'transaction', 'money', 'wallet', 'crypto', 'invest'],
  'productivity-tools': ['productivity', 'task', 'project', 'team', 'collaborate', 'workspace', 'document'],
};

/**
 * Detect the most likely app category from project content
 */
export function detectAppCategory(
  projectName: string,
  files: Array<{ name: string; content: string }>,
  capabilities: DetectedCapability[]
): string {
  const allContent = [
    projectName.toLowerCase(),
    ...files.map(f => f.content.toLowerCase()),
    ...capabilities.map(c => c.name.toLowerCase() + ' ' + c.description.toLowerCase()),
  ].join(' ');

  const scores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = keywords.reduce((score, keyword) => {
      const matches = (allContent.match(new RegExp(keyword, 'gi')) || []).length;
      return score + matches;
    }, 0);
  }

  const topCategory = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .find(([, score]) => score > 2);

  return topCategory ? topCategory[0] : 'generic';
}

/**
 * Calculate percentile ranking for a given score within a category
 */
function calculatePercentile(score: number, category: CategoryProfile): number {
  // Approximate percentile based on distribution
  if (score <= 3) {
    return Math.round(5 + (score / 3) * 7); // 5-12%
  } else if (score <= 5) {
    const basePercentile = parseInt(category.distribution['0-3']);
    const rangePercentile = parseInt(category.distribution['3-5']);
    return Math.round(basePercentile + ((score - 3) / 2) * rangePercentile);
  } else if (score <= 7) {
    const basePercentile = parseInt(category.distribution['0-3']) + parseInt(category.distribution['3-5']);
    const rangePercentile = parseInt(category.distribution['5-7']);
    return Math.round(basePercentile + ((score - 5) / 2) * rangePercentile);
  } else {
    const basePercentile = 100 - parseInt(category.distribution['7-10']);
    const rangePercentile = parseInt(category.distribution['7-10']);
    return Math.round(basePercentile + ((score - 7) / 3) * rangePercentile);
  }
}

/**
 * Generate interpretation text for the score
 */
function generateInterpretation(score: number, percentile: number, categoryName: string): string {
  if (percentile >= 90) {
    return `Riskier than ${percentile}% of ${categoryName.toLowerCase()}. Immediate attention required.`;
  } else if (percentile >= 70) {
    return `Riskier than ${percentile}% of ${categoryName.toLowerCase()}. Significant improvements needed.`;
  } else if (percentile >= 50) {
    return `Average risk for ${categoryName.toLowerCase()}. Room for improvement.`;
  } else if (percentile >= 25) {
    return `Better than ${100 - percentile}% of ${categoryName.toLowerCase()}. Good baseline.`;
  } else {
    return `Top ${percentile}% safest in ${categoryName.toLowerCase()}. Excellent ethical design.`;
  }
}

/**
 * Select comparable projects based on score proximity
 */
function selectComparables(score: number, category: CategoryProfile): ComparableProject[] {
  const sorted = [...category.comparables].sort((a, b) => 
    Math.abs(a.score - score) - Math.abs(b.score - score)
  );

  // Find one better, one similar, one worse
  const better = category.comparables.find(c => c.score < score - 1);
  const similar = sorted[0];
  const worse = category.comparables.find(c => c.score > score + 0.5);

  const result: ComparableProject[] = [];
  
  if (better) {
    result.push({ ...better, relationship: 'Best-in-class example' });
  }
  
  if (similar && similar.name !== better?.name && similar.name !== worse?.name) {
    result.push({
      ...similar,
      relationship: Math.abs(similar.score - score) < 1 ? 'Similar risk profile' : 
                    similar.score > score ? 'Slightly riskier' : 'Best-in-class example',
    });
  }
  
  if (worse) {
    result.push({ 
      ...worse, 
      relationship: worse.score - score > 2 ? 'Much riskier' : 'Slightly riskier' 
    });
  }

  return result.slice(0, 3);
}

/**
 * Main benchmarking function - generates comparative context for a risk score
 */
export function generateBenchmark(
  riskScore: number,
  projectName: string,
  files: Array<{ name: string; content: string }>,
  capabilities: DetectedCapability[]
): Benchmark {
  const categoryKey = detectAppCategory(projectName, files, capabilities);
  const category = CATEGORY_PROFILES[categoryKey] || CATEGORY_PROFILES.generic;
  
  const percentile = calculatePercentile(riskScore, category);
  const interpretation = generateInterpretation(riskScore, percentile, category.name);
  const comparables = selectComparables(riskScore, category);

  return {
    riskScore,
    industryAverage: 5.4,
    categoryAverage: category.averageScore,
    categoryName: category.name,
    percentile,
    interpretation,
    comparableProjects: comparables,
    scoreDistribution: category.distribution,
  };
}
