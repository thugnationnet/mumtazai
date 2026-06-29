/**
 * AGENT SEARCH ROUTE — Web search + AI summary
 * Each agent handles its own search requests.
 * Frontend calls /api/agent/{agentId}/search → nginx → this agent's port → here
 */

import express from 'express';
import { webSearch } from '../lib/agent-tools-service.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { query, agentId } = req.body;

    if (!query?.trim()) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }

    const AGENT_ID = process.env.AGENT_ID || agentId || 'unknown';
    console.log(`[${AGENT_ID}/search] Searching for: "${query}"`);

    // Step 1: Web search
    const searchResult = await webSearch(query, 6);

    if (!searchResult.success || !searchResult.results?.length) {
      return res.json({
        success: true,
        summary: `🔍 **Search: "${query}"**\n\nNo results found. Try rephrasing your query.`,
      });
    }

    // Step 2: Format results
    const results = searchResult.results;
    let summary = `🔍 **Search Results for: "${query}"**\n\n`;

    results.forEach((r, i) => {
      summary += `### ${i + 1}. ${r.title}\n`;
      if (r.snippet) summary += `${r.snippet}\n`;
      if (r.url) summary += `[Source](${r.url})`;
      if (r.source) summary += ` — *${r.source}*`;
      summary += '\n\n';
    });

    // Step 3: AI summary using available provider
    const aiSummary = await generateSearchSummary(query, results);
    if (aiSummary) {
      summary += `---\n\n**AI Summary:**\n${aiSummary}`;
    }

    return res.json({ success: true, summary });
  } catch (error) {
    console.error('[search] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

async function generateSearchSummary(query, results) {
  const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
  const XAI_API_KEY = process.env.XAI_API_KEY;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  const context = results.map((r, i) =>
    `[${i + 1}] ${r.title}: ${r.snippet} (${r.url})`
  ).join('\n');

  const systemPrompt = 'You are a helpful search assistant. Summarize the search results concisely in 2-4 sentences. Include key facts and reference the sources.';
  const userPrompt = `Query: "${query}"\n\nSearch Results:\n${context}\n\nProvide a concise summary of these results.`;

  if (MISTRAL_API_KEY) {
    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MISTRAL_API_KEY}` },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
      }
    } catch (err) {
      console.warn('[search] Mistral summary failed:', err.message);
    }
  }

  if (XAI_API_KEY) {
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${XAI_API_KEY}` },
        body: JSON.stringify({
          model: 'grok-3-mini-fast',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
      }
    } catch (err) {
      console.warn('[search] xAI summary failed:', err.message);
    }
  }

  if (OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
      }
    } catch (err) {
      console.warn('[search] OpenAI summary failed:', err.message);
    }
  }

  return null;
}

export default router;
