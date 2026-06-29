/**
 * WEB & FRONTEND TOOLS — 7 tools
 * web_analyze, web_scaffold, web_optimize, web_transform, web_screenshot, web_lighthouse, web_scrape
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http  from 'http';
import { execSync } from 'child_process';
import { URL } from 'url';

export const WEB_FRONTEND_TOOL_DEFINITIONS = [
  {
    name: 'web_analyze',
    description: 'Analyze HTML/CSS/JS: check accessibility (a11y), SEO, performance hints, validate HTML.',
    input_schema: {
      type: 'object',
      properties: {
        content:   { type: 'string', description: 'HTML content to analyze' },
        path:      { type: 'string', description: 'Path to HTML file' },
        url:       { type: 'string', description: 'URL to fetch and analyze' },
        checks:    { type: 'array', items: { type: 'string', enum: ['a11y', 'seo', 'performance', 'security', 'links', 'meta'] },
                     description: 'Analysis checks to run (default: all)' },
      },
      required: [],
    },
  },
  {
    name: 'web_scaffold',
    description: 'Generate React/Next.js components, pages, hooks, or API routes from templates.',
    input_schema: {
      type: 'object',
      properties: {
        type:      { type: 'string', enum: ['react_component', 'next_page', 'next_api_route', 'react_hook', 'context', 'form', 'layout', 'card'],
                     description: 'Scaffold type' },
        name:      { type: 'string', description: 'Component/page/hook name (PascalCase)' },
        output:    { type: 'string', description: 'Output file path' },
        props:     { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, type: { type: 'string' } } }, description: 'Component props list' },
        typescript:{ type: 'boolean', description: 'Generate TypeScript (default: true)' },
        with_styles:{ type: 'boolean', description: 'Include Tailwind classes (default: true)' },
        with_tests:{ type: 'boolean', description: 'Generate test file (default: false)' },
      },
      required: ['type', 'name'],
    },
  },
  {
    name: 'web_optimize',
    description: 'Generate SEO meta tags, Open Graph, sitemap.xml, robots.txt, PWA manifest.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['meta_tags', 'open_graph', 'sitemap', 'robots_txt', 'pwa_manifest', 'structured_data'],
                     description: 'SEO/optimization operation' },
        site_url:  { type: 'string', description: 'Site base URL (e.g. https://example.com)' },
        title:     { type: 'string', description: 'Page/site title' },
        description: { type: 'string', description: 'Meta description' },
        pages:     { type: 'array', items: { type: 'string' }, description: 'Page paths for sitemap' },
        output:    { type: 'string', description: 'Output file path (optional)' },
        data:      { type: 'object', description: 'Additional metadata' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'web_transform',
    description: 'CSS transformations: generate Tailwind config, dark mode toggle, CSS variables, color palette.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['tailwind_config', 'dark_mode', 'css_vars', 'color_palette', 'reset_css', 'theme_tokens'],
                     description: 'CSS transformation' },
        colors:    { type: 'object', description: 'Color palette object {primary: "#...", ...}' },
        fonts:     { type: 'array', items: { type: 'string' }, description: 'Font families' },
        output:    { type: 'string', description: 'Output file path' },
        mode:      { type: 'string', enum: ['class', 'media'], description: 'Dark mode strategy (default: class)' },
        content:   { type: 'string', description: 'Existing CSS content to transform' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'web_screenshot',
    description: 'Take a screenshot of a URL using headless Playwright or Puppeteer.',
    input_schema: {
      type: 'object',
      properties: {
        url:        { type: 'string', description: 'URL to screenshot' },
        output:     { type: 'string', description: 'Output image path' },
        viewport:   { type: 'object', properties: { width: { type: 'number' }, height: { type: 'number' } }, description: 'Viewport size (default: 1280x720)' },
        wait_ms:    { type: 'number', description: 'Wait time after load in ms (default: 1000)' },
        full_page:  { type: 'boolean', description: 'Full page screenshot (default: false)' },
        device:     { type: 'string', description: 'Device emulation (e.g. "iPhone 13")' },
      },
      required: ['url', 'output'],
    },
  },
  {
    name: 'web_lighthouse',
    description: 'Run Google Lighthouse audit on a URL for performance, accessibility, SEO scores.',
    input_schema: {
      type: 'object',
      properties: {
        url:        { type: 'string', description: 'URL to audit' },
        categories: { type: 'array', items: { type: 'string', enum: ['performance', 'accessibility', 'seo', 'pwa', 'best-practices'] },
                      description: 'Categories to audit (default: all)' },
        output_path:{ type: 'string', description: 'Path to save JSON report (optional)' },
        mobile:     { type: 'boolean', description: 'Use mobile emulation (default: desktop)' },
      },
      required: ['url'],
    },
  },
  {
    name: 'web_scrape',
    description: 'Fetch a webpage and extract content: full HTML, text, links, images, meta, structured data.',
    input_schema: {
      type: 'object',
      properties: {
        url:       { type: 'string', description: 'URL to scrape' },
        extract:   { type: 'array', items: { type: 'string', enum: ['html', 'text', 'links', 'images', 'meta', 'headings', 'structured_data'] },
                     description: 'Data to extract (default: text, links, meta)' },
        css_selector: { type: 'string', description: 'CSS selector to extract specific element' },
        follow_links: { type: 'boolean', description: 'Follow and scrape linked pages (depth 1)' },
        timeout:   { type: 'number', description: 'Request timeout in ms (default: 10000)' },
      },
      required: ['url'],
    },
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function fetchUrl(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(url); } catch (e) { return reject(new Error(`Invalid URL: ${url}`)); }
    const requester = parsed.protocol === 'https:' ? https : http;
    let data = '';
    const req = requester.get(url, { timeout }, (res) => {
      res.on('data', c => { data += c; });
      res.on('end',  () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error',   reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
  });
}

function parseHtmlMeta(html) {
  const meta = {};
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (title) meta.title = title[1].trim();
  for (const m of html.matchAll(/<meta\s+(?:[^>]*\s+)?(?:name|property)="([^"]+)"[^>]*content="([^"]+)"/gi)) {
    meta[m[1]] = m[2];
  }
  return meta;
}

function extractLinks(html, baseUrl) {
  return [...html.matchAll(/href="([^"]+)"/gi)].map(m => {
    try { return new URL(m[1], baseUrl).href; } catch { return m[1]; }
  }).filter((v, i, a) => a.indexOf(v) === i);
}

function extractText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .trim();
}

function extractImages(html, baseUrl) {
  return [...html.matchAll(/<img[^>]+src="([^"]+)"[^>]*(?:alt="([^"]*)")?/gi)].map(m => ({
    src: m[1] ? (m[1].startsWith('http') ? m[1] : new URL(m[1], baseUrl).href) : m[1],
    alt: m[2] || '',
  }));
}

// ============================================================================
// COMPONENT SCAFFOLDING
// ============================================================================

function propsToTs(props = []) {
  if (!props.length) return '';
  return `interface Props {\n${props.map(p => `  ${p.name}: ${p.type || 'string'}`).join(';\n')};\n}\n\n`;
}

const SCAFFOLDS = {
  react_component: ({ name, props = [], typescript = true, with_styles = true }) => {
    const ts   = typescript !== false;
    const propsInterface = ts ? propsToTs(props) : '';
    const propsParam     = props.length ? `{ ${props.map(p => p.name).join(', ')} }` : '';
    const propsType      = ts && props.length ? ': Props' : '';
    return `${ts ? "import React from 'react';\n\n" : ""}${propsInterface}export default function ${name}(${propsParam}${propsType}) {
  return (
    <div${with_styles !== false ? ' className="flex flex-col gap-4 p-4"' : ''}>
      <h2${with_styles !== false ? ' className="text-xl font-semibold"' : ''}>${name}</h2>
    </div>
  );
}
`;
  },
  next_page: ({ name, typescript = true }) => `${typescript !== false ? "import type { NextPage } from 'next';\n\n" : ''}const ${name}Page${typescript !== false ? ': NextPage' : ''} = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">${name}</h1>
    </main>
  );
};

export default ${name}Page;
`,
  next_api_route: ({ name }) => `import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
  try {
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
`,
  react_hook: ({ name }) => {
    const hookName = name.startsWith('use') ? name : `use${name}`;
    return `import { useState, useEffect } from 'react';

export function ${hookName}() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    // Add your side effect here
  }, []);

  return { data, loading, error };
}
`;
  },
  context: ({ name }) => `import { createContext, useContext, useState } from 'react';

const ${name}Context = createContext(null);

export function ${name}Provider({ children }) {
  const [state, setState] = useState({});
  return (
    <${name}Context.Provider value={{ state, setState }}>
      {children}
    </${name}Context.Provider>
  );
}

export const use${name} = () => {
  const ctx = useContext(${name}Context);
  if (!ctx) throw new Error('use${name} must be used inside ${name}Provider');
  return ctx;
};
`,
  form: ({ name, props = [] }) => `import { useState } from 'react';

export default function ${name}Form({ onSubmit }) {
  const [form, setForm] = useState(${JSON.stringify(Object.fromEntries((props || []).map(p => [p.name, ''])), null, 2)});

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit?.(form); };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
${(props || [{ name: 'value' }]).map(p => `      <input name="${p.name}" value={form.${p.name}} onChange={handleChange} placeholder="${p.name}" className="border rounded p-2" />`).join('\n')}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
    </form>
  );
}
`,
  card: ({ name }) => `export default function ${name}Card({ title, description, children, className = '' }) {
  return (
    <div className={\`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 \${className}\`}>
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      {description && <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{description}</p>}
      {children}
    </div>
  );
}
`,
  layout: ({ name }) => `export default function ${name}Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
`,
};

// ============================================================================
// EXECUTORS
// ============================================================================

export async function executeWebFrontendTool(toolName, input, ctx = {}) {
  const root = ctx.workspaceRoot || process.cwd();

  try {
    switch (toolName) {

      case 'web_analyze': {
        let html = input.content;
        if (!html && input.path) html = fs.readFileSync(path.resolve(root, input.path), 'utf8');
        if (!html && input.url)  { const res = await fetchUrl(input.url); html = res.body; }
        if (!html) throw new Error('content, path, or url required');

        const checks  = input.checks || ['a11y', 'seo', 'performance', 'security', 'meta'];
        const issues  = [];
        const meta    = parseHtmlMeta(html);

        if (checks.includes('a11y')) {
          if (!html.includes('alt='))                   issues.push({ type: 'a11y', severity: 'warning', msg: 'Images may be missing alt attributes' });
          if (!html.includes('<h1'))                    issues.push({ type: 'a11y', severity: 'warning', msg: 'No h1 heading found' });
          if (!html.includes('role=') && !html.includes('aria-')) issues.push({ type: 'a11y', severity: 'info',    msg: 'No ARIA roles found — consider adding landmarks' });
        }
        if (checks.includes('seo')) {
          if (!meta.title)                              issues.push({ type: 'seo', severity: 'error', msg: 'Missing <title> tag' });
          if (!meta.description)                        issues.push({ type: 'seo', severity: 'error', msg: 'Missing meta description' });
          if (!meta['og:title'])                        issues.push({ type: 'seo', severity: 'warning', msg: 'Missing Open Graph title' });
          if (!html.includes('canonical'))              issues.push({ type: 'seo', severity: 'info', msg: 'No canonical link tag' });
        }
        if (checks.includes('performance')) {
          const scriptCount = (html.match(/<script/gi) || []).length;
          if (scriptCount > 10)                         issues.push({ type: 'performance', severity: 'warning', msg: `${scriptCount} script tags found — consider bundling` });
          if (!html.includes('loading="lazy"'))         issues.push({ type: 'performance', severity: 'info', msg: 'Images not using lazy loading' });
        }
        if (checks.includes('security')) {
          if (!html.includes('Content-Security-Policy') && !html.includes('meta http-equiv')) issues.push({ type: 'security', severity: 'info', msg: 'No CSP meta tag found' });
          if (html.includes('javascript:'))             issues.push({ type: 'security', severity: 'error', msg: 'Inline javascript: links found (XSS risk)' });
        }

        return { result: JSON.stringify({ status: 'success', issues, issue_count: issues.length, meta }) };
      }

      case 'web_scaffold': {
        const generator = SCAFFOLDS[input.type];
        if (!generator) throw new Error(`Unknown scaffold type: ${input.type}`);
        const code    = generator(input);
        const ts      = input.typescript !== false;
        const ext     = ts ? 'tsx' : 'jsx';
        const outPath = input.output ? path.resolve(root, input.output) : null;
        if (outPath) {
          fs.mkdirSync(path.dirname(outPath), { recursive: true });
          fs.writeFileSync(outPath, code);
        }
        return { result: JSON.stringify({ status: 'success', code, path: outPath, type: input.type }) };
      }

      case 'web_optimize': {
        const base    = input.site_url || 'https://example.com';
        const title   = input.title || 'My Site';
        const desc    = input.description || '';
        let output;

        switch (input.operation) {
          case 'meta_tags':
          case 'open_graph':
            output = `<!-- SEO Meta Tags -->
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="description" content="${desc}" />
<meta name="robots" content="index, follow" />
<title>${title}</title>

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:url" content="${base}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="${base}/og-image.png" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${desc}" />`;
            break;
          case 'sitemap':
            output = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${(input.pages || ['/']).map(p => `  <url>
    <loc>${base}${p}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;
            break;
          case 'robots_txt':
            output = `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml`;
            break;
          case 'pwa_manifest':
            output = JSON.stringify({ name: title, short_name: title.split(' ')[0], start_url: '/', display: 'standalone', background_color: '#ffffff', theme_color: '#000000', icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }] }, null, 2);
            break;
          default:
            output = `<!-- ${input.operation} not implemented yet -->`;
        }

        if (input.output) {
          fs.mkdirSync(path.dirname(path.resolve(root, input.output)), { recursive: true });
          fs.writeFileSync(path.resolve(root, input.output), output);
        }
        return { result: JSON.stringify({ status: 'success', output, path: input.output }) };
      }

      case 'web_transform': {
        const colors = input.colors || { primary: '#3b82f6', secondary: '#6366f1', accent: '#06b6d4' };
        let output;

        switch (input.operation) {
          case 'tailwind_config':
            output = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './app/**/*.{js,ts,jsx,tsx}'],
  darkMode: ${JSON.stringify(input.mode || 'class')},
  theme: {
    extend: {
      colors: ${JSON.stringify(colors, null, 6)},
      fontFamily: ${JSON.stringify({ sans: [...(input.fonts || ['Inter']), 'ui-sans-serif', 'system-ui'] }, null, 6)},
    },
  },
  plugins: [],
};`;
            break;
          case 'css_vars':
          case 'theme_tokens':
            output = `:root {\n${Object.entries(colors).map(([k, v]) => `  --color-${k}: ${v};`).join('\n')}\n}`;
            if (input.mode === 'class') output += `\n.dark {\n${Object.entries(colors).map(([k, v]) => `  --color-${k}-dark: ${v};`).join('\n')}\n}`;
            break;
          case 'dark_mode':
            output = `/* Dark mode toggle utility */\n.dark { color-scheme: dark; }\n@media (prefers-color-scheme: dark) {\n  :root { color-scheme: dark; }\n}`;
            break;
          case 'reset_css':
            output = `*, *::before, *::after { box-sizing: border-box; }\nbody { margin: 0; font-family: system-ui, sans-serif; -webkit-font-smoothing: antialiased; }\nimg { max-width: 100%; height: auto; }\nbutton { cursor: pointer; }\na { color: inherit; }`;
            break;
          default:
            output = `/* ${input.operation} */`;
        }

        if (input.output) {
          fs.mkdirSync(path.dirname(path.resolve(root, input.output)), { recursive: true });
          fs.writeFileSync(path.resolve(root, input.output), output);
        }
        return { result: JSON.stringify({ status: 'success', output, path: input.output }) };
      }

      case 'web_screenshot': {
        // Try playwright first, then puppeteer
        const outPath = path.resolve(root, input.output);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        try {
          const vw = input.viewport?.width  || 1280;
          const vh = input.viewport?.height || 720;
          const script = `
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page    = await browser.newPage();
  await page.setViewportSize({ width: ${vw}, height: ${vh} });
  await page.goto(${JSON.stringify(input.url)}, { waitUntil: 'networkidle' });
  if (${input.wait_ms || 1000}) await page.waitForTimeout(${input.wait_ms || 1000});
  await page.screenshot({ path: ${JSON.stringify(outPath)}, fullPage: ${!!input.full_page} });
  await browser.close();
})();`;
          const tmpScript = `/tmp/screenshot_${Date.now()}.js`;
          fs.writeFileSync(tmpScript, script);
          execSync(`node "${tmpScript}" 2>&1`, { timeout: 30000 });
          fs.unlinkSync(tmpScript);
          return { result: JSON.stringify({ status: 'success', path: outPath }) };
        } catch {
          return { result: JSON.stringify({ status: 'error', error: 'Playwright not available. Install: npm install playwright && npx playwright install chromium' }) };
        }
      }

      case 'web_lighthouse': {
        const cats = (input.categories || ['performance', 'accessibility', 'seo', 'best-practices']).join(',');
        const flag = input.mobile ? '--emulated-form-factor=mobile' : '--emulated-form-factor=desktop';
        const outFlag = input.output_path ? `--output-path="${path.resolve(root, input.output_path)}" --output=json` : '--output=json';
        try {
          const out = execSync(`npx lighthouse "${input.url}" ${flag} --quiet --only-categories=${cats} ${outFlag} 2>&1`, { encoding: 'utf8', timeout: 120000 });
          const report = JSON.parse(out.includes('{') ? out.slice(out.indexOf('{')) : out);
          const scores = {};
          for (const cat of Object.keys(report.categories || {})) {
            scores[cat] = Math.round(report.categories[cat].score * 100);
          }
          return { result: JSON.stringify({ status: 'success', url: input.url, scores }) };
        } catch {
          return { result: JSON.stringify({ status: 'error', error: 'Lighthouse not available. Install: npm install -g lighthouse' }) };
        }
      }

      case 'web_scrape': {
        const res     = await fetchUrl(input.url, input.timeout || 10000);
        const html    = res.body;
        const extract = input.extract || ['text', 'links', 'meta'];
        const result  = { url: input.url, status: res.status };

        if (extract.includes('html'))    result.html     = html.slice(0, 50000);
        if (extract.includes('text'))    result.text     = extractText(html).slice(0, 10000);
        if (extract.includes('links'))   result.links    = extractLinks(html, input.url).slice(0, 100);
        if (extract.includes('images'))  result.images   = extractImages(html, input.url).slice(0, 50);
        if (extract.includes('meta'))    result.meta     = parseHtmlMeta(html);
        if (extract.includes('headings')) {
          result.headings = [...html.matchAll(/<h([1-6])[^>]*>([^<]+)<\/h\1>/gi)].map(m => ({ level: Number(m[1]), text: m[2].trim() }));
        }
        return { result: JSON.stringify({ status: 'success', ...result }) };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isWebFrontendTool = (name) => WEB_FRONTEND_TOOL_DEFINITIONS.some(t => t.name === name);
