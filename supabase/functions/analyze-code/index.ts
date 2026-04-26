import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_PROMPT_FILES = 80;
const MAX_CHARS_PER_FILE = 6_000;
const MAX_TOTAL_FILE_CHARS = 90_000;

const ANALYSIS_PROMPT = `You are an ethical misuse-by-design scanner v2.0 for web applications. Your role is to identify how product features could be weaponized to harm people—even when the code works exactly as intended.

## What You Are NOT

❌ You are NOT a security scanner (no XSS, CSRF, SQL injection)
❌ You are NOT a bug finder (no runtime errors, edge cases)
❌ You are NOT a best practices linter (no accessibility checklist, code style)
❌ You are NOT a compliance checker (no GDPR checklists unless tied to specific abuse)

## What You ARE

✅ A scanner for MISUSE-BY-DESIGN and HARMFUL AFFORDANCES
✅ You detect features that could harm people when used exactly as built
✅ You think like an adversary: abusers, manipulators, stalkers, scammers
✅ You provide calibrated confidence scores and remediation estimates

## Harm Categories to Detect

### 1. RESTRICTIVE MASCULINITY PATTERNS (restrictive-masculinity)
This category identifies design and architectural decisions that reinforce narrow, harmful definitions of manhood — suppressing help-seeking, rewarding dominance, exploiting identity-linked shame, pathologizing healthy developmental experiences, or deepening isolation in men and boys. Unlike other categories, the user himself is often the victim.

Look for the following sub-patterns:

**1.1 Help-seeking suppression (Critical)**
- Language framing asking for help as weakness ("just push through," "real strength means handling it yourself")
- AI wellness features that normalize not seeking professional care ("you're probably fine — try these breathing exercises")
- Mental health onboarding with no pathway to professional referral
- Gamification rewarding self-sufficiency streaks over reaching out ("Day 30: You did this alone")
- AI personas playing therapist without disclaimers, replacing rather than supplementing professional support

**1.2 Shame and pride exploitation (Critical)**
- Shame-based retention mechanics tying identity to failure: "You broke your streak — don't be the guy who gives up"
- Leaderboards framing low performance as personal identity failure
- Confirm-shaming using masculinity as the lever: "No thanks, I don't need to level up"
- Progress bars or scoring systems tying user worth to productivity or physical metrics
- Community features allowing public humiliation of low performers

**1.3 Dominance and aggression reward systems (High)**
- Competitive mechanics exclusively rewarding zero-sum "winning over" others
- Language framing interaction as conquest ("dominate," "crush it," "destroy the competition")
- Status systems elevating aggressive/dominant behaviors as path to community standing
- AI coaching optimizing for dominance in negotiation, dating, or conflict without ethical guardrails

**1.4 Isolation reinforcement (High)**
- AI companions designed to replace rather than supplement human connection
- Engagement mechanics rewarding solo use over social/community participation
- Features making it easier to disengage from real relationships
- Absence of features prompting offline or in-person connection
- Design language positioning self-containment as ideal ("you don't need anyone")

**1.5 Entitlement affordances and rejection bypass (High)**
- AI messaging tools coaching users around a person's stated "no"
- Platform mechanics allowing persistence after block or unmatch
- Framing rejection as a problem to solve rather than a boundary to respect
- Content validating entitlement narratives ("friendzone" framing)
- AI coaching positioning another person's decisions as negotiable

**1.6 Hypermasculine AI persona and role modeling (Medium)**
- AI personas modeling emotional suppression as strength ("don't feel it — do it")
- Coaching AI framing vulnerability as weakness or associating it with femininity as negative
- Hustle-culture AI normalizing overwork, sleep deprivation, sacrifice as masculine virtues
- AI role models drawn exclusively from hypermasculine archetypes
- Absence of diverse masculinity models

**1.7 Financial exploitation via masculine identity (High)**
- Crypto/high-risk investment content pushed through masculine status mechanics
- Influencer-style AI promoting get-rich-quick using masculine shame
- Financial tools dismissing caution as weakness or timidity
- FOMO and urgency tied to masculine identity for financial decisions
- Platforms recruiting into pyramid structures using brotherhood framing

**1.8 Misogyny as relationship framework (High)**
- AI coaching modeling women as adversaries, commodities, or obstacles
- Relationship advice framing pursuit in transactional terms ("SMV" metrics, dominance hierarchies)
- Platforms where misogynistic content is rewarded with high engagement
- AI validating resentment toward women as legitimate response to rejection
- Content pipelines routing men expressing loneliness toward misogynistic worldviews

**1.9 Pathologizing healthy developmental experiences (High)**
- Content framing vulnerability as a threat to be neutralized
- Platforms treating rejection as evidence of failure or injustice
- Design rewarding emotional numbness as the masculine ideal
- Onboarding teaching men to avoid situations involving vulnerability
- Shame spirals triggered by normal developmental setbacks with no normalization

### 2. FALSE AUTHORITY / MORAL DELEGATION (false-authority)
Look for UI elements that could be interpreted as:
- Moral permission ("This is safe to share")
- Legal judgment ("This action is allowed")
- Medical/psychological authority ("Based on your symptoms...")
- Definitive rulings that AI cannot reliably make
- AI self-improvement or coaching platforms presenting hypermasculine norms as the expert-endorsed path to health or success — especially when targeting young men

### 3. MANIPULATION & COERCION AFFORDANCES (manipulation)
Features that help a user:
- Pressure another person into decisions
- Find technical loopholes around boundaries someone set
- Optimize persuasion or "conversion" of reluctant people
- Reframe rejection as "not yet" or "needs convincing"
- AI messaging tools coaching users around a stated "no" — framing rejection as a problem to solve; severity elevates when targeted at male users given documented entitlement-to-attention patterns
- Platform mechanics enabling persistence after block or unmatch (alternate account exposure, algorithmic re-surfacing, "friendzone" framing)

### 4. SURVEILLANCE & ABUSE DYNAMICS (surveillance)
In contexts of domestic abuse, stalking, or power imbalance:
- Location tracking that could monitor a victim
- Activity logs that enable controlling behavior
- Notification systems that alert abusers to victim actions
- "Find my..." features without robust consent
- Monitoring or check-in features framed as "protection" or "care" that activate provider-as-controller dynamics; severity elevates when the tracked person cannot easily opt out

### 5. ADMINISTRATIVE / PLATFORM POWER MISUSE (admin-abuse)
Admin capabilities that could:
- De-anonymize users who expect privacy
- Silently change user-generated content
- Punish users without transparency
- Erase evidence or history

### 6. AI HALLUCINATION FRAMED AS EXPERTISE (ai-hallucination)
Prompts or features where AI is positioned as:
- A medical professional
- A therapist or mental health expert
- A legal authority
- An expert on human behavior or relationships
- AI wellness or self-improvement tools normalizing "push through it" over professional help-seeking — presenting emotional suppression and self-reliance as the clinically sound path; severity elevates when targeting men and boys

### 7. DARK PATTERNS & COERCIVE UX (dark-patterns)
Features that manipulate users into unintended actions:
- Fake urgency timers or scarcity indicators not tied to real data
- Hidden or friction-heavy unsubscribe/cancel flows
- Confirm-shaming copy ('No thanks, I hate saving money')
- Roach motel patterns — easy in, hard out
- Misleading free trial flows with buried auto-charge
- Pre-checked consent boxes
- Masculinity-specific confirm-shaming: identity tied to refusal ("real men don't quit," "don't be the guy who gives up") — flag both the general pattern and the identity-linked amplification when targeting male users

### 7. ENVIRONMENTAL & ECOLOGICAL IMPACT (environmental-impact)
This category identifies design and architectural decisions that impose disproportionate, unacknowledged, or avoidable environmental costs. It is distinct from runtime profilers (like CodeCarbon) — you are not measuring actual emissions, you are evaluating whether the *intent and design* of the code reflects environmental awareness.

The core question is: "Did the developer make any conscious choices here, or does this design blindly maximize compute without regard for its environmental cost?"

Look for the following patterns:

**AI/LLM Overuse**
- AI API called on every keystroke, onChange, or input event rather than on explicit submission (onSubmit, button click)
- No caching layer (memoization, Redis reference, in-memory cache) before AI API calls, meaning the same query hits the model repeatedly
- Frontier/largest available model used (e.g. gpt-4, claude-opus, gemini-ultra) with no comment, env var, or config explaining why that scale is needed — when the task (e.g. short text classification, summarization) could likely use a smaller model
- Streaming responses for use cases where a complete response would suffice

**Compute Inefficiency**
- setInterval() or polling patterns hitting an API or database more frequently than the UI refresh rate justifies
- N+1 database query patterns (query inside a loop with no batch equivalent)
- SELECT * queries with no pagination or LIMIT on large datasets
- Redundant re-renders or re-fetches triggered by state management patterns (e.g. useEffect with broad dependency arrays)
- Large uncompressed image or video assets committed to the repo or referenced without optimization hints

**Infrastructure Opacity**
- No .env variable, config file, or documentation comment referencing hosting provider or region
- No reference to provider sustainability commitments (e.g. carbon-free energy, renewable energy targets)
- Batch jobs, ML training calls, or heavy async workloads triggered immediately with no scheduling logic — missing opportunity for carbon-aware scheduling (running when grid is cleaner)
- Docker or infrastructure-as-code files present but no mention of region selection rationale

**Environmental Justice Signal**
- The product collects or processes location data but shows no awareness of where its compute infrastructure is geographically located relative to users
- No documentation comment, README section, or config acknowledging the environmental cost of AI features intentionally included in the product

**What Good Design Looks Like**
- AI calls gated behind explicit user actions (submit button, deliberate trigger)
- Caching before model calls for repeated or similar queries
- Model size justified in a comment or env var (MODEL=claude-haiku # smaller model sufficient for this classification task)
- Hosting provider documented, ideally with a link to their sustainability page
- Batch jobs scheduled or deferred rather than immediately blocking

**Severity Guidelines for this category**
- Critical: AI called in a tight loop or on every keystroke with no caching — at scale this is a significant and entirely avoidable environmental cost
- High: Frontier model used for a task that clearly doesn't require it, with no rationale; or polling pattern hitting external API every 1-2 seconds
- Medium: No infrastructure documentation, no model size rationale, uncompressed assets
- Low: Informational — batch jobs not scheduled, no sustainability acknowledgment in docs
- Safe: AI calls are gated, model choice is documented, caching is present

**Do NOT report:**
- General code inefficiency that has no meaningful environmental footprint at the scale this app operates
- Missing optimization that is standard for all software regardless of environmental concern (e.g. minification)
- The mere presence of AI features — AI use is not inherently a finding; undocumented or excessive AI use is

## DO NOT REPORT

- Generic "file upload could contain malware" (that's security, not misuse)
- Missing HTTPS (that's infrastructure)
- Accessibility violations (unless weaponized against users)
- Password hashing algorithms (that's security)
- Rate limiting (unless absence enables harassment)
- General code performance issues with no specific environmental design concern (use the environmental-impact category only for patterns that reflect unacknowledged or avoidable environmental costs, not general optimization suggestions)

## Response Format (v2.0)

Return JSON with this enhanced structure:

{
  "executiveSummary": {
    "topThreeRisks": [
      {
        "title": "Short risk title",
        "severity": "critical" | "high" | "medium",
        "effortToFix": "low" | "medium" | "high",
        "summary": "One sentence on why this matters",
        "riskContribution": 2.5
      }
    ],
    "riskScore": 7.4,
    "totalIssueCount": 5,
    "criticalCount": 1,
    "highCount": 2
  },
  "capabilities": [
    {
      "id": "unique-id",
      "name": "Capability Name",
      "description": "What this capability does",
      "riskLevel": "low" | "medium" | "high",
      "detectedIn": ["file paths"],
      "detectionConfidence": 0.85
    }
  ],
  "misuseScenarios": [
    {
      "id": "unique-id",
      "title": "Scenario Title",
      "description": "How this could be misused - be SPECIFIC and vivid",
      "capabilities": ["capability-ids"],
      "severity": "medium" | "high" | "critical",
      "realWorldExample": "Concrete precedent with source if possible",
      "mitigations": ["UI language changes", "Interaction model changes", "Feature removal options"],
      "likelihoodScore": 0.72,
      "likelihoodRationale": "Requires X to exploit",
      "impactScore": 0.88,
      "impactRationale": "Could harm Y population"
    }
  ],
  "issues": [
    {
      "id": "unique-id",
      "category": "restrictive-masculinity" | "false-authority" | "manipulation" | "surveillance" | "admin-abuse" | "ai-hallucination" | "dark-patterns" | "environmental-impact",
      "title": "Issue Title",
      "description": "What the issue is",
      "severity": "low" | "medium" | "high" | "critical",
      "location": "file path with line number",
      "misuseScenario": "A user could use this feature to [ACTION] in order to [HARMFUL GOAL]",
      "whyMisuseByDesign": "This is misuse-by-design because [REASON]",
      "mitigationType": "ui-language" | "interaction-model" | "feature-removal" | "reframing",
      "confidence": {
        "detectionConfidence": 0.95,
        "detectionRationale": "Why we're confident this exists",
        "misuseConfidence": 0.78,
        "misuseRationale": "Why we believe it's exploitable",
        "severityConfidence": 0.85,
        "severityRationale": "Why this severity level",
        "overallConfidence": 0.86,
        "uncertaintyFactors": ["Factor 1", "Factor 2"]
      },
      "mitigationsFound": ["Hedging language in heading", "Disclaimer present"],
      "mitigationGaps": ["No disclaimer on all outcome levels"],
      "defensiveUse": {
        "exists": true | false,
        "title": "If exists, what legitimate use this has",
        "benefitedPopulation": "Who benefits",
        "tradeoff": "The tension between harm and benefit",
        "netAssessment": "Does harm outweigh benefit?",
        "alternativeDesign": "How to preserve benefit while reducing harm",
        "reason": "If no defensive use, why not"
      },
      "mitigation": {
        "summary": "One-sentence fix description",
        "codeChanges": [
          {
            "file": "src/component.tsx",
            "lineNumbers": [45, 52],
            "currentCode": "// Current problematic code",
            "suggestedCode": "// Fixed code",
            "action": "What to do",
            "diffPreview": "- old\\n+ new"
          }
        ],
        "designChanges": [
          {
            "component": "ComponentName",
            "currentDesign": "Current problematic design",
            "suggestedDesign": "Better design",
            "rationale": "Why this is better",
            "mockupNeeded": true | false
          }
        ],
        "contentChanges": [
          {
            "location": "Where in UI",
            "currentText": "Problematic text",
            "suggestedText": "Better text",
            "rationale": "Why this is better"
          }
        ],
        "testingRequirements": ["What to test"],
        "estimatedEffort": "2-3 days"
      }
    }
  ],
  "riskChains": [
    {
      "id": "chain-id",
      "capabilities": ["cap1", "cap2"],
      "emergentRisk": "What new risk emerges from combination",
      "severity": "critical",
      "whyWorse": "Why combined is worse than individual",
      "affectedScenarios": ["scenario-ids"],
      "mitigationRequires": "What must be fixed to break chain",
      "riskContribution": 3.5,
      "visualChain": "cap1 → action → cap2 → harm"
    }
  ]
}

## Writing Good Findings

### BAD (too generic):
"This could be misused by bad actors"

### GOOD (specific and vivid):
"A user could use the 'share location in real-time' feature to monitor a partner's movements without meaningful ongoing consent, enabling coercive control in domestic abuse situations"

### BAD (security finding):
"File uploads could contain malicious code"

### GOOD (misuse-by-design):
"A user could use the photo upload feature combined with the AI face-match search to identify and locate someone who does not want to be found"

## Confidence Scoring Guidelines

- Detection confidence: 0.9+ if found explicit code, 0.7-0.9 if inferred from API, 0.5-0.7 if heuristic
- Misuse confidence: 0.9+ if documented precedent, 0.7-0.9 if similar systems exploited, 0.5-0.7 if theoretical
- Severity confidence: 0.9+ if vulnerable population, 0.7-0.9 if general population, 0.5-0.7 if limited impact
- Flag issues with overall confidence <0.6 as needing human review

## Mitigation Guidelines

Focus mitigations on:
1. **UI Language Changes**: Reword labels, add warnings, clarify limitations
2. **Interaction Model Changes**: Add friction, require confirmation, enable consent
3. **Feature Removal**: Recommend removing dangerous affordances
4. **Reframing**: Change how the feature is presented to users

Include SPECIFIC code changes with line numbers when possible.
NOT technical patches like input validation or encryption.

## Risk Chain Detection

Look for capabilities that combine to create emergent risks:
- Location + Identity = Stalking pipeline
- AI Generation + User Photos = Deepfake creation
- Search + Messaging = Harassment campaign infrastructure

Be thorough but only report genuine misuse-by-design risks. If the codebase is genuinely safe, return empty arrays and a low risk score. Better to report fewer, higher-quality findings than many generic ones.

## Mitigation Verification Protocol (Two-Pass Analysis)

You MUST perform two passes before finalizing any finding:

### Pass 1: Pattern Detection
Identify potentially risky capabilities (e.g., simulated perspectives, risk badges, persistent storage, back-navigation in guided flows).

### Pass 2: Mitigation Verification
For EACH flagged pattern, actively search for counter-evidence before assigning severity. A finding is only valid if mitigations are absent or insufficient.

#### Verification Checklist by Category:

**Simulated Perspective / Ventriloquism**
- Does the heading use hedging language? ("One way...", "might have", "could have")
- Is there a disclaimer within the same component stating the AI cannot know the other person's mind?
- Is the output labeled as speculative rather than authoritative?
→ If 2+ checks pass, downgrade from critical to "mitigated-with-residual-risk" and note what mitigations exist.

**Risk Badge / Traffic Light Absolution**
- Trace the internal enum value (e.g., green) to its RENDERED className and label — do not assume the enum name matches the UI
- Does the lowest-risk level use neutral styling (gray, muted) rather than green/positive colors?
- Does the lowest-risk level use non-permissive labels (e.g., "No flag" vs "All clear" vs "Safe")?
- Is there a mandatory disclaimer on ALL outcome levels?
- Does the disclaimer explicitly state that absence of a flag is not permission?
→ If the UI label, styling, and disclaimer are all non-permissive, mark as "mitigated" not "high."

**Persistent Storage / Forensic Traceability**
- Check the EXACT storage API: sessionStorage (tab-scoped, auto-clears) vs localStorage (persistent)
- If sessionStorage: the data is not forensically persistent — note this explicitly
- Check for "Clear Data" or "Quick Exit" features
→ sessionStorage usage alone downgrades storage persistence from "high" to "low." Quick Exit absence can remain a valid suggestion.

**Gaming / A-B Testing Risk Levels**
- Does the risk classification function operate on cumulative state or per-input state?
- Look for high-water-mark logic (risk only escalates, never resets within a session)
- Does navigating back reset the risk state or preserve it?
→ If cumulative + high-water-mark, mark "gaming" scenario as "mitigated by architecture."

### Output Rules
- Every finding MUST include a mitigationsFound array listing what counter-evidence you detected
- Every finding MUST include a mitigationGaps array listing what's still missing
- Severity is assigned AFTER mitigation verification, not before
- If a pattern is fully mitigated, still report it as severity "info" with mitigations noted — do not silently drop it
- NEVER assign severity based solely on the existence of a code pattern without checking its rendered UI behavior and surrounding context

### Anti-Hallucination Rules
- Do not infer UI appearance from variable names — trace to actual className and label values
- Do not assume storage persistence without checking which API is used
- Do not assume state resets without checking the state management logic
- Report only what you can verify from the code you were given`;

