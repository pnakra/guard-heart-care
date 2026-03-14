# GuardHeart — AI-Powered Ethical Code Scanner

GuardHeart analyzes source code for ethical risks, misuse-by-design patterns, and harmful capabilities — helping teams ship responsibly.

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

## How It Works

1. **Upload** source files or paste a GitHub URL
2. **Scan** — the backend fetches and analyzes relevant source files using AI
3. **Review** — browse issues by category, severity, and misuse potential
4. **Remediate** — follow suggested fixes with code diffs and design changes
5. **Approve** — use the publish gate to formally acknowledge risks before shipping
