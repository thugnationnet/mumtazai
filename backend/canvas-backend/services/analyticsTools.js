/**
 * ANALYTICS & MONITORING TOOLS — 5 tools
 * analytics_track, analytics_dashboard, log_parse, monitor_health, telemetry_send
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';

// In-memory event store (replaces with DB in production)
const _eventStore = [];
const _metrics    = {};

export const ANALYTICS_TOOL_DEFINITIONS = [
  {
    name: 'analytics_track',
    description: 'Log events, metrics, and user behavior. Stores events with timestamp and metadata.',
    input_schema: {
      type: 'object',
      properties: {
        event:      { type: 'string', description: 'Event name (e.g. "page_view", "button_click")' },
        properties: { type: 'object', description: 'Event properties/metadata' },
        user_id:    { type: 'string', description: 'User identifier (optional)' },
        session_id: { type: 'string', description: 'Session identifier (optional)' },
        category:   { type: 'string', description: 'Event category (optional)' },
      },
      required: ['event'],
    },
  },
  {
    name: 'analytics_dashboard',
    description: 'Query tracked events and return aggregated stats, charts data, or reports.',
    input_schema: {
      type: 'object',
      properties: {
        operation:  { type: 'string', enum: ['summary', 'top_events', 'timeline', 'funnel', 'user_stats', 'export'],
                      description: 'Dashboard operation' },
        event:      { type: 'string', description: 'Filter by event name (optional)' },
        start_time: { type: 'string', description: 'ISO start timestamp filter (optional)' },
        end_time:   { type: 'string', description: 'ISO end timestamp filter (optional)' },
        limit:      { type: 'number', description: 'Max results to return (default: 50)' },
        group_by:   { type: 'string', description: 'Property to group by (optional)' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'log_parse',
    description: 'Parse log files to extract errors, patterns, timelines, and anomalies.',
    input_schema: {
      type: 'object',
      properties: {
        path:      { type: 'string', description: 'Log file path or directory' },
        content:   { type: 'string', description: 'Log content (alternative to path)' },
        format:    { type: 'string', enum: ['auto', 'nginx', 'apache', 'json', 'syslog', 'pm2'],
                     description: 'Log format (default: auto-detect)' },
        operation: { type: 'string', enum: ['errors', 'warnings', 'timeline', 'stats', 'patterns', 'tail'],
                     description: 'Parse operation (default: errors)' },
        limit:     { type: 'number', description: 'Max lines to return (default: 100)' },
        pattern:   { type: 'string', description: 'Custom regex pattern to search for' },
      },
      required: [],
    },
  },
  {
    name: 'monitor_health',
    description: 'Check uptime, response times, and health of services/URLs.',
    input_schema: {
      type: 'object',
      properties: {
        targets: { type: 'array', items: {
                     type: 'object',
                     properties: {
                       url:     { type: 'string', description: 'URL to check' },
                       name:    { type: 'string', description: 'Service name' },
                       timeout: { type: 'number', description: 'Timeout in ms' },
                       expect_status: { type: 'number', description: 'Expected HTTP status (default: 200)' },
                     },
                   }, description: 'Services to check' },
        operation: { type: 'string', enum: ['ping', 'check_all', 'uptime_report'],
                     description: 'Monitor operation (default: check_all)' },
      },
      required: ['targets'],
    },
  },
  {
    name: 'telemetry_send',
    description: 'Send telemetry data to an external analytics endpoint (Mixpanel, Amplitude, custom).',
    input_schema: {
      type: 'object',
      properties: {
        service:    { type: 'string', enum: ['mixpanel', 'amplitude', 'custom', 'console'],
                      description: 'Analytics service' },
        events:     { type: 'array', description: 'Events to send (array of event objects)' },
        api_key:    { type: 'string', description: 'API key for the service' },
        endpoint:   { type: 'string', description: 'Custom endpoint URL (for custom service)' },
        batch_size: { type: 'number', description: 'Batch send size (default: all at once)' },
      },
      required: ['service', 'events'],
    },
  },
];

// ============================================================================
// EXECUTORS
// ============================================================================

function httpPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed    = new URL(url);
    const requester = parsed.protocol === 'https:' ? https : http;
    const data      = JSON.stringify(body);
    const req       = requester.request({
      hostname: parsed.hostname,
      port:     parsed.port,
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers },
      timeout:  10000,
    }, (res) => {
      let d = '';
      res.on('data', c => { d += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function httpGet(url, timeout = 10000) {
  return new Promise((resolve) => {
    const start = Date.now();
    try {
      const parsed    = new URL(url);
      const requester = parsed.protocol === 'https:' ? https : http;
      const req       = requester.get(url, { timeout }, (res) => {
        res.resume(); // drain response
        resolve({ status: res.statusCode, latency_ms: Date.now() - start, up: res.statusCode < 500 });
      });
      req.on('error', () => resolve({ status: 0, latency_ms: Date.now() - start, up: false, error: 'connection_failed' }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 0, latency_ms: timeout, up: false, error: 'timeout' }); });
    } catch (err) {
      resolve({ status: 0, latency_ms: 0, up: false, error: err.message });
    }
  });
}

function parseLogLine(line, format) {
  if (format === 'json') {
    try { return JSON.parse(line); } catch { return { raw: line }; }
  }
  // Auto-detect common patterns
  const errorPat = /\b(error|err|fatal|exception|critical)\b/i;
  const warnPat  = /\b(warn|warning)\b/i;
  const tsPat    = /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})/;
  const tsMatch  = line.match(tsPat);
  return {
    raw:       line,
    timestamp: tsMatch?.[1],
    level:     errorPat.test(line) ? 'error' : warnPat.test(line) ? 'warn' : 'info',
  };
}

export async function executeAnalyticsTool(toolName, input, ctx = {}) {
  const root = ctx.workspaceRoot || process.cwd();

  try {
    switch (toolName) {

      case 'analytics_track': {
        const event = {
          event:      input.event,
          properties: input.properties || {},
          user_id:    input.user_id || ctx.userId || null,
          session_id: input.session_id || null,
          category:   input.category || 'general',
          timestamp:  new Date().toISOString(),
        };
        _eventStore.push(event);
        // Update counter metrics
        _metrics[input.event] = (_metrics[input.event] || 0) + 1;
        return { result: JSON.stringify({ status: 'success', event_id: _eventStore.length - 1, event }) };
      }

      case 'analytics_dashboard': {
        let events = [..._eventStore];
        if (input.event)      events = events.filter(e => e.event === input.event);
        if (input.start_time) events = events.filter(e => e.timestamp >= input.start_time);
        if (input.end_time)   events = events.filter(e => e.timestamp <= input.end_time);
        const limit = input.limit || 50;

        switch (input.operation) {
          case 'summary': {
            return { result: JSON.stringify({
              status: 'success',
              total_events:  _eventStore.length,
              unique_events: Object.keys(_metrics).length,
              event_counts:  _metrics,
              recent:        events.slice(-10),
            }) };
          }
          case 'top_events': {
            const sorted = Object.entries(_metrics).sort((a, b) => b[1] - a[1]).slice(0, limit);
            return { result: JSON.stringify({ status: 'success', top_events: sorted.map(([name, count]) => ({ name, count })) }) };
          }
          case 'timeline': {
            const timeline = {};
            for (const e of events) {
              const day = e.timestamp.slice(0, 10);
              timeline[day] = (timeline[day] || 0) + 1;
            }
            return { result: JSON.stringify({ status: 'success', timeline }) };
          }
          case 'user_stats': {
            const users = {};
            for (const e of events) {
              if (e.user_id) users[e.user_id] = (users[e.user_id] || 0) + 1;
            }
            return { result: JSON.stringify({ status: 'success', unique_users: Object.keys(users).length, user_event_counts: users }) };
          }
          case 'export': {
            return { result: JSON.stringify({ status: 'success', events: events.slice(0, limit) }) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: 'Unknown dashboard operation' }) };
        }
      }

      case 'log_parse': {
        let content = input.content;
        if (!content && input.path) {
          const fp = path.resolve(root, input.path);
          content  = fs.readFileSync(fp, 'utf8');
        }
        if (!content) throw new Error('Either path or content required');

        const lines    = content.split('\n').filter(l => l.trim());
        const fmt      = input.format || 'auto';
        const op       = input.operation || 'errors';
        const limit    = input.limit || 100;
        const parsed   = lines.map(l => parseLogLine(l, fmt));

        switch (op) {
          case 'errors':   return { result: JSON.stringify({ status: 'success', errors:   parsed.filter(l => l.level === 'error').slice(-limit) }) };
          case 'warnings': return { result: JSON.stringify({ status: 'success', warnings: parsed.filter(l => l.level === 'warn').slice(-limit) }) };
          case 'tail':     return { result: JSON.stringify({ status: 'success', lines:    parsed.slice(-limit) }) };
          case 'stats': {
            const counts = { error: 0, warn: 0, info: 0 };
            for (const l of parsed) counts[l.level] = (counts[l.level] || 0) + 1;
            return { result: JSON.stringify({ status: 'success', total_lines: lines.length, counts }) };
          }
          case 'patterns': {
            if (!input.pattern) throw new Error('pattern required for patterns operation');
            const re      = new RegExp(input.pattern, 'gi');
            const matches = parsed.filter(l => re.test(l.raw));
            return { result: JSON.stringify({ status: 'success', matches: matches.slice(0, limit), count: matches.length }) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: 'Unknown log_parse operation' }) };
        }
      }

      case 'monitor_health': {
        const targets = input.targets || [];
        const results = await Promise.all(targets.map(async (t) => {
          const check    = await httpGet(t.url, t.timeout || 10000);
          const expected = t.expect_status || 200;
          return {
            name:       t.name || t.url,
            url:        t.url,
            up:         check.up && check.status === expected,
            status:     check.status,
            latency_ms: check.latency_ms,
            error:      check.error,
          };
        }));
        const up      = results.filter(r => r.up).length;
        const down    = results.filter(r => !r.up).length;
        return { result: JSON.stringify({ status: 'success', checked: results.length, up, down, results }) };
      }

      case 'telemetry_send': {
        if (input.service === 'console') {
          console.log('[Telemetry]', JSON.stringify(input.events, null, 2));
          return { result: JSON.stringify({ status: 'success', sent: input.events.length, service: 'console' }) };
        }
        if (input.service === 'custom' && input.endpoint) {
          const res = await httpPost(input.endpoint, { events: input.events }, input.api_key ? { 'X-API-Key': input.api_key } : {});
          return { result: JSON.stringify({ status: 'success', sent: input.events.length, response_status: res.status }) };
        }
        if (input.service === 'mixpanel' && input.api_key) {
          const data = input.events.map(e => ({ event: e.event, properties: { ...e.properties, token: input.api_key, time: Date.now() } }));
          const encoded = Buffer.from(JSON.stringify(data)).toString('base64');
          const res  = await httpGet(`https://api.mixpanel.com/track?data=${encodeURIComponent(encoded)}`);
          return { result: JSON.stringify({ status: 'success', sent: input.events.length, service: 'mixpanel' }) };
        }
        return { result: JSON.stringify({ status: 'error', error: `Service '${input.service}' requires api_key/endpoint configuration` }) };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isAnalyticsTool = (name) => ANALYTICS_TOOL_DEFINITIONS.some(t => t.name === name);