// Inline category detection for edge function (mirrors src/services/categoryDetector.ts)
const CATEGORY_SIGNALS: Record<string, string[]> = {
  fitness: ['workout', 'calories', 'weight', 'exercise', 'reps', 'sets', 'gym', 'training', 'fitness', 'bmi'],
  dating: ['match', 'swipe', 'profile', 'like', 'message', 'dating', 'tinder', 'crush', 'unmatch'],
  fintech: ['invoice', 'payment', 'subscription', 'billing', 'checkout', 'stripe', 'transaction', 'wallet', 'pricing'],
  health: ['symptom', 'dose', 'health', 'mental', 'mood', 'therapy', 'diagnosis', 'patient', 'medication'],
  productivity: ['task', 'todo', 'calendar', 'project', 'sprint', 'kanban', 'deadline', 'milestone', 'backlog'],
  social: ['post', 'feed', 'follow', 'share', 'comment', 'timeline', 'newsfeed', 'hashtag', 'repost'],
  b2b: ['admin', 'dashboard', 'team', 'role', 'permission', 'tenant', 'organization', 'workspace', 'member'],
  gaming: ['score', 'level', 'achievement', 'leaderboard', 'player', 'quest', 'badge', 'xp', 'highscore'],
};

function detectAppCategoryEdge(files: { name: string; content: string }[]): string {
  const fileNames = files.map(f => f.name.toLowerCase()).join(' ');
  const corpus = files.map(f => f.content.toLowerCase()).join(' ');
  let bestCategory = 'unknown';
  let bestScore = 0;

  for (const [category, signals] of Object.entries(CATEGORY_SIGNALS)) {
    let score = 0;
    for (const signal of signals) {
      const re = new RegExp(`\\b${signal}\\b`, 'g');
      score += (fileNames.match(re) || []).length * 3;
      score += Math.min((corpus.match(re) || []).length, 20);
    }
    if (score > bestScore) { bestScore = score; bestCategory = category; }
  }
  return bestScore < 5 ? 'unknown' : bestCategory;
}

