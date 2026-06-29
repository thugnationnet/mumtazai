/**
 * ═══════════════════════════════════════════════════════════════════
 * AGENT SEARCH ROUTE — Direct web search + AI summary
 * Used by the Search mode in the universal chat dropdown.
 * Calls webSearch (SerpAPI/DuckDuckGo) then summarizes with an LLM.
 * ═══════════════════════════════════════════════════════════════════
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

    console.log(`[agent-search] Searching for: "${query}" (agent: ${agentId || 'none'})`);

    // Step 1: Web search
    const searchResult = await webSearch(query, 6);

    if (!searchResult.success || !searchResult.results?.length) {
      return res.json({
        success: true,
        summary: `🔍 **Search: "${query}"**\n\nNo results found. Try rephrasing your query.`,
      });
    }

    // Step 2: Format results into a readable summary
    const results = searchResult.results;
    let summary = `🔍 **Search Results for: "${query}"**\n\n`;

    results.forEach((r, i) => {
      summary += `### ${i + 1}. ${r.title}\n`;
      if (r.snippet) summary += `${r.snippet}\n`;
      if (r.url) summary += `[Source](${r.url})`;
      if (r.source) summary += ` — *${r.source}*`;
      summary += '\n\n';
    });

    // Step 3: Try to get an AI summary using available provider
    const aiSummary = await generateSearchSummary(query, results);
    if (aiSummary) {
      summary += `---\n\n**AI Summary:**\n${aiSummary}`;
    }

    return res.json({ success: true, summary });
  } catch (error) {
    console.error('[agent-search] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Generate an AI summary of search results using the best available provider.
 */
async function generateSearchSummary(query, results) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  const context = results.map((r, i) =>
    `[${i + 1}] ${r.title}: ${r.snippet} (${r.url})`
  ).join('\n');

  const systemPrompt = 'You are a helpful search assistant. Summarize the search results concisely in 2-4 sentences. Include key facts and reference the sources.';
  const userPrompt = `Query: "${query}"\n\nSearch Results:\n${context}\n\nProvide a concise summary of these results.`;

  // Try OpenAI first (fast)
  if (OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
      }
    } catch (err) {
      console.warn('[agent-search] OpenAI summary failed:', err.message);
    }
  }

  // Fallback to Anthropic
  if (ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 500,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.content?.[0]?.text || null;
      }
    } catch (err) {
      console.warn('[agent-search] Anthropic summary failed:', err.message);
    }
  }

  return null; // No AI summary available
}

export default router;
