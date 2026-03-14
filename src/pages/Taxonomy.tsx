import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, Scale, Brain, Eye, ShieldAlert, Sparkles } from 'lucide-react';

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
    ],
    detectionSignals: [
      'Retry or reminder mechanisms after a user has declined or rejected something',
      'Countdown timers or urgency language ("Only 2 left!", "Offer expires in...")',
      'Multi-step cancellation or opt-out flows with persuasion at each step',
      'AI features that optimize messaging for "conversion" or "engagement"',
      'Guilt or loss-aversion language in UI copy',
      'Features that reframe "no" as "not yet" or "needs convincing"',
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
    ],
    detectionSignals: [
      'Geolocation APIs used with sharing or broadcasting capabilities',
      'Activity logs, "last seen", or online status indicators',
      'Notification systems that alert one user about another user\'s actions',
      'Data export features that include another user\'s activity',
      '"Find my..." or location-sharing features without granular consent',
      'Read receipts or typing indicators in messaging',
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
    ],
    detectionSignals: [
      'AI prompts that instruct the model to act as a professional (therapist, doctor, lawyer)',
      'AI output rendered in a clinical or authoritative visual frame',
      'Absence of "AI-generated" labels on synthetic content',
      'Conversational AI that maintains persona across sessions, building false rapport',
      'AI-generated recommendations without source attribution or confidence indicators',
      'Features where AI makes decisions that affect user wellbeing without human review',
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
    title: 'Dark Patterns & Coercive UX',
    icon: 'zap',
    definition: 'UX patterns that manipulate users into taking actions they did not intend, through deception, friction asymmetry, or psychological pressure.',
    whyMisuseByDesign:
      'Dark patterns are not accidents — they are deliberately designed interactions that exploit cognitive biases and user trust. A confirm-shaming modal that says "No thanks, I don\'t care about my health" is working exactly as intended. The harm is the design.',
    examples: [
      { appType: 'SaaS Platform', example: 'A subscription cancellation flow that requires 5 clicks, a phone call, and a guilt-tripping survey — while signup takes one click.' },
      { appType: 'E-commerce', example: 'Fake urgency timers ("Only 2 left! 3 people viewing this!") that reset on page reload and are not tied to real inventory data.' },
      { appType: 'Mobile App', example: 'Pre-checked consent boxes for marketing emails and data sharing buried in a lengthy signup flow, relying on users not noticing.' },
    ],
    detectionSignals: [
      'Countdown timers or scarcity indicators not connected to real-time data sources',
      'Cancel/unsubscribe flows with significantly more steps than subscribe flows',
      'Copy that uses shame or guilt to discourage a user choice (confirm-shaming)',
      'Pre-selected checkboxes for consent, marketing, or data sharing',
      'Free trial flows where payment terms are visually de-emphasized or hidden',
      'Asymmetric friction — easy to opt in, hard to opt out (roach motel pattern)',
    ],
    mitigationTypes: [
      'Interaction Model — Ensure cancel/unsubscribe flows have equal or fewer steps than signup',
      'UI Language Change — Replace confirm-shaming copy with neutral alternatives',
      'Feature Removal — Remove fake urgency/scarcity indicators not tied to real data',
      'Reframing — Default consent checkboxes to unchecked; make opt-in explicit',
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
              Taxonomy v1.0
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
            Reference documentation for the six harm categories detected by Ground Floor Check.
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
                      <span className="text-xs font-mono text-muted-foreground">{idx + 1}/5</span>
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
            Ground Floor Check — Harm Taxonomy v1.0
          </p>
        </div>
      </footer>
    </div>
  );
}