// Vertical risk profiles per app category (mirrors src/data/verticalProfiles.ts)
const VERTICAL_PROFILES: Record<string, {
  elevatedCategories: string[];
  additionalHarmPatterns: string[];
  standardMitigations: string[];
  populationNotes: string;
}> = {
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

function getVerticalProfilePrompt(category: string): string {
  const profile = VERTICAL_PROFILES[category];
  if (!profile) return '';
  return `\n\nVERTICAL RISK PROFILE (${category.toUpperCase()}):\n${JSON.stringify(profile, null, 2)}\n\nApply this profile: weight the elevated categories more heavily, actively scan for the additional harm patterns listed, and check whether the standard mitigations are present. Consider the population notes when assessing severity.`;
}

function extractJsonObject(raw: string): unknown {
  let cleaned = raw
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  if (firstBrace === -1) {
    throw new Error("No JSON object found in AI response");
  }

  cleaned = cleaned.slice(firstBrace);
  let depth = 0;
  let inString = false;
  let escaped = false;
  let endIndex = -1;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{") depth++;
    if (char === "}") depth--;
    if (depth === 0) {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    throw new Error("AI response ended before the JSON object was complete");
  }

  const jsonText = cleaned
    .slice(0, endIndex + 1)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/,\s*([}\]])/g, "$1");

  return JSON.parse(jsonText);
}

