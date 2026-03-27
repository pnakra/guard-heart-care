# Ground Floor Check — Product Requirements Document

**Ground Floor Check** is an AI-powered ethical code scanner that analyzes source code for *misuse-by-design* patterns — features that can harm people even when working exactly as intended. It helps product teams, independent developers, and social-impact reviewers ship responsibly.

> **Live:** [ground-floor-scan.lovable.app](https://ground-floor-scan.lovable.app)

---

## Table of Contents

1. [Core Concept](#core-concept)
2. [User Personas](#user-personas)
3. [Scan Setup & Input Methods](#scan-setup--input-methods)
4. [Quick Context Quiz](#quick-context-quiz)
5. [Scanning & AI Analysis](#scanning--ai-analysis)
6. [Results Dashboard](#results-dashboard)
7. [Ground Floor Score (GFS)](#ground-floor-score-gfs)
8. [Harm Categories (Taxonomy)](#harm-categories-taxonomy)
9. [Issue Cards & Triage](#issue-cards--triage)
10. [Misuse Scenarios & Risk Chains](#misuse-scenarios--risk-chains)
11. [Confidence Scoring](#confidence-scoring)
12. [Sorting & Filtering](#sorting--filtering)
13. [Dual-Mode Interface (Dev / Vibe)](#dual-mode-interface-dev--vibe)
14. [Remediation & Fix Prompts](#remediation--fix-prompts)
15. [Fork Comparison Analysis](#fork-comparison-analysis)
16. [Vertical Profiles](#vertical-profiles)
17. [Publish Gate](#publish-gate)
18. [Report Export](#report-export)
19. [Onboarding Flow](#onboarding-flow)
20. [Tech Stack](#tech-stack)
21. [Supported Languages](#supported-languages)

---

## Core Concept

Ground Floor Check focuses exclusively on **misuse-by-design** — it does *not* report generic security bugs, linting violations, or encryption gaps unless they directly facilitate human misuse scenarios. The question it answers is: *"If this feature works exactly as designed, who could it hurt?"*

---

## User Personas

| Persona | Need |
|---------|------|
| **Solo developer / vibe coder** | Quick, plain-language ethical gut-check before shipping |
| **Product team** | Structured ethical review with exportable reports for compliance |
| **Social impact reviewer** | Non-technical taxonomy to assess whether an app's design could harm vulnerable populations |
| **Lawyer / policy specialist** | Documentation of harm categories and severity definitions for regulatory review |

---

## Scan Setup & Input Methods

### File Upload
Drag-and-drop local source files or select a folder. Supports filtering by extension (`.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.go`, `.rs`, `.java`, `.kt`, `.swift`, `.c`, `.cpp`, `.php`, `.dart`, `.vue`, `.svelte`, `.html`, `.css`, `.json`, `.md`, `.yaml`). Max 500 KB per file.

### GitHub Import
Paste a public GitHub repository URL. The backend:
1. Fetches the repo's file tree via GitHub API
2. Applies priority scoring — `src/`, `app/`, `lib/`, `components/`, `pages/` directories rank higher
3. Selects up to **50 files** totalling ~800 KB
4. Drops tests, docs, configs, lockfiles, and `.d.ts` declarations first

### Fork Comparison
Provide both an upstream and fork GitHub URL. The tool fetches both, diffs them, and classifies each finding as:
- **Inherited** — issue exists in upstream
- **Introduced** — issue is new in the fork
- **Remediated** — issue was present upstream but fixed in the fork

---

## Quick Context Quiz

A 7-question yes/no quiz appears below the file upload area. Each answer tunes the scan:

| # | Question | Effect |
|---|----------|--------|
| 1 | Could minors (under 18) use this app? | Adds `minors` population modifier |
| 2 | Does the app involve location data? | Elevates `surveillance` category |
| 3 | Does it connect users with each other? | Elevates `manipulation` + `surveillance` |
| 4 | Does it involve health, mental health, or body data? | Elevates `false-authority` + `ai-hallucination`; adds `mental-health` modifier; activates health vertical |
| 5 | Does it involve money, credit, or financial decisions? | Elevates `dark-patterns`; adds `financially-vulnerable` modifier; activates fintech vertical |
| 6 | Could users be in domestic abuse or coercive control situations? | Elevates `surveillance`; adds `domestic-abuse` modifier |
| 7 | Are elderly users a primary audience? | Adds `elderly` modifier |

A **scan config summary** line shows the resulting elevated categories and active population modifiers before the user clicks "Analyze."

Quiz answers persist in `sessionStorage` across scans.

---

## Scanning & AI Analysis

After setup, the code is sent to a backend function that:
1. Detects the app's **vertical category** (fitness, dating, fintech, health, productivity, social, B2B, gaming)
2. Applies **vertical-specific harm patterns** from the matching profile
3. Merges quiz-derived elevations and population modifiers into the prompt
4. Sends the full context + code to **Gemini 2.5 Flash** for analysis
5. Returns structured findings: issues, capabilities, misuse scenarios, executive summary, and deployment context

A scanning animation with progress steps is shown during analysis.

---

## Results Dashboard

The main results view includes:
- **Executive Summary** — top 3 risks with severity and effort-to-fix
- **Ground Floor Score (GFS)** — composite risk metric (0–100)
- **Overall Status** — safe / low / medium / high / critical
- **Category Cards** — one per harm category with issue count and highest severity
- **Issues List** — sortable, filterable detailed findings
- **Misuse Scenarios** — emergent risk chains from capability combinations
- **File Tree Sidebar** — browse issues by source file location

---

## Ground Floor Score (GFS)

A composite 0–100 metric calculated as:

1. **Base** = `riskScore × 10` (from AI analysis)
2. **+ Deployment modifiers** — vulnerable population, sensitive content, lack of auth (each a multiplier, e.g., 1.3 → +3 points)
3. **− Resolved credit** — 2 points per resolved issue from version comparison (max 10)
4. **Clamped** to [0, 100]

### Adjusted GFS
When issues are triaged as `won't-fix` or `accepted-risk`, the Adjusted GFS reduces proportionally (50% weight per excluded issue). This lets teams acknowledge known risks without them dominating the headline score.

### Severity Bands
| Score | Band | Color |
|-------|------|-------|
| 0–30 | LOW | Green |
| 31–60 | MODERATE | Yellow |
| 61–85 | HIGH | Orange |
| 86–100 | CRITICAL | Red |

---

## Harm Categories (Taxonomy)

Six categories of misuse-by-design. Full reference at `/taxonomy`.

| Category | Description |
|----------|-------------|
| **False Authority** | AI or UI positioned as moral, legal, or medical authority it cannot hold |
| **Manipulation & Coercion** | Features that help pressure, deceive, or override another person's boundaries |
| **Surveillance & Abuse Dynamics** | Tracking/monitoring features weaponizable in power-imbalanced relationships |
| **Administrative Power Misuse** | Admin capabilities usable to harm, surveil, or punish governed users |
| **AI Hallucination as Expertise** | AI output framed as professional judgment in harm-sensitive domains |
| **Dark Patterns & Coercive UX** | UX that manipulates users into unintended actions through deception or friction asymmetry |

See [TAXONOMY.md](./TAXONOMY.md) for the full non-technical reference.

---

## Issue Cards & Triage

Each finding is an **Issue Card** containing:
- **Title** and **description**
- **Severity** badge (safe → critical)
- **Harm category** tag
- **File location** (monospace)
- **Misuse scenario** — how the feature could be weaponized
- **Why misuse-by-design** — why the harm is a design choice, not a bug
- **Mitigation** — concrete fix suggestion
- **Mitigation type** — `ui-language`, `interaction-model`, `feature-removal`, or `reframing`
- **Code diff** — suggested code changes with before/after
- **Confidence scores** — detection, misuse, severity, and overall confidence
- **Population tags** — which vulnerable populations are affected
- **Fork classification** — inherited / introduced / remediated (fork mode only)

### Triage Statuses
Issues can be marked as: `unreviewed`, `acknowledged`, `in-progress`, `fixed`, `won't-fix`, `accepted-risk`. Statuses affect the Adjusted GFS.

### Copy Fix Prompt
Each card has a **"Copy fix prompt"** button that copies a Lovable-compatible remediation prompt to clipboard, formatted with the issue location, description, mitigation details, and a constraint to not change other functionality.

---

## Misuse Scenarios & Risk Chains

The scanner identifies **capabilities** (e.g., identity collection, geolocation, content generation) and detects **risk chains** — emergent hazards where individually benign features combine into dangerous affordances.

Example: `identity` + `location` + `real-time data` = **stalking pipeline** (requires fixing all involved capabilities).

Each scenario includes likelihood, impact, and affected populations.

---

## Confidence Scoring

Every issue and scenario has calibrated confidence metrics:

- **Detection confidence** — how certain the scanner is that the pattern exists (0–1)
- **Misuse confidence** — how documented the misuse precedent is
- **Severity confidence** — based on affected population vulnerability
- **Overall confidence** — composite

Factors: explicit code match (0.95), API inference (0.80), keyword match (0.65), heuristic (0.50).

---

## Sorting & Filtering

The issues list supports four sort modes:

| Sort | Behavior |
|------|----------|
| **Severity** (default for returning users) | Highest severity first |
| **Effort to Fix** (default for first-time users) | Lowest effort first — shows "quick wins" with a green banner |
| **Confidence** | Highest confidence first |
| **Category** | Grouped by harm category |

Effort ranking maps `mitigationType` to numeric rank: `ui-language` = 1 (easiest), `reframing` = 2, `interaction-model` = 3, `feature-removal` = 4.

---

## Dual-Mode Interface (Dev / Vibe)

A pill toggle switches between two presentation modes:

| Mode | Typography | Severity labels | Category labels | Audience |
|------|-----------|----------------|----------------|----------|
| **Dev** | Monospace, technical | `CRITICAL`, `HIGH`, etc. | `false-authority`, `surveillance` | Developers |
| **Vibe** | Sans-serif, plain language | `Fix immediately`, `Fix before launch` | `Fake Expert Claims`, `Tracking & Monitoring` | Non-technical users |

The mode toggle affects all issue cards, category headers, and severity badges throughout the interface.

---

## Remediation & Fix Prompts

Each issue includes:
- **Mitigation summary** — plain-language fix description
- **Mitigation type** — categorized approach
- **Code changes** — file path, action, before/after code, unified diff
- **Remediation impact** — projected score reduction, time-to-fix breakdown (design/implementation/testing), dependencies, ripple effects

---

## Fork Comparison Analysis

When scanning a fork against its upstream:
- Issues are classified as **inherited**, **introduced**, or **remediated**
- A fork summary shows counts for each classification
- A dedicated **Fork Analysis** tab visualizes the diff
- The fork badge shows the classification on each issue card

---

## Vertical Profiles

Eight industry vertical profiles apply domain-specific harm patterns:

| Vertical | Elevated Categories | Key Risks |
|----------|-------------------|-----------|
| **Fitness** | AI hallucination, manipulation | Body image distortion, calorie restriction encouragement |
| **Dating** | Surveillance, manipulation | Stalking via location, boundary bypass features |
| **Fintech** | Manipulation, false authority | Dark patterns in cancellation, AI financial advice |
| **Health** | False authority, AI hallucination | AI diagnoses, crisis detection without protocols |
| **Productivity** | Surveillance, admin abuse | Employee monitoring, productivity scoring |
| **Social** | Manipulation, surveillance | Algorithmic amplification, harassment infrastructure |
| **B2B** | Admin abuse | Silent content editing, user impersonation |
| **Gaming** | Manipulation, AI hallucination | Loot boxes, FOMO mechanics, child spending |

---

## Publish Gate

Before approving a project for release, the **Publish Gate** modal requires:
1. Review of all critical and high-severity issues
2. Review of active misuse scenarios
3. Explicit acknowledgment of each risk
4. Final confirmation

---

## Report Export

Reports can be exported as:
- **PDF** — formatted document with executive summary, all findings, and mitigations
- **Markdown** — structured text for embedding in documentation or PRs

Both formats include severity badges, misuse scenarios, code changes, and the GFS.

---

## Onboarding Flow

First-time users see a guided onboarding explaining:
1. What Ground Floor Check does (misuse-by-design, not security bugs)
2. The six harm categories
3. How to interpret results
4. How to use the publish gate

Completion is stored in `localStorage`. Users can replay via "Show intro again" link.

---

## Advanced: Custom Rules

Power users can configure scan rules via a JSON editor:
- **disabledCategories** — skip specific harm categories
- **elevatedCategories** — increase scrutiny for specific categories
- **customPatterns** — up to 20 custom patterns with name, description, category, and severity

Validation is real-time with inline error display.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Lovable Cloud (edge functions) |
| AI Model | Gemini 2.5 Flash |
| PDF Export | jsPDF |
| Animations | Framer Motion |

---

## Supported Languages

TypeScript, JavaScript, Python, Go, Rust, Java, Kotlin, Swift, C/C++, PHP, Dart, Ruby, Vue, Svelte, HTML, CSS, SCSS, JSON, YAML, Markdown.

---

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```
