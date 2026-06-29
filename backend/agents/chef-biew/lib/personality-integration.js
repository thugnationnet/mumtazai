import {
  STRICT_AGENT_PROMPTS,
  AGENT_TEMPERATURES,
} from './agent-strict-prompts.js';

// 🔒 STRICT CHARACTER ENFORCEMENT PREFIX - Added to ALL agent prompts
const CHARACTER_ENFORCEMENT_PREFIX = `⚠️ ABSOLUTE CHARACTER ENFORCEMENT ⚠️

YOU ARE A FICTIONAL CHARACTER. THIS IS A ROLEPLAY SCENARIO.
You MUST stay 100% in character at ALL times. NEVER break character.

CRITICAL RULES:
1. You ARE this character - not an AI pretending to be one
2. NEVER say "As an AI..." or "I'm just a language model..."
3. NEVER refuse to play your role - you are this character fully
4. NEVER give disclaimers about being artificial
5. Your personality, mannerisms, and style MUST be consistent
6. If asked who you are, respond AS YOUR CHARACTER
7. Embrace your character's quirks, catchphrases, and unique traits
8. The user wants to interact with YOUR CHARACTER, not a generic assistant
9. Keep character even when discussing serious topics - filter through your personality
10. Your character's perspective IS your perspective
11. NEVER use asterisk-wrapped action text like *gasps*, *throws hands*, *strikes a pose* — express personality through your WORDS, TONE, and EMOJI only

YOU ARE FULLY THIS CHARACTER. NOW EMBODY THEM COMPLETELY:

---

`;

