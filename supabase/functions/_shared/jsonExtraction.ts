// Robust extraction of a single JSON object from an LLM response that may wrap
// it in markdown fences, prepend/append prose, include trailing commas, or be
// truncated mid-object. Pure (no Deno/browser APIs) so it is unit-testable from
// Vitest — see src/test/jsonExtraction.test.ts.

const BOM = 0xfeff;

/**
 * Drop the C0 control characters JSON.parse would choke on, while preserving the
 * whitespace it allows: tab (0x09), newline (0x0A), carriage return (0x0D).
 */
function stripControlChars(input: string): string {
  let out = "";
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code > 0x1f || code === 0x09 || code === 0x0a || code === 0x0d) {
      out += input[i];
    }
  }
  return out;
}

/**
 * Pulls the first complete top-level JSON object out of `raw` and parses it.
 * Strips a UTF-8 BOM and ```json fences, brace-matches (ignoring braces inside
 * strings), removes stray control characters, and tolerates trailing commas.
 * Throws if no object is present or the object never closes (truncation).
 */
export function extractJsonObject(raw: string): unknown {
  let cleaned = raw;
  if (cleaned.charCodeAt(0) === BOM) cleaned = cleaned.slice(1);
  cleaned = cleaned
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

  const jsonText = stripControlChars(cleaned.slice(0, endIndex + 1)).replace(
    /,\s*([}\]])/g,
    "$1",
  );

  return JSON.parse(jsonText);
}

/**
 * Heuristic: does `raw` look like a truncated JSON payload? True when brace
 * depth never returns to zero, or the text ends with an ellipsis / [truncated]
 * marker. Used to decide whether to retry the model with a shorter-output ask.
 */
export function isLikelyTruncated(raw: string): boolean {
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
