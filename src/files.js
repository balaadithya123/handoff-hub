// File transfer between AIs (0.23.0). Bytes live in a private Supabase Storage bucket; only metadata
// is kept in the per-user Hub state. Limits: 30 MB per file, 100 MB per account. When the account is
// full, uploads are refused until the user deletes files (delete_file).
import crypto from 'node:crypto';
import { z } from 'zod';
import { getState, mutate } from './store.js';

export const MAX_FILE_BYTES = 30 * 1024 * 1024;
export const MAX_ACCOUNT_BYTES = 100 * 1024 * 1024;
const MAX_DIRECT_BYTES = 3 * 1024 * 1024; // Vercel function bodies are limited to ~4.5 MB, so base64 uploads stay small
const PENDING_MINUTES = 60;
const DOWNLOAD_SECONDS = 3600;
const BUCKET = process.env.HUB_FILES_BUCKET || 'axon-files';

const now = () => new Date().toISOString();
const text = value => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });
const mb = bytes => Math.round((bytes / 1048576) * 100) / 100;

const storageBase = () => `${process.env.SUPABASE_URL}/storage/v1`;
const storageOn = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const authHeaders = (extra = {}) => ({ apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, ...extra });
const encodePath = p => p.split('/').map(encodeURIComponent).join('/');

export function safeName(name) {
  const base = String(name).split(/[\\/]/).pop().replace(/[^A-Za-z0-9._ -]+/g, '_').replace(/^\.+/, '').trim();
  return (base || 'file').slice(0, 120);
}

// Bytes counted against the account: stored files plus unexpired reservations.
export function usedBytes(files = [], at = Date.now()) {
  return files
    .filter(f => f.status === 'stored' || (f.status === 'pending' && Date.parse(f.expires_at) > at))
    .reduce((sum, f) => sum + (f.size_bytes || 0), 0);
}

export function checkQuota(files, sizeBytes, at = Date.now()) {
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) return { ok: false, reason: 'size_bytes must be a positive whole number.' };
  if (sizeBytes > MAX_FILE_BYTES) return { ok: false, reason: `File is ${mb(sizeBytes)} MB. The limit is ${mb(MAX_FILE_BYTES)} MB per file.` };
  const used = usedBytes(files, at);
  if (used + sizeBytes > MAX_ACCOUNT_BYTES) {
    return { ok: false, reason: `Storage full: ${mb(used)} MB of ${mb(MAX_ACCOUNT_BYTES)} MB used, this file needs ${mb(sizeBytes)} MB. Delete files with delete_file (see list_files) to free space.` };
  }
  return { ok: true, used };
}

function view(f) {
  return { id: f.id, name: f.name, size_bytes: f.size_bytes, size_mb: mb(f.size_bytes), content_type: f.content_type, status: f.status, uploaded_by: f.uploaded_by, note: f.note, created_at: f.created_at, ...(f.status === 'pending' ? { expires_at: f.expires_at } : {}) };
}

async function storageCall(path, init = {}) {
  const r = await fetch(`${storageBase()}${path}`, init);
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`Storage request failed: ${r.status} ${body.slice(0, 200)}`);
  }
  return r;
}

async function signedUploadUrl(objectPath) {
  const r = await storageCall(`/object/upload/sign/${BUCKET}/${encodePath(objectPath)}`, { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: '{}' });
  const j = await r.json();
  const rel = j.url || j.signedURL;
  if (!rel) throw new Error('Storage did not return an upload URL.');
  return rel.startsWith('http') ? rel : `${storageBase()}${rel.startsWith('/') ? '' : '/'}${rel}`;
}

async function signedDownloadUrl(objectPath, name) {
  const r = await storageCall(`/object/sign/${BUCKET}/${encodePath(objectPath)}`, { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ expiresIn: DOWNLOAD_SECONDS }) });
  const j = await r.json();
  const rel = j.signedURL || j.url;
  if (!rel) throw new Error('Storage did not return a download URL.');
  const full = rel.startsWith('http') ? rel : `${storageBase()}${rel.startsWith('/') ? '' : '/'}${rel}`;
  return `${full}${full.includes('?') ? '&' : '?'}download=${encodeURIComponent(name)}`;
}

async function objectSize(objectPath) {
  const r = await fetch(`${storageBase()}/object/info/${BUCKET}/${encodePath(objectPath)}`, { headers: authHeaders() });
  if (r.status === 404 || r.status === 400) return null;
  if (!r.ok) throw new Error(`Storage request failed: ${r.status}`);
  const j = await r.json();
  const size = j.size ?? j.metadata?.size ?? j.metadata?.contentLength;
  return Number.isFinite(Number(size)) ? Number(size) : null;
}

