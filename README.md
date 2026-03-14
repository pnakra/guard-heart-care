# Ground Floor Check — AI-Powered Ethical Code Scanner

Ground Floor Check analyzes source code for ethical risks, misuse-by-design patterns, and harmful capabilities — helping teams ship responsibly.

## What It Does

- **Upload or import code** — Drag-and-drop local files or fetch a public GitHub repository
- **AI-powered ethical analysis** — Scans for issues across five harm categories: false authority, manipulation, surveillance, admin abuse, and AI hallucination
- **Risk scoring & severity levels** — Each issue is rated (safe → critical) with an overall project risk score
- **Misuse scenario detection** — Identifies how features could be weaponized and suggests mitigations
- **Capability detection** — Flags risky capabilities like data collection, authentication bypass, and content generation
- **Actionable remediation** — Provides concrete code, design, and content changes with effort estimates
- **Publish gate** — Review and acknowledge all ethical issues before approving a project for release
- **Export reports** — Download findings for compliance and team review

## Supported Languages

TypeScript, JavaScript, Python, Go, Rust, Java, Kotlin, Swift, C/C++, PHP, Dart, Ruby, Vue, Svelte, and more.

## How the GitHub Import Works

When you paste a public GitHub repository URL, the tool fetches the repo's file tree and applies a smart selection process:

1. **File filtering** — Excludes non-source files like lockfiles, images, minified code, test fixtures, `.d.ts` declarations, and `node_modules`.
2. **Priority scoring** — Files in core application directories (`src/`, `app/`, `lib/`, `components/`, `pages/`) are ranked higher than root-level or config files.
3. **Extension weighting** — Source code files (`.tsx`, `.ts`, `.jsx`, `.js`, `.py`, etc.) are prioritized over configuration or styling files (`.json`, `.css`, `.yaml`).
4. **Size limits** — The scanner selects **up to 50 files** totalling approximately **800 KB** of content. If a repo exceeds this, only the highest-priority files are included.
5. **Large repos** — For repositories with hundreds or thousands of files, the tool still produces useful results by focusing on the most relevant application code. Peripheral files (tests, docs, configs) are dropped first.

> **Tip:** For the most thorough scan of a large project, upload specific source directories manually rather than importing the full repo.

## How It Works

1. **Upload** source files or paste a GitHub URL
2. **Scan** — the backend fetches and analyzes relevant source files using AI
3. **Review** — browse issues by category, severity, and misuse potential
4. **Remediate** — follow suggested fixes with code diffs and design changes
5. **Approve** — use the publish gate to formally acknowledge risks before shipping

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Lovable Cloud (edge functions for code analysis and GitHub integration)
- **AI:** Gemini 2.5 Flash for ethical analysis

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```
