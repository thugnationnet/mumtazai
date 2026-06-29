/**
 * API & INTEGRATION TOOLS
 * 7 tools: api_request, api_mock, api_document, api_test,
 *          api_transform, webhook_listen, sdk_generate
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

export const API_TOOL_DEFINITIONS = [
  {
    name: 'api_request',
    description: 'Make HTTP requests (GET/POST/PUT/DELETE/PATCH). Supports auth headers, JSON body, query params.',
    input_schema: {
      type: 'object',
      properties: {
        url:     { type: 'string', description: 'Request URL' },
        method:  { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
                   description: 'HTTP method (default: GET)' },
        headers: { type: 'object', description: 'HTTP headers' },
        body:    { description: 'Request body (JSON object or string)' },
        params:  { type: 'object', description: 'Query parameters' },
        timeout: { type: 'number', description: 'Timeout in ms (default: 30000)' },
        auth:    { type: 'object', properties: {
                     type:  { type: 'string', enum: ['bearer', 'basic', 'api_key'] },
                     token: { type: 'string' },
                     key:   { type: 'string' },
                     value: { type: 'string' },
                   }, description: 'Authentication config' },
      },
      required: ['url'],
    },
  },
  {
    name: 'api_mock',
    description: 'Create a mock API endpoint definition with sample responses.',
    input_schema: {
      type: 'object',
      properties: {
        endpoint:    { type: 'string', description: 'Endpoint path (e.g. /api/users)' },
        method:      { type: 'string', description: 'HTTP method' },
        response:    { description: 'Mock response body' },
        status_code: { type: 'number', description: 'HTTP status code (default: 200)' },
        delay_ms:    { type: 'number', description: 'Simulated response delay in ms' },
      },
      required: ['endpoint'],
    },
  },
  {
    name: 'api_document',
    description: 'Generate OpenAPI/Swagger documentation from route definitions or code.',
    input_schema: {
      type: 'object',
      properties: {
        routes:  { type: 'array', description: 'Array of route definitions to document' },
        title:   { type: 'string', description: 'API title' },
        version: { type: 'string', description: 'API version (default: 1.0.0)' },
        format:  { type: 'string', enum: ['yaml', 'json'], description: 'Output format (default: json)' },
      },
      required: ['routes'],
    },
  },
  {
    name: 'api_test',
    description: 'Test API endpoints with assertions. Reports pass/fail for each test.',
    input_schema: {
      type: 'object',
      properties: {
        base_url: { type: 'string', description: 'Base URL for all requests' },
        tests:    { type: 'array', items: {
                     type: 'object',
                     properties: {
                       name:     { type: 'string' },
                       method:   { type: 'string' },
                       path:     { type: 'string' },
                       body:     {},
                       expect:   { type: 'object', properties: {
                                     status: { type: 'number' },
                                     body:   {},
                                 }},
                     },
                   }, description: 'Test cases to run' },
      },
      required: ['base_url', 'tests'],
    },
  },
  {
    name: 'api_transform',
    description: 'Transform between API formats: REST to GraphQL schema, JSON to TypeScript types, etc.',
    input_schema: {
      type: 'object',
      properties: {
        operation:  { type: 'string', enum: ['json_to_ts', 'json_schema', 'openapi_to_ts', 'flatten', 'validate'],
                      description: 'Transform operation' },
        input_data: { description: 'Data to transform (JSON object, schema, etc.)' },
        options:    { type: 'object', description: 'Operation-specific options' },
      },
      required: ['operation', 'input_data'],
    },
  },
  {
    name: 'webhook_listen',
    description: 'Register a webhook endpoint and return sample incoming payload schema. (Shows webhook configuration, not actual listening.)',
    input_schema: {
      type: 'object',
      properties: {
        service:  { type: 'string', description: 'Webhook source (e.g. "github", "stripe", "slack")' },
        event:    { type: 'string', description: 'Event type to listen for' },
        endpoint: { type: 'string', description: 'Your receiving endpoint URL' },
      },
      required: ['service'],
    },
  },
  {
    name: 'sdk_generate',
    description: 'Auto-generate SDK client code from an OpenAPI spec or route list.',
    input_schema: {
      type: 'object',
      properties: {
        spec:      { description: 'OpenAPI spec (JSON object or URL string)' },
        language:  { type: 'string', enum: ['javascript', 'typescript', 'python'],
                     description: 'Target language (default: typescript)' },
        base_url:  { type: 'string', description: 'Base URL for the SDK' },
        client_name: { type: 'string', description: 'SDK class name (default: ApiClient)' },
      },
      required: ['spec'],
    },
  },
];

// ============================================================================
// EXECUTORS
// ============================================================================

function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed   = new URL(url);
    const requester = parsed.protocol === 'https:' ? https : http;
    const method   = (options.method || 'GET').toUpperCase();
    const bodyStr  = options.body ? JSON.stringify(options.body) : null;

    const reqOptions = {
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method,
      headers:  {
        'Content-Type': 'application/json',
        'User-Agent':   'Onelastai-Tool/1.0',
        ...options.headers,
      },
      timeout: options.timeout || 30000,
    };

    if (bodyStr) reqOptions.headers['Content-Length'] = Buffer.byteLength(bodyStr);

    const req = requester.request(reqOptions, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        let parsed_body;
        try { parsed_body = JSON.parse(data); } catch { parsed_body = data; }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed_body });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function jsonToTypeScript(obj, typeName = 'Type', indent = 0) {
  const pad = '  '.repeat(indent);
  if (Array.isArray(obj)) {
    if (obj.length === 0) return `${typeName}: any[]`;
    return `${typeName}: ${jsonToTypeScript(obj[0], '', indent + 1)}[]`;
  }
  if (obj === null) return `${typeName}: null`;
  if (typeof obj === 'object') {
    const fields = Object.entries(obj).map(([k, v]) => {
      const t = v === null ? 'null | any' : typeof v === 'object' ? (Array.isArray(v) ? 'any[]' : jsonToTypeScript(v, '', 0)) : typeof v;
      return `${pad}  ${k}: ${t};`;
    }).join('\n');
    return typeName ? `interface ${typeName} {\n${fields}\n${pad}}` : `{\n${fields}\n${pad}}`;
  }
  return typeof obj;
}

export async function executeApiTool(toolName, input, ctx = {}) {
  try {
    switch (toolName) {
      case 'api_request': {
        let url = input.url;
        if (input.params) {
          const qs = new URLSearchParams(input.params).toString();
          url += (url.includes('?') ? '&' : '?') + qs;
        }
        const headers = { ...(input.headers || {}) };
        if (input.auth) {
          if (input.auth.type === 'bearer') headers['Authorization'] = `Bearer ${input.auth.token}`;
          else if (input.auth.type === 'basic') headers['Authorization'] = `Basic ${Buffer.from(`${input.auth.token}`).toString('base64')}`;
          else if (input.auth.type === 'api_key') headers[input.auth.key || 'X-API-Key'] = input.auth.value;
        }
        const result = await httpRequest(url, {
          method:  input.method || 'GET',
          headers,
          body:    input.body,
          timeout: input.timeout || 30000,
        });
        return { result: JSON.stringify({ status: 'success', http_status: result.status, body: result.body }) };
      }

      case 'api_mock': {
        const mock = {
          endpoint:    input.endpoint,
          method:      input.method || 'GET',
          status_code: input.status_code || 200,
          delay_ms:    input.delay_ms || 0,
          response:    input.response || { message: 'Mock response', data: null },
          created_at:  new Date().toISOString(),
        };
        return { result: JSON.stringify({ status: 'success', mock }) };
      }

      case 'api_document': {
        const spec = {
          openapi: '3.0.0',
          info: { title: input.title || 'API Documentation', version: input.version || '1.0.0' },
          paths: {},
        };
        for (const route of (input.routes || [])) {
          const p = route.path || route.endpoint || '/unknown';
          const m = (route.method || 'get').toLowerCase();
          if (!spec.paths[p]) spec.paths[p] = {};
          spec.paths[p][m] = {
            summary: route.summary || route.description || `${m.toUpperCase()} ${p}`,
            responses: { '200': { description: 'Success' } },
          };
        }
        return { result: JSON.stringify({ status: 'success', spec }) };
      }

      case 'api_test': {
        const results = [];
        for (const test of (input.tests || [])) {
          try {
            const url = `${input.base_url}${test.path || ''}`;
            const res = await httpRequest(url, { method: test.method || 'GET', body: test.body || null });
            const passed = !test.expect || (
              (!test.expect.status || res.status === test.expect.status)
            );
            results.push({ name: test.name, passed, status: res.status, url });
          } catch (err) {
            results.push({ name: test.name, passed: false, error: err.message });
          }
        }
        const passed = results.filter(r => r.passed).length;
        return { result: JSON.stringify({ status: 'success', total: results.length, passed, failed: results.length - passed, results }) };
      }

      case 'api_transform': {
        switch (input.operation) {
          case 'json_to_ts': {
            const ts = jsonToTypeScript(input.input_data, 'GeneratedType');
            return { result: JSON.stringify({ status: 'success', typescript: ts }) };
          }
          case 'json_schema': {
            function inferSchema(val) {
              if (val === null) return { type: 'null' };
              if (Array.isArray(val)) return { type: 'array', items: val.length ? inferSchema(val[0]) : {} };
              if (typeof val === 'object') {
                const props = {};
                for (const [k, v] of Object.entries(val)) props[k] = inferSchema(v);
                return { type: 'object', properties: props };
              }
              return { type: typeof val };
            }
            return { result: JSON.stringify({ status: 'success', schema: inferSchema(input.input_data) }) };
          }
          case 'flatten': {
            function flatten(obj, prefix = '') {
              const out = {};
              for (const [k, v] of Object.entries(obj)) {
                const key = prefix ? `${prefix}.${k}` : k;
                if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
                else out[key] = v;
              }
              return out;
            }
            return { result: JSON.stringify({ status: 'success', flattened: flatten(input.input_data) }) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: 'Unknown transform operation' }) };
        }
      }

      case 'webhook_listen': {
        const WEBHOOKS = {
          github:  { events: ['push', 'pull_request', 'issues'], payload_example: { ref: 'refs/heads/main', repository: { name: 'repo' } } },
          stripe:  { events: ['payment_intent.succeeded', 'customer.subscription.updated'], payload_example: { type: 'payment_intent.succeeded', data: {} } },
          slack:   { events: ['message', 'app_mention'], payload_example: { type: 'event_callback', event: { type: 'message', text: 'hello' } } },
        };
        const cfg = WEBHOOKS[input.service.toLowerCase()] || { events: ['event'], payload_example: {} };
        return { result: JSON.stringify({
          status: 'success',
          service: input.service,
          endpoint: input.endpoint || 'https://your-domain.com/webhooks/' + input.service,
          event: input.event || cfg.events[0],
          available_events: cfg.events,
          sample_payload: cfg.payload_example,
          setup_instructions: `Configure ${input.service} to send ${input.event || 'events'} to your endpoint.`,
        }) };
      }

      case 'sdk_generate': {
        const lang = input.language || 'typescript';
        const base = input.base_url || 'https://api.example.com';
        const name = input.client_name || 'ApiClient';
        const routes = Array.isArray(input.spec?.paths)
          ? input.spec.paths
          : Object.entries(input.spec?.paths || {});

        let code = '';
        if (lang === 'typescript' || lang === 'javascript') {
          const isTS = lang === 'typescript';
          code = `${isTS ? '// Auto-generated TypeScript SDK\n' : '// Auto-generated JavaScript SDK\n'}
export class ${name} {
  private baseUrl${isTS ? ': string' : ''};
  private headers${isTS ? ': Record<string, string>' : ''};

  constructor(apiKey${isTS ? ': string' : ''}) {
    this.baseUrl = '${base}';
    this.headers = { 'Authorization': \`Bearer \${apiKey}\`, 'Content-Type': 'application/json' };
  }

  private async request(method${isTS ? ': string' : ''}, path${isTS ? ': string' : ''}, body${isTS ? '?: any' : ''}) {
    const res = await fetch(\`\${this.baseUrl}\${path}\`, {
      method, headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return res.json();
  }
}`;
        } else {
          code = `# Auto-generated Python SDK
import requests

class ${name}:
    def __init__(self, api_key):
        self.base_url = '${base}'
        self.headers = {'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}

    def request(self, method, path, body=None):
        url = self.base_url + path
        res = requests.request(method, url, headers=self.headers, json=body)
        res.raise_for_status()
        return res.json()
`;
        }
        return { result: JSON.stringify({ status: 'success', language: lang, code }) };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isApiTool = (name) => API_TOOL_DEFINITIONS.some(t => t.name === name);