async function removeObject(objectPath) {
  const r = await fetch(`${storageBase()}/object/${BUCKET}/${encodePath(objectPath)}`, { method: 'DELETE', headers: authHeaders() });
  if (!r.ok && r.status !== 404) throw new Error(`Storage delete failed: ${r.status}`);
}

// Drop reservations that were never completed so they stop counting and their objects do not linger.
function expirePending(state, at = Date.now()) {
  const gone = [];
  state.files = (state.files || []).filter(f => {
    if (f.status === 'pending' && Date.parse(f.expires_at) <= at) { gone.push(f); return false; }
    return true;
  });
  return gone;
}

export function registerFileTools(server, userId, tool) {
  const needStorage = () => {
    if (!storageOn()) throw new Error('File storage is not configured on this server (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required).');
  };
  const agentName = z.string().min(1).describe('Name of the calling AI agent, e.g. claude or chatgpt');

  tool('request_file_upload', `Reserve space and get a one-time upload URL for a file up to ${mb(MAX_FILE_BYTES)} MB. Each account can hold ${mb(MAX_ACCOUNT_BYTES)} MB in total; when full, uploads are refused until files are deleted. Send the bytes with an HTTP PUT to upload_url (no auth header), then call confirm_file_upload with the returned file_id within an hour. Use this only when the user asked to share a file through Axon. Needs an environment that can make outbound HTTP requests; otherwise use put_file for files up to ${mb(MAX_DIRECT_BYTES)} MB.`, { agent: agentName, name: z.string().min(1).max(200), size_bytes: z.number().int().positive().describe('Exact size of the file in bytes'), content_type: z.string().max(120).optional(), note: z.string().max(300).optional() }, { title: 'Request a file upload URL' }, async input => {
    needStorage();
    const id = crypto.randomUUID();
    const name = safeName(input.name);
    const objectPath = `${userId}/${id}/${name}`;
    const gone = [];
    const result = await mutate(userId, state => {
      gone.push(...expirePending(state));
      const q = checkQuota(state.files, input.size_bytes);
      if (!q.ok) return { error: q.reason };
      const rec = { id, name, object_path: objectPath, size_bytes: input.size_bytes, content_type: input.content_type || 'application/octet-stream', status: 'pending', uploaded_by: String(input.agent).trim().toLowerCase(), note: input.note, created_at: now(), expires_at: new Date(Date.now() + PENDING_MINUTES * 60000).toISOString() };
      state.files = [rec, ...(state.files || [])];
      return { rec };
    });
    await Promise.all(gone.map(f => removeObject(f.object_path).catch(() => {})));
    if (result.error) return text({ error: result.error });
    try {
      const upload_url = await signedUploadUrl(objectPath);
      return text({ file_id: id, upload_url, method: 'PUT', header: 'Content-Type: ' + result.rec.content_type, expires_at: result.rec.expires_at, next: 'PUT the file bytes to upload_url, then call confirm_file_upload with file_id.' });
    } catch (e) {
      await mutate(userId, state => { state.files = (state.files || []).filter(f => f.id !== id); });
      throw e;
    }
  });

  tool('confirm_file_upload', 'Finish an upload started with request_file_upload. Checks the file really arrived and matches the size that was reserved. Until confirmed, the file cannot be downloaded.', { file_id: z.string().min(1) }, { title: 'Confirm a file upload' }, async ({ file_id }) => {
    needStorage();
    const st = await getState(userId);
    const rec = (st.files || []).find(f => f.id === file_id);
    if (!rec) return text({ error: 'No such file id (it may have expired). Call request_file_upload again.' });
    if (rec.status === 'stored') return text({ file: view(rec) });
    const size = await objectSize(rec.object_path);
    if (size === null) return text({ error: 'The file has not arrived yet. PUT the bytes to the upload_url first.' });
    if (size > MAX_FILE_BYTES || size !== rec.size_bytes) {
      await removeObject(rec.object_path).catch(() => {});
      await mutate(userId, state => { state.files = (state.files || []).filter(f => f.id !== file_id); });
      return text({ error: `Uploaded size ${size} bytes does not match the reserved ${rec.size_bytes} bytes (limit ${MAX_FILE_BYTES}). The upload was discarded; start again.` });
    }
    const stored = await mutate(userId, state => {
      const f = (state.files || []).find(x => x.id === file_id);
      if (!f) return null;
      f.status = 'stored';
      delete f.expires_at;
      f.stored_at = now();
      return f;
    });
    return text(stored ? { file: view(stored) } : { error: 'The reservation expired before it was confirmed.' });
  });

  tool('put_file', `Upload a small file directly as base64 (up to ${mb(MAX_DIRECT_BYTES)} MB, because tool calls are small). For anything larger use request_file_upload. Counts toward the ${mb(MAX_ACCOUNT_BYTES)} MB account storage. Use only when the user asked to share a file through Axon.`, { agent: agentName, name: z.string().min(1).max(200), content_base64: z.string().min(1), content_type: z.string().max(120).optional(), note: z.string().max(300).optional() }, { title: 'Upload a small file' }, async input => {
    needStorage();
    const bytes = Buffer.from(input.content_base64, 'base64');
    if (bytes.length > MAX_DIRECT_BYTES) return text({ error: `Direct upload is limited to ${mb(MAX_DIRECT_BYTES)} MB. Use request_file_upload for larger files (up to ${mb(MAX_FILE_BYTES)} MB).` });
    const id = crypto.randomUUID();
    const name = safeName(input.name);
    const objectPath = `${userId}/${id}/${name}`;
    const gone = [];
    const reserved = await mutate(userId, state => {
      gone.push(...expirePending(state));
      const q = checkQuota(state.files, bytes.length);
      if (!q.ok) return { error: q.reason };
      const rec = { id, name, object_path: objectPath, size_bytes: bytes.length, content_type: input.content_type || 'application/octet-stream', status: 'pending', uploaded_by: String(input.agent).trim().toLowerCase(), note: input.note, created_at: now(), expires_at: new Date(Date.now() + 5 * 60000).toISOString() };
      state.files = [rec, ...(state.files || [])];
      return { rec };
    });
    await Promise.all(gone.map(f => removeObject(f.object_path).catch(() => {})));
    if (reserved.error) return text({ error: reserved.error });
    try {
      await storageCall(`/object/${BUCKET}/${encodePath(objectPath)}`, { method: 'POST', headers: authHeaders({ 'Content-Type': reserved.rec.content_type, 'x-upsert': 'false' }), body: bytes });
    } catch (e) {
      await mutate(userId, state => { state.files = (state.files || []).filter(f => f.id !== id); });
      throw e;
    }
    const stored = await mutate(userId, state => {
      const f = (state.files || []).find(x => x.id === id);
      if (f) { f.status = 'stored'; delete f.expires_at; f.stored_at = now(); }
      return f;
    });
    return text({ file: view(stored || reserved.rec) });
  });

  tool('list_files', 'List files shared through Axon with how much of the 100 MB account storage is used. Includes who uploaded each file and any note.', {}, { title: 'List shared files', ro: true }, async () => {
    const st = await getState(userId);
    const files = (st.files || []).filter(f => f.status === 'stored' || (f.status === 'pending' && Date.parse(f.expires_at) > Date.now()));
    const used = usedBytes(st.files);
    return text({ used_bytes: used, used_mb: mb(used), limit_mb: mb(MAX_ACCOUNT_BYTES), free_mb: mb(Math.max(0, MAX_ACCOUNT_BYTES - used)), max_file_mb: mb(MAX_FILE_BYTES), count: files.length, files: files.map(view) });
  });

  tool('get_file', 'Get a temporary download URL (valid one hour) for a stored file. Download it with an HTTP GET, no auth header. Use only when the user asked to fetch that file.', { file_id: z.string().min(1) }, { title: 'Get a file download link', ro: true }, async ({ file_id }) => {
    needStorage();
    const st = await getState(userId);
    const rec = (st.files || []).find(f => f.id === file_id);
    if (!rec) return text({ error: 'No such file.' });
    if (rec.status !== 'stored') return text({ error: 'This upload was never confirmed. Call confirm_file_upload first.' });
    return text({ file: view(rec), download_url: await signedDownloadUrl(rec.object_path, rec.name), expires_in_seconds: DOWNLOAD_SECONDS });
  });

  tool('delete_file', 'Permanently delete a shared file to free storage. Only call this when the user asked to delete that file or to clear the library.', { file_id: z.string().min(1) }, { title: 'Delete a shared file', destructive: true }, async ({ file_id }) => {
    needStorage();
    const st = await getState(userId);
    const rec = (st.files || []).find(f => f.id === file_id);
    if (!rec) return text({ deleted: false, reason: 'No such file.' });
    await removeObject(rec.object_path);
    await mutate(userId, state => { state.files = (state.files || []).filter(f => f.id !== file_id); });
    return text({ deleted: true, file: view(rec) });
  });
}
