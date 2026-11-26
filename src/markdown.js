// File -> compact Markdown, so an AI can read a stored file in chat using far fewer tokens than the raw file.
// Same idea as Microsoft's markitdown (https://github.com/microsoft/markitdown), but a small Node port with no
// dependencies: text/code, CSV/TSV, JSON, HTML, XML and Word/PowerPoint/Excel (these are zip files of XML).
// PDFs are NOT converted here (that needs a PDF engine); the portal converts them in the user's browser.
import zlib from 'node:zlib';

export const MAX_CONVERT_BYTES = 20 * 1024 * 1024;
const MAX_ENTRY_BYTES = 40 * 1024 * 1024;
const MAX_SHEET_ROWS = 2000;

const TEXT_EXT = new Set(['md', 'markdown', 'txt', 'text', 'log', 'rst', 'ini', 'cfg', 'conf', 'env', 'tex']);
const CODE_EXT = { js: 'js', mjs: 'js', cjs: 'js', ts: 'ts', tsx: 'tsx', jsx: 'jsx', py: 'python', java: 'java', c: 'c', h: 'c', cpp: 'cpp', cs: 'csharp', go: 'go', rs: 'rust', rb: 'ruby', php: 'php', sh: 'bash', sql: 'sql', css: 'css', yaml: 'yaml', yml: 'yaml', toml: 'toml', kt: 'kotlin', swift: 'swift', gradle: 'groovy' };

const ext = name => (String(name).toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';

// ---------- small helpers ----------
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '-', mdash: '-', hellip: '...', rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"' };
export function decodeEntities(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : '';
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

const tidy = md => md.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
const cell = v => String(v ?? '').replace(/\r?\n+/g, ' ').replace(/\|/g, '\\|').trim();

export function mdTable(rows) {
  const data = rows.filter(r => r.some(c => String(c ?? '').trim() !== ''));
  if (!data.length) return '';
  const width = Math.max(...data.map(r => r.length));
  const norm = data.map(r => Array.from({ length: width }, (_, i) => cell(r[i])));
  const head = norm[0];
  return [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...norm.slice(1).map(r => `| ${r.join(' | ')} |`)].join('\n');
}

// ---------- CSV / TSV ----------
export function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i += 1; } else quoted = false; }
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field); field = ''; rows.push(row); row = [];
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ---------- HTML ----------
export function htmlToMarkdown(html) {
  let s = String(html);
  s = s.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, c) => `\n\n\`\`\`\n${decodeEntities(c.replace(/<[^>]+>/g, ''))}\n\`\`\`\n\n`);
  s = s.replace(/<table[\s\S]*?<\/table>/gi, t => {
    const rows = [...t.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map(r => [...r[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(c => decodeEntities(c[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()));
    return `\n\n${mdTable(rows)}\n\n`;
  });
  for (let n = 1; n <= 6; n += 1) s = s.replace(new RegExp(`<h${n}[^>]*>([\\s\\S]*?)</h${n}>`, 'gi'), (_, c) => `\n\n${'#'.repeat(n)} ${c.replace(/<[^>]+>/g, '').trim()}\n\n`);
  s = s.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, c) => { const t = c.replace(/<[^>]+>/g, '').trim(); return t ? `[${t}](${href})` : ''; });
  s = s.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**').replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*').replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
  s = s.replace(/<li\b[^>]*>/gi, '\n- ').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|section|article|ul|ol|blockquote|tr)>/gi, '\n\n').replace(/<(p|div|section|article|ul|ol|blockquote)\b[^>]*>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  return tidy(decodeEntities(s).replace(/[ \t]{2,}/g, ' '));
}

