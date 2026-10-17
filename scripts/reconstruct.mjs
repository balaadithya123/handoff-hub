// Reconstructs src/features.js from src/features.js.gz.b64 (gzip+base64 of full 0.21 body).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'src/features.js');
const packed = join(root, 'src/features.js.gz.b64');

if (!existsSync(packed)) {
  if (existsSync(out) && readFileSync(out, 'utf8').length > 10000) {
    console.log('reconstruct: features.js already present, skip');
    process.exit(0);
  }
  console.error('reconstruct: missing src/features.js.gz.b64');
  process.exit(1);
}

const b64 = readFileSync(packed, 'utf8').trim();
const js = gunzipSync(Buffer.from(b64, 'base64')).toString('utf8');
if (!js.includes("HUB_VERSION = '0.21.0'") || !js.includes('plan_task')) {
  console.error('reconstruct: decoded content missing expected markers');
  process.exit(1);
}
writeFileSync(out, js);
console.log(`reconstruct: wrote src/features.js (${js.length} bytes) from gzip+b64`);
