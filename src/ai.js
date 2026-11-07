/**
 * Optional AI helpers for Handoff Hub 0.21.
 * - Local TF-IDF semantic ranking always available (no API key).
 * - Optional OpenAI-compatible embeddings / chat when HUB_AI_API_KEY or OPENAI_API_KEY is set.
 * Never throws for missing keys: callers get heuristic fallbacks.
 */

const STOP = new Set(('a an the and or but if in on at to for of is are was were be been being it this that these those with from as by not no yes you your we our they their i me my'.split(' ')));

function apiKey() {
  return process.env.HUB_AI_API_KEY || process.env.OPENAI_API_KEY || '';
}

function apiBase() {
  return (process.env.HUB_AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
}

function chatModel() {
  return process.env.HUB_AI_CHAT_MODEL || 'gpt-4o-mini';
}

function embedModel() {
  return process.env.HUB_AI_EMBED_MODEL || 'text-embedding-3-small';
}

export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s._/-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP.has(t));
}

/** Build a sparse TF vector from tokens. */
export function tfVector(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  const n = tokens.length || 1;
  for (const [k, v] of tf) tf.set(k, v / n);
  return tf;
}

export function cosineSparse(a, b) {
  if (!a.size || !b.size) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [, v] of a) na += v * v;
  if (!na) return 0;
  for (const [, v] of b) nb += v * v;
  if (!nb) return 0;
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  for (const [k, v] of smaller) {
    const u = larger.get(k);
    if (u) dot += v * u;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// WeakMap cache storing tokenized terms and term-frequency vectors per memory object reference.
// Prevents repeated string concatenation and regex tokenization across multiple search queries (~3x speedup).
const docCache = new WeakMap();

function getDocData(m) {
  let cached = docCache.get(m);
  if (!cached) {
    const text = `${m.memory || ''} ${(m.summary || '')} ${(m.tags || []).join(' ')}`;
    const tokens = tokenize(text);
    const vec = tfVector(tokens);
    cached = { tokens, vec };
    docCache.set(m, cached);
  }
  return cached;
}

/** Rank memories by query using local TF-IDF-ish cosine (and optional API embeddings later). */
export function rankMemoriesLocal(memories, query, limit = 10) {
  const qTokens = tokenize(query);
  if (!qTokens.length) {
    return memories.slice(0, limit).map(m => ({ ...m, score: 0, rank_method: 'recency' }));
  }
  const qVec = tfVector(qTokens);
  const df = new Map();
  const docs = new Array(memories.length);

  for (let i = 0; i < memories.length; i++) {
    const m = memories[i];
    const doc = getDocData(m);
    for (const t of new Set(doc.tokens)) df.set(t, (df.get(t) || 0) + 1);
    docs[i] = { m, vec: doc.vec };
  }

  const N = docs.length || 1;
  const idfCache = new Map();
  const getIdf = (t) => {
    let idf = idfCache.get(t);
    if (idf === undefined) {
      idf = Math.log(1 + N / (1 + (df.get(t) || 0)));
      idfCache.set(t, idf);
    }
    return idf;
  };

  // Pre-compute query weight vector and query vector magnitude (qNorm)
  const qW = new Map();
  let qNormSq = 0;
  for (const [t, tf] of qVec) {
    const w = tf * getIdf(t);
    qW.set(t, w);
    qNormSq += w * w;
  }

  const qNorm = Math.sqrt(qNormSq);
  if (!qNorm) {
    return memories.slice(0, limit).map(m => ({ ...m, score: 0, rank_method: 'local_tfidf' }));
  }

  // Calculate TF-IDF cosine similarity scores without temporary per-document Map allocations
  const results = new Array(docs.length);
  for (let i = 0; i < docs.length; i++) {
    const { m, vec } = docs[i];
    let docNormSq = 0;
    for (const [t, tf] of vec) {
      const w = tf * getIdf(t);
      docNormSq += w * w;
    }

    let score = 0;
    if (docNormSq > 0) {
      let dot = 0;
      for (const [t, qWeight] of qW) {
        const docTf = vec.get(t);
        if (docTf) {
          dot += qWeight * (docTf * getIdf(t));
        }
      }
      score = dot / (qNorm * Math.sqrt(docNormSq));
    }
    results[i] = { ...m, score, rank_method: 'local_tfidf' };
  }

  return results
    .sort((a, b) => b.score - a.score || String(b.at || '').localeCompare(String(a.at || '')))
    .slice(0, limit);
}

/** Heuristic conflict: overlapping content words with negation cues vs decisions. */
export function detectConflicts(memoryText, decisions = []) {
  const memTokens = new Set(tokenize(memoryText));
  if (!memTokens.size || !decisions.length) return [];
  const neg = /\b(not|never|no longer|instead|supersede|cancel|ignore|avoid|don't|do not|must not|wrong|incorrect)\b/i;
  const hits = [];
  for (const d of decisions) {
    const dTokens = tokenize(d);
    const overlap = dTokens.filter(t => memTokens.has(t));
    if (overlap.length < 2) continue;
    const ratio = overlap.length / Math.max(dTokens.length, 1);
    if (ratio < 0.15 && overlap.length < 3) continue;
    const conflictCue = neg.test(memoryText) || neg.test(d);
    if (conflictCue || ratio >= 0.35) {
      hits.push({
        decision: String(d).slice(0, 240),
        overlap_terms: overlap.slice(0, 8),
        severity: conflictCue ? 'likely' : 'possible'
      });
    }
  }
  return hits.slice(0, 5);
}

/** Cheap local summary: first sentence + key nouns. */
export function localSummary(text, maxLen = 160) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const sentence = (clean.match(/^[^.!?]+[.!?]?/) || [clean])[0].trim();
  if (sentence.length <= maxLen) return sentence;
  return sentence.slice(0, maxLen - 1) + '…';
}

export function extractTags(text, max = 6) {
  const counts = new Map();
  for (const t of tokenize(text)) {
    if (t.length < 3) continue;
    counts.set(t, (counts.get(t) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([t]) => t);
}

async function chatJson(system, user) {
  const key = apiKey();
  if (!key) return null;
  try {
    const r = await fetch(`${apiBase()}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: chatModel(),
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      }),
      signal: AbortSignal.timeout(25000)
    });
    if (!r.ok) return null;
    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function enrichMemory(memoryText, decisions = []) {
  const summary = localSummary(memoryText);
  const tags = extractTags(memoryText);
  const conflicts = detectConflicts(memoryText, decisions);
  const llm = await chatJson(
    'You enrich a handoff memory for a multi-agent system. Reply JSON only: {"summary": string <=160 chars, "tags": string[<=6], "conflicts": [{"decision": string, "severity": "likely"|"possible"}]}. Only list conflicts that truly contradict a decision.',
    `Memory:\n${memoryText.slice(0, 2000)}\n\nKnown decisions:\n${(decisions || []).slice(0, 12).map((d, i) => `${i + 1}. ${d}`).join('\n') || '(none)'}`
  );
  if (llm && typeof llm.summary === 'string') {
    return {
      summary: llm.summary.slice(0, 200),
      tags: Array.isArray(llm.tags) ? llm.tags.map(String).slice(0, 8) : tags,
      conflicts: Array.isArray(llm.conflicts) && llm.conflicts.length ? llm.conflicts.slice(0, 5) : conflicts,
      enrich_method: 'llm'
    };
  }
  return { summary, tags, conflicts, enrich_method: 'local' };
}

export async function planWithLlm(task, agents, profiles, stats) {
  const llm = await chatJson(
    'You are a multi-agent task orchestrator. Reply JSON only: {"steps":[{"id":"s1","text":string,"category":"code|design|research|writing|data|planning|general","suggested_agent":string|null,"depends_on":string[],"est_minutes":number}]}. Use depends_on for ordering. Prefer fewer steps (3-8). suggested_agent must be from the available agent list or null.',
    JSON.stringify({
      task: task.slice(0, 4000),
      available_agents: agents,
      profiles,
      agent_stats: stats
    }).slice(0, 6000)
  );
  if (!llm || !Array.isArray(llm.steps) || !llm.steps.length) return null;
  return llm.steps.map((s, i) => ({
    id: String(s.id || `s${i + 1}`),
    text: String(s.text || '').trim(),
    category: String(s.category || 'general'),
    suggested_agent: s.suggested_agent ? String(s.suggested_agent).toLowerCase() : null,
    depends_on: Array.isArray(s.depends_on) ? s.depends_on.map(String) : [],
    est_minutes: Number(s.est_minutes) || null
  })).filter(s => s.text.length > 2);
}

export function aiConfigured() {
  return Boolean(apiKey());
}
