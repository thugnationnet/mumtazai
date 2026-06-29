/**
 * CORE UTILITY TOOLS
 * 6 tools: web_search, fetch_url, execute_code, calculate, get_current_time, get_weather
 */

import { execSync } from 'child_process';
import https from 'https';
import http from 'http';
import { URL } from 'url';

export const CORE_UTILITY_TOOL_DEFINITIONS = [
  {
    name: 'web_search',
    description: 'Search the web using DuckDuckGo. Returns titles, URLs, and snippets.',
    input_schema: {
      type: 'object',
      properties: {
        query:       { type: 'string', description: 'Search query' },
        max_results: { type: 'number', description: 'Max number of results (default: 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'fetch_url',
    description: 'Fetch and extract content from a URL. Returns cleaned text and metadata.',
    input_schema: {
      type: 'object',
      properties: {
        url:     { type: 'string', description: 'URL to fetch' },
        format:  { type: 'string', enum: ['text', 'html', 'json'], description: 'Return format (default: text)' },
        timeout: { type: 'number', description: 'Timeout in ms (default: 15000)' },
      },
      required: ['url'],
    },
  },
  {
    name: 'execute_code',
    description: 'Execute JavaScript, Python, or Bash code. Returns stdout and stderr.',
    input_schema: {
      type: 'object',
      properties: {
        code:     { type: 'string', description: 'Code to execute' },
        language: { type: 'string', enum: ['javascript', 'python', 'bash'], description: 'Language (default: javascript)' },
        timeout:  { type: 'number', description: 'Timeout in ms (default: 30000)' },
      },
      required: ['code'],
    },
  },
  {
    name: 'calculate',
    description: 'Evaluate a mathematical expression. Returns the numeric result.',
    input_schema: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'Math expression to evaluate (e.g. "2 + 2 * 10")' },
      },
      required: ['expression'],
    },
  },
  {
    name: 'get_current_time',
    description: 'Get the current date and time in a given timezone.',
    input_schema: {
      type: 'object',
      properties: {
        timezone: { type: 'string', description: 'IANA timezone (e.g. "America/New_York", default: "UTC")' },
        format:   { type: 'string', description: 'Date format: "iso" | "human" (default: "human")' },
      },
      required: [],
    },
  },
  {
    name: 'get_weather',
    description: 'Get current weather for a location using wttr.in (no API key needed).',
    input_schema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name or coordinates (e.g. "London" or "51.5,-0.1")' },
        units:    { type: 'string', enum: ['metric', 'imperial'], description: 'Temperature units (default: metric)' },
      },
      required: ['location'],
    },
  },
];

// ============================================================================
// EXECUTORS
// ============================================================================

function fetchUrl(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    try {
      const parsed  = new URL(url);
      const requester = parsed.protocol === 'https:' ? https : http;
      const req = requester.get(url, { timeout }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    } catch (err) { reject(err); }
  });
}

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s{3,}/g, '\n\n')
    .trim();
}

export async function executeCoreUtilityTool(toolName, input, ctx = {}) {
  try {
    switch (toolName) {
      case 'web_search': {
        const n   = input.max_results || 5;
        const q   = encodeURIComponent(input.query);
        const url = `https://html.duckduckgo.com/html/?q=${q}`;
        const { body } = await fetchUrl(url, 10000);
        // Parse result snippets from DuckDuckGo HTML
        const results = [];
        const linkRe  = /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
        const snippetRe = /<a[^>]+class="result__snippet"[^>]*>(.*?)<\/a>/gi;
        const titleMatches   = [...body.matchAll(linkRe)].slice(0, n);
        const snippetMatches = [...body.matchAll(snippetRe)].slice(0, n);
        for (let i = 0; i < Math.min(titleMatches.length, n); i++) {
          results.push({
            title:   stripHtml(titleMatches[i][2]),
            url:     titleMatches[i][1],
            snippet: snippetMatches[i] ? stripHtml(snippetMatches[i][1]) : '',
          });
        }
        return { result: JSON.stringify({ status: 'success', query: input.query, results }) };
      }

      case 'fetch_url': {
        const { status, body } = await fetchUrl(input.url, input.timeout || 15000);
        const format = input.format || 'text';
        let content;
        if (format === 'json') {
          try { content = JSON.parse(body); } catch { content = body; }
        } else if (format === 'html') {
          content = body;
        } else {
          content = stripHtml(body).slice(0, 50000); // cap at 50k chars
        }
        return { result: JSON.stringify({ status: 'success', url: input.url, http_status: status, content }) };
      }

      case 'execute_code': {
        const lang = input.language || 'javascript';
        const timeout = Math.min(input.timeout || 30000, 60000);
        let output;
        if (lang === 'javascript') {
          // Use Node.js to eval
          const tmpFile = `/tmp/exec_${Date.now()}.mjs`;
          const { writeFileSync, unlinkSync } = await import('fs');
          writeFileSync(tmpFile, input.code);
          try {
            output = execSync(`node "${tmpFile}"`, { timeout, encoding: 'utf8', stdio: 'pipe' });
          } finally {
            try { unlinkSync(tmpFile); } catch { /* ignore */ }
          }
        } else if (lang === 'python') {
          output = execSync(`python3 -c ${JSON.stringify(input.code)}`, { timeout, encoding: 'utf8', stdio: 'pipe' });
        } else if (lang === 'bash') {
          output = execSync(input.code, { timeout, encoding: 'utf8', stdio: 'pipe', shell: '/bin/bash' });
        } else {
          throw new Error(`Unsupported language: ${lang}`);
        }
        return { result: JSON.stringify({ status: 'success', output: String(output).slice(0, 10000), language: lang }) };
      }

      case 'calculate': {
        // Safe math evaluation using Function constructor (no imports, no system calls)
        const expr = input.expression.replace(/[^0-9+\-*/.()%^ ,eE]/g, '');
        const result = Function(`"use strict"; return (${expr})`)();
        return { result: JSON.stringify({ status: 'success', expression: input.expression, result }) };
      }

      case 'get_current_time': {
        const tz     = input.timezone || 'UTC';
        const format = input.format || 'human';
        const now    = new Date();
        let formatted;
        if (format === 'iso') {
          formatted = now.toISOString();
        } else {
          formatted = now.toLocaleString('en-US', { timeZone: tz, dateStyle: 'full', timeStyle: 'long' });
        }
        return { result: JSON.stringify({ status: 'success', timezone: tz, time: formatted, unix: Math.floor(now.getTime() / 1000) }) };
      }

      case 'get_weather': {
        const units = input.units === 'imperial' ? 'u' : 'm';
        const loc   = encodeURIComponent(input.location);
        const url   = `https://wttr.in/${loc}?format=j1&${units}=1`;
        const { body } = await fetchUrl(url, 10000);
        let weather;
        try {
          const data    = JSON.parse(body);
          const current = data.current_condition?.[0];
          weather = {
            location:    input.location,
            temp_c:      current?.temp_C,
            temp_f:      current?.temp_F,
            description: current?.weatherDesc?.[0]?.value,
            humidity:    current?.humidity,
            wind_kmph:   current?.windspeedKmph,
            feels_like_c: current?.FeelsLikeC,
          };
        } catch { weather = { raw: body.slice(0, 500) }; }
        return { result: JSON.stringify({ status: 'success', weather }) };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isCoreUtilityTool = (name) =>
  CORE_UTILITY_TOOL_DEFINITIONS.some(t => t.name === name);
