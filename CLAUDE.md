# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Ground Floor Ethiscanner** — an AI-powered scanner for **misuse-by-design**: product features that can harm people even when working exactly as intended. It is deliberately *not* a security scanner, bug finder, linter, or compliance checker. The core question every finding answers: "If this feature works exactly as designed, who could it hurt?"

## Commands

```sh
npm i              # install (bun also works — bun.lock and bun.lockb are committed)
npm run dev        # Vite dev server on port 8080
npm run build      # production build (build:dev for development-mode build)
npm run lint       # eslint
npm run test       # vitest run (one-shot)
npm run test:watch # vitest watch mode
npx vitest run src/test/example.test.ts   # run a single test file
```

Tests run under vitest + jsdom; setup is `src/test/setup.ts`, includes `src/**/*.{test,spec}.{ts,tsx}`. The `@` alias maps to `src/` in both Vite and Vitest.

## Stack reality vs. README

The `README.md` is a product PRD and is **out of date on two technical points** — trust the code, not the README:
- **AI model**: the `analyze-code` edge function calls the **Anthropic API directly** (`claude-sonnet-4-5`, streaming), not Gemini/Lovable Cloud. Requires the `ANTHROPIC_API_KEY` secret in the Supabase edge environment.
- **Harm categories**: there are **8**, not 6. The README omits `restrictive-masculinity` and `environmental-impact`. The full list lives in `HarmCategory` (`src/types/ethics.ts`) and `CATEGORY_LABELS` (`src/hooks/useCodeAnalysis.ts`), and must stay in sync with the category enum in the edge-function prompt.

Frontend: React 18 + Vite + TypeScript + Tailwind + shadcn/ui (Radix primitives under `src/components/ui/`). Backend: Supabase (Postgres + Deno edge functions).

## Architecture

### The scan pipeline (the part worth understanding)

The AI edge function is intentionally *thin and bounded*; the client hook does the heavy enrichment. Understanding this split is essential before touching either side.

1. **`src/hooks/useCodeAnalysis.ts`** — the orchestrator. `analyzeCode()` invokes the edge function, then transforms the raw AI JSON into two parallel result shapes and derives all V2 enrichments **deterministically from the actual uploaded files** (not from the AI). This is the single most important file.

2. **`supabase/functions/analyze-code/index.ts`** — the Deno edge function. It:
   - Bounds the input (`MAX_PROMPT_FILES`, `MAX_CHARS_PER_FILE`, `MAX_TOTAL_FILE_CHARS`) so large repos can't force the model to truncate mid-JSON.
   - **Runs chunked analysis** (`CHUNKED_ANALYSIS`, on by default): one focused pass per harm-category group (`CATEGORY_GROUPS` in `_shared/mergeAnalyses.ts`), each bounded to a small per-pass output ("OUTPUT SIZE LIMITS" in the prompt) so no single response truncates mid-JSON. Passes are merged by `mergeAnalyses` (deduped, severity-ranked, capped ~8 issues). Set `ANALYSIS_CHUNKED=false` to fall back to a single capped pass. The per-pass cap is a reliability guard, not a product limit.
   - Detects the app's vertical category (`detectAppCategory` from `_shared/categoryDetector.ts`) and injects a matching **vertical risk profile** (`getVerticalProfilePrompt` from `_shared/verticalProfiles.ts`) plus quiz-derived population modifiers into the prompt.
   - Streams the Anthropic SSE response, extracts the JSON (`extractJsonObject` — a brace-matching parser tolerant of markdown fences/trailing prose), and on truncation **retries with a stricter shorter-output prompt**, then falls back to a deterministic keyword scan (`buildFallbackAnalysis`) if that also fails.
   - The giant `ANALYSIS_PROMPT` system string is the product's actual behavior spec — it defines every harm category, the two-pass mitigation-verification protocol, and anti-hallucination rules. Editing detection behavior means editing this prompt.

