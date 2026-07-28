#!/usr/bin/env node
/**
 * Fails if anything in core/ imports UI or platform code.
 *
 * core/ is the data model and rule engine. Keeping it free of React, React
 * Native, Skia and Supabase is what lets it run in a Vitest process with no
 * simulator, ship to iOS unchanged, and execute server-side for the Phase 2
 * report. That property is invisible in review and easy to lose to one
 * convenient import, so it is checked mechanically rather than trusted.
 *
 * Run: node tools/check-core-purity.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const CORE_DIR = new URL('../core/', import.meta.url).pathname;

/** Import specifiers core/ may never reach for, matched on the package root. */
const BANNED = [
  'react',
  'react-dom',
  'react-native',
  'react-native-web',
  'react-native-gesture-handler',
  'react-native-reanimated',
  'expo',
  'expo-router',
  'nativewind',
  '@shopify/react-native-skia',
  '@supabase/supabase-js',
  // The app's state container (REQ-009). core/ is called by the store, never the
  // other way round, or the rule engine stops being usable without one.
  'zustand',
];

/** Allowed despite matching a banned prefix — test tooling only. */
const ALLOWED = ['vitest'];

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s*['"]([^'"]+)['"]/g;
const BARE_IMPORT_RE = /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;
const REQUIRE_RE = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) out.push(full);
  }
  return out;
}

/** The package root of a specifier: `@scope/pkg/sub` → `@scope/pkg`. */
function packageRoot(specifier) {
  if (specifier.startsWith('.') || specifier.startsWith('/')) return null;
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

const violations = [];

for (const file of walk(CORE_DIR)) {
  const source = readFileSync(file, 'utf8');
  const specifiers = new Set();
  for (const re of [IMPORT_RE, BARE_IMPORT_RE, REQUIRE_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(source)) !== null) specifiers.add(m[1]);
  }

  for (const specifier of specifiers) {
    const root = packageRoot(specifier);
    if (!root || ALLOWED.includes(root)) continue;
    if (BANNED.includes(root)) {
      violations.push(`${relative(process.cwd(), file)} imports "${specifier}"`);
    }
  }
}

if (violations.length > 0) {
  console.error('core/ must stay free of UI and platform imports. Found:\n');
  for (const v of violations) console.error(`  ${v}`);
  console.error(
    '\ncore/ is the portable half of this app: pure TypeScript, testable without a\n' +
      'simulator, reusable on iOS and server-side. Move the offending code to lib/\n' +
      'or components/, or invert the dependency so core/ is called rather than calling.',
  );
  process.exit(1);
}

console.log(`core purity: OK (${walk(CORE_DIR).length} files, no UI or platform imports)`);
