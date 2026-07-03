import React from 'react';
import ToolExecutionPanel, { ToolDefinition } from './ToolExecutionPanel';
import { PreviewContent } from './PanelPreview';

const TOOLS: ToolDefinition[] = [
  {
    id: 'web_search',
    icon: '🔎',
    label: 'Web Search',
    desc: 'Search the web using Google, Bing, DuckDuckGo, or Brave. Get results with titles, URLs, snippets.',
    color: 'cyan',
    fields: [
      { key: 'query', type: 'text', label: 'Search Query', placeholder: 'Next.js deployment best practices', required: true },
      { key: 'engine', type: 'select', label: 'Search Engine', options: ['auto','google','bing','duckduckgo','brave'], default: 'auto' },
      { key: 'num_results', type: 'number', label: 'Number of Results', placeholder: '10', default: 10 },
      { key: 'safe_search', type: 'checkbox', label: 'Safe Search', default: true },
    ],
    buildInput: (v) => ({ query: v.query, engine: v.engine, num_results: Number(v.num_results) || 10, safe_search: v.safe_search === 'true' || v.safe_search === true }),
  },
  {
    id: 'fetch_url',
    icon: '📥',
    label: 'Fetch URL',
    desc: 'Fetch content from a URL. Returns text, HTML, JSON, or headers. Supports custom headers/auth.',
    color: 'blue',
    fields: [
      { key: 'url', type: 'text', label: 'URL', placeholder: 'https://api.example.com/data', required: true },
      { key: 'method', type: 'select', label: 'HTTP Method', options: ['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'], default: 'GET' },
      { key: 'headers', type: 'textarea', label: 'Headers (JSON)', placeholder: '{"Authorization": "Bearer token"}' },
      { key: 'body', type: 'textarea', label: 'Request Body', placeholder: '{"key": "value"}' },
      { key: 'format', type: 'select', label: 'Response Format', options: ['auto','text','json','html','headers','raw'], default: 'auto' },
      { key: 'timeout', type: 'number', label: 'Timeout (ms)', placeholder: '30000', default: 30000 },
    ],
    buildInput: (v) => ({ url: v.url, method: v.method, headers: v.headers, body: v.body, format: v.format, timeout: Number(v.timeout) || 30000 }),
  },
  {
    id: 'web_scrape',
    icon: '🕷️',
    label: 'Web Scraper',
    desc: 'Scrape web pages: extract text, links, images, tables, structured data. CSS/XPath selectors.',
    color: 'emerald',
    fields: [
      { key: 'url', type: 'text', label: 'URL', placeholder: 'https://example.com/page', required: true },
      { key: 'selector', type: 'text', label: 'CSS Selector', placeholder: 'article.content, div.main' },
      { key: 'extract', type: 'select', label: 'Extract', options: ['text','links','images','tables','metadata','all','structured'], default: 'text' },
      { key: 'format', type: 'select', label: 'Output Format', options: ['text','json','markdown','html','csv'], default: 'json' },
      { key: 'wait_for', type: 'text', label: 'Wait for Selector', placeholder: '.loaded-content' },
      { key: 'javascript', type: 'checkbox', label: 'Execute JavaScript', default: false },
    ],
    buildInput: (v) => ({ url: v.url, selector: v.selector, extract: v.extract, format: v.format, wait_for: v.wait_for, javascript: v.javascript === 'true' || v.javascript === true }),
  },
  {
    id: 'web_screenshot',
    icon: '📸',
    label: 'Screenshot',
    desc: 'Capture full-page or element screenshots. Custom viewport, device emulation, PDF export.',
    color: 'violet',
    fields: [
      { key: 'url', type: 'text', label: 'URL', placeholder: 'https://example.com', required: true },
      { key: 'type', type: 'select', label: 'Capture Type', options: ['full_page','viewport','element','pdf'], default: 'full_page' },
      { key: 'selector', type: 'text', label: 'Element Selector (for element type)', placeholder: '#main-content' },
      { key: 'width', type: 'number', label: 'Viewport Width', placeholder: '1920', default: 1920 },
      { key: 'height', type: 'number', label: 'Viewport Height', placeholder: '1080', default: 1080 },
      { key: 'device', type: 'select', label: 'Device Emulation', options: ['none','iPhone 14','iPad Pro','Pixel 7','Galaxy S23'], default: 'none' },
      { key: 'format', type: 'select', label: 'Output Format', options: ['png','jpeg','webp','pdf'], default: 'png' },
    ],
    buildInput: (v) => ({ url: v.url, type: v.type, selector: v.selector, width: Number(v.width) || 1920, height: Number(v.height) || 1080, device: v.device, format: v.format }),
  },
  {
    id: 'web_lighthouse',
    icon: '🏗️',
    label: 'Lighthouse Audit',
    desc: 'Run Google Lighthouse audits: performance, accessibility, SEO, best practices, PWA scores.',
    color: 'amber',
    fields: [
      { key: 'url', type: 'text', label: 'URL', placeholder: 'https://example.com', required: true },
      { key: 'categories', type: 'select', label: 'Categories', options: ['all','performance','accessibility','seo','best-practices','pwa'], default: 'all' },
      { key: 'device', type: 'select', label: 'Device', options: ['mobile','desktop'], default: 'mobile' },
      { key: 'format', type: 'select', label: 'Output Format', options: ['json','html','markdown','summary'], default: 'summary' },
    ],
    buildInput: (v) => ({ url: v.url, categories: v.categories, device: v.device, format: v.format }),
  },
  {
    id: 'web_analyze',
    icon: '🔬',
    label: 'Tech Stack Analyzer',
    desc: 'Detect technologies used on a website: frameworks, CMS, analytics, CDN, hosting, libraries.',
    color: 'pink',
    fields: [
      { key: 'url', type: 'text', label: 'URL', placeholder: 'https://example.com', required: true },
      { key: 'depth', type: 'select', label: 'Analysis Depth', options: ['quick','standard','deep'], default: 'standard' },
      { key: 'format', type: 'select', label: 'Output Format', options: ['json','markdown','table','html'], default: 'markdown' },
    ],
    buildInput: (v) => ({ url: v.url, depth: v.depth, format: v.format }),
  },
  {
    id: 'web_scaffold',
    icon: '🏠',
    label: 'Scaffold Website',
    desc: 'Generate a complete website scaffold: landing page, blog, portfolio, docs, dashboard, e-commerce.',
    color: 'indigo',
    fields: [
      { key: 'template', type: 'select', label: 'Template', options: ['landing','blog','portfolio','docs','dashboard','ecommerce','saas','agency','startup'], default: 'landing', required: true },
      { key: 'framework', type: 'select', label: 'Framework', options: ['html','react','next','vue','nuxt','svelte','astro'], default: 'html' },
      { key: 'styling', type: 'select', label: 'Styling', options: ['tailwind','css','scss','styled-components','chakra','material'], default: 'tailwind' },
      { key: 'name', type: 'text', label: 'Project Name', placeholder: 'my-website', required: true },
      { key: 'features', type: 'text', label: 'Features (comma-separated)', placeholder: 'dark-mode,responsive,animations,seo' },
    ],
    buildInput: (v) => ({ template: v.template, framework: v.framework, styling: v.styling, name: v.name, features: v.features }),
  },
  {
    id: 'web_optimize',
    icon: '⚡',
    label: 'Optimize Assets',
    desc: 'Optimize web assets: minify HTML/CSS/JS, compress images, generate sprites, critical CSS.',
    color: 'yellow',
    fields: [
      { key: 'type', type: 'select', label: 'Asset Type', options: ['html','css','javascript','images','fonts','all'], default: 'all', required: true },
      { key: 'input', type: 'text', label: 'Input Path', placeholder: './dist or ./src/styles.css', required: true },
      { key: 'operation', type: 'select', label: 'Operation', options: ['minify','compress','bundle','tree_shake','critical_css','purge_css','sprite','inline'], default: 'minify' },
      { key: 'output', type: 'text', label: 'Output Path', placeholder: './optimized/' },
    ],
    buildInput: (v) => ({ type: v.type, input: v.input, operation: v.operation, output: v.output }),
  },
  {
    id: 'web_transform',
    icon: '🔄',
    label: 'Transform Content',
    desc: 'Transform web content: HTML to Markdown, RSS to JSON, sitemap generator, meta tag builder.',
    color: 'orange',
    fields: [
      { key: 'operation', type: 'select', label: 'Operation', options: ['html_to_markdown','markdown_to_html','rss_to_json','json_to_rss','sitemap','meta_tags','og_tags','schema_org','robots_txt'], default: 'html_to_markdown', required: true },
      { key: 'input', type: 'textarea', label: 'Input Content or URL', placeholder: '<h1>Title</h1><p>Content...</p>', required: true },
      { key: 'options', type: 'textarea', label: 'Options (JSON)', placeholder: '{"baseUrl": "https://example.com"}' },
    ],
    buildInput: (v) => ({ operation: v.operation, input: v.input, options: v.options }),
  },
];

interface Props {
  onClose?: () => void;
  onRunTool: (message: string) => void;
  onPreviewContent?: (c: PreviewContent) => void;
}

const WebToolsPanel: React.FC<Props> = ({ onClose, onRunTool, onPreviewContent }) => (
  <ToolExecutionPanel
    categoryTitle="Web Tools"
    categorySubtitle="Search, Scrape, Screenshot, Audit & Build"
    categoryColor="cyan"
    tools={TOOLS}
    onClose={onClose}
    onRunTool={onRunTool}
    onPreviewContent={onPreviewContent}
  />
);

export default WebToolsPanel;
