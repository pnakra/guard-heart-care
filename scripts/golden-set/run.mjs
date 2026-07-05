#!/usr/bin/env node
// Golden-set smoke test for the analyze-code scanner. Runs a handful of tiny
// fixture "repos" (known-bad and known-clean) through the DEPLOYED edge function
// and checks whether the expected harm categories surface. This COSTS Anthropic
// API calls, so it is intentionally NOT part of `npm test` — run it by hand
// after prompt/profile changes:
//
//   node scripts/golden-set/run.mjs
//
// Requires (read from the environment, e.g. your .env exported into the shell):
//   VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, and — if configured —
//   VITE_SCAN_ACCESS_TOKEN.

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(HERE, 'fixtures');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const ACCESS_TOKEN = process.env.VITE_SCAN_ACCESS_TOKEN;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in the environment.');
  console.error('Export them (e.g. `set -a; source .env; set +a`) and re-run.');
  process.exit(2);
}

// Each fixture is a folder under fixtures/ with an `expect.json`
// ({ "categories": [...], "clean": bool }) plus one or more source files.
function loadFixtures() {
  return readdirSync(FIXTURES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const dir = join(FIXTURES_DIR, d.name);
      const entries = readdirSync(dir).filter((f) => f !== 'expect.json');
      const files = entries.map((name) => ({ name, content: readFileSync(join(dir, name), 'utf8') }));
      const expect = JSON.parse(readFileSync(join(dir, 'expect.json'), 'utf8'));
      return { name: d.name, files, expect };
    });
}

function parseResponse(text) {
  // The function streams keep-alive spaces then a single JSON object.
  const start = text.indexOf('{');
  if (start === -1) throw new Error('no JSON in response');
  return JSON.parse(text.slice(start));
}

async function scan(files, projectName) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/analyze-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      ...(ACCESS_TOKEN ? { 'x-ethiscan-token': ACCESS_TOKEN } : {}),
    },
    body: JSON.stringify({ files, projectName }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  const data = parseResponse(text);
  if (data.error) throw new Error(data.error);
  return data.analysis ?? {};
}

async function main() {
  const fixtures = loadFixtures();
  let failures = 0;

  for (const fixture of fixtures) {
    process.stdout.write(`\n▶ ${fixture.name} ... `);
    let analysis;
    try {
      analysis = await scan(fixture.files, fixture.name);
    } catch (err) {
      console.log(`ERROR (${err.message})`);
      failures++;
      continue;
    }

    const issues = Array.isArray(analysis.issues) ? analysis.issues : [];
    const foundCategories = [...new Set(issues.map((i) => i.category))];
    const riskScore = analysis.executiveSummary?.riskScore ?? 0;

    if (fixture.expect.clean) {
      const ok = issues.length === 0 || riskScore < 3;
      console.log(ok ? 'PASS (clean)' : `FAIL — expected clean, got ${issues.length} issues (risk ${riskScore})`);
      console.log(`    categories: [${foundCategories.join(', ') || 'none'}]`);
      if (!ok) failures++;
    } else {
      const expected = fixture.expect.categories ?? [];
      const missing = expected.filter((c) => !foundCategories.includes(c));
      const ok = missing.length === 0;
      console.log(ok ? 'PASS' : `FAIL — missing ${missing.join(', ')}`);
      console.log(`    expected: [${expected.join(', ')}]  found: [${foundCategories.join(', ') || 'none'}]  risk ${riskScore}`);
      if (!ok) failures++;
    }
  }

  console.log(`\n${failures === 0 ? '✓ all fixtures passed' : `✗ ${failures} fixture(s) failed`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
