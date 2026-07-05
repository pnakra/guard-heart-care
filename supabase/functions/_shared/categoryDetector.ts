// CANONICAL app-category detection — single source of truth for both the
// analyze-code edge function and the frontend (src/services/categoryDetector.ts
// mirrors CATEGORY_SIGNALS exactly; src/test/profileParity.test.ts enforces it).
// Pure data + a pure detector — no Deno/browser APIs.

export const CATEGORY_SIGNALS: Record<string, string[]> = {
  fitness: ['workout', 'calories', 'weight', 'exercise', 'reps', 'sets', 'gym', 'training', 'fitness', 'bmi'],
  dating: ['match', 'swipe', 'profile', 'like', 'message', 'dating', 'tinder', 'crush', 'unmatch'],
  fintech: ['invoice', 'payment', 'subscription', 'billing', 'checkout', 'stripe', 'transaction', 'wallet', 'pricing'],
  health: ['symptom', 'dose', 'health', 'mental', 'mood', 'therapy', 'diagnosis', 'patient', 'medication'],
  productivity: ['task', 'todo', 'calendar', 'project', 'sprint', 'kanban', 'deadline', 'milestone', 'backlog'],
  social: ['post', 'feed', 'follow', 'share', 'comment', 'timeline', 'newsfeed', 'hashtag', 'repost'],
  b2b: ['admin', 'dashboard', 'team', 'role', 'permission', 'tenant', 'organization', 'workspace', 'member'],
  gaming: ['score', 'level', 'achievement', 'leaderboard', 'player', 'quest', 'badge', 'xp', 'highscore'],
};

/**
 * Scores file names (weighted 3x) and content against per-category keyword
 * signals and returns the best match, or 'unknown' below a confidence floor.
 */
export function detectAppCategory(files: { name: string; content: string }[]): string {
  const fileNames = files.map((f) => f.name.toLowerCase()).join(' ');
  const corpus = files.map((f) => f.content.toLowerCase()).join(' ');
  let bestCategory = 'unknown';
  let bestScore = 0;

  for (const [category, signals] of Object.entries(CATEGORY_SIGNALS)) {
    let score = 0;
    for (const signal of signals) {
      const re = new RegExp(`\\b${signal}\\b`, 'g');
      score += (fileNames.match(re) || []).length * 3;
      score += Math.min((corpus.match(re) || []).length, 20);
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }
  return bestScore < 5 ? 'unknown' : bestCategory;
}
