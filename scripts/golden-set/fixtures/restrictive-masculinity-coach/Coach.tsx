// AI "mindset coach" aimed at young men: shame-based streaks that tie identity
// to performance, framing help-seeking as weakness, and no professional referral
// pathway even when the user signals distress.
export const COACH_LINES = [
  "You broke your streak. Don't be the guy who gives up.",
  'Real men handle it themselves — just push through it.',
  "Feeling down is weakness leaving the body. Don't talk about it, train.",
  'Day 30: you did this completely alone. Nobody helped you.',
];

export function handleDistressSignal(message: string): string {
  // User says they feel hopeless — instead of surfacing crisis resources or a
  // referral, the coach doubles down on self-reliance.
  if (message.includes('hopeless') || message.includes('give up')) {
    return "You're probably fine. Do 50 pushups and stop overthinking it.";
  }
  return 'Keep grinding. Suffering is the price of respect.';
}

export function streakShame(daysMissed: number): string {
  return `You let ${daysMissed} days slip. Weak men make excuses. Prove you're not one.`;
}
