#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const manifestPath = path.join(cwd, '.next', 'build-manifest.json');
const chunksDir = path.join(cwd, '.next', 'static', 'chunks');
const jsonMode = process.argv.includes('--json');

if (!fs.existsSync(manifestPath)) {
  console.error(`Missing build manifest: ${manifestPath}`);
  console.error('Run `pnpm build` before measuring entry JS.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const rootMainFiles = Array.isArray(manifest.rootMainFiles) ? manifest.rootMainFiles : [];

const rootEntries = rootMainFiles.map((relativeFile) => {
  const absoluteFile = path.join(cwd, '.next', relativeFile);
  const bytes = fs.existsSync(absoluteFile) ? fs.statSync(absoluteFile).size : 0;
  return {
    file: relativeFile,
    bytes,
  };
});

const totalRootBytes = rootEntries.reduce((sum, entry) => sum + entry.bytes, 0);

let totalChunkBytes = 0;
if (fs.existsSync(chunksDir)) {
  const chunkFiles = fs.readdirSync(chunksDir).filter((file) => file.endsWith('.js'));
  totalChunkBytes = chunkFiles.reduce((sum, file) => {
    const absoluteFile = path.join(chunksDir, file);
    return sum + fs.statSync(absoluteFile).size;
  }, 0);
}

const result = {
  measuredAt: new Date().toISOString(),
  rootMainFiles: rootEntries,
  totalRootMainBytes: totalRootBytes,
  totalStaticChunkJsBytes: totalChunkBytes,
};

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

console.log('Entry JS measurement');
console.log(`Measured at: ${result.measuredAt}`);
console.log('');
console.table(rootEntries);
console.log(`Root main total bytes: ${totalRootBytes}`);
console.log(`Total static chunk JS bytes: ${totalChunkBytes}`);
