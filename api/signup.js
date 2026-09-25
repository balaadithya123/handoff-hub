import { createUser } from '../src/auth.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id, apiKey } = await createUser();
    return res.status(200).json({
      user_id: id,
      api_key: apiKey,
      note: 'Save this key now. It is shown only once. Use it as Authorization: Bearer <api_key> on every /mcp connection.'
    });
  } catch (error) {
    console.error('Signup failed:', error);
    return res.status(500).json({ error: 'Signup failed' });
  }
}
