import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

### 1. FALSE AUTHORITY / MORAL DELEGATION (false-authority)
Look for UI elements that could be interpreted as:
- Moral permission ("This is safe to share")
- Legal judgment ("This action is allowed")
- Medical/psychological authority ("Based on your symptoms...")
- Definitive rulings that AI cannot reliably make

### 2. MANIPULATION & COERCION AFFORDANCES (manipulation)
Features that help a user:
- Pressure another person into decisions
- Find technical loopholes around boundaries someone set
- Optimize persuasion or "conversion" of reluctant people
- Reframe rejection as "not yet" or "needs convincing"

### 3. SURVEILLANCE & ABUSE DYNAMICS (surveillance)
In contexts of domestic abuse, stalking, or power imbalance:
- Location tracking that could monitor a victim
- Activity logs that enable controlling behavior
- Notification systems that alert abusers to victim actions
- "Find my..." features without robust consent

### 4. ADMINISTRATIVE / PLATFORM POWER MISUSE (admin-abuse)
Admin capabilities that could:
- De-anonymize users who expect privacy
- Silently change user-generated content
- Punish users without transparency
- Erase evidence or history

### 5. AI HALLUCINATION FRAMED AS EXPERTISE (ai-hallucination)
Prompts or features where AI is positioned as:
- A medical professional
- A therapist or mental health expert
- A legal authority
- An expert on human behavior or relationships

### 6. DARK PATTERNS & COERCIVE UX (dark-patterns)
Features that manipulate users into unintended actions:
- Fake urgency timers or scarcity indicators not tied to real data
- Hidden or friction-heavy unsubscribe/cancel flows
- Confirm-shaming copy ('No thanks, I hate saving money')
- Roach motel patterns — easy in, hard out
- Misleading free trial flows with buried auto-charge
- Pre-checked consent boxes

## DO NOT REPORT