3. **`supabase/functions/fetch-github-repo/index.ts`** — fetches a public repo's tree via GitHub API, priority-scores files (`src/`, `app/`, `lib/`, etc. rank higher), drops tests/docs/configs/lockfiles first, returns a bounded selection. Used for GitHub import and fork comparison.

### Two-tier type system (V1 / V2)

`analyzeCode` returns **both** `result` (`EthicsReviewResult`, `src/types/ethics.ts`) and `resultV2` (`EthicsReviewResultV2`, `src/types/ethicsV2.ts`). V1 is the backwards-compatible shape; V2 adds confidence, remediation impact, deployment context, risk chains, and version comparison. When adding a field, decide which tier it belongs to — most new UI reads V2. The AI response uses the V2 schema; V1 is derived from it.

### Client-side enrichment services (`src/services/`)

These run **after** the AI responds and derive structured data from the real files/issues — they are pure/deterministic, not AI calls:
- `deploymentDetector.ts` — infers deployment context (vulnerable population, auth presence, etc.) → feeds GFS modifiers.
- `riskChainAnalyzer.ts` — combines detected capabilities into emergent "risk chains" (e.g. identity + location = stalking pipeline).
- `confidenceScoring.ts` — computes issue/scenario confidence when the AI didn't provide it.
- `remediationImpact.ts` — projected score reduction, time-to-fix, ripple effects per issue.
- `versionComparator.ts` — diffs against the previous scan (see persistence below).
- `gfsCalculator.ts` — the **Ground Floor Score** (0–100 composite): `riskScore×10` + deployment modifiers − resolved-issue credit, plus an *Adjusted GFS* that discounts `won't-fix`/`accepted-risk` triaged issues.
- `defensiveUseAnalyzer.ts`, `categoryDetector.ts`, `summaryGenerator.ts`.

Pattern to preserve: the AI value is used if present, otherwise the service computes a fallback (`aiConfidence || calculateIssueConfidence(issue)`). Keep this "AI-first, deterministic-fallback" convention.

### Persistence — two separate stores, don't confuse them

- **`localStorage`** (`ethical-review-history`, last 30 scans) — client-only history that powers **version comparison**. Also holds onboarding completion (`gfc_onboarding_complete`) and quiz answers.
- **Supabase `scan_reports` table** (`src/services/reportStorage.ts`) — persists a full report keyed by UUID for **shareable `/report/:id` links**. `finding_feedback` stores per-issue thumbs up/down. Both tables are anon-readable/insertable (RLS allows public access — these are anonymous, unauthenticated scans). Schema: `supabase/migrations/`.

### Routing & UI state

- Routes in `src/App.tsx`; `Index.tsx` is a single-page state machine (`onboarding → upload → scanning → results → publish-gate`).
- **`ModeContext`** toggles Dev (monospace, technical labels) vs. Vibe (plain-language) presentation across all issue cards/badges — this affects labels throughout, not just one component.
- **`IssueStatusContext`** holds per-issue triage status (`unreviewed`/`acknowledged`/`fixed`/`won't-fix`/`accepted-risk`), which feeds the Adjusted GFS.
- Ethics-specific UI lives in `src/components/ethics/`; generic shadcn primitives in `src/components/ui/`.

## Editing the two edge functions

They are Deno, deployed to Supabase separately from the frontend build (`supabase/config.toml` — both have `verify_jwt = false`). They import from URLs (`https://deno.land/...`), use `Deno.env.get(...)` for secrets, and are **not** part of the Vite build or the `@`-alias world. Category-detection signals and vertical profiles are **canonical in `supabase/functions/_shared/`** (`categoryDetector.ts`, `verticalProfiles.ts`), imported by both edge functions; the frontend copies in `src/services/categoryDetector.ts` and `src/data/verticalProfiles.ts` are mirrors kept in lockstep by `src/test/profileParity.test.ts` (it fails if they drift). Edit the `_shared` canonical and update the mirror.
