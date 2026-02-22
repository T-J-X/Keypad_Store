#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const layoutPath = path.join(process.cwd(), 'app', 'layout.tsx');

if (!fs.existsSync(layoutPath)) {
  console.error(`Unable to find layout file: ${layoutPath}`);
  process.exit(1);
}

const source = fs.readFileSync(layoutPath, 'utf8');
const importLines = source
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.startsWith('import '));

const failures = [];

if (/^\s*['"]use client['"]\s*;?/m.test(source)) {
  failures.push('`app/layout.tsx` must remain a server component (no `"use client"`).');
}

const forbiddenImportMatchers = [
  'CookieBanner',
  'ConsentAwareAnalytics',
  'GlobalToastViewport',
  '@vercel/analytics',
  '@vercel/speed-insights',
];

for (const matcher of forbiddenImportMatchers) {
  const matchedLine = importLines.find((line) => line.includes(matcher));
  if (matchedLine) {
    failures.push(`Forbidden direct import in layout: ${matchedLine}`);
  }
}

if (failures.length > 0) {
  console.error('Global client guardrail failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Global client guardrail passed.');