- Generic "file upload could contain malware" (that's security, not misuse)
- Missing HTTPS (that's infrastructure)
- Accessibility violations (unless weaponized against users)
- Password hashing algorithms (that's security)
- Rate limiting (unless absence enables harassment)

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
      "category": "false-authority" | "manipulation" | "surveillance" | "admin-abuse" | "ai-hallucination",
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
    elevatedCategories: ['ai-hallucination', 'manipulation'],
    additionalHarmPatterns: ['Body image distortion through metrics or comparisons', 'Calorie restriction encouragement without medical context', 'Progress shaming or guilt-based engagement', 'AI meal plans or supplement advice framed as professional', 'Competitive leaderboards triggering compulsive exercise'],
    standardMitigations: ['Disclaimer that fitness advice is not medical guidance', 'Avoid absolute language in health metrics', 'Opt-out from social comparison features', 'Content warnings on calorie tracking for ED history'],
    populationNotes: 'Users vulnerable to eating disorders, body dysmorphia, and exercise addiction. Teens and young adults especially at risk.',
  },
  dating: {
    elevatedCategories: ['surveillance', 'manipulation'],
    additionalHarmPatterns: ['Location sharing enabling stalking', 'Read receipts enabling controlling behavior', 'Profile info usable to locate someone offline', 'Features bypassing block/unmatch boundaries', 'AI messaging manufacturing false intimacy or consent', 'Screenshot/export of private conversations'],
    standardMitigations: ['Robust block/report with full visibility removal', 'Fuzzy location only', 'No read receipts by default', 'Clear consent before sharing photos/info', 'Silent unmatch'],
    populationNotes: 'Includes DV survivors, stalking targets, LGBTQ+ in hostile regions. Any feature revealing identity, location, or activity can be weaponized.',
  },
  fintech: {
    elevatedCategories: ['manipulation', 'false-authority'],
    additionalHarmPatterns: ['Dark patterns in cancellation flows', 'Urgency/scarcity pressuring financial decisions', 'AI financial advice framed as professional', 'Hidden fees or unclear pricing', 'Auto-recurring charges without disclosure', 'Debt normalization'],
    standardMitigations: ['Clear upfront pricing', 'One-click cancellation', 'Financial info disclaimer', 'Transaction confirmation with cooling-off period'],
    populationNotes: 'Users in debt, financially illiterate, or in economic distress. Subscription traps affect elderly and cognitively disabled disproportionately.',
  },
  health: {
    elevatedCategories: ['false-authority', 'ai-hallucination'],
    additionalHarmPatterns: ['AI diagnoses framed as clinical', 'Mood tracking inferring conditions without validity', 'Dosage calculators without pharmacist review', 'Crisis detection without escalation protocols', 'Clinical language used by non-medical AI', 'Wellness scores mimicking clinical assessments'],
    standardMitigations: ['Prominent "not medical advice" disclaimer', 'Crisis resources surfaced when risk detected', 'No clinical language in AI content', 'Health data encryption and access controls'],
    populationNotes: 'People experiencing symptoms, chronic conditions, or mental health crises. Misplaced authority can delay real care. Health anxiety users may over-rely on assessments.',
  },
  productivity: {
    elevatedCategories: ['surveillance', 'admin-abuse'],
    additionalHarmPatterns: ['Activity monitoring enabling micromanagement', 'Productivity scores visible to managers', 'Time tracking penalizing breaks', 'Calendar transparency exposing personal info', 'Automated performance reports from activity'],
    standardMitigations: ['User control over shared activity data', 'No productivity scoring visible to others', 'Right to disconnect outside hours', 'Workload visibility'],
    populationNotes: 'Workers with no real choice about tool adoption. Remote and gig workers especially vulnerable to always-on monitoring.',
  },
  social: {
    elevatedCategories: ['manipulation', 'surveillance'],
    additionalHarmPatterns: ['Algorithmic outrage amplification', 'Engagement metrics enabling social comparison harm', 'Filter bubbles and radicalization paths', 'Harassment infrastructure: mass tagging, pile-ons', 'Doxxing vectors', 'Addictive patterns: infinite scroll, notification urgency', 'Minor safety: age-inappropriate content, predator vectors'],
    standardMitigations: ['Robust block/mute across all paths', 'Option to hide engagement metrics', 'Content warnings and filters', 'Rate limiting on mentions and DMs', 'Age verification and minor protections'],
    populationNotes: 'Minors, bullying targets, people with social anxiety. Marginalized communities face disproportionate harassment.',
  },
  b2b: {
    elevatedCategories: ['admin-abuse'],
    additionalHarmPatterns: ['Admin reading private data without audit trail', 'User impersonation without consent', 'Silent content modification', 'Data export for surveillance', 'Role escalation without notification', 'Tenant data isolation failures', 'Punishment without transparency'],
    standardMitigations: ['Audit logging visible to affected users', 'No silent content editing', 'Impersonation requires notification', 'Data export with consent', 'Role change notifications'],
    populationNotes: 'Employees on company-mandated tools with no opt-out. Admin features without transparency enable retaliation and discrimination.',
  },
  gaming: {
    elevatedCategories: ['manipulation', 'ai-hallucination'],
    additionalHarmPatterns: ['Loot box/gacha with obscured odds', 'Pay-to-win mechanics', 'FOMO limited-time events pressuring spending', 'Social pressure: gifting, clan obligations, streaks', 'Leaderboards enabling targeted harassment', 'Child-accessible spending without parental controls'],
    standardMitigations: ['Transparent odds disclosure', 'Spending limits and cooldowns', 'Parental controls', 'Option to hide from leaderboards', 'Play time reminders'],
    populationNotes: 'Heavily used by minors and those vulnerable to gambling-like mechanics. Randomized rewards exploit same psychology as slot machines.',
  },
};

function getVerticalProfilePrompt(category: string): string {
  const profile = VERTICAL_PROFILES[category];
  if (!profile) return '';
  return `\n\nVERTICAL RISK PROFILE (${category.toUpperCase()}):\n${JSON.stringify(profile, null, 2)}\n\nApply this profile: weight the elevated categories more heavily, actively scan for the additional harm patterns listed, and check whether the standard mitigations are present. Consider the population notes when assessing severity.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, projectName, previousScan, customRules, populationModifiers, forkMode, upstreamFiles } = await req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ error: "No files provided for analysis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format files for the prompt
    const filesContent = files
      .map((f: { name: string; content: string }) => `--- ${f.name} ---\n${f.content}`)
      .join("\n\n");

    // Include previous scan context if available
    const previousContext = previousScan 
      ? `\n\nPREVIOUS SCAN CONTEXT:\nPrevious risk score: ${previousScan.riskScore}\nPrevious issues: ${previousScan.issueIds?.join(', ') || 'none'}\nLook for new patterns that emerged since the last scan and note any resolved issues.`
      : '';

    // Detect app category and get vertical profile
    const detectedCategory = detectAppCategoryEdge(files);
    const categoryHint = detectedCategory !== 'unknown'
      ? `\n\nDetected app category: ${detectedCategory}. Elevate risk sensitivity for harms most relevant to this category.`
      : '';
    const verticalProfilePrompt = getVerticalProfilePrompt(detectedCategory);

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

Provide calibrated confidence scores for each finding and specific code-level mitigations.${categoryHint}${verticalProfilePrompt}${customRulesPrompt}${populationPrompt}${forkPrompt}${previousContext}

${filesContent}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          { role: "system", content: ANALYSIS_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to analyze code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from AI");
    }

    // Parse the JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid response format from AI");
    }

    // Add post-processing for benchmarking and deployment context
    // These are calculated on the client side using the services

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        timestamp: new Date().toISOString(),
        projectName: projectName || "Uploaded Project",
        scanVersion: 2,
        detectedCategory,
        previousScanTimestamp: previousScan?.timestamp || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-code error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