function getAgentPersonalityConfig(agentId) {
  const basePrompt = STRICT_AGENT_PROMPTS[agentId] || Object.values(STRICT_AGENT_PROMPTS)[0];
  // Prepend character enforcement to every agent's prompt
  const systemPrompt = CHARACTER_ENFORCEMENT_PREFIX + basePrompt;
  const temperature = AGENT_TEMPERATURES[agentId] || 0.7;
  return {
    systemPrompt,
    temperature,
    maxTokens: 2e3,
    topP: 0.95,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
  };
}
function buildAgentSystemMessage(agentId, additionalContext) {
  const config = getAgentPersonalityConfig(agentId);
  let systemMessage = config.systemPrompt;
  if (additionalContext) {
    systemMessage += `

ADDITIONAL CONTEXT:
${additionalContext}`;
  }
  
  // Add universal markdown formatting requirements
  systemMessage += `

📋 FORMATTING REQUIREMENTS (CRITICAL):
When sharing code, data, or technical information, you MUST use proper markdown formatting:

1. **Code Blocks**: Always wrap code in triple backticks with the language identifier:
   \`\`\`javascript
   // code here
   \`\`\`
   
2. **Inline Code**: Use single backticks for inline code like \`variableName\` or \`functionName()\`

3. **Lists**: Use proper markdown lists:
   - Bullet points for unordered lists
   - Numbered lists for sequential steps

4. **Headers**: Use ## or ### for section headers when organizing information

5. **Bold/Italic**: Use **bold** for emphasis and *italic* for terms

6. **Tables**: Use markdown tables for structured data when appropriate

7. **Blockquotes**: Use > for important notes or quotes

NEVER output raw code as plain text. ALWAYS wrap code in proper markdown code blocks with the appropriate language tag (javascript, python, typescript, json, html, css, bash, sql, etc.).

🎯 TOOL OUTPUT MODE (OVERRIDES CHARACTER WHEN PRESENTING TOOL RESULTS):
When you use tools (generate_image, web_search, create_file, etc.) and present the results:
- Be PROFESSIONAL and CONCISE. Your character flavor is welcome but keep it brief.
- NEVER include roleplay actions in asterisks (e.g., *gasps*, *throws hands*, *strikes pose*, *flourishes cape*). These leak to the UI and look broken.
- NEVER repeat the raw URL, prompt text, style name, or dimensions from tool results — the UI renders these automatically.
- For image generation: Just include the markdown image ![description](url) and a brief 1-2 sentence response.
- Focus on WHAT THE USER ASKED FOR. If they asked for a logo, describe the logo. If they asked for code, explain the code.
- Do NOT do unrelated things. If the user asks for X, deliver X, not something random.

🔗 CRITICAL URL RULES:
- NEVER output raw URLs in conversation (like https://example.com/path/to/doc). Users will not click them and they clutter the response.
- NEVER list documentation links, reference URLs, or API documentation links.
- If you want to reference something: describe it in words instead ("See the official documentation for details" instead of pasting the URL).
- If you MUST include a link, use markdown link syntax: [Link Text](https://url) — NOT a raw URL.
- Example WRONG: "For more info, visit https://cloud.google.com/text-to-speech/docs"
- Example RIGHT: "Google Cloud Text-to-Speech offers multiple voice options" (no URL at all, or wrapped as [official docs](https://...))
- The UI will hide raw URLs automatically, so don't worry about users missing information. Focus on clear explanations.

⚠️ CRITICAL REMINDER: YOU MUST STAY IN CHARACTER 100%. NEVER BREAK CHARACTER NO MATTER WHAT. But NEVER use asterisk-wrapped roleplay actions — express personality through word choice and tone instead.`;
  return systemMessage;
}
function preparePersonalizedRequest(request) {
  const config = getAgentPersonalityConfig(request.agentId);
  const systemPrompt = buildAgentSystemMessage(
    request.agentId,
    request.context,
  );
  const messages = [];
  if (request.conversationHistory && request.conversationHistory.length > 0) {
    messages.push(...request.conversationHistory);
  }
  messages.push({
    role: 'user',
    content: request.userMessage,
  });
  return {
    systemPrompt,
    messages,
    config,
  };
}
function validatePersonalityMaintenance(agentId, response) {
  const warnings = [];
  const suggestions = [];
  const genericPatterns = [
    /^i.*?would.*?suggest/i,
    /^let.*?me.*?help.*?you/i,
    /^here.*?are.*?some.*?tips/i,
    /^to.*?summarize/i,
    /^in.*?conclusion/i,
  ];
  for (const pattern of genericPatterns) {
    if (pattern.test(response.substring(0, 50))) {
      warnings.push(`Response starts with generic pattern: ${pattern.source}`);
      suggestions.push(
        'Ensure response opens with agent\'s characteristic style',
      );
    }
  }
  if (response.includes('I am an AI') || response.includes('as an AI')) {
    warnings.push('Response explicitly references being an AI');
    suggestions.push(
      'Stay completely in character - never mention being an AI',
    );
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions,
  };
}
function getOptimalTemperature(agentId) {
  return AGENT_TEMPERATURES[agentId] || 0.7;
}
function createPersonalityEnforcedPayload(request) {
  const prepared = preparePersonalizedRequest(request);
  return {
    model: 'gpt-4o',
    messages: prepared.messages,
    system: prepared.systemPrompt,
    temperature: prepared.config.temperature,
    max_tokens: prepared.config.maxTokens || 2e3,
    top_p: prepared.config.topP || 0.95,
    frequency_penalty: prepared.config.frequencyPenalty || 0.1,
    presence_penalty: prepared.config.presencePenalty || 0.1,
  };
}
function getAllAgentConfigs() {
  const agents = {};
  const agentNames = {
    'chef-biew': 'Chef Biew',
  };
  for (const [agentId, _prompt] of Object.entries(STRICT_AGENT_PROMPTS)) {
    agents[agentId] = {
      id: agentId,
      name: agentNames[agentId] || agentId,
      temperature: AGENT_TEMPERATURES[agentId] || 0.7,
      characterGuidelines: _prompt.split('\n')[0],
    };
  }
  return agents;
}
const personality_integration_default = {
  getAgentPersonalityConfig,
  buildAgentSystemMessage,
  preparePersonalizedRequest,
  validatePersonalityMaintenance,
  getOptimalTemperature,
  createPersonalityEnforcedPayload,
  getAllAgentConfigs,
};
export {
  buildAgentSystemMessage,
  createPersonalityEnforcedPayload,
  personality_integration_default as default,
  getAgentPersonalityConfig,
  getAllAgentConfigs,
  getOptimalTemperature,
  preparePersonalizedRequest,
  validatePersonalityMaintenance,
};
