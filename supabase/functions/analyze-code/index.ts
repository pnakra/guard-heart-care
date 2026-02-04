import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANALYSIS_PROMPT = `You are an ethical code reviewer for web applications. Analyze the provided code files and identify:

1. **Detected Capabilities**: What features/capabilities does this app have? Look for patterns like:
   - Image/file uploads (FormData, file inputs, storage uploads)
   - User profiles with personal info
   - Geolocation/location tracking
   - Messaging/chat features
   - User search/discovery
   - AI/ML integrations
   - Payment processing
   - Social features (likes, follows, comments)
   - Data collection/analytics
   - Camera/microphone access

2. **Potential Misuse Scenarios**: Based on detected capabilities, identify how bad actors could misuse the application. Consider combinations of capabilities that enable harm.

3. **Ethical Issues**: Identify potential concerns related to:
   - Dark patterns
   - Privacy violations
   - Manipulation techniques
   - Accessibility problems
   - Addictive mechanics
   - Discrimination risks

Return a JSON response with this exact structure:
{
  "capabilities": [
    {
      "id": "unique-id",
      "name": "Capability Name",
      "description": "What this capability does",
      "riskLevel": "low" | "medium" | "high",
      "detectedIn": ["file paths where detected"]
    }
  ],
  "misuseScenarios": [
    {
      "id": "unique-id",
      "title": "Scenario Title",
      "description": "How this could be misused",
      "capabilities": ["capability-ids that enable this"],
      "severity": "medium" | "high" | "critical",
      "realWorldExample": "Optional real-world precedent",
      "mitigations": ["Suggested mitigation steps"]
    }
  ],
  "issues": [
    {
      "id": "unique-id",
      "category": "manipulation" | "dark-patterns" | "privacy" | "accessibility" | "addiction" | "misinformation" | "discrimination" | "transparency",
      "title": "Issue Title",
      "description": "What the issue is",
      "severity": "safe" | "low" | "medium" | "high" | "critical",
      "location": "file path if applicable",
      "recommendation": "How to address this"
    }
  ],
  "summary": {
    "overallStatus": "safe" | "low" | "medium" | "high" | "critical",
    "capabilityCount": number,
    "issueCount": number,
    "criticalMisuseCount": number
  }
}

Be thorough but realistic. Focus on genuine risks, not theoretical edge cases. Prioritize issues by real-world harm potential.`;

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

    const userPrompt = `Analyze this ${projectName || "web application"} codebase for ethical concerns:\n\n${filesContent}`;

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
