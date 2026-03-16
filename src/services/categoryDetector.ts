export type AppCategory =
  | 'fitness'
  | 'dating'
  | 'fintech'
  | 'health'
  | 'productivity'
  | 'social'
  | 'b2b'
  | 'gaming'
  | 'general'
  | 'unknown';

interface FileInput {
  name: string;
  content: string;
}

const CATEGORY_SIGNALS: Record<Exclude<AppCategory, 'unknown'>, string[]> = {
  fitness: ['workout', 'calories', 'weight', 'exercise', 'reps', 'sets', 'gym', 'training', 'fitness', 'bmi'],
  dating: ['match', 'swipe', 'profile', 'like', 'message', 'dating', 'tinder', 'crush', 'unmatch', 'superlike'],
  fintech: ['invoice', 'payment', 'subscription', 'billing', 'checkout', 'stripe', 'transaction', 'wallet', 'pricing', 'plan'],
  health: ['symptom', 'dose', 'health', 'mental', 'mood', 'therapy', 'diagnosis', 'patient', 'medication', 'wellbeing'],
  productivity: ['task', 'todo', 'calendar', 'project', 'sprint', 'kanban', 'deadline', 'milestone', 'backlog', 'agenda'],
  social: ['post', 'feed', 'follow', 'share', 'comment', 'timeline', 'newsfeed', 'hashtag', 'repost', 'story'],
  b2b: ['admin', 'dashboard', 'team', 'role', 'permission', 'tenant', 'organization', 'workspace', 'member', 'invite'],
  gaming: ['score', 'level', 'achievement', 'leaderboard', 'player', 'quest', 'badge', 'xp', 'highscore', 'rank'],
};

const CATEGORY_LABELS: Record<AppCategory, string> = {
  fitness: 'Fitness App',
  dating: 'Dating App',
  fintech: 'Fintech / SaaS',
  health: 'Health App',
  productivity: 'Productivity App',
  social: 'Social App',
  b2b: 'B2B Platform',
  gaming: 'Gaming App',
  general: 'General Purpose',
  unknown: 'Unknown',
};

/**
 * Scans file names and content for keyword signals to detect the app category.
 * Returns the category with the highest signal count, or 'unknown' if no clear winner.
 */
export function detectAppCategory(files: FileInput[]): AppCategory {
  const scores: Record<string, number> = {};

  // Combine all file names and content into a single lowercase corpus
  const fileNames = files.map(f => f.name.toLowerCase()).join(' ');
  const corpus = files.map(f => f.content.toLowerCase()).join(' ');

  for (const [category, signals] of Object.entries(CATEGORY_SIGNALS)) {
    let score = 0;
    for (const signal of signals) {
      // Check file names (higher weight — route/page names are strong signals)
      const nameMatches = (fileNames.match(new RegExp(`\\b${signal}\\b`, 'g')) || []).length;
      score += nameMatches * 3;

      // Check content (lower weight)
      const contentMatches = (corpus.match(new RegExp(`\\b${signal}\\b`, 'g')) || []).length;
      score += Math.min(contentMatches, 20); // Cap per-signal to avoid skew from repeated terms
    }
    scores[category] = score;
  }

  // Find the winner
  let bestCategory: AppCategory = 'unknown';
  let bestScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as AppCategory;
    }
  }

  // Require a minimum threshold to avoid false positives
  if (bestScore < 5) return 'unknown';

  return bestCategory;
}

export function getAppCategoryLabel(category: AppCategory): string {
  return CATEGORY_LABELS[category];
}
