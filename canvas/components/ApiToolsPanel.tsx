import React from 'react';
import ToolExecutionPanel, { ToolDefinition } from './ToolExecutionPanel';
import { PreviewContent } from './PanelPreview';

const TOOLS: ToolDefinition[] = [
  {
    id: 'api_request',
    icon: '🌐',
    label: 'HTTP Request',
    desc: 'Send HTTP requests with custom headers, body, and authentication. Supports GET, POST, PUT, PATCH, DELETE.',
    color: 'indigo',
    fields: [
      { key: 'method', type: 'select', label: 'Method', options: ['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'], default: 'GET' },
      { key: 'url', type: 'text', label: 'URL', placeholder: 'https://api.example.com/users', required: true },
      { key: 'headers', type: 'json', label: 'Headers (JSON)', rows: 3, placeholder: '{"Authorization": "Bearer token", "Content-Type": "application/json"}' },
      { key: 'body', type: 'json', label: 'Request Body (JSON)', rows: 4, placeholder: '{"name": "John", "email": "john@example.com"}' },
      { key: 'timeout', type: 'number', label: 'Timeout (ms)', default: 30000, min: 1000, max: 120000 },
    ],
    buildInput: (v) => {
      let headers, body;
      try { headers = v.headers ? JSON.parse(v.headers) : undefined; } catch { headers = undefined; }
      try { body = v.body ? JSON.parse(v.body) : undefined; } catch { body = undefined; }
      return { method: v.method, url: v.url, headers, body, timeout: Number(v.timeout) || 30000 };
    },
  },
  {
    id: 'api_mock',
    icon: '🃏',
    label: 'Mock API Server',
    desc: 'Start a mock API server from an OpenAPI spec or custom route definitions for local testing.',
    color: 'violet',
    fields: [
      { key: 'source', type: 'select', label: 'Source', options: ['spec','routes'], default: 'routes' },
      { key: 'path', type: 'text', label: 'Spec File Path (if from spec)', placeholder: './openapi.yaml' },
      { key: 'port', type: 'number', label: 'Port', default: 3001, min: 1024, max: 65535 },
      { key: 'routes', type: 'json', label: 'Routes Definition (JSON)', rows: 6, placeholder: '[{"method":"GET","path":"/users","response":{"users":[]}}]' },
    ],
    buildInput: (v) => {
      let routes;
      try { routes = v.routes ? JSON.parse(v.routes) : undefined; } catch { routes = undefined; }
      return { source: v.source, path: v.path, port: Number(v.port), routes };
    },
  },
  {
    id: 'api_document',
    icon: '📖',
    label: 'Generate API Docs',
    desc: 'Auto-generate OpenAPI specs, Markdown docs, or Postman collections from your API code.',
    color: 'blue',
    fields: [
      { key: 'source', type: 'select', label: 'Source', options: ['code','spec','routes'], default: 'code' },
      { key: 'path', type: 'text', label: 'Source Path', placeholder: './routes/ or ./openapi.yaml', required: true },
      { key: 'format', type: 'select', label: 'Output Format', options: ['openapi','markdown','postman','html','slate'], default: 'openapi' },
      { key: 'output', type: 'text', label: 'Output File', placeholder: './docs/api.md' },
    ],
    buildInput: (v) => ({ source: v.source, path: v.path, format: v.format, output: v.output }),
  },
  {
    id: 'api_test',
    icon: '🧪',
    label: 'Test API Endpoints',
    desc: 'Run automated tests against your API endpoints. Supports status, body, and header assertions.',
    color: 'emerald',
    fields: [
      { key: 'spec', type: 'text', label: 'Spec / Test File', placeholder: './openapi.yaml or ./tests/api.json' },
      { key: 'base_url', type: 'text', label: 'Base URL', placeholder: 'https://api.example.com', required: true },
      { key: 'filter', type: 'text', label: 'Filter (optional)', placeholder: '/users or GET' },
      { key: 'verbose', type: 'checkbox', label: 'Verbose Output', placeholder: 'Show full request/response details' },
    ],
    buildInput: (v) => ({ spec: v.spec, base_url: v.base_url, filter: v.filter, verbose: !!v.verbose }),
  },
  {
    id: 'api_transform',
    icon: '🔄',
    label: 'Transform / Convert',
    desc: 'Convert between OpenAPI, Postman, GraphQL, RAML, cURL, and other API specification formats.',
    color: 'cyan',
    fields: [
      { key: 'input_format', type: 'select', label: 'Input Format', options: ['openapi','postman','graphql','raml','curl','har','insomnia'], default: 'openapi' },
      { key: 'output_format', type: 'select', label: 'Output Format', options: ['openapi','postman','graphql','raml','curl','markdown','typescript'], default: 'postman' },
      { key: 'content', type: 'json', label: 'Content', rows: 8, placeholder: 'Paste API spec, cURL command, or GraphQL schema...' },
    ],
    buildInput: (v) => ({ input_format: v.input_format, output_format: v.output_format, content: v.content }),
  },
  {
    id: 'webhook_listen',
    icon: '📡',
    label: 'Webhook Listener',
    desc: 'Start a webhook receiver with automatic ngrok tunnel. Captures and logs all incoming requests.',
    color: 'amber',
    fields: [
      { key: 'port', type: 'number', label: 'Port', default: 9090, min: 1024, max: 65535 },
      { key: 'path', type: 'text', label: 'Webhook Path', default: '/webhook', placeholder: '/webhook/github' },
      { key: 'tunnel', type: 'checkbox', label: 'Enable Tunnel', placeholder: 'Create public URL via ngrok' },
      { key: 'secret', type: 'text', label: 'Webhook Secret (optional)', placeholder: 'For HMAC signature verification' },
    ],
    buildInput: (v) => ({ port: Number(v.port), path: v.path, tunnel: !!v.tunnel, secret: v.secret }),
  },
  {
    id: 'sdk_generate',
    icon: '📦',
    label: 'Generate SDK',
    desc: 'Generate a type-safe client SDK from your API spec in TypeScript, Python, Go, Java, Ruby, or PHP.',
    color: 'purple',
    fields: [
      { key: 'spec', type: 'text', label: 'API Spec Path', placeholder: './openapi.yaml', required: true },
      { key: 'language', type: 'select', label: 'Target Language', options: ['typescript','python','go','java','ruby','php','csharp','swift','kotlin'], default: 'typescript' },
      { key: 'output', type: 'text', label: 'Output Directory', placeholder: './sdk/' },
      { key: 'package', type: 'text', label: 'Package Name', placeholder: 'my-api-client' },
    ],
    buildInput: (v) => ({ spec: v.spec, language: v.language, output: v.output, package_name: v.package }),
  },
];

interface Props {
  onClose?: () => void;
  onRunTool: (message: string) => void;
  onPreviewContent?: (c: PreviewContent) => void;
}

const ApiToolsPanel: React.FC<Props> = ({ onClose, onRunTool, onPreviewContent }) => (
  <ToolExecutionPanel
    categoryTitle="API Tools"
    categorySubtitle="Request, Mock, Docs, Test & SDK"
    categoryColor="indigo"
    tools={TOOLS}
    onClose={onClose}
    onRunTool={onRunTool}
    onPreviewContent={onPreviewContent}
  />
);

export default ApiToolsPanel;
