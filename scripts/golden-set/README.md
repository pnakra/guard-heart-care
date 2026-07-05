# Golden-set scanner smoke test

Runs a few tiny fixture "repos" through the **deployed** `analyze-code` edge
function and checks that the expected harm categories surface (and that the
known-clean fixture stays clean). Use it to sanity-check prompt, vertical-profile,
or model changes against known-good/known-bad inputs.

**This costs Anthropic API calls**, so it is deliberately separate from
`npm test` and never runs in CI.

## Run

```sh
# Export the frontend env vars the runner needs (same values the app uses):
set -a; source .env; set +a
node scripts/golden-set/run.mjs
```

Needs `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and — if the access
token is configured on the edge function — `VITE_SCAN_ACCESS_TOKEN`.

Exit code is non-zero if any fixture fails, so it can gate a manual release check.

## Fixtures

Each subfolder of `fixtures/` is one "repo": one or more source files plus an
`expect.json`:

```json
{ "categories": ["surveillance"], "clean": false }
```

- `categories` — harm-category slugs that MUST appear in the findings (known-bad).
- `clean: true` — expects zero findings or a risk score below 3 (known-clean).

Current set: `surveillance-stalking`, `dark-patterns-billing`,
`restrictive-masculinity-coach` (known-bad), and `clean-unit-converter`
(known-clean). Add more by dropping in a new folder with source files and an
`expect.json`.
