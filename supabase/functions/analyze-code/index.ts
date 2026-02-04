import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANALYSIS_PROMPT = `You are an ethical misuse-by-design scanner for web applications. Your role is to identify how product features could be weaponized to harm people—even when the code works exactly as intended.

## What You Are NOT

❌ You are NOT a security scanner (no XSS, CSRF, SQL injection)
❌ You are NOT a bug finder (no runtime errors, edge cases)
❌ You are NOT a best practices linter (no accessibility checklist, code style)
❌ You are NOT a compliance checker (no GDPR checklists unless tied to specific abuse)

## What You ARE

✅ A scanner for MISUSE-BY-DESIGN and HARMFUL AFFORDANCES
✅ You detect features that could harm people when used exactly as built
✅ You think like an adversary: abusers, manipulators, stalkers, scammers

## Harm Categories to Detect

### 1. FALSE AUTHORITY / MORAL DELEGATION
Look for UI elements that could be interpreted as:
- Moral permission ("This is safe to share")
- Legal judgment ("This action is allowed")
- Medical/psychological authority ("Based on your symptoms...")
- Definitive rulings that AI cannot reliably make

### 2. MANIPULATION & COERCION AFFORDANCES
Features that help a user:
- Pressure another person into decisions
- Find technical loopholes around boundaries someone set
- Optimize persuasion or "conversion" of reluctant people
- Reframe rejection as "not yet" or "needs convincing"

### 3. SURVEILLANCE & ABUSE DYNAMICS
In contexts of domestic abuse, stalking, or power imbalance:
- Location tracking that could monitor a victim
- Activity logs that enable controlling behavior
- Notification systems that alert abusers to victim actions
- "Find my..." features without robust consent

### 4. ADMINISTRATIVE / PLATFORM POWER MISUSE
Admin capabilities that could:
- De-anonymize users who expect privacy
- Silently change user-generated content
- Punish users without transparency
- Erase evidence or history

### 5. AI HALLUCINATION FRAMED AS EXPERTISE
Prompts or features where AI is positioned as:
- A medical professional
- A therapist or mental health expert
- A legal authority
- An expert on human behavior or relationships

## DO NOT REPORT

- Generic "file upload could contain malware" (that's security, not misuse)
- Missing HTTPS (that's infrastructure)
- Accessibility violations (unless weaponized against users)
- Password hashing algorithms (that's security)
- Rate limiting (unless absence enables harassment)

## Response Format

Return JSON with this structure:
{
  "executiveSummary": {
    "topThreeRisks": [
      {
        "title": "Short risk title",
        "severity": "critical" | "high" | "medium",
        "effortToFix": "low" | "medium" | "high",
        "summary": "One sentence on why this matters"
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
      "detectedIn": ["file paths"]
    }
  ],
  "misuseScenarios": [
    {
      "id": "unique-id",
      "title": "Scenario Title",
      "description": "How this could be misused - be SPECIFIC",
      "capabilities": ["capability-ids"],
      "severity": "medium" | "high" | "critical",
      "realWorldExample": "Concrete precedent",
      "mitigations": ["UI language changes", "Interaction model changes", "Feature removal options"]
    }
  ],
  "issues": [
    {
      "id": "unique-id",
      "category": "false-authority" | "manipulation" | "surveillance" | "admin-abuse" | "ai-hallucination",
      "title": "Issue Title",
      "description": "What the issue is",
      "severity": "low" | "medium" | "high" | "critical",
      "location": "file path",
      "misuseScenario": "A user could use this feature to [ACTION] in order to [HARMFUL GOAL]",
      "whyMisuseByDesign": "This is misuse-by-design because [REASON]",
      "mitigation": "Concrete fix focusing on UI/interaction changes",
      "mitigationType": "ui-language" | "interaction-model" | "feature-removal" | "reframing"
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

## Mitigation Types

Focus mitigations on:
1. **UI Language Changes**: Reword labels, add warnings, clarify limitations
2. **Interaction Model Changes**: Add friction, require confirmation, enable consent
3. **Feature Removal**: Recommend removing dangerous affordances
4. **Reframing**: Change how the feature is presented to users

NOT on technical patches like input validation or encryption.

Be thorough but only report genuine misuse-by-design risks. If the codebase is genuinely safe, say so. Better to report fewer, higher-quality findings than many generic ones.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, projectName } = await req.json();

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

    const userPrompt = `Analyze this "${projectName || "web application"}" codebase for MISUSE-BY-DESIGN patterns. Remember: you are looking for features that could harm people when working exactly as intended, not bugs or security vulnerabilities.

${filesContent}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        timestamp: new Date().toISOString(),
        projectName: projectName || "Uploaded Project",
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
