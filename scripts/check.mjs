// Pre-deploy contract check. Dependency-free, no network, no env needed.
// Run: npm run check   (fails with exit code 1 on any problem)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (msg) => errors.push(msg);
const rel = (p) => relative(root, p).replaceAll('\\', '/');

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : [];
  });
}

// 1. Every relative import must resolve to a real file (this catches wrong ../ depth).
const files = [...walk(join(root, 'api')), ...walk(join(root, 'src'))];
const importRe = /(?:from\s*|import\s*\(\s*|import\s+)['"](\.{1,2}\/[^'"]+)['"]/g;
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  for (const m of source.matchAll(importRe)) {
    const target = resolve(dirname(file), m[1]);
    if (!existsSync(target) || !statSync(target).isFile()) {
      fail(`${rel(file)}: import '${m[1]}' does not resolve (looked for ${rel(target)})`);
    }
  }
}

// 2. Registered MCP tools must exactly match tools.contract.json (catches silently dropped/added tools).
const serverSrc = readFileSync(join(root, 'src/server.js'), 'utf8');
const featureSrc = existsSync(join(root, 'src/features.js')) ? readFileSync(join(root, 'src/features.js'), 'utf8') : '';
const registered = [...(serverSrc + '\n' + featureSrc).matchAll(/(?:server\.tool|\btool)\(\s*'([a-z0-9_]+)'/g)].map((m) => m[1]);
const dupes = registered.filter((n, i) => registered.indexOf(n) !== i);
if (dupes.length) fail(`duplicate tool registrations: ${[...new Set(dupes)].join(', ')}`);
const contract = JSON.parse(readFileSync(join(root, 'tools.contract.json'), 'utf8')).tools;
const missing = contract.filter((n) => !registered.includes(n));
const extra = registered.filter((n) => !contract.includes(n));
if (missing.length) fail(`tools in tools.contract.json but NOT registered in src/server.js: ${missing.join(', ')}`);
if (extra.length) fail(`tools registered in src/server.js but missing from tools.contract.json: ${extra.join(', ')} (add them on purpose)`);

// 2b. Every source file must parse. A syntax error fails the build instead of shipping a broken server.
for (const file of files) {
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (r.status !== 0) fail(`${rel(file)}: syntax error: ${(r.stderr || '').split('\n').slice(0, 3).join(' ')}`);
}

// 3. One version everywhere (features.js HUB_VERSION too).
const pkgVersion = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const mcpVersion = readFileSync(join(root, 'api/mcp.js'), 'utf8').match(/MCP_VERSION\s*=\s*'([^']+)'/)?.[1];
const srvVersion = serverSrc.match(/new McpServer\(\{[^}]*version:\s*'([^']+)'/)?.[1];
const featVersion = featureSrc.match(/HUB_VERSION\s*=\s*'([^']+)'/)?.[1];
if (!(pkgVersion === mcpVersion && mcpVersion === srvVersion && srvVersion === featVersion)) {
  fail(`version mismatch: package.json=${pkgVersion} api/mcp.js=${mcpVersion} src/server.js=${srvVersion} src/features.js=${featVersion}`);
}

if (errors.length) {
  console.error(`check FAILED (${errors.length}):\n - ${errors.join('\n - ')}`);
  process.exit(1);
}
console.log(`check ok: ${files.length} files, all relative imports resolve, ${registered.length} tools match contract, version ${pkgVersion} consistent`);
