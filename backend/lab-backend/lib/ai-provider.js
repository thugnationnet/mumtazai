/**
 * AI Provider — shared multi-provider fallback chain for lab experiments
 * Cerebras → Groq → OpenAI
 */

/**
 * Call AI with fallback chain: Cerebras → Groq → OpenAI
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {object} [opts]
 * @param {number} [opts.maxTokens=32768]
 * @param {number} [opts.temperature=0.7]
 * @returns {Promise<{text: string, tokens: number}>}
 */
export async function generateWithAI(systemPrompt, userPrompt, opts = {}) {
  const { maxTokens = 32768, temperature = 0.7 } = opts;

  const providers = [
    { url: 'https://api.cerebras.ai/v1/chat/completions', key: process.env.CEREBRAS_API_KEY, model: 'llama-3.3-70b' },
    { url: 'https://api.groq.com/openai/v1/chat/completions', key: process.env.GROQ_API_KEY, model: 'llama-3.3-70b-versatile' },
  ];

  for (const provider of providers) {
    if (!provider.key) continue;
    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.key}` },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature,
        }),
      });
      if (!response.ok) continue;
      const data = await response.json();
      return { text: data.choices?.[0]?.message?.content || '', tokens: data.usage?.total_tokens || 0 };
    } catch {
      continue;
    }
  }

  // Final fallback — OpenAI via fetch (no SDK dependency)
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error('All AI providers failed — no API keys configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return { text: data.choices?.[0]?.message?.content || '', tokens: data.usage?.total_tokens || 0 };
}

/**
 * Call a specific model by name (for battle arena multi-model comparison)
 */
export async function callModel(model, systemPrompt, userPrompt, opts = {}) {
  const { maxTokens = 32768, temperature = 0.8 } = opts;
  const startTime = Date.now();

  const modelMap = {
    'gpt-4': { url: 'https://api.openai.com/v1/chat/completions', key: process.env.OPENAI_API_KEY, modelId: 'gpt-4' },
    'claude-3': { url: 'https://api.anthropic.com/v1/messages', key: process.env.ANTHROPIC_API_KEY, modelId: 'claude-3-5-sonnet-20241022', isAnthropic: true },
    'gemini': { url: 'https://api.cerebras.ai/v1/chat/completions', key: process.env.CEREBRAS_API_KEY, modelId: 'llama-3.3-70b' },
    'cerebras': { url: 'https://api.cerebras.ai/v1/chat/completions', key: process.env.CEREBRAS_API_KEY, modelId: 'llama-3.3-70b' },
    'groq': { url: 'https://api.groq.com/openai/v1/chat/completions', key: process.env.GROQ_API_KEY, modelId: 'llama-3.3-70b-versatile' },
    'mistral': { url: 'https://api.mistral.ai/v1/chat/completions', key: process.env.MISTRAL_API_KEY, modelId: 'mistral-large-latest' },
    'llama-3': { url: 'https://api.cerebras.ai/v1/chat/completions', key: process.env.CEREBRAS_API_KEY, modelId: 'llama-3.3-70b' },
    'cohere': { url: 'https://api.cerebras.ai/v1/chat/completions', key: process.env.CEREBRAS_API_KEY, modelId: 'llama-3.3-70b' },
  };

  const cfg = modelMap[model];
  if (!cfg || !cfg.key) throw new Error(`Unsupported / unconfigured model: ${model}`);

  if (cfg.isAnthropic) {
    const response = await fetch(cfg.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': cfg.key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: cfg.modelId,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    if (!response.ok) throw new Error(`Anthropic error: ${response.status}`);
    const data = await response.json();
    const content = data.content?.[0];
    return {
      text: content?.type === 'text' ? content.text : '',
      time: Date.now() - startTime,
      tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    };
  }

  // OpenAI-compatible providers
  const response = await fetch(cfg.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify({
      model: cfg.modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) throw new Error(`${model} API error: ${response.status}`);
  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content || '',
    time: Date.now() - startTime,
    tokens: data.usage?.total_tokens || 0,
  };
}
