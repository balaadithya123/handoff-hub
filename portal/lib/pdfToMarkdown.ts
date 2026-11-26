// PDF text -> compact Markdown, built to minimise tokens. Runs in the browser on the text items PDF.js returns.
// Differences from a naive line-per-paragraph conversion: wrapped lines are joined into real paragraphs,
// words split by a line-end hyphen are rejoined, and headers/footers that repeat on most pages are dropped.

export type PdfItem = { str: string; transform: number[]; width?: number; height?: number };
export type ConvertOptions = { detectHeadings: boolean; pageSeparators: boolean; dropRepeated: boolean };

type Line = { text: string; y: number; h: number; x: number };

const heightOf = (it: PdfItem) => Math.abs(it.transform[3] || it.height || 12);
const BULLET = /^[•·▪◦●○‣\-–—*]\s+/;
const NUMBERED = /^(\d{1,3}[.)]|[a-z][.)])\s+/i;

export function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

function pageLines(items: PdfItem[]): Line[] {
  const useful = items.filter(it => it.str && it.str.trim().length > 0);
  const sorted = [...useful].sort((a, b) => (Math.abs(a.transform[5] - b.transform[5]) > 3 ? b.transform[5] - a.transform[5] : a.transform[4] - b.transform[4]));
  const groups: PdfItem[][] = [];
  let current: PdfItem[] = [];
  let y: number | null = null;
  for (const it of sorted) {
    const iy = it.transform[5];
    if (y === null || Math.abs(iy - y) <= 3) { current.push(it); y = y === null ? iy : (y + iy) / 2; }
    else { groups.push(current); current = [it]; y = iy; }
  }
  if (current.length) groups.push(current);
  return groups.map(g => {
    g.sort((a, b) => a.transform[4] - b.transform[4]);
    let text = "";
    let lastEnd: number | null = null;
    for (const it of g) {
      const x = it.transform[4];
      const fs = heightOf(it);
      if (lastEnd !== null && x - lastEnd > Math.max(1, fs * 0.15) && !text.endsWith(" ") && !it.str.startsWith(" ")) text += " ";
      text += it.str;
      lastEnd = x + (it.width ?? it.str.length * (Math.abs(it.transform[0]) || 8) * 0.5);
    }
    return { text: text.replace(/\s+/g, " ").trim(), y: g.reduce((s, it) => s + it.transform[5], 0) / g.length, h: Math.max(...g.map(heightOf)), x: g[0].transform[4] };
  }).filter(l => l.text);
}

const repeatKey = (t: string) => t.toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ").trim();

export function pagesToMarkdown(pages: PdfItem[][], opts: ConvertOptions): string {
  const lines = pages.map(pageLines);
  const heights = pages.flatMap(p => p.filter(it => it.str?.trim()).map(heightOf)).sort((a, b) => a - b);
  const body = heights[Math.floor(heights.length / 2)] || 12;

  // Headers and footers: the first line and last two lines of a page that look the same on most pages.
  const drop = new Set<string>();
  if (opts.dropRepeated && pages.length >= 3) {
    const seen = new Map<string, number>();
    for (const pl of lines) {
      const edge = new Set([...pl.slice(0, 1), ...pl.slice(-2)].map(l => repeatKey(l.text)));
      for (const k of edge) seen.set(k, (seen.get(k) || 0) + 1);
    }
    const need = Math.max(3, Math.ceil(pages.length * 0.6));
    for (const [k, n] of seen) if (n >= need) drop.add(k);
  }

  const pageBlocks = lines.map(pl => {
    const kept = pl.filter((l, i) => !(drop.size && (i < 1 || i >= pl.length - 2) && drop.has(repeatKey(l.text))));
    const blocks: { kind: "h" | "li" | "p"; text: string }[] = [];
    let prev: Line | null = null;
    for (const l of kept) {
      let kind: "h" | "li" | "p" = "p";
      let text = l.text;
      if (opts.detectHeadings && l.h > body * 1.35 && text.length < 160) {
        kind = "h";
        text = `${l.h > body * 1.8 ? "#" : l.h > body * 1.5 ? "##" : "###"} ${text}`;
      } else if (BULLET.test(text)) { kind = "li"; text = `- ${text.replace(BULLET, "")}`; }
      else if (NUMBERED.test(text)) { kind = "li"; }
      const last = blocks[blocks.length - 1];
      const close = prev !== null && prev.y - l.y <= body * 1.6 && Math.abs(prev.h - l.h) < body * 0.25;
      if (kind === "p" && last && last.kind === "p" && close) {
        last.text = /[A-Za-z]-$/.test(last.text) && /^[a-z]/.test(text) ? last.text.slice(0, -1) + text : `${last.text} ${text}`;
      } else if (kind === "li" && last && last.kind === "li" && close && !BULLET.test(l.text) && !NUMBERED.test(l.text)) {
        last.text += ` ${text}`;
      } else if (kind === "p" && last && last.kind === "li" && close && l.x > (prev?.x ?? 0)) {
        last.text += ` ${text}`; // wrapped continuation of a list item
      } else blocks.push({ kind, text });
      prev = l;
    }
    return blocks;
  });

  const pageText = pageBlocks.map(blocks => blocks.map((b, i) => (i === 0 ? "" : b.kind === "li" && blocks[i - 1].kind === "li" ? "\n" : "\n\n") + b.text).join(""));
  const joined = pageText.filter(t => t.trim()).join(opts.pageSeparators ? "\n\n---\n\n" : "\n\n");
  return joined.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