// ---------- ZIP (Word / PowerPoint / Excel) ----------
export function openZip(buf) {
  const minEocd = 22;
  let eocd = -1;
  for (let i = buf.length - minEocd; i >= Math.max(0, buf.length - minEocd - 65535); i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a valid zip/Office file.');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  if (count === 0xffff || p === 0xffffffff) throw new Error('Zip64 files are not supported.');
  if (count > 5000) throw new Error('Too many entries in this archive.');
  const entries = new Map();
  for (let n = 0; n < count; n += 1) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Corrupt zip directory.');
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commentLen = buf.readUInt16LE(p + 32);
    entries.set(buf.toString('utf8', p + 46, p + 46 + nameLen), { method: buf.readUInt16LE(p + 10), size: buf.readUInt32LE(p + 20), offset: buf.readUInt32LE(p + 42) });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return {
    names: () => [...entries.keys()],
    has: name => entries.has(name),
    read(name) {
      const e = entries.get(name);
      if (!e) return null;
      const nameLen = buf.readUInt16LE(e.offset + 26), extraLen = buf.readUInt16LE(e.offset + 28);
      const start = e.offset + 30 + nameLen + extraLen;
      const data = buf.subarray(start, start + e.size);
      if (e.method === 0) return data;
      if (e.method === 8) return zlib.inflateRawSync(data, { maxOutputLength: MAX_ENTRY_BYTES });
      throw new Error(`Unsupported zip compression method ${e.method}.`);
    },
    text(name) { const d = this.read(name); return d ? d.toString('utf8') : null; }
  };
}

const xmlText = s => decodeEntities(s.replace(/<[^>]+>/g, ''));

export function docxToMarkdown(zip) {
  const xml = zip.text('word/document.xml');
  if (!xml) throw new Error('This .docx has no document body.');
  const out = [];
  const paragraph = p => {
    const style = (p.match(/<w:pStyle[^>]*w:val="([^"]+)"/) || [])[1] || '';
    const text = [...p.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\s*\/>|<w:br\s*\/>/g)].map(m => (m[0].startsWith('<w:tab') ? '\t' : m[0].startsWith('<w:br') ? '\n' : decodeEntities(m[1]))).join('').trim();
    if (!text) return '';
    const h = style.match(/^Heading\s*(\d)$/i);
    if (h) return `${'#'.repeat(Math.min(6, Number(h[1])))} ${text}`;
    if (/^Title$/i.test(style)) return `# ${text}`;
    if (/<w:numPr>/.test(p) || /^List/i.test(style)) return `- ${text}`;
    return text;
  };
  for (const m of xml.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>|<w:p[ >][\s\S]*?<\/w:p>/g)) {
    if (m[0].startsWith('<w:tbl>')) {
      const rows = [...m[0].matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)].map(r => [...r[0].matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map(c => [...c[0].matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map(p => paragraph(p[0])).filter(Boolean).join(' ')));
      out.push(mdTable(rows));
    } else {
      out.push(paragraph(m[0]));
    }
  }
  return tidy(out.filter(Boolean).join('\n\n').replace(/\n\n(- )/g, '\n$1'));
}

