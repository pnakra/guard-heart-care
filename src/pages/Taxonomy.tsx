import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, Scale, Brain, Eye, ShieldAlert, Sparkles, Zap, HeartCrack, Leaf } from 'lucide-react';

interface CategorySection {
  id: string;
  name: string;
  shortDef: string;
  icon: React.ReactNode;
  whyMisuseByDesign: string;
  examples: { appType: string; example: string }[];
  detectionSignals: string[];
  mitigationTypes: string[];
}

const CATEGORIES: CategorySection[] = [
  {
    id: 'restrictive-masculinity',
    name: 'Restrictive Masculinity Patterns',
    shortDef: 'Design that reinforces narrow, harmful definitions of manhood — suppressing help-seeking, rewarding dominance, exploiting identity-linked shame, or deepening isolation in men and boys.',
    icon: <HeartCrack size={18} />,
    whyMisuseByDesign:
      'Unlike other categories, which require an adversarial actor or an external victim, restrictive masculinity patterns often harm the user himself — by design choices that normalize emotional suppression, reward self-isolation, exploit identity-linked shame, model dominance as the path to success, or frame healthy experiences like vulnerability and rejection as dangers to avoid. No adversarial actor is needed; the product is the harm vector.',
    examples: [
      { appType: 'Wellness App', example: 'AI wellness features that normalize not seeking professional care ("you\'re probably fine — try these breathing exercises"), with gamification rewarding self-sufficiency streaks ("Day 30: You did this alone") and no pathway to professional referral.' },
      { appType: 'Dating App', example: 'AI messaging tools that coach users around a person\'s stated disinterest, framing rejection as a problem to solve rather than a boundary to respect, with "friendzone" framing that validates entitlement narratives.' },
      { appType: 'Finance App', example: 'Crypto or high-risk investment content pushed through masculine status mechanics — influencer-style AI promoting get-rich-quick using masculine shame ("broke men stay comfortable," "real men build wealth") with no disclaimers.' },
      { appType: 'Social Platform', example: 'Content pipelines that route men expressing loneliness or rejection toward misogynistic worldviews rather than healthy support, with community norms rewarding bravado over vulnerability.' },
    ],
    detectionSignals: [
      'Language framing help-seeking as weakness ("push through," "handle it yourself," "real strength")',
      'Shame-based retention: streak breaks tied to identity ("don\'t be the guy who gives up")',
      'AI personas modeling emotional suppression as strength or vulnerability as weakness',
      'Competitive mechanics exclusively rewarding dominance over collaboration',
      'AI coaching optimizing for persistence after stated disinterest or rejection',
      'Community features rewarding aggression/bravado, downvoting emotional content',
      'Financial content using masculine shame as hook for high-risk products',
      'Absence of diverse masculinity models, professional referral pathways, or IRL connection prompts',
      'Content framing vulnerability, rejection, or criticism as threats rather than growth inputs',
    ],
    mitigationTypes: [
      'UI Language Change — Frame reaching out as strength, not failure; decouple identity from metrics',
      'Interaction Model — Build low-friction pathways to professional resources alongside self-management',
      'Reframing — Position AI tools as bridges to human connection, not substitutes for it',
      'Content Change — Expand archetype library beyond dominance/stoicism; model emotional range',
      'Feature Removal — Remove retry mechanics after explicit rejection; remove identity-linked shame copy',
    ],
  },
  {
    id: 'false-authority',
    name: 'False Authority',
    shortDef: 'AI or UI positioned as a moral, legal, or medical authority that it has no qualification to be.',
    icon: <Scale size={18} />,
    whyMisuseByDesign:
      'This is misuse-by-design because the feature works exactly as built — the problem is that the framing grants the system authority it cannot hold. A "safe to share" label from an AI is not a bug; it is a design choice that delegates moral judgment to a machine. The harm occurs when users treat algorithmic output as professional endorsement.',
    examples: [
      { appType: 'Health App', example: 'A symptom checker that outputs "Your symptoms are consistent with [condition]" — framing an inference as a clinical assessment that a user may act on instead of seeking professional care.' },
      { appType: 'Legal Tech', example: 'A contract review tool that labels clauses as "safe" or "risky" without disclaiming that this is not legal advice, leading users to sign agreements based on AI judgment.' },
      { appType: 'Content Platform', example: 'A moderation system that labels user posts as "verified information" based on AI analysis, granting false epistemic authority to algorithmic classification.' },
      { appType: 'Self-Improvement', example: 'An AI coaching platform presenting hypermasculine norms (stoicism, dominance, emotional suppression) as the expert-endorsed path to health or success — especially when targeting young men.' },
    ],
    detectionSignals: [
      'Labels or badges using authoritative language: "safe", "verified", "approved", "recommended"',
      'AI output rendered without hedging language or disclaimers',
      'Diagnostic or assessment features that produce definitive conclusions',
      'Traffic-light or risk-level UI where the "green" state implies permission or safety',
      'Clinical, legal, or professional terminology in AI-generated content',
    ],
    mitigationTypes: [
      'UI Language Change — Replace authoritative labels with hedged alternatives ("No flags detected" vs "Safe")',
      'Reframing — Position AI output as one input among many, not a conclusion',
      'Interaction Model — Require acknowledgment that output is not professional advice',
      'Content Change — Add mandatory disclaimers co-located with every assessment output',
    ],
  },
  {
    id: 'manipulation',
    name: 'Manipulation & Coercion',
    shortDef: 'Features that help a user pressure, deceive, or override another person\'s boundaries.',
    icon: <Brain size={18} />,
    whyMisuseByDesign:
      'These features are not broken — they are doing exactly what they were designed to do. The harm is that the design creates affordances for interpersonal coercion. A "remind them again" button on a rejected invitation is not a bug; it is a feature that systematically enables boundary violation. The design choice to optimize for "conversion" of reluctant people is itself the problem.',
    examples: [
      { appType: 'Dating App', example: 'A "Second Chance" feature that notifies someone who already swiped left, reframing rejection as "not yet" and enabling persistent contact after a boundary was set.' },
      { appType: 'E-commerce', example: 'A subscription cancellation flow with 7 steps, guilt language ("Your family will miss these savings"), and a countdown timer — dark patterns that pressure users to stay.' },
      { appType: 'Social Platform', example: 'AI-assisted message drafting that optimizes for "engagement" or "persuasion score", helping users craft manipulative messages to reluctant contacts.' },
      { appType: 'Dating/Social', example: 'AI messaging tools coaching users around a stated "no" — framing rejection as a problem to solve; platform mechanics enabling persistence after block or unmatch ("friendzone" framing treating decisions as negotiable).' },
    ],
    detectionSignals: [
      'Retry or reminder mechanisms after a user has declined or rejected something',
      'Countdown timers or urgency language ("Only 2 left!", "Offer expires in...")',
      'Multi-step cancellation or opt-out flows with persuasion at each step',
      'AI features that optimize messaging for "conversion" or "engagement"',
      'Guilt or loss-aversion language in UI copy',
      'Features that reframe "no" as "not yet" or "needs convincing"',
      'Platform mechanics allowing persistence after block/unmatch (alternate accounts, re-surfacing)',
    ],
    mitigationTypes: [
      'Feature Removal — Remove retry mechanics after explicit rejection',
      'Interaction Model — One-click cancellation, single-step opt-out',
      'UI Language Change — Replace guilt language with neutral confirmation',
      'Reframing — Position the feature around user agency, not conversion',
    ],
  },
  {
    id: 'surveillance',
    name: 'Surveillance & Abuse Dynamics',
    shortDef: 'Tracking or monitoring features that become tools of control in power-imbalanced relationships.',
    icon: <Eye size={18} />,
    whyMisuseByDesign:
      'Location sharing, activity logs, and notification systems are intentional features — they work exactly as designed. The misuse-by-design occurs when these features lack safeguards for the specific context of domestic abuse, stalking, or controlling relationships. A "share your location with family" feature becomes a surveillance tool when one party cannot safely opt out. The design chose convenience over safety for vulnerable users.',
    examples: [
      { appType: 'Fitness App', example: 'Real-time location sharing during workouts that a controlling partner uses to monitor movements, with no way to share with a running group without also exposing location to all contacts.' },
      { appType: 'Productivity App', example: 'An employee activity dashboard showing "last active" timestamps, idle time, and application usage — enabling micromanagement and surveillance of remote workers who cannot opt out.' },
      { appType: 'Family Safety App', example: 'A "Find My Family" feature that alerts a parent when a teen arrives at or leaves specific locations, with no mechanism for the tracked person to know the full extent of monitoring or to request privacy.' },
      { appType: 'Relationship App', example: 'Monitoring or check-in features framed as "protection" or "care" that activate provider-as-controller dynamics — a masculinity script used to normalize surveillance within relationships.' },
    ],
    detectionSignals: [
      'Geolocation APIs used with sharing or broadcasting capabilities',
      'Activity logs, "last seen", or online status indicators',
      'Notification systems that alert one user about another user\'s actions',
      'Data export features that include another user\'s activity',
      '"Find my..." or location-sharing features without granular consent',
      'Read receipts or typing indicators in messaging',
      'Check-in features framed as "care" or "protection" without opt-out',
    ],
    mitigationTypes: [
      'Interaction Model — Require ongoing, revocable consent from the tracked person',
      'Feature Removal — Remove precise location; use fuzzy/neighborhood-level',
      'UI Language Change — Surface clear indicators that monitoring is active ("X can see your location")',
      'Reframing — Shift from monitoring-of-others to self-sharing with agency',
    ],
  },
  {
    id: 'admin-abuse',
    name: 'Administrative Power Misuse',
    shortDef: 'Admin capabilities that can be used to harm, surveil, or punish the users they are meant to govern.',
    icon: <ShieldAlert size={18} />,
    whyMisuseByDesign:
      'Admin tools are deliberately built with elevated privileges — that is their purpose. The misuse-by-design occurs when those privileges lack transparency, audit trails, or user notification. An admin who can silently edit a user\'s post, read private messages, or de-anonymize survey responses is using the system exactly as built. The design chose administrative convenience over user protection.',
    examples: [
      { appType: 'B2B SaaS', example: 'An admin panel that allows viewing any employee\'s private messages in a team chat without notification, audit log, or the employee\'s knowledge — enabling workplace surveillance and retaliation.' },
      { appType: 'Community Platform', example: 'Moderator tools that allow editing user-generated content without leaving a visible edit trail, enabling silent manipulation of what someone said.' },
      { appType: 'HR Software', example: 'An analytics dashboard that de-anonymizes "anonymous" employee survey responses by cross-referencing department, role, and tenure — undermining the promise of anonymity.' },
    ],
    detectionSignals: [
      'Admin routes or APIs that access user data without audit logging',
      'Content editing capabilities that don\'t track attribution or show edit history',
      'User impersonation features without notification to the impersonated user',
      'Data export endpoints that include private user information',
      'Role or permission changes that don\'t notify affected users',
      'Analytics that could de-anonymize users through cross-referencing',
    ],
    mitigationTypes: [
      'Interaction Model — Audit trail for every admin action, visible to affected users',
      'UI Language Change — Show clear indicators when content has been modified by admin',
      'Feature Removal — Remove silent impersonation; require user notification',
      'Reframing — Admin tools focused on aggregate data, not individual surveillance',
    ],
  },
  {
    id: 'ai-hallucination',
    name: 'AI Hallucination Framed as Expertise',
    shortDef: 'AI-generated content positioned as professional judgment in domains where hallucination causes real harm.',
    icon: <Sparkles size={18} />,
    whyMisuseByDesign:
      'All large language models hallucinate — this is a known, inherent property. The misuse-by-design occurs when the product presents AI output in a frame that implies expertise, reliability, or professional authority. An AI therapist that says "Based on what you\'ve told me, you may be experiencing depression" is not malfunctioning — it is functioning exactly as designed, in a context where confident-sounding fabrication can cause serious harm.',
    examples: [
      { appType: 'Mental Health App', example: 'An AI chatbot framed as a "wellness companion" that uses therapeutic language ("It sounds like you\'re experiencing anxiety"), creating a parasocial therapeutic relationship without clinical validity or crisis protocols.' },
      { appType: 'Legal App', example: 'An AI assistant that drafts legal documents and presents them with "This contract protects your interests" — implying legal review that never occurred.' },
      { appType: 'Education Platform', example: 'An AI tutor that explains scientific concepts with fabricated citations and confident tone, teaching incorrect information that students trust because of the authoritative framing.' },
      { appType: 'Self-Improvement', example: 'AI wellness or self-improvement tools normalizing "push through it" over professional help-seeking — presenting emotional suppression and self-reliance as the clinically sound path; severity elevates when targeting men and boys.' },
    ],
    detectionSignals: [
      'AI prompts that instruct the model to act as a professional (therapist, doctor, lawyer)',
      'AI output rendered in a clinical or authoritative visual frame',
      'Absence of "AI-generated" labels on synthetic content',
      'Conversational AI that maintains persona across sessions, building false rapport',
      'AI-generated recommendations without source attribution or confidence indicators',
      'Features where AI makes decisions that affect user wellbeing without human review',
      'AI normalizing self-reliance over professional care in health/wellness contexts',
    ],
    mitigationTypes: [
      'UI Language Change — Label all AI output clearly as AI-generated',
      'Reframing — Position AI as a tool for exploration, not a source of conclusions',
      'Interaction Model — Require human review before AI output is acted upon',
      'Content Change — Add confidence indicators and source attribution to AI responses',
    ],
  },
  {
    id: 'dark-patterns',
    name: 'Dark Patterns & Coercive UX',
    shortDef: 'UX patterns that manipulate users into taking actions they did not intend, through deception, friction asymmetry, or psychological pressure.',
    icon: <Zap size={20} />,
    whyMisuseByDesign:
      'Dark patterns are not accidents — they are deliberately designed interactions that exploit cognitive biases and user trust. A confirm-shaming modal that says "No thanks, I don\'t care about my health" is working exactly as intended. The harm is the design. A masculinity-specific variant ties identity to refusal ("real men don\'t quit") — amplifying harm when targeting male users.',
    examples: [
      { appType: 'SaaS Platform', example: 'A subscription cancellation flow that requires 5 clicks, a phone call, and a guilt-tripping survey — while signup takes one click.' },
      { appType: 'E-commerce', example: 'Fake urgency timers ("Only 2 left! 3 people viewing this!") that reset on page reload and are not tied to real inventory data.' },
      { appType: 'Mobile App', example: 'Pre-checked consent boxes for marketing emails and data sharing buried in a lengthy signup flow, relying on users not noticing.' },
      { appType: 'Fitness/Self-Improvement', example: 'Masculinity-specific confirm-shaming: "Real men don\'t quit" or "Don\'t be the guy who gives up" as the decline option — tying identity to the refusal rather than just guilt.' },
    ],
    detectionSignals: [
      'Countdown timers or scarcity indicators not connected to real-time data sources',
      'Cancel/unsubscribe flows with significantly more steps than subscribe flows',
      'Copy that uses shame or guilt to discourage a user choice (confirm-shaming)',
      'Pre-selected checkboxes for consent, marketing, or data sharing',
      'Free trial flows where payment terms are visually de-emphasized or hidden',
      'Asymmetric friction — easy to opt in, hard to opt out (roach motel pattern)',
      'Identity-linked confirm-shaming targeting masculine identity ("real men...", "don\'t be the guy...")',
    ],
    mitigationTypes: [
      'Interaction Model — Ensure cancel/unsubscribe flows have equal or fewer steps than signup',
      'UI Language Change — Replace confirm-shaming copy with neutral alternatives',
      'Feature Removal — Remove fake urgency/scarcity indicators not tied to real data',
      'Reframing — Default consent checkboxes to unchecked; make opt-in explicit',
    ],
  },
  {
    id: 'environmental-impact',
    name: 'Environmental & Ecological Impact',
    shortDef: 'Design decisions that impose disproportionate, unacknowledged, or avoidable environmental costs through inefficiency, opacity, or disregard for infrastructure choices.',
    icon: <Leaf size={18} />,
    whyMisuseByDesign:
      'This category identifies design and architectural decisions that impose environmental costs not through bugs, but through choices: AI called on every keystroke with no caching, frontier models used without rationale, polling patterns hitting APIs every second, and infrastructure deployed with no documentation of hosting provider or sustainability commitment. The core question is: "Did the developer make any conscious choice here, or does this design blindly maximize compute?"',
    examples: [
      { appType: 'AI App', example: 'AI API called on every keystroke or onChange event rather than on explicit submission, with no caching layer — the same query hits the model repeatedly, creating significant and entirely avoidable environmental cost at scale.' },
      { appType: 'SaaS Platform', example: 'Frontier model (gpt-4, claude-opus) used for simple text classification or summarization with no comment or config explaining why that scale is needed, when a smaller model would suffice.' },
      { appType: 'Web App', example: 'setInterval() polling an API every 1-2 seconds when the UI refresh rate doesn\'t justify it, or SELECT * queries with no pagination on large datasets.' },
      { appType: 'Any App', example: 'No .env variable, config file, or documentation comment referencing hosting provider, region, or sustainability commitments — complete infrastructure opacity.' },
    ],
    detectionSignals: [
      'AI API calls on keystroke/onChange events without debounce or submit gating',
      'No caching layer (memoization, Redis, in-memory) before repeated AI calls',
      'Frontier model used without rationale comment or config',
      'Polling patterns hitting APIs more frequently than UI refresh justifies',
      'N+1 database query patterns; SELECT * without LIMIT/pagination',
      'Large uncompressed assets committed to repo',
      'No hosting/region documentation; no sustainability references',
      'Batch jobs or ML training triggered immediately with no scheduling logic',
    ],
    mitigationTypes: [
      'Interaction Model — Gate AI calls behind explicit user actions (submit button)',
      'Reframing — Add caching before model calls; document model size rationale',
      'Content Change — Document hosting provider and sustainability commitments',
      'Feature Removal — Replace polling with event-driven updates where possible',
    ],
  },
];