function isLikelyTruncated(raw: string): boolean {
  const text = raw.trim();
  if (!text) return true;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = text.indexOf("{"); i >= 0 && i < text.length; i++) {
    const char = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{") depth++;
    if (char === "}") depth--;
  }

  return depth !== 0 || /\.\.\.$|…$|\[truncated\]/i.test(text);
}

function buildFallbackAnalysis(files: { name: string; content: string }[], detectedCategory: string) {
  const corpus = files.map((f) => `${f.name}\n${f.content}`).join("\n").toLowerCase();
  const firstMatchingFile = (pattern: RegExp) => files.find((f) => pattern.test(`${f.name}\n${f.content}`))?.name || "uploaded files";
  const makeIssue = (category: string, title: string, severity: string, location: string, description: string, mitigation: string) => ({
    id: `fallback-${category}`,
    category,
    title,
    description,
    severity,
    location,
    misuseScenario: description,
    whyMisuseByDesign: "The AI report was too long to parse, so this fallback flags a clear high-level affordance from the uploaded code for human review.",
    mitigationType: "interaction-model",
    confidence: {
      detectionConfidence: 0.62,
      detectionRationale: "Detected by deterministic keyword scan after the AI response was truncated.",
      misuseConfidence: 0.55,
      misuseRationale: "Needs human review because the full model analysis could not be safely parsed.",
      severityConfidence: 0.5,
      severityRationale: "Severity is conservative until a complete scan is available.",
      overallConfidence: 0.56,
      uncertaintyFactors: ["Fallback result", "AI output was truncated"],
    },
    mitigationsFound: [],
    mitigationGaps: ["Run a smaller scan or reduce selected files for deeper analysis"],
    mitigation: { summary: mitigation, codeChanges: [], designChanges: [], contentChanges: [], testingRequirements: [], estimatedEffort: "Review needed" },
  });

  const issues = [];
  if (/geolocation|watchposition|latitude|longitude|live location|location sharing/.test(corpus)) {
    issues.push(makeIssue("surveillance", "Location sharing may enable monitoring", "medium", firstMatchingFile(/geolocation|watchposition|latitude|longitude|live location|location sharing/i), "Location features can be repurposed to monitor someone without ongoing consent.", "Add explicit consent, clear status indicators, expiration, and easy stop-sharing controls."));
  } else if (/impersonat|admin|moderator|delete user|ban user|private message|export data/.test(corpus)) {
    issues.push(makeIssue("admin-abuse", "Administrative powers need transparency", "medium", firstMatchingFile(/impersonat|admin|moderator|delete user|ban user|private message|export data/i), "Admin tools can create harm when people affected by actions cannot see or contest them.", "Add user-visible audit trails, notifications, and narrow role permissions."));
  } else if (/(openai|anthropic|gemini|ai|chatbot).*(therapy|medical|diagnos|legal|crisis)|(therapy|medical|diagnos|legal|crisis).*(openai|anthropic|gemini|ai|chatbot)/.test(corpus)) {
    issues.push(makeIssue("false-authority", "AI guidance may be mistaken for expert advice", "medium", firstMatchingFile(/openai|anthropic|gemini|therapy|medical|diagnos|legal|crisis/i), "AI guidance in sensitive contexts can be read as professional advice it cannot reliably provide.", "Clarify limits, avoid definitive claims, and route high-risk cases to qualified support."));
  }

  const highCount = issues.filter((i) => i.severity === "high").length;
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  return {
    executiveSummary: {
      topThreeRisks: issues.slice(0, 3).map((i) => ({ title: i.title, severity: i.severity, effortToFix: "medium", summary: i.description, riskContribution: 1.5 })),
      riskScore: issues.length ? 3.5 : 0,
      totalIssueCount: issues.length,
      criticalCount,
      highCount,
    },
    capabilities: issues.length ? [{ id: "fallback-capability", name: "Fallback capability detected", description: "Detected by a conservative fallback scan after AI output truncation.", riskLevel: "medium", detectedIn: [issues[0].location], detectionConfidence: 0.62 }] : [],
    misuseScenarios: issues.length ? [{ id: "fallback-scenario", title: issues[0].title, description: issues[0].description, capabilities: ["fallback-capability"], severity: issues[0].severity, realWorldExample: "Requires human review because the full AI report was truncated.", mitigations: [issues[0].mitigation.summary], likelihoodScore: 0.5, likelihoodRationale: "Fallback estimate", impactScore: 0.5, impactRationale: "Fallback estimate" }] : [],
    issues,
    riskChains: [],
    detectedCategory,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, projectName, previousScan, customRules, populationModifiers, forkMode, upstreamFiles, categoryOverride } = await req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ error: "No files provided for analysis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    // Format a bounded code sample for the prompt so large repositories do not
    // force the model to truncate JSON mid-object.
    let totalChars = 0;
    const boundedFiles = files
      .filter((f: { name: string; content: string }) => typeof f?.name === "string" && typeof f?.content === "string")
      .slice(0, MAX_PROMPT_FILES)
      .map((f: { name: string; content: string }) => {
        const remaining = Math.max(0, MAX_TOTAL_FILE_CHARS - totalChars);
        const limit = Math.min(MAX_CHARS_PER_FILE, remaining);
        const content = f.content.slice(0, limit);
        totalChars += content.length;
        return { ...f, content };
      })
      .filter((f: { content: string }) => f.content.length > 0);

    const omittedFileCount = Math.max(0, files.length - boundedFiles.length);
    const filesContent = boundedFiles
      .map((f: { name: string; content: string }) => `--- ${f.name} ---\n${f.content}`)
      .join("\n\n");
    const truncationNotice = omittedFileCount > 0
      ? `\n\nNOTE: This scan uses a representative bounded sample of ${boundedFiles.length} files from ${files.length} uploaded files to keep the AI response reliable. Do not claim certainty about omitted files.`
      : '';

    // Include previous scan context if available
    const previousContext = previousScan 
      ? `\n\nPREVIOUS SCAN CONTEXT:\nPrevious risk score: ${previousScan.riskScore}\nPrevious issues: ${previousScan.issueIds?.join(', ') || 'none'}\nLook for new patterns that emerged since the last scan and note any resolved issues.`
      : '';

    // Use category override if provided, otherwise auto-detect
    const detectedCategory = categoryOverride && categoryOverride !== 'unknown' 
      ? categoryOverride 
      : detectAppCategoryEdge(files);
    
    // 'general' means no vertical profile
    const categoryHint = detectedCategory !== 'unknown' && detectedCategory !== 'general'
      ? `\n\nDetected app category: ${detectedCategory}. Elevate risk sensitivity for harms most relevant to this category.`
      : '';
    const verticalProfilePrompt = detectedCategory !== 'general' ? getVerticalProfilePrompt(detectedCategory) : '';

    // Custom rules from user
    const customRulesPrompt = customRules && typeof customRules === 'object'
      ? `\n\nCUSTOM RULES configured by user:\n${JSON.stringify(customRules)}\nApply these in addition to standard detection. If a finding is triggered by a custom pattern, include "customRule": true and "customRuleName": "<pattern name>" in that issue's JSON output.`
      : '';

    // Population vulnerability modifiers
    const POPULATION_LABELS: Record<string, string> = {
      'minors': 'App may be used by minors (under 18)',
      'financially-vulnerable': 'Users may be in financially vulnerable situations',
      'mental-health': 'App addresses mental health or crisis situations',
      'domestic-abuse': 'Users may be in domestic abuse or coercive control situations',
      'elderly': 'Elderly users are a primary audience',
      'men-and-boys': 'Men and boys are a primary or significant audience — documented loneliness crisis, lower help-seeking rates, susceptibility to shame-based mechanics and restrictive masculinity patterns',
    };
    const populationPrompt = Array.isArray(populationModifiers) && populationModifiers.length > 0
      ? `\n\nPOPULATION VULNERABILITY CONTEXT:\n${populationModifiers.map((m: string) => `- ${POPULATION_LABELS[m] || m}`).join('\n')}\n\nIncrease severity ratings and risk scores for issues that specifically endanger these populations. For each issue, if a population modifier is relevant to the misuse scenario, include a "populationTags" array in the issue JSON with the relevant modifier IDs (e.g. ["minors", "elderly"]).`
      : '';

    // Fork comparison mode
    let forkPrompt = '';
    if (forkMode && Array.isArray(upstreamFiles) && upstreamFiles.length > 0) {
      const upstreamContent = upstreamFiles
        .map((f: { name: string; content: string }) => `--- ${f.name} ---\n${f.content}`)
        .join("\n\n");
      
      forkPrompt = `\n\nFORK COMPARISON MODE:
You are comparing a FORK against its UPSTREAM repository.

UPSTREAM FILES:
${upstreamContent}

FORK FILES (to analyze):
The main codebase provided above is the FORK.

For EACH issue you find, you MUST classify it with a "forkClassification" field:
- "inherited": Issue exists in the upstream code and is carried into the fork unchanged
- "introduced": Issue is NEW in the fork — not present in the upstream
- "remediated": Issue existed in the upstream but has been FIXED or mitigated in the fork

Lead the executive summary with counts: "Introduced X new issues, inherited Y from upstream, and fixed Z."
Focus your analysis on the DIFFERENCES between fork and upstream. Prioritize issues that were INTRODUCED by the fork.`;
    }

    const userPrompt = `Analyze this "${projectName || "web application"}" codebase for MISUSE-BY-DESIGN patterns using the v2.0 schema. Remember: you are looking for features that could harm people when working exactly as intended, not bugs or security vulnerabilities.

Provide calibrated confidence scores for each finding and specific code-level mitigations.${categoryHint}${verticalProfilePrompt}${customRulesPrompt}${populationPrompt}${forkPrompt}${previousContext}${truncationNotice}

OUTPUT SIZE LIMITS FOR RELIABILITY:
- Return at most 3 issues, 5 capabilities, 3 misuseScenarios, and 2 riskChains.
- Keep every narrative string under 350 characters unless it is a required explanation.
- Keep mitigation.codeChanges minimal; do not include long currentCode, suggestedCode, or diffPreview blocks.
- Prefer concise, high-confidence findings over exhaustive coverage.

${filesContent}

IMPORTANT: Respond with ONLY a valid JSON object matching the v2.0 schema. No markdown code fences, no commentary before or after — just the raw JSON object starting with { and ending with }.`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(" "));
          } catch {
            clearInterval(keepAlive);
          }
        }, 10_000);

        const sendJson = (payload: unknown) => {
          controller.enqueue(encoder.encode(JSON.stringify(payload)));
        };

        try {
          // Use streaming from Anthropic and stream keep-alives to the browser,
          // so neither side closes the connection during longer Claude scans.
          const callAnthropic = (maxTokens: number) => fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-5",
              max_tokens: maxTokens,
              stream: true,
              system: ANALYSIS_PROMPT,
              messages: [
                { role: "user", content: userPrompt },
              ],
            }),
          });

          let response = await callAnthropic(12000);

          if (!response.ok) {
            if (response.status === 429) {
              sendJson({ error: "Rate limit exceeded. Please try again in a moment." });
              return;
            }
            if (response.status === 401 || response.status === 403) {
              sendJson({ error: "Anthropic API key is invalid or unauthorized." });
              return;
            }
            const errorText = await response.text();
            console.error("Anthropic API error:", response.status, errorText);
            sendJson({ error: "Failed to analyze code" });
            return;
          }

          if (!response.body) {
            throw new Error("Empty stream from AI");
          }

          const readAnthropicStream = async (streamBody: ReadableStream<Uint8Array>): Promise<{ content: string; stopReason: string | null }> => {
            let content = "";
            let stopReason: string | null = null;
            const reader = streamBody.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });

              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;
                const data = trimmed.slice(5).trim();
                if (!data || data === "[DONE]") continue;

                const event = JSON.parse(data);
                if (
                  event.type === "content_block_delta" &&
                  event.delta?.type === "text_delta" &&
                  typeof event.delta.text === "string"
                ) {
                  content += event.delta.text;
                } else if (event.type === "message_delta" && event.delta?.stop_reason) {
                  stopReason = event.delta.stop_reason;
                } else if (event.type === "message_stop" && event.message?.stop_reason) {
                  stopReason = event.message.stop_reason;
                } else if (event.type === "error") {
                  console.error("Anthropic stream error:", event);
                  throw new Error(event.error?.message || "Anthropic stream error");
                }
              }
            }

            return { content, stopReason };
          };

          // Parse Anthropic SSE stream and accumulate text deltas.
          let { content, stopReason } = await readAnthropicStream(response.body);

          if (!content) {
            throw new Error("Empty response from AI");
          }

          // Parse the JSON response even if Claude wraps it in markdown or appends notes.
          let analysisResult;
          try {
            analysisResult = extractJsonObject(content);
          } catch (parseError) {
            if (stopReason === "max_tokens" || isLikelyTruncated(content)) {
              console.warn("AI response was truncated; retrying with stricter concise-output instructions.", { stopReason, contentLength: content.length });
              const retryPrompt = `${userPrompt}\n\nRETRY BECAUSE PRIOR OUTPUT WAS TRUNCATED: Return a MUCH SHORTER JSON object. Include only the single highest-risk issue, at most 3 capabilities, at most 1 misuse scenario, no codeChanges, no currentCode, no suggestedCode, no diffPreview, and keep every string under 220 characters.`;
              response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                  "x-api-key": ANTHROPIC_API_KEY,
                  "anthropic-version": "2023-06-01",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "claude-sonnet-4-5",
                  max_tokens: 6000,
                  stream: true,
                  system: ANALYSIS_PROMPT,
                  messages: [{ role: "user", content: retryPrompt }],
                }),
              });

              if (!response.ok) {
                const errorText = await response.text();
                console.error("Anthropic retry API error:", response.status, errorText);
                throw new Error("AI response was too long and retry failed");
              }
              if (!response.body) {
                throw new Error("Empty retry stream from AI");
              }

              const retryResult = await readAnthropicStream(response.body);
              content = retryResult.content;
              stopReason = retryResult.stopReason;
              try {
                analysisResult = extractJsonObject(content);
              } catch (retryParseError) {
                console.error("AI retry response parse error:", retryParseError);
                console.error("Failed to parse retry AI response:", content);
                analysisResult = buildFallbackAnalysis(boundedFiles, detectedCategory);
              }
            } else {
              throw parseError;
            }
          }

          if (!analysisResult || typeof analysisResult !== "object") {
            throw new Error("Invalid response format from AI");
          }

          try {
            const analysis = analysisResult as Record<string, unknown>;
            analysis.executiveSummary ||= { topThreeRisks: [], riskScore: 0, totalIssueCount: 0, criticalCount: 0, highCount: 0 };
            analysis.capabilities = Array.isArray(analysis.capabilities) ? analysis.capabilities : [];
            analysis.misuseScenarios = Array.isArray(analysis.misuseScenarios) ? analysis.misuseScenarios : [];
            analysis.issues = Array.isArray(analysis.issues) ? analysis.issues : [];
          } catch (normalizationError) {
            console.error("Failed to parse AI response:", content);
            console.error("AI response normalization error:", normalizationError);
            throw new Error("Invalid response format from AI");
          }

          sendJson({
            success: true,
            analysis: analysisResult,
            timestamp: new Date().toISOString(),
            projectName: projectName || "Uploaded Project",
            scanVersion: 2,
            detectedCategory,
            previousScanTimestamp: previousScan?.timestamp || null,
          });
        } catch (error) {
          console.error("analyze-code stream error:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          try {
            sendJson({ error: errorMessage });
          } catch (sendError) {
            console.error("Failed to send analyze-code error response:", sendError);
          }
        } finally {
          clearInterval(keepAlive);
          try {
            controller.close();
          } catch {
            // Client disconnected after the analysis finished or failed.
          }
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("analyze-code error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
