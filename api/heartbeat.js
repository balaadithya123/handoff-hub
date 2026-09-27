import { runHealthCheck } from '../src/worker.js';

// Triggered by Vercel Cron (once/day on the Hobby plan; see vercel.json) and
// callable on demand for testing. Verifies the Vercel-issued CRON_SECRET
// header so this can't be invoked by anyone who finds the URL.
export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'] || '';
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const workerUserId = process.env.WORKER_USER_ID;
  if (!workerUserId) {
    return res.status(500).json({ error: 'WORKER_USER_ID is not configured' });
  }

  try {
    const result = await runHealthCheck(workerUserId, { agent: 'scheduled' });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Heartbeat failed:', error);
    return res.status(500).json({ error: 'Heartbeat failed' });
  }
}