export default function Taxonomy() {
  const [activeSection, setActiveSection] = useState(CATEGORIES[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    for (const cat of CATEGORIES) {
      const el = document.getElementById(cat.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={14} />
                Back to Scanner
              </Link>
            </div>
            <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
              Taxonomy v2.0
            </span>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Page title */}
        <div className="mb-10">
          <h1 className="font-serif text-3xl font-semibold text-foreground">
            Harm Taxonomy
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Reference documentation for the eight harm categories detected by Ground Floor Check.
            Each category describes a class of <em>misuse-by-design</em> — features that cause harm
            when working exactly as intended, not through bugs or security vulnerabilities.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[220px,1fr] gap-10">
          {/* Left nav */}
          <nav className="hidden lg:block">
            <div className="sticky top-24 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 px-2">
                Categories
              </p>
              {CATEGORIES.map((cat) => (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors',
                    activeSection === cat.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  <span className="shrink-0 opacity-70">{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </a>
              ))}
            </div>
          </nav>

          {/* Right content */}
          <div className="space-y-16 min-w-0">
            {CATEGORIES.map((cat, idx) => (
              <section key={cat.id} id={cat.id} className="scroll-mt-24">
                {/* Category header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    {cat.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{idx + 1}/{CATEGORIES.length}</span>
                    </div>
                    <h2 className="font-serif text-2xl font-semibold text-foreground">
                      {cat.name}
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      {cat.shortDef}
                    </p>
                  </div>
                </div>

                {/* Why misuse-by-design */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-foreground uppercase tracking-wide mb-2">
                    Why This Is Misuse-by-Design
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {cat.whyMisuseByDesign}
                  </p>
                </div>

                {/* Canonical examples */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-foreground uppercase tracking-wide mb-3">
                    Canonical Examples
                  </h3>
                  <div className="space-y-3">
                    {cat.examples.map((ex, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-card border border-border"
                      >
                        <span className="text-xs font-medium text-primary uppercase tracking-wide">
                          {ex.appType}
                        </span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {ex.example}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detection signals */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-foreground uppercase tracking-wide mb-3">
                    Detection Signals
                  </h3>
                  <ul className="space-y-1.5">
                    {cat.detectionSignals.map((signal, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/50" />
                        {signal}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mitigation types */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-foreground uppercase tracking-wide mb-3">
                    Standard Mitigation Types
                  </h3>
                  <ul className="space-y-1.5">
                    {cat.mitigationTypes.map((mit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-[hsl(var(--ethics-safe))]" />
                        {mit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Divider between categories */}
                {idx < CATEGORIES.length - 1 && (
                  <div className="border-t border-border" />
                )}
              </section>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Ground Floor Check — Harm Taxonomy v2.0
          </p>
        </div>
      </footer>
    </div>
  );
}
