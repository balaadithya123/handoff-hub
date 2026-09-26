import { hfModels, hfChat } from './integrations.js';

const SYSTEM = `You are Handoff Hub's internal task optimizer. You are not a chat assistant. Analyze integration tasks only. Return JSON with goal, steps, integrations, verification, risks. Do not claim actions were executed.`;

function score(model) {
  const id = model.id.toLowerCase();
  return (id.includes('coder') ? 100 : 0) + (id.includes('qwen3') ? 40 : 0) + (id.includes('30b') ? 20 : 0) + (id.includes('instruct') ? 10 : 0);
}

export async function optimizeTask({ task, context = '', max_tokens = 1400 }) {
  const candidates = await hfModels('coder');
  if (!candidates.length) throw new Error('No free Hugging Face coding model/provider is currently available.');
  const selected = [...candidates].sort((a,b) => score(b) - score(a))[0];
  const result = await hfChat({
    model: selected.id,
    system: SYSTEM,
    prompt: `Task: ${task}\n${context ? `Context: ${context}\n` : ''}Available integrations should be used for execution and verification.`,
    max_tokens
  });
  return { role: 'internal_optimizer', model: result.model, provider: result.provider, free_only: true, plan: result.content, usage: result.usage };
}
