// Reconstructs src/features.js from src/features.js.gz.b64.0 + .1 (gzip+base64 split).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'src/features.js');
const p0 = join(root, 'src/features.js.gz.b64.0');
const p1 = join(root, 'src/features.js.gz.b64.1');
const single = join(root, 'src/features.js.gz.b64');

let b64;
if (existsSync(p0) && existsSync(p1)) {
  b64 = readFileSync(p0, 'utf8').trim() + readFileSync(p1, 'utf8').trim();
} else if (existsSync(single)) {
  b64 = readFileSync(single, 'utf8').trim();
} else if (existsSync(out) && readFileSync(out, 'utf8').length > 10000) {
  console.log('reconstruct: features.js already present, skip');
  process.exit(0);
} else {
  console.error('reconstruct: missing packed features');
  process.exit(1);
}

const js = gunzipSync(Buffer.from(b64, 'base64')).toString('utf8');
if (!js.includes("HUB_VERSION = '0.21.0'") || !js.includes('plan_task')) {
  console.error('reconstruct: decoded content missing expected markers');
  process.exit(1);
}
writeFileSync(out, js);
console.log(`reconstruct: wrote src/features.js (${js.length} bytes)`);
