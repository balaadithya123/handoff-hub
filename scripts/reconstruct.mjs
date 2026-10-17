// Reconstructs src/features.js from base64 chunks (one-time restore for large file).
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'src/features.js');
const dir = join(root, 'src');

const parts = readdirSync(dir)
  .filter(n => /^features\.b64\.\d+$/.test(n))
  .sort((a, b) => Number(a.split('.').pop()) - Number(b.split('.').pop()))
  .map(n => readFileSync(join(dir, n), 'utf8').trim());

if (!parts.length) {
  if (!existsSync(out) || readFileSync(out, 'utf8').length < 10000) {
    console.error('reconstruct: no features.b64.* chunks and features.js missing/incomplete');
    process.exit(1);
  }
  console.log('reconstruct: features.js already present, skip');
  process.exit(0);
}

const b64 = parts.join('');
const js = Buffer.from(b64, 'base64').toString('utf8');
if (!js.includes("HUB_VERSION = '0.21.0'") || !js.includes('plan_task')) {
  console.error('reconstruct: decoded content missing expected markers');
  process.exit(1);
}
writeFileSync(out, js);
console.log(`reconstruct: wrote src/features.js (${js.length} bytes) from ${parts.length} chunks`);