export function pptxToMarkdown(zip) {
  const slides = zip.names().map(n => ({ n, i: Number((n.match(/^ppt\/slides\/slide(\d+)\.xml$/) || [])[1]) })).filter(x => x.i).sort((a, b) => a.i - b.i);
  if (!slides.length) throw new Error('This .pptx has no slides.');
  const paras = xml => [...xml.matchAll(/<a:p>[\s\S]*?<\/a:p>|<a:p\s[\s\S]*?<\/a:p>/g)].map(p => [...p[0].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map(t => decodeEntities(t[1])).join('').trim()).filter(Boolean);
  const out = [];
  for (const { n, i } of slides) {
    const lines = paras(zip.text(n));
    const notes = zip.text(`ppt/notesSlides/notesSlide${i}.xml`);
    const noteLines = notes ? paras(notes).filter(t => !/^\d+$/.test(t)) : [];
    out.push([`## Slide ${i}`, ...lines.map((t, k) => (k === 0 ? `**${t}**` : `- ${t}`)), ...(noteLines.length ? ['', `Notes: ${noteLines.join(' ')}`] : [])].join('\n'));
  }
  return out.join('\n\n');
}

const colIndex = ref => [...ref.replace(/\d+/g, '')].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;

export function xlsxToMarkdown(zip) {
  const shared = (zip.text('xl/sharedStrings.xml') || '').split(/<si[ >]/).slice(1).map(si => xmlText([...si.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(m => m[1]).join('')));
  const wb = zip.text('xl/workbook.xml');
  if (!wb) throw new Error('This .xlsx has no workbook.');
  const rels = new Map([...(zip.text('xl/_rels/workbook.xml.rels') || '').matchAll(/<Relationship\b[^>]*>/g)].map(m => [(m[0].match(/Id="([^"]+)"/) || [])[1], (m[0].match(/Target="([^"]+)"/) || [])[1]]));
  const out = [];
  for (const sh of wb.matchAll(/<sheet\b[^>]*>/g)) {
    const name = decodeEntities((sh[0].match(/name="([^"]*)"/) || [])[1] || 'Sheet');
    const target = rels.get((sh[0].match(/r:id="([^"]+)"/) || [])[1]);
    const path = target ? (target.startsWith('/') ? target.slice(1) : `xl/${target}`) : null;
    const xml = path && zip.text(path);
    if (!xml) continue;
    const rows = [];
    let truncated = false;
    for (const r of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      if (rows.length >= MAX_SHEET_ROWS) { truncated = true; break; }
      const row = [];
      for (const c of r[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = c[1], body = c[2] || '';
        const ref = (attrs.match(/\br="([A-Z]+\d+)"/) || [])[1];
        const type = (attrs.match(/\bt="([^"]+)"/) || [])[1];
        const v = (body.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        let val = '';
        if (type === 's') val = shared[Number(v)] ?? '';
        else if (type === 'inlineStr') val = xmlText([...body.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(m => m[1]).join(''));
        else if (type === 'b') val = v === '1' ? 'TRUE' : 'FALSE';
        else val = v === undefined ? '' : decodeEntities(v);
        row[ref ? colIndex(ref) : row.length] = val;
      }
      rows.push(Array.from(row, x => x ?? ''));
    }
    const table = mdTable(rows);
    if (table) out.push(`## ${name}\n\n${table}${truncated ? `\n\n(first ${MAX_SHEET_ROWS} rows shown)` : ''}`);
  }
  if (!out.length) throw new Error('No cell data found in this workbook.');
  return out.join('\n\n');
}

// ---------- entry point ----------
export function toMarkdown({ name, contentType = '', bytes }) {
  const e = ext(name);
  const ct = String(contentType).toLowerCase();
  const asText = () => bytes.toString('utf8').replace(/^﻿/, '');
  if (e === 'pdf' || ct.includes('pdf')) return { unsupported: 'PDFs cannot be converted on the server. Open the Files page in the Axon portal, use "Convert PDF to Markdown" (it runs in your browser), and save the .md to your library; then read that file instead.' };
  if (e === 'docx') return { markdown: docxToMarkdown(openZip(bytes)), method: 'docx' };
  if (e === 'pptx') return { markdown: pptxToMarkdown(openZip(bytes)), method: 'pptx' };
  if (e === 'xlsx' || e === 'xlsm') return { markdown: xlsxToMarkdown(openZip(bytes)), method: 'xlsx' };
  if (e === 'csv' || e === 'tsv' || ct === 'text/csv') return { markdown: mdTable(parseDelimited(asText(), e === 'tsv' ? '\t' : ',')), method: 'table' };
  if (e === 'json' || ct.includes('json')) {
    const raw = asText();
    try { return { markdown: `\`\`\`json\n${JSON.stringify(JSON.parse(raw))}\n\`\`\``, method: 'json' }; } catch { return { markdown: `\`\`\`json\n${raw}\n\`\`\``, method: 'json' }; }
  }
  if (e === 'html' || e === 'htm' || ct.includes('html')) return { markdown: htmlToMarkdown(asText()), method: 'html' };
  if (e === 'xml' || ct.includes('xml')) return { markdown: `\`\`\`xml\n${asText()}\n\`\`\``, method: 'xml' };
  if (CODE_EXT[e]) return { markdown: `\`\`\`${CODE_EXT[e]}\n${asText()}\n\`\`\``, method: 'code' };
  if (TEXT_EXT.has(e) || ct.startsWith('text/')) return { markdown: asText(), method: 'text' };
  return { unsupported: `No text converter for .${e || 'this'} files (${contentType || 'unknown type'}). Supported: docx, pptx, xlsx, csv, tsv, json, html, xml, md, txt and common code files.` };
}

// Cut a long Markdown document into pages, preferring to break at a line end.
export function pageText(markdown, offset = 0, maxChars = 30000) {
  const total = markdown.length;
  const start = Math.min(Math.max(0, offset), total);
  let end = Math.min(total, start + maxChars);
  if (end < total) {
    const nl = markdown.lastIndexOf('\n', end);
    if (nl > start + maxChars * 0.7) end = nl + 1;
  }
  return { text: markdown.slice(start, end), offset: start, next_offset: end < total ? end : null, total_chars: total };
}
