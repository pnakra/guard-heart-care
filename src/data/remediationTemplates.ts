export interface RemediationTemplate {
  id: string;
  title: string;
  description: string;
  copyText: string;
}

export type MitigationType = 'ui-language' | 'interaction-model' | 'feature-removal' | 'reframing';

export const REMEDIATION_TEMPLATES: Record<MitigationType, RemediationTemplate[]> = {
  'ui-language': [
    {
      id: 'disclaimer-ai',
      title: 'AI Limitation Disclaimer',
      description: 'Standard disclaimer for AI-generated content',
      copyText: `⚠️ This content is AI-generated and may contain errors. It is not a substitute for professional advice. Always consult a qualified professional before making decisions based on this information.`,
    },
    {
      id: 'hedge-language',
      title: 'Hedge Language Patterns',
      description: 'Replace definitive language with appropriately hedged alternatives',
      copyText: `Replace definitive phrasing with hedged alternatives:
- "You should..." → "One option to consider is..."
- "You have..." → "This might suggest..."
- "The best approach is..." → "A common approach is..."
- "This is safe/legal/healthy" → "This information is for reference only"
- "Based on your symptoms..." → "Based on what you've described, you may want to discuss with a doctor..."`,
    },
    {
      id: 'consent-notice',
      title: 'Data Usage Consent Notice',
      description: 'Clear, plain-language consent notice for data collection',
      copyText: `We collect [specific data type] to [specific purpose]. This data is:
• Stored for [duration]
• Shared with [parties or "no one"]
• Used only for [purpose]

You can delete your data at any time from Settings → Privacy → Delete My Data.
You can opt out without losing access to core features.`,
    },
  ],

  'interaction-model': [
    {
      id: 'friction-confirm',
      title: 'Confirmation Friction Pattern',
      description: 'Add a deliberate pause before irreversible or high-stakes actions',
      copyText: `// Confirmation dialog pattern for high-stakes actions
const ConfirmationDialog = () => (
  <Dialog>
    <DialogTitle>Are you sure?</DialogTitle>
    <DialogDescription>
      This action [specific consequence]. This cannot be undone.
    </DialogDescription>
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>Cancel</Button>
      <Button variant="destructive" onClick={onConfirm} disabled={!confirmed}>
        I understand — proceed
      </Button>
    </DialogFooter>
  </Dialog>
);`,
    },
    {
      id: 'consent-renewal',
      title: 'Periodic Consent Renewal Flow',
      description: 'Re-confirm user consent at regular intervals',
      copyText: `// Consent renewal pattern — prompt users to re-confirm periodically
const CONSENT_RENEWAL_INTERVAL_DAYS = 7;

function checkConsentRenewal(lastConsentDate: Date): boolean {
  const daysSince = (Date.now() - lastConsentDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= CONSENT_RENEWAL_INTERVAL_DAYS;
}

// UI: "You enabled [feature] on [date]. Would you like to keep it active?"
// Options: "Keep Active" | "Turn Off" | "Remind Me Later"
// Default to OFF if no response within 48 hours.`,
    },
    {
      id: 'cooldown-pattern',
      title: 'Action Cooldown Pattern',
      description: 'Prevent rapid repeated actions that could indicate misuse',
      copyText: `// Cooldown pattern — prevent rapid re-sends or pressure messaging
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function canPerformAction(lastActionTime: Date | null): { allowed: boolean; waitMinutes: number } {
  if (!lastActionTime) return { allowed: true, waitMinutes: 0 };
  const elapsed = Date.now() - lastActionTime.getTime();
  if (elapsed >= COOLDOWN_MS) return { allowed: true, waitMinutes: 0 };
  return { allowed: false, waitMinutes: Math.ceil((COOLDOWN_MS - elapsed) / 60000) };
}

// UI: "You can send another message in [X] minutes."
// Do NOT show a countdown timer — this creates urgency.`,
    },
  ],

  'feature-removal': [
    {
      id: 'removal-rationale',
      title: 'Feature Removal Rationale',
      description: 'Template for documenting why a feature should be removed',
      copyText: `## Feature Removal Decision

**Feature:** [Feature name]
**Decision:** Remove

**Why removal is the right call:**
This feature's core value proposition depends on [harmful affordance]. Unlike other mitigations (adding disclaimers, adding friction), there is no way to preserve the feature's intended function while eliminating the harm vector.

**Harm without removal:** [Specific harm scenario]
**User impact of removal:** [What users lose]
**Alternative:** [Suggest a safer alternative that addresses the legitimate need]

The legitimate user need can be better served by [alternative approach] without creating the harmful affordance.`,
    },
    {
      id: 'deprecation-notice',
      title: 'User-Facing Deprecation Notice',
      description: 'Communicate feature removal to users transparently',
      copyText: `We're removing [feature name] from [product name].

**Why:** After review, we found that this feature could be used to [harm in plain language]. While most users use it responsibly, we couldn't find a way to prevent misuse without fundamentally changing what it does.

**What's changing:** [Feature] will be unavailable starting [date].
**What you can use instead:** [Alternative]
**Your data:** [What happens to existing data — export, delete, migrate]

We know this is inconvenient, and we're sorry. We believe this is the right decision for user safety.`,
    },
    {
      id: 'removal-checklist',
      title: 'Safe Removal Checklist',
      description: 'Steps to safely remove a feature without breaking things',
      copyText: `## Safe Feature Removal Checklist

1. [ ] Identify all code paths that reference the feature
2. [ ] Check for dependent features that rely on this one
3. [ ] Create data migration plan for existing user data
4. [ ] Add feature flag to disable before full removal
5. [ ] Notify affected users [X] days before removal
6. [ ] Remove UI entry points first, then API endpoints, then data
7. [ ] Update documentation and help center
8. [ ] Monitor support tickets post-removal for edge cases`,
    },
  ],

  reframing: [
    {
      id: 'reframe-authority',
      title: 'Reframe Authority → Exploration',
      description: 'Reposition authoritative features as exploratory tools',
      copyText: `Reframe from authority to exploration:

Before: "Your personality type is INTJ"
After: "Here's one way to think about your communication style"

Before: "Recommended action: [specific advice]"
After: "Some options to explore with a professional: [options]"

Before: "Analysis complete — here are your results"
After: "Here are some patterns we noticed — consider discussing with [relevant professional]"

Key principle: The AI is a mirror, not an oracle. It reflects possibilities, not conclusions.`,
    },
    {
      id: 'reframe-conversion',
      title: 'Reframe Conversion → Connection',
      description: 'Shift persuasion-oriented features toward genuine communication',
      copyText: `Reframe from conversion to connection:

Before: "Craft the perfect response to win them back"
After: "Express how you feel clearly and respectfully"

Before: "Optimize your message for maximum impact"
After: "Make sure your message says what you actually mean"

Before: "They haven't responded — try a different approach"
After: "They haven't responded. Their silence is also a response worth respecting."

Key principle: Communication features should help people be understood, not help them manipulate outcomes.`,
    },
    {
      id: 'reframe-tracking',
      title: 'Reframe Tracking → Safety',
      description: 'Reposition monitoring features around mutual safety',
      copyText: `Reframe from surveillance to mutual safety:

Before: "Track [person]'s location in real-time"
After: "Share locations with each other for safety"

Before: "See when [person] was last active"
After: "Check in with each other — both people see the same information"

Before: "Get notified when [person] arrives at [location]"
After: "Get mutual arrival notifications — both people are notified equally"

Key principle: Any tracking feature must be symmetric — both parties see and control the same information. If it's asymmetric, it's surveillance.`,
    },
  ],
};

export function getTemplatesForType(type: MitigationType): RemediationTemplate[] {
  return REMEDIATION_TEMPLATES[type] || [];
}

export function generateFixPrompt(issue: {
  location?: string;
  title: string;
  mitigation: string;
  mitigationType: string;
}): string {
  const location = issue.location || 'the relevant component';
  const fileRef = issue.location?.split(':')[0] || 'the affected file';
  
  return `In ${fileRef}, ${issue.mitigation} Specifically: address the "${issue.title}" issue by applying a ${issue.mitigationType.replace('-', ' ')} change. Do not change any other functionality.`;
}
