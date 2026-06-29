/**
 * WEB FRONTEND SERVICE
 * ═══════════════════════
 * AI agent capabilities for web & frontend development:
 * - Web analysis (HTML validation, CSS analysis, accessibility, SEO, performance, bundle)
 * - Scaffolding (components, routes, forms, auth, state, API clients, animations)
 * - Optimization (code splitting, lazy loading, meta tags, web vitals, caching)
 * - Transforms (design-to-code, CSS-to-Tailwind, JS-to-TS, dark mode, PWA, responsive)
 *
 * 4 consolidated tools, ~45 actions total.
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.nuxt',
  'dist',
  'build',
  '.cache',
  '.turbo',
  '__pycache__',
  'coverage',
  '.vercel',
  '.netlify',
  '.output',
]);

// Accessibility rules (WCAG 2.1)
const A11Y_RULES = [
  {
    id: 'img-alt',
    pattern: /<img(?![^>]*alt\s*=)[^>]*>/gi,
    message: 'Image missing alt attribute',
    severity: 'error',
  },
  {
    id: 'input-label',
    pattern:
      /<input(?![^>]*(?:aria-label|aria-labelledby|id\s*=\s*["'][^"']*["'][^>]*<label))[^>]*>/gi,
    message: 'Input may be missing associated label',
    severity: 'warning',
  },
  {
    id: 'button-text',
    pattern: /<button[^>]*>\s*<\/button>/gi,
    message: 'Empty button — needs text or aria-label',
    severity: 'error',
  },
  {
    id: 'heading-order',
    pattern: null,
    message: 'Heading levels should not skip (e.g., h1 -> h3)',
    severity: 'warning',
    custom: true,
  },
  {
    id: 'link-text',
    pattern: /<a[^>]*>\s*(?:click here|here|read more|more)\s*<\/a>/gi,
    message: 'Avoid generic link text like "click here"',
    severity: 'warning',
  },
  {
    id: 'tabindex-positive',
    pattern: /tabindex\s*=\s*["'][1-9]/gi,
    message: 'Avoid positive tabindex values',
    severity: 'warning',
  },
  {
    id: 'autocomplete',
    pattern:
      /<input[^>]*type\s*=\s*["'](?:email|password|tel|text)["'][^>]*(?!autocomplete)[^>]*>/gi,
    message: 'Input should have autocomplete attribute',
    severity: 'info',
  },
  {
    id: 'html-lang',
    pattern: /<html(?![^>]*lang\s*=)[^>]*>/gi,
    message: 'HTML element missing lang attribute',
    severity: 'error',
  },
  {
    id: 'viewport-meta',
    pattern: null,
    message: 'Page should have viewport meta tag',
    severity: 'warning',
    custom: true,
  },
  {
    id: 'color-contrast',
    pattern: null,
    message: 'Check color contrast ratios meet WCAG AA (4.5:1 for text)',
    severity: 'info',
    custom: true,
  },
];

// SEO rules
const SEO_RULES = [
  {
    id: 'title',
    pattern: /<title>[^<]+<\/title>/i,
    required: true,
    message: 'Page should have a <title> tag',
  },
  {
    id: 'meta-description',
    pattern: /<meta[^>]*name\s*=\s*["']description["'][^>]*>/i,
    required: true,
    message: 'Page should have a meta description',
  },
  {
    id: 'h1',
    pattern: /<h1[^>]*>/i,
    required: true,
    message: 'Page should have exactly one <h1>',
  },
  {
    id: 'canonical',
    pattern: /<link[^>]*rel\s*=\s*["']canonical["'][^>]*>/i,
    required: false,
    message: 'Consider adding a canonical URL',
  },
  {
    id: 'og-title',
    pattern: /<meta[^>]*property\s*=\s*["']og:title["'][^>]*>/i,
    required: false,
    message: 'Missing Open Graph title',
  },
  {
    id: 'og-description',
    pattern: /<meta[^>]*property\s*=\s*["']og:description["'][^>]*>/i,
    required: false,
    message: 'Missing Open Graph description',
  },
  {
    id: 'og-image',
    pattern: /<meta[^>]*property\s*=\s*["']og:image["'][^>]*>/i,
    required: false,
    message: 'Missing Open Graph image',
  },
  {
    id: 'twitter-card',
    pattern: /<meta[^>]*name\s*=\s*["']twitter:card["'][^>]*>/i,
    required: false,
    message: 'Missing Twitter Card meta',
  },
  {
    id: 'robots',
    pattern: /<meta[^>]*name\s*=\s*["']robots["'][^>]*>/i,
    required: false,
    message: 'Consider adding robots meta tag',
  },
  {
    id: 'structured-data',
    pattern: /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>/i,
    required: false,
    message: 'Consider adding structured data (JSON-LD)',
  },
];

// Component templates
const COMPONENT_TEMPLATES = {
  react_functional: (name, props) => `import React from 'react';

interface ${name}Props {
${props.map((p) => `  ${p.name}${p.required ? '' : '?'}: ${p.type};`).join('\n')}
}

export function ${name}({ ${props.map((p) => p.name).join(', ')} }: ${name}Props) {
  return (
    <div className="${camelToKebab(name)}">
      {/* TODO: Implement ${name} */}
    </div>
  );
}

export default ${name};
`,

  react_with_state: (name, props) => `'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface ${name}Props {
${props.map((p) => `  ${p.name}${p.required ? '' : '?'}: ${p.type};`).join('\n')}
}

export function ${name}({ ${props.map((p) => p.name).join(', ')} }: ${name}Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Initialize component
  }, []);

  if (loading) return <div className="${camelToKebab(name)} loading">Loading...</div>;
  if (error) return <div className="${camelToKebab(name)} error">{error}</div>;

  return (
    <div className="${camelToKebab(name)}">
      {/* TODO: Implement ${name} */}
    </div>
  );
}

export default ${name};
`,

  nextjs_page: (name, props) => `import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${name}',
  description: '${name} page',
};

interface ${name}PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ${name}Page({ params, searchParams }: ${name}PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;

  return (
    <main className="${camelToKebab(name)}-page">
      <h1>${name}</h1>
      {/* TODO: Implement ${name} page */}
    </main>
  );
}
`,

  nextjs_layout: (name) => `import { ReactNode } from 'react';

interface ${name}LayoutProps {
  children: ReactNode;
}

export default function ${name}Layout({ children }: ${name}LayoutProps) {
  return (
    <div className="${camelToKebab(name)}-layout">
      {children}
    </div>
  );
}
`,

  nextjs_loading: () => `export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}
`,

  nextjs_error: (name) => `'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ${name}Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-semibold">Something went wrong!</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
`,

  nextjs_api_route: (
    name
  ) => `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement GET handler
    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    console.error('${name} GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Implement POST handler
    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    console.error('${name} POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
`,

  react_hook: (
    name
  ) => `import { useState, useEffect, useCallback } from 'react';

interface Use${name}Options {
  // TODO: Define options
}

interface Use${name}Return {
  loading: boolean;
  error: string | null;
  // TODO: Define return type
}

export function use${name}(options?: Use${name}Options): Use${name}Return {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Implement hook logic
  }, []);

  return {
    loading,
    error,
  };
}
`,

  zustand_store: (name) => `import { create } from 'zustand';

interface ${name}State {
  loading: boolean;
  error: string | null;
  // TODO: Define state
}

interface ${name}Actions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  // TODO: Define actions
}

type ${name}Store = ${name}State & ${name}Actions;

const initialState: ${name}State = {
  loading: false,
  error: null,
};

export const use${name}Store = create<${name}Store>((set, get) => ({
  ...initialState,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
`,

  context_provider: (name) => `'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ${name}ContextType {
  // TODO: Define context type
}

const ${name}Context = createContext<${name}ContextType | undefined>(undefined);

interface ${name}ProviderProps {
  children: ReactNode;
}

export function ${name}Provider({ children }: ${name}ProviderProps) {
  // TODO: Implement provider

  const value: ${name}ContextType = {
    // TODO: Provide values
  };

  return (
    <${name}Context.Provider value={value}>
      {children}
    </${name}Context.Provider>
  );
}

export function use${name}() {
  const context = useContext(${name}Context);
  if (context === undefined) {
    throw new Error('use${name} must be used within a ${name}Provider');
  }
  return context;
}
`,
};

// ═══════════════════════════════════════════════════════════════════
// TOOL 5: web_analyze
// ═══════════════════════════════════════════════════════════════════
// Actions: html_validate, css_analyze, accessibility_audit, responsive_audit, seo_audit, performance_audit, bundle_analyze

export async function webAnalyze(params, userId) {
  const action = params.action;
  try {
    switch (action) {
      // ── HTML VALIDATE ──────────────────────────────────────────────
      case 'html_validate': {
        const filePath = params.file || params.path;
        const content =
          params.content ||
          (filePath ? await fs.readFile(filePath, 'utf8') : null);
        if (!content)
          return { success: false, error: 'file or content is required' };

        const issues = [];

        // Structural checks
        if (!/<html[^>]*>/i.test(content))
          issues.push({
            severity: 'error',
            rule: 'missing-html',
            message: 'Missing <html> tag',
          });
        if (!/<head[^>]*>/i.test(content))
          issues.push({
            severity: 'error',
            rule: 'missing-head',
            message: 'Missing <head> tag',
          });
        if (!/<body[^>]*>/i.test(content))
          issues.push({
            severity: 'error',
            rule: 'missing-body',
            message: 'Missing <body> tag',
          });
        if (!/<meta[^>]*charset/i.test(content))
          issues.push({
            severity: 'warning',
            rule: 'missing-charset',
            message: 'Missing charset meta tag',
          });
        if (!/<meta[^>]*viewport/i.test(content))
          issues.push({
            severity: 'warning',
            rule: 'missing-viewport',
            message: 'Missing viewport meta tag',
          });
        if (!/<!DOCTYPE/i.test(content))
          issues.push({
            severity: 'warning',
            rule: 'missing-doctype',
            message: 'Missing DOCTYPE declaration',
          });

        // Semantic checks
        const semanticTags = [
          'header',
          'nav',
          'main',
          'footer',
          'article',
          'section',
          'aside',
        ];
        const usedSemantic = semanticTags.filter((tag) =>
          new RegExp(`<${tag}[\\s>]`, 'i').test(content)
        );
        const missingSemantic = semanticTags.filter(
          (tag) => !usedSemantic.includes(tag)
        );
        if (usedSemantic.length < 3) {
          issues.push({
            severity: 'info',
            rule: 'semantic-html',
            message: `Consider using more semantic elements: ${missingSemantic.join(', ')}`,
          });
        }

        // Deprecated tags
        const deprecated = [
          'center',
          'font',
          'marquee',
          'blink',
          'frame',
          'frameset',
          'strike',
          'u',
          'big',
        ];
        for (const tag of deprecated) {
          if (new RegExp(`<${tag}[\\s>]`, 'i').test(content)) {
            issues.push({
              severity: 'warning',
              rule: 'deprecated-tag',
              message: `Deprecated <${tag}> tag found — use CSS instead`,
            });
          }
        }

        // Duplicate IDs
        const idPattern = /id\s*=\s*["']([^"']+)["']/gi;
        const ids = new Map();
        let match;
        while ((match = idPattern.exec(content)) !== null) {
          const id = match[1];
          ids.set(id, (ids.get(id) || 0) + 1);
        }
        for (const [id, count] of ids) {
          if (count > 1)
            issues.push({
              severity: 'error',
              rule: 'duplicate-id',
              message: `Duplicate id="${id}" found ${count} times`,
            });
        }

        // Unclosed tags (basic check)
        const selfClosing = new Set([
          'br',
          'hr',
          'img',
          'input',
          'meta',
          'link',
          'area',
          'base',
          'col',
          'embed',
          'source',
          'track',
          'wbr',
        ]);
        const openTags =
          content.match(/<([a-z][a-z0-9]*)[^>]*(?<!\/)\s*>/gi) || [];
        const closeTags = content.match(/<\/([a-z][a-z0-9]*)\s*>/gi) || [];
        const openCounts = {};
        const closeCounts = {};
        for (const tag of openTags) {
          const name = tag.match(/<([a-z][a-z0-9]*)/i)?.[1]?.toLowerCase();
          if (name && !selfClosing.has(name))
            openCounts[name] = (openCounts[name] || 0) + 1;
        }
        for (const tag of closeTags) {
          const name = tag.match(/<\/([a-z][a-z0-9]*)/i)?.[1]?.toLowerCase();
          if (name) closeCounts[name] = (closeCounts[name] || 0) + 1;
        }
        for (const [tag, count] of Object.entries(openCounts)) {
          const closeCount = closeCounts[tag] || 0;
          if (count > closeCount)
            issues.push({
              severity: 'warning',
              rule: 'unclosed-tag',
              message: `Potentially unclosed <${tag}> (${count} open, ${closeCount} close)`,
            });
        }

        const counts = { error: 0, warning: 0, info: 0 };
        for (const issue of issues) counts[issue.severity]++;

        return {
          success: true,
          action: 'html_validate',
          file: filePath || '(content)',
          totalIssues: issues.length,
          counts,
          semanticScore: Math.round(
            (usedSemantic.length / semanticTags.length) * 100
          ),
          usedSemanticTags: usedSemantic,
          issues,
        };
      }

      // ── CSS ANALYZE ────────────────────────────────────────────────
      case 'css_analyze': {
        const filePath = params.file || params.path;
        const content =
          params.content ||
          (filePath ? await fs.readFile(filePath, 'utf8') : null);
        if (!content)
          return { success: false, error: 'file or content is required' };

        const issues = [];
        const lines = content.split('\n');

        // Variables
        const variables = [];
        const varPattern = /(--[\w-]+)\s*:\s*([^;]+);/g;
        while ((match = varPattern.exec(content)) !== null) {
          variables.push({ name: match[1], value: match[2].trim() });
        }

        // Selectors
        const selectors = [];
        const selectorPattern = /([^{}@/]+)\{/g;
        while ((match = selectorPattern.exec(content)) !== null) {
          const sel = match[1].trim();
          if (sel && !sel.startsWith('/*') && !sel.startsWith('//')) {
            // Calculate specificity (simplified)
            const ids = (sel.match(/#/g) || []).length;
            const classes = (sel.match(/[.:\[]/g) || []).length;
            const elements = (sel.match(/(?:^|[\s>+~])([a-z])/gi) || []).length;
            selectors.push({
              selector: sel,
              specificity: `${ids}-${classes}-${elements}`,
            });
          }
        }

        // Media queries
        const mediaQueries = [];
        const mediaPattern = /@media\s*\(([^)]+)\)/g;
        while ((match = mediaPattern.exec(content)) !== null) {
          mediaQueries.push(match[1].trim());
        }

        // Check for issues
        // !important usage
        const importantCount = (content.match(/!important/g) || []).length;
        if (importantCount > 0) {
          issues.push({
            severity: 'warning',
            rule: 'no-important',
            message: `${importantCount} uses of !important found — prefer specificity`,
          });
        }

        // Vendor prefixes (should use autoprefixer)
        const vendorPrefixes = (content.match(/-(?:webkit|moz|ms|o)-/g) || [])
          .length;
        if (vendorPrefixes > 3) {
          issues.push({
            severity: 'info',
            rule: 'vendor-prefixes',
            message: `${vendorPrefixes} vendor prefixes found — consider using autoprefixer`,
          });
        }

        // ID selectors (high specificity)
        const idSelectors = selectors.filter((s) => s.selector.includes('#'));
        if (idSelectors.length > 3) {
          issues.push({
            severity: 'info',
            rule: 'no-id-selectors',
            message: `${idSelectors.length} ID selectors found — prefer classes for lower specificity`,
          });
        }

        // Deep nesting
        const deepSelectors = selectors.filter(
          (s) => (s.selector.match(/\s/g) || []).length > 3
        );
        if (deepSelectors.length > 0) {
          issues.push({
            severity: 'warning',
            rule: 'max-nesting',
            message: `${deepSelectors.length} deeply nested selectors — keep under 3 levels`,
          });
        }

        // Duplicate properties
        const ruleBlocks = content.match(/\{[^}]+\}/g) || [];
        for (const block of ruleBlocks) {
          const props = block.match(/[\w-]+\s*:/g) || [];
          const propNames = props.map((p) => p.replace(':', '').trim());
          const dupes = propNames.filter((p, i) => propNames.indexOf(p) !== i);
          if (
            dupes.length > 0 &&
            dupes.some((d) => d !== '-webkit-' && d !== '-moz-')
          ) {
            issues.push({
              severity: 'warning',
              rule: 'duplicate-properties',
              message: `Duplicate properties: ${[...new Set(dupes)].join(', ')}`,
            });
          }
        }

        return {
          success: true,
          action: 'css_analyze',
          file: filePath || '(content)',
          stats: {
            totalLines: lines.length,
            totalSelectors: selectors.length,
            totalVariables: variables.length,
            totalMediaQueries: mediaQueries.length,
            importantCount,
            vendorPrefixes,
          },
          variables: variables.slice(0, 50),
          mediaQueries: [...new Set(mediaQueries)],
          highSpecificity: selectors
            .filter((s) => s.specificity.startsWith('1'))
            .slice(0, 20),
          issues,
        };
      }

      // ── ACCESSIBILITY AUDIT ────────────────────────────────────────
      case 'accessibility_audit': {
        const filePath = params.file || params.path;
        const content =
          params.content ||
          (filePath ? await fs.readFile(filePath, 'utf8') : null);
        if (!content)
          return { success: false, error: 'file or content is required' };

        const issues = [];

        // Pattern-based checks
        for (const rule of A11Y_RULES) {
          if (rule.custom) {
            // Custom checks
            if (rule.id === 'heading-order') {
              const headings = [];
              const headingPattern = /<(h[1-6])[^>]*>/gi;
              while ((match = headingPattern.exec(content)) !== null) {
                headings.push(parseInt(match[1][1]));
              }
              for (let i = 1; i < headings.length; i++) {
                if (headings[i] - headings[i - 1] > 1) {
                  issues.push({
                    severity: rule.severity,
                    rule: rule.id,
                    message: `Heading skip: h${headings[i - 1]} → h${headings[i]}`,
                  });
                }
              }
            }
            if (rule.id === 'viewport-meta') {
              if (!/<meta[^>]*viewport/i.test(content)) {
                issues.push({
                  severity: rule.severity,
                  rule: rule.id,
                  message: rule.message,
                });
              }
            }
            continue;
          }

          if (rule.pattern) {
            const matches = content.match(rule.pattern) || [];
            if (matches.length > 0) {
              issues.push({
                severity: rule.severity,
                rule: rule.id,
                message: rule.message,
                count: matches.length,
              });
            }
          }
        }

        // ARIA usage analysis
        const ariaAttributes = content.match(/aria-[\w-]+/g) || [];
        const roles = (content.match(/role\s*=\s*["']([^"']+)["']/g) || []).map(
          (r) => r.match(/["']([^"']+)["']/)?.[1]
        );

        // Focus management
        const focusableElements = (
          content.match(/<(?:a|button|input|select|textarea)[^>]*>/gi) || []
        ).length;
        const tabindexElements = (content.match(/tabindex/gi) || []).length;

        // Score (0-100)
        const maxPenalty = issues.reduce((sum, i) => {
          if (i.severity === 'error') return sum + 20;
          if (i.severity === 'warning') return sum + 10;
          return sum + 5;
        }, 0);
        const score = Math.max(0, 100 - maxPenalty);

        return {
          success: true,
          action: 'accessibility_audit',
          file: filePath || '(content)',
          score,
          grade:
            score >= 90
              ? 'A'
              : score >= 70
                ? 'B'
                : score >= 50
                  ? 'C'
                  : score >= 30
                    ? 'D'
                    : 'F',
          totalIssues: issues.length,
          ariaUsage: {
            attributes: [...new Set(ariaAttributes)],
            roles: [...new Set(roles)],
          },
          focusManagement: { focusableElements, tabindexElements },
          issues,
        };
      }

      // ── RESPONSIVE AUDIT ───────────────────────────────────────────
      case 'responsive_audit': {
        const dir = params.directory || params.path || '.';
        const issues = [];
        const breakpoints = new Set();
        const responsivePatterns = {
          mediaQueries: 0,
          flexbox: 0,
          grid: 0,
          relativeUnits: 0,
          fixedWidths: 0,
          viewportUnits: 0,
        };

        async function scanDir(dirPath) {
          let entries;
          try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
          } catch {
            return;
          }
          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
              if (!IGNORE_DIRS.has(entry.name)) await scanDir(fullPath);
              continue;
            }
            const ext = path.extname(entry.name).toLowerCase();
            if (
              !['.css', '.scss', '.less', '.tsx', '.jsx', '.html'].includes(ext)
            )
              continue;

            try {
              const content = await fs.readFile(fullPath, 'utf8');

              // Media queries
              const mediaMatches = content.match(/@media\s*\([^)]+\)/g) || [];
              responsivePatterns.mediaQueries += mediaMatches.length;
              for (const m of mediaMatches) {
                const bp = m.match(/(\d+)\s*px/)?.[1];
                if (bp) breakpoints.add(parseInt(bp));
              }

              // Layout patterns
              responsivePatterns.flexbox += (
                content.match(/display\s*:\s*flex|className.*flex/g) || []
              ).length;
              responsivePatterns.grid += (
                content.match(/display\s*:\s*grid|className.*grid/g) || []
              ).length;
              responsivePatterns.relativeUnits += (
                content.match(/\d+(?:em|rem|%|vw|vh)/g) || []
              ).length;
              responsivePatterns.fixedWidths += (
                content.match(/width\s*:\s*\d+px/g) || []
              ).length;
              responsivePatterns.viewportUnits += (
                content.match(/\d+(?:vw|vh|vmin|vmax)/g) || []
              ).length;

              // Tailwind responsive
              const tailwindResponsive = (
                content.match(/(?:sm|md|lg|xl|2xl):/g) || []
              ).length;
              if (tailwindResponsive > 0)
                responsivePatterns.mediaQueries += tailwindResponsive;
            } catch {
              continue;
            }
          }
        }

        await scanDir(dir);

        // Generate issues
        if (
          responsivePatterns.mediaQueries === 0 &&
          responsivePatterns.flexbox === 0
        ) {
          issues.push({
            severity: 'error',
            message:
              'No responsive patterns detected — site may not work on mobile',
          });
        }
        if (responsivePatterns.fixedWidths > 10) {
          issues.push({
            severity: 'warning',
            message: `${responsivePatterns.fixedWidths} fixed pixel widths found — use relative units`,
          });
        }
        if (breakpoints.size === 0) {
          issues.push({
            severity: 'warning',
            message:
              'No breakpoints detected — consider adding responsive breakpoints',
          });
        }

        const sortedBreakpoints = [...breakpoints].sort((a, b) => a - b);

        return {
          success: true,
          action: 'responsive_audit',
          directory: dir,
          patterns: responsivePatterns,
          breakpoints: sortedBreakpoints,
          issues,
          recommendations: generateResponsiveRecommendations(
            responsivePatterns,
            sortedBreakpoints
          ),
        };
      }

      // ── SEO AUDIT ──────────────────────────────────────────────────
      case 'seo_audit': {
        const filePath = params.file || params.path;
        const content =
          params.content ||
          (filePath ? await fs.readFile(filePath, 'utf8') : null);
        if (!content)
          return { success: false, error: 'file or content is required' };

        const issues = [];
        const found = {};

        for (const rule of SEO_RULES) {
          const hasMatch = rule.pattern.test(content);
          found[rule.id] = hasMatch;
          if (!hasMatch) {
            issues.push({
              severity: rule.required ? 'error' : 'info',
              rule: rule.id,
              message: rule.message,
            });
          }
        }

        // Additional checks
        const title = content.match(/<title>([^<]+)<\/title>/i)?.[1];
        if (title) {
          if (title.length < 30)
            issues.push({
              severity: 'warning',
              rule: 'title-length',
              message: `Title too short (${title.length} chars) — aim for 30-60 chars`,
            });
          if (title.length > 70)
            issues.push({
              severity: 'warning',
              rule: 'title-length',
              message: `Title too long (${title.length} chars) — keep under 60 chars`,
            });
        }

        const desc = content.match(
          /<meta[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']+)["']/i
        )?.[1];
        if (desc) {
          if (desc.length < 70)
            issues.push({
              severity: 'warning',
              rule: 'desc-length',
              message: `Description too short (${desc.length} chars) — aim for 120-160 chars`,
            });
          if (desc.length > 170)
            issues.push({
              severity: 'warning',
              rule: 'desc-length',
              message: `Description too long (${desc.length} chars) — keep under 160 chars`,
            });
        }

        // Image alt tags for SEO
        const images = content.match(/<img[^>]*>/gi) || [];
        const imagesWithAlt = images.filter((img) =>
          /alt\s*=\s*["'][^"']+["']/i.test(img)
        );

        // Score
        const maxScore = SEO_RULES.length * 10;
        const score = Math.round(
          (Object.values(found).filter(Boolean).length / SEO_RULES.length) * 100
        );

        return {
          success: true,
          action: 'seo_audit',
          file: filePath || '(content)',
          score,
          grade:
            score >= 90
              ? 'A'
              : score >= 70
                ? 'B'
                : score >= 50
                  ? 'C'
                  : score >= 30
                    ? 'D'
                    : 'F',
          title: title || null,
          description: desc || null,
          imageStats: { total: images.length, withAlt: imagesWithAlt.length },
          checks: found,
          issues,
        };
      }

      // ── PERFORMANCE AUDIT ──────────────────────────────────────────
      case 'performance_audit': {
        const dir = params.directory || params.path || '.';
        const issues = [];
        const stats = {
          totalJsSize: 0,
          totalCssSize: 0,
          totalImageSize: 0,
          jsFiles: 0,
          cssFiles: 0,
          imageFiles: 0,
          largeFiles: [],
        };

        const imageExts = new Set([
          '.png',
          '.jpg',
          '.jpeg',
          '.gif',
          '.webp',
          '.svg',
          '.ico',
          '.bmp',
          '.avif',
        ]);
        const jsExts = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs']);
        const cssExts = new Set(['.css', '.scss', '.less']);

        async function scanDir(dirPath) {
          let entries;
          try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
          } catch {
            return;
          }
          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
              if (!IGNORE_DIRS.has(entry.name)) await scanDir(fullPath);
              continue;
            }
            const ext = path.extname(entry.name).toLowerCase();
            try {
              const stat = await fs.stat(fullPath);
              if (jsExts.has(ext)) {
                stats.totalJsSize += stat.size;
                stats.jsFiles++;
              } else if (cssExts.has(ext)) {
                stats.totalCssSize += stat.size;
                stats.cssFiles++;
              } else if (imageExts.has(ext)) {
                stats.totalImageSize += stat.size;
                stats.imageFiles++;
              }

              if (stat.size > 500 * 1024) {
                stats.largeFiles.push({
                  file: fullPath,
                  size: stat.size,
                  sizeHuman: formatBytes(stat.size),
                });
              }
            } catch {
              continue;
            }
          }
        }

        await scanDir(dir);

        // Check for optimization patterns in code
        let hasLazyLoading = false;
        let hasCodeSplitting = false;
        let hasNextImage = false;

        async function checkOptimizations(dirPath) {
          let entries;
          try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
          } catch {
            return;
          }
          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
              if (!IGNORE_DIRS.has(entry.name))
                await checkOptimizations(fullPath);
              continue;
            }
            if (!jsExts.has(path.extname(entry.name).toLowerCase())) continue;
            try {
              const content = await fs.readFile(fullPath, 'utf8');
              if (/React\.lazy|dynamic\s*\(|lazy\s*\(/.test(content))
                hasCodeSplitting = true;
              if (/loading\s*=\s*["']lazy["']/.test(content))
                hasLazyLoading = true;
              if (/from\s*["']next\/image["']|<Image\s/.test(content))
                hasNextImage = true;
            } catch {
              continue;
            }
          }
        }
        await checkOptimizations(dir);

        if (!hasCodeSplitting)
          issues.push({
            severity: 'warning',
            rule: 'code-splitting',
            message:
              'No code splitting detected — use React.lazy() or dynamic imports',
          });
        if (!hasLazyLoading)
          issues.push({
            severity: 'info',
            rule: 'lazy-loading',
            message:
              'No lazy loading on images — add loading="lazy" to non-critical images',
          });
        if (stats.totalJsSize > 1024 * 1024)
          issues.push({
            severity: 'warning',
            rule: 'js-size',
            message: `Total JS size is ${formatBytes(stats.totalJsSize)} — consider code splitting`,
          });
        if (stats.totalImageSize > 5 * 1024 * 1024)
          issues.push({
            severity: 'warning',
            rule: 'image-size',
            message: `Total image size is ${formatBytes(stats.totalImageSize)} — optimize images`,
          });
        if (stats.largeFiles.length > 0)
          issues.push({
            severity: 'info',
            rule: 'large-files',
            message: `${stats.largeFiles.length} files over 500KB — review for optimization`,
          });

        return {
          success: true,
          action: 'performance_audit',
          directory: dir,
          stats: {
            ...stats,
            totalJsSizeHuman: formatBytes(stats.totalJsSize),
            totalCssSizeHuman: formatBytes(stats.totalCssSize),
            totalImageSizeHuman: formatBytes(stats.totalImageSize),
          },
          optimizations: { hasCodeSplitting, hasLazyLoading, hasNextImage },
          issues,
        };
      }

      // ── BUNDLE ANALYZE ─────────────────────────────────────────────
      case 'bundle_analyze': {
        const dir = params.directory || params.path || '.';

        // Read package.json for dependencies
        let pkgJson = null;
        try {
          const raw = await fs.readFile(path.join(dir, 'package.json'), 'utf8');
          pkgJson = JSON.parse(raw);
        } catch {
          return { success: false, error: 'No package.json found' };
        }

        const deps = Object.keys(pkgJson.dependencies || {});
        const devDeps = Object.keys(pkgJson.devDependencies || {});

        // Known heavy packages and their lighter alternatives
        const heavyPackages = {
          moment: {
            size: '~300KB',
            alternative: 'dayjs (~2KB) or date-fns (~tree-shakeable)',
          },
          lodash: {
            size: '~70KB',
            alternative: 'lodash-es (tree-shakeable) or native JS',
          },
          underscore: {
            size: '~20KB',
            alternative: 'native JavaScript methods',
          },
          jquery: { size: '~90KB', alternative: 'native DOM API' },
          axios: { size: '~14KB', alternative: 'native fetch API' },
          uuid: { size: '~11KB', alternative: 'crypto.randomUUID()' },
          classnames: {
            size: '~1KB',
            alternative: 'clsx (~500B) or template literals',
          },
          request: { size: '~220KB', alternative: 'native fetch or undici' },
          bluebird: { size: '~80KB', alternative: 'native Promises' },
          chalk: { size: '~20KB', alternative: 'picocolors (~1KB)' },
        };

        const warnings = [];
        for (const dep of deps) {
          if (heavyPackages[dep]) {
            const info = heavyPackages[dep];
            warnings.push({
              package: dep,
              estimatedSize: info.size,
              suggestion: `Consider replacing with ${info.alternative}`,
            });
          }
        }

        // Check for duplicate-ish packages
        const duplicateGroups = {
          'HTTP clients': deps.filter((d) =>
            [
              'axios',
              'got',
              'node-fetch',
              'undici',
              'request',
              'superagent',
            ].includes(d)
          ),
          'Date libraries': deps.filter((d) =>
            ['moment', 'dayjs', 'date-fns', 'luxon'].includes(d)
          ),
          'CSS-in-JS': deps.filter((d) =>
            [
              'styled-components',
              '@emotion/react',
              '@emotion/styled',
              'styled-jsx',
              'linaria',
            ].includes(d)
          ),
          'State managers': deps.filter((d) =>
            [
              'redux',
              '@reduxjs/toolkit',
              'mobx',
              'zustand',
              'jotai',
              'recoil',
              'valtio',
            ].includes(d)
          ),
        };
        const activeDupes = Object.entries(duplicateGroups).filter(
          ([, pkgs]) => pkgs.length > 1
        );

        return {
          success: true,
          action: 'bundle_analyze',
          directory: dir,
          dependencies: deps.length,
          devDependencies: devDeps.length,
          heavyPackages: warnings,
          duplicateCategories: activeDupes.map(([category, pkgs]) => ({
            category,
            packages: pkgs,
            suggestion: `Consider consolidating to one ${category.toLowerCase()} library`,
          })),
          treeShakeability: {
            esModules: deps.filter((d) =>
              ['lodash-es', '@headlessui/react', '@radix-ui'].some((p) =>
                d.startsWith(p)
              )
            ),
            potentiallyNonTreeShakeable: deps.filter((d) =>
              ['lodash', 'moment', 'antd'].includes(d)
            ),
          },
        };
      }

      default:
        return {
          success: false,
          error: `Unknown web_analyze action: ${action}`,
        };
    }
  } catch (err) {
    return { success: false, action, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 6: web_scaffold
// ═══════════════════════════════════════════════════════════════════
// Actions: component, route, form, auth_flow, state_store, api_client, hook, context

export async function webScaffold(params, userId) {
  const action = params.action;
  try {
    switch (action) {
      // ── COMPONENT ──────────────────────────────────────────────────
      case 'component': {
        const name = params.name;
        const template = params.template || 'react_functional';
        const props = params.props || [];
        const outputDir = params.directory || params.path || '.';

        if (!name) return { success: false, error: 'name is required' };

        const templateFn = COMPONENT_TEMPLATES[template];
        if (!templateFn) {
          return {
            success: false,
            error: `Unknown template: ${template}. Available: ${Object.keys(COMPONENT_TEMPLATES).join(', ')}`,
          };
        }

        const parsedProps = props.map((p) => {
          if (typeof p === 'string') {
            const match = p.match(/^(\w+)(\?)?:\s*(.+)$/);
            return match
              ? { name: match[1], required: !match[2], type: match[3] }
              : { name: p, required: false, type: 'any' };
          }
          return p;
        });

        const code = templateFn(name, parsedProps);
        const fileName = `${name}.tsx`;
        const filePath = path.join(outputDir, fileName);

        return {
          success: true,
          action: 'component',
          template,
          name,
          fileName,
          outputPath: filePath,
          code,
          props: parsedProps,
        };
      }

      // ── ROUTE ──────────────────────────────────────────────────────
      case 'route': {
        const name = params.name;
        const framework = params.framework || 'nextjs';
        const outputDir = params.directory || params.path || '.';
        const withLayout = params.options?.withLayout ?? false;
        const withLoading = params.options?.withLoading ?? true;
        const withError = params.options?.withError ?? true;
        const withApi = params.options?.withApi ?? false;

        if (!name) return { success: false, error: 'name is required' };

        const files = [];
        const pascalName = name.charAt(0).toUpperCase() + name.slice(1);

        if (framework === 'nextjs') {
          files.push({
            path: path.join(outputDir, name, 'page.tsx'),
            content: COMPONENT_TEMPLATES.nextjs_page(pascalName, []),
          });
          if (withLayout) {
            files.push({
              path: path.join(outputDir, name, 'layout.tsx'),
              content: COMPONENT_TEMPLATES.nextjs_layout(pascalName),
            });
          }
          if (withLoading) {
            files.push({
              path: path.join(outputDir, name, 'loading.tsx'),
              content: COMPONENT_TEMPLATES.nextjs_loading(),
            });
          }
          if (withError) {
            files.push({
              path: path.join(outputDir, name, 'error.tsx'),
              content: COMPONENT_TEMPLATES.nextjs_error(pascalName),
            });
          }
          if (withApi) {
            files.push({
              path: path.join(outputDir, 'api', name, 'route.ts'),
              content: COMPONENT_TEMPLATES.nextjs_api_route(pascalName),
            });
          }
        }

        return {
          success: true,
          action: 'route',
          framework,
          name,
          files: files.map((f) => ({ path: f.path, content: f.content })),
          totalFiles: files.length,
        };
      }

      // ── FORM ───────────────────────────────────────────────────────
      case 'form': {
        const name = params.name || 'ContactForm';
        const fields = params.fields || [];
        const validation = params.options?.validation ?? 'zod';
        const multiStep = params.options?.multiStep ?? false;

        if (fields.length === 0) {
          return {
            success: false,
            error:
              'fields array is required (e.g., [{name: "email", type: "email", required: true}])',
          };
        }

        // Generate Zod schema
        let zodSchema = "import { z } from 'zod';\n\n";
        zodSchema += `const ${name}Schema = z.object({\n`;
        for (const field of fields) {
          let validator = 'z.string()';
          if (field.type === 'email') validator = 'z.string().email()';
          else if (field.type === 'number') validator = 'z.number()';
          else if (field.type === 'url') validator = 'z.string().url()';
          else if (field.type === 'tel')
            validator =
              'z.string().regex(/^\\+?[\\d\\s-]+$/, "Invalid phone number")';
          else if (field.type === 'textarea') validator = 'z.string().min(10)';
          if (field.maxLength) validator += `.max(${field.maxLength})`;
          if (field.minLength) validator += `.min(${field.minLength})`;
          if (!field.required) validator += '.optional()';
          zodSchema += `  ${field.name}: ${validator},\n`;
        }
        zodSchema += `});\n\ntype ${name}Data = z.infer<typeof ${name}Schema>;\n`;

        // Generate form component
        let formCode =
          "'use client';\n\nimport React, { useState } from 'react';\nimport { useForm } from 'react-hook-form';\nimport { zodResolver } from '@hookform/resolvers/zod';\n";
        formCode += zodSchema;
        formCode += `\nexport function ${name}() {\n`;
        formCode += `  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<${name}Data>({\n`;
        formCode += `    resolver: zodResolver(${name}Schema),\n  });\n\n`;
        formCode += `  const onSubmit = async (data: ${name}Data) => {\n    try {\n      // TODO: Submit form\n      console.log(data);\n    } catch (error) {\n      console.error(error);\n    }\n  };\n\n`;
        formCode +=
          '  return (\n    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">\n';

        for (const field of fields) {
          const inputType = field.type === 'textarea' ? 'textarea' : 'input';
          formCode += '      <div>\n';
          formCode += `        <label htmlFor="${field.name}" className="block text-sm font-medium">\n`;
          formCode += `          ${field.label || field.name}${field.required ? ' *' : ''}\n        </label>\n`;
          if (inputType === 'textarea') {
            formCode += `        <textarea\n          id="${field.name}"\n          {...register('${field.name}')}\n          className="mt-1 block w-full rounded-md border px-3 py-2"\n          rows={4}\n        />\n`;
          } else {
            formCode += `        <input\n          id="${field.name}"\n          type="${field.type || 'text'}"\n          {...register('${field.name}')}\n          className="mt-1 block w-full rounded-md border px-3 py-2"\n          ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}\n        />\n`;
          }
          formCode += `        {errors.${field.name} && (\n          <p className="mt-1 text-sm text-red-500">{errors.${field.name}?.message}</p>\n        )}\n      </div>\n`;
        }

        formCode +=
          '      <button\n        type="submit"\n        disabled={isSubmitting}\n        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"\n      >\n        {isSubmitting ? \'Submitting...\' : \'Submit\'}\n      </button>\n    </form>\n  );\n}\n';

        return {
          success: true,
          action: 'form',
          name,
          fields,
          validation,
          code: formCode,
          dependencies: ['react-hook-form', 'zod', '@hookform/resolvers'],
        };
      }

      // ── AUTH FLOW ──────────────────────────────────────────────────
      case 'auth_flow': {
        const provider = params.provider || 'jwt';
        const name = params.name || 'Auth';

        const files = {};

        // Auth context/provider
        files['AuthProvider.tsx'] = `'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    setUser(data.user);
  }

  async function signup(email: string, password: string, name: string) {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) throw new Error('Signup failed');
    const data = await res.json();
    setUser(data.user);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
`;

        files['ProtectedRoute.tsx'] = `'use client';

import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
`;

        files['LoginForm.tsx'] = `'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Sign In</h2>
      {error && <p className="text-red-500">{error}</p>}
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full px-3 py-2 border rounded-md" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full px-3 py-2 border rounded-md" />
      <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50">
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
`;

        return {
          success: true,
          action: 'auth_flow',
          provider,
          files: Object.entries(files).map(([name, content]) => ({
            name,
            content,
          })),
          totalFiles: Object.keys(files).length,
        };
      }

      // ── STATE STORE ────────────────────────────────────────────────
      case 'state_store': {
        const name = params.name;
        const stateLib = params.library || 'zustand';

        if (!name) return { success: false, error: 'name is required' };

        const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
        let code;

        if (stateLib === 'zustand') {
          code = COMPONENT_TEMPLATES.zustand_store(pascalName);
        } else if (stateLib === 'context') {
          code = COMPONENT_TEMPLATES.context_provider(pascalName);
        } else {
          return {
            success: false,
            error: `Unsupported library: ${stateLib}. Use: zustand, context`,
          };
        }

        return {
          success: true,
          action: 'state_store',
          name: pascalName,
          library: stateLib,
          code,
          dependencies: stateLib === 'zustand' ? ['zustand'] : [],
        };
      }

      // ── API CLIENT ─────────────────────────────────────────────────
      case 'api_client': {
        const baseUrl = params.baseUrl || '/api';
        const name = params.name || 'api';
        const endpoints = params.endpoints || [];

        let code = `// Auto-generated API client\n\nconst BASE_URL = '${baseUrl}';\n\n`;
        code +=
          'type RequestOptions = {\n  headers?: Record<string, string>;\n  signal?: AbortSignal;\n};\n\n';

        code +=
          'async function request<T>(method: string, path: string, body?: any, options?: RequestOptions): Promise<T> {\n';
        code +=
          "  const res = await fetch(`${BASE_URL}${path}`, {\n    method,\n    headers: {\n      'Content-Type': 'application/json',\n      ...options?.headers,\n    },\n    credentials: 'include',\n    ...(body ? { body: JSON.stringify(body) } : {}),\n    signal: options?.signal,\n  });\n";
        code +=
          '  if (!res.ok) {\n    const error = await res.json().catch(() => ({ message: res.statusText }));\n    throw new Error(error.message || `Request failed: ${res.status}`);\n  }\n  return res.json();\n}\n\n';

        code += `export const ${name} = {\n`;

        if (endpoints.length > 0) {
          for (const ep of endpoints) {
            const method = (ep.method || 'GET').toUpperCase();
            const fnName =
              ep.name || ep.path.replace(/\//g, '_').replace(/^_/, '');

            if (method === 'GET') {
              code += `  ${fnName}: (params?: Record<string, string>, options?: RequestOptions) => {\n`;
              code +=
                "    const query = params ? '?' + new URLSearchParams(params).toString() : '';\n";
              code += `    return request<any>('GET', '${ep.path}' + query, undefined, options);\n  },\n\n`;
            } else {
              code += `  ${fnName}: (body: any, options?: RequestOptions) =>\n`;
              code += `    request<any>('${method}', '${ep.path}', body, options),\n\n`;
            }
          }
        } else {
          // Generate generic CRUD
          code +=
            '  getAll: (resource: string, params?: Record<string, string>, options?: RequestOptions) => {\n';
          code +=
            "    const query = params ? '?' + new URLSearchParams(params).toString() : '';\n";
          code +=
            "    return request<any[]>('GET', `/${resource}` + query, undefined, options);\n  },\n\n";
          code +=
            '  getOne: (resource: string, id: string, options?: RequestOptions) =>\n';
          code +=
            "    request<any>('GET', `/${resource}/${id}`, undefined, options),\n\n";
          code +=
            '  create: (resource: string, body: any, options?: RequestOptions) =>\n';
          code +=
            "    request<any>('POST', `/${resource}`, body, options),\n\n";
          code +=
            '  update: (resource: string, id: string, body: any, options?: RequestOptions) =>\n';
          code +=
            "    request<any>('PUT', `/${resource}/${id}`, body, options),\n\n";
          code +=
            '  remove: (resource: string, id: string, options?: RequestOptions) =>\n';
          code +=
            "    request<any>('DELETE', `/${resource}/${id}`, undefined, options),\n";
        }

        code += '};\n';

        return {
          success: true,
          action: 'api_client',
          name,
          baseUrl,
          code,
          endpoints: endpoints.length,
        };
      }

      // ── HOOK ───────────────────────────────────────────────────────
      case 'hook': {
        const name = params.name;
        if (!name) return { success: false, error: 'name is required' };
        const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
        const code = COMPONENT_TEMPLATES.react_hook(pascalName);
        return {
          success: true,
          action: 'hook',
          name: `use${pascalName}`,
          code,
        };
      }

      // ── CONTEXT ────────────────────────────────────────────────────
      case 'context': {
        const name = params.name;
        if (!name) return { success: false, error: 'name is required' };
        const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
        const code = COMPONENT_TEMPLATES.context_provider(pascalName);
        return {
          success: true,
          action: 'context',
          name: `${pascalName}Provider`,
          code,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown web_scaffold action: ${action}`,
        };
    }
  } catch (err) {
    return { success: false, action, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 7: web_optimize
// ═══════════════════════════════════════════════════════════════════
// Actions: meta_tags, sitemap, robots_txt, manifest, service_worker, lighthouse_config, caching_strategy

export async function webOptimize(params, userId) {
  const action = params.action;
  try {
    switch (action) {
      // ── META TAGS ──────────────────────────────────────────────────
      case 'meta_tags': {
        const title = params.title;
        const description = params.description;
        const url = params.url || '';
        const image = params.image || '';
        const siteName = params.siteName || '';
        const type = params.type || 'website';
        const twitterHandle = params.twitterHandle || '';

        if (!title || !description)
          return {
            success: false,
            error: 'title and description are required',
          };

        // Generate Next.js metadata export
        const nextjsMetadata = `import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${title}',
  description: '${description}',
  ${url ? `metadataBase: new URL('${url}'),` : ''}
  openGraph: {
    title: '${title}',
    description: '${description}',
    type: '${type}',
    ${url ? `url: '${url}',` : ''}
    ${image ? `images: [{ url: '${image}', width: 1200, height: 630, alt: '${title}' }],` : ''}
    ${siteName ? `siteName: '${siteName}',` : ''}
  },
  twitter: {
    card: 'summary_large_image',
    title: '${title}',
    description: '${description}',
    ${image ? `images: ['${image}'],` : ''}
    ${twitterHandle ? `creator: '${twitterHandle}',` : ''}
  },
};
`;

        // Generate HTML meta tags
        let htmlTags = `<title>${title}</title>\n`;
        htmlTags += `<meta name="description" content="${description}" />\n`;
        htmlTags += `<meta property="og:title" content="${title}" />\n`;
        htmlTags += `<meta property="og:description" content="${description}" />\n`;
        htmlTags += `<meta property="og:type" content="${type}" />\n`;
        if (url) htmlTags += `<meta property="og:url" content="${url}" />\n`;
        if (image)
          htmlTags += `<meta property="og:image" content="${image}" />\n`;
        if (siteName)
          htmlTags += `<meta property="og:site_name" content="${siteName}" />\n`;
        htmlTags +=
          '<meta name="twitter:card" content="summary_large_image" />\n';
        htmlTags += `<meta name="twitter:title" content="${title}" />\n`;
        htmlTags += `<meta name="twitter:description" content="${description}" />\n`;
        if (image)
          htmlTags += `<meta name="twitter:image" content="${image}" />\n`;
        if (twitterHandle)
          htmlTags += `<meta name="twitter:creator" content="${twitterHandle}" />\n`;

        return {
          success: true,
          action: 'meta_tags',
          nextjsMetadata,
          htmlTags,
        };
      }

      // ── SITEMAP ────────────────────────────────────────────────────
      case 'sitemap': {
        const baseUrl = params.baseUrl;
        const pages = params.pages || [];

        if (!baseUrl) return { success: false, error: 'baseUrl is required' };

        // Static sitemap XML
        let xml =
          '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        for (const page of pages) {
          const url = typeof page === 'string' ? page : page.url;
          const priority =
            typeof page === 'object' ? page.priority || '0.8' : '0.8';
          const changefreq =
            typeof page === 'object' ? page.changefreq || 'weekly' : 'weekly';
          xml += `  <url>\n    <loc>${baseUrl}${url}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
        }
        xml += '</urlset>';

        // Next.js dynamic sitemap
        const nextjsSitemap = `import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
${pages
  .map((p) => {
    const url = typeof p === 'string' ? p : p.url;
    const priority = typeof p === 'object' ? p.priority || 0.8 : 0.8;
    const changefreq =
      typeof p === 'object' ? p.changefreq || 'weekly' : 'weekly';
    return `    {\n      url: '${baseUrl}${url}',\n      lastModified: new Date(),\n      changeFrequency: '${changefreq}',\n      priority: ${priority},\n    },`;
  })
  .join('\n')}
  ];
}
`;

        return {
          success: true,
          action: 'sitemap',
          xml,
          nextjsSitemap,
          pages: pages.length,
        };
      }

      // ── ROBOTS.TXT ─────────────────────────────────────────────────
      case 'robots_txt': {
        const baseUrl = params.baseUrl || '';
        const disallow = params.disallow || ['/api/', '/admin/', '/private/'];
        const allow = params.allow || ['/'];

        let content = 'User-agent: *\n';
        for (const a of allow) content += `Allow: ${a}\n`;
        for (const d of disallow) content += `Disallow: ${d}\n`;
        content += `\nSitemap: ${baseUrl}/sitemap.xml\n`;

        // Next.js version
        const nextjsRobots = `import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ${JSON.stringify(allow)},
      disallow: ${JSON.stringify(disallow)},
    },
    sitemap: '${baseUrl}/sitemap.xml',
  };
}
`;

        return { success: true, action: 'robots_txt', content, nextjsRobots };
      }

      // ── MANIFEST ───────────────────────────────────────────────────
      case 'manifest': {
        const name = params.name || 'My App';
        const shortName = params.shortName || name;
        const description = params.description || '';
        const themeColor = params.themeColor || '#000000';
        const bgColor = params.backgroundColor || '#ffffff';
        const display = params.display || 'standalone';
        const startUrl = params.startUrl || '/';

        const manifest = {
          name,
          short_name: shortName,
          description,
          theme_color: themeColor,
          background_color: bgColor,
          display,
          start_url: startUrl,
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: '/icons/icon-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        };

        // Next.js manifest
        const nextjsManifest = `import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return ${JSON.stringify(manifest, null, 4).replace(/"([^"]+)":/g, '$1:')};
}
`;

        return {
          success: true,
          action: 'manifest',
          json: JSON.stringify(manifest, null, 2),
          nextjsManifest,
        };
      }

      // ── SERVICE WORKER ─────────────────────────────────────────────
      case 'service_worker': {
        const cacheName = params.cacheName || 'app-cache-v1';
        const staticAssets = params.staticAssets || ['/', '/offline'];

        const code = `// Service Worker - ${cacheName}
const CACHE_NAME = '${cacheName}';
const STATIC_ASSETS = ${JSON.stringify(staticAssets, null, 2)};

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — network-first with cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/offline');
        });
      })
  );
});
`;

        return { success: true, action: 'service_worker', code, cacheName };
      }

      // ── CACHING STRATEGY ───────────────────────────────────────────
      case 'caching_strategy': {
        const framework = params.framework || 'nextjs';
        const dir = params.directory || params.path || '.';

        let config;
        if (framework === 'nextjs') {
          config = `// next.config.js — caching headers
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=43200' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
`;
        }

        return { success: true, action: 'caching_strategy', framework, config };
      }

      default:
        return {
          success: false,
          error: `Unknown web_optimize action: ${action}`,
        };
    }
  } catch (err) {
    return { success: false, action, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 8: web_transform
// ═══════════════════════════════════════════════════════════════════
// Actions: tailwind_config, dark_mode, pwa_setup, responsive_wrapper, animation

export async function webTransform(params, userId) {
  const action = params.action;
  try {
    switch (action) {
      // ── TAILWIND CONFIG ────────────────────────────────────────────
      case 'tailwind_config': {
        const colors = params.colors || {};
        const fonts = params.fonts || {};
        const extend = params.extend || {};
        const plugins = params.plugins || [];

        const config = `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: ${JSON.stringify(
        {
          primary: colors.primary || {
            DEFAULT: '#3b82f6',
            foreground: '#ffffff',
          },
          secondary: colors.secondary || {
            DEFAULT: '#6b7280',
            foreground: '#ffffff',
          },
          accent: colors.accent || {
            DEFAULT: '#8b5cf6',
            foreground: '#ffffff',
          },
          background: colors.background || '#ffffff',
          foreground: colors.foreground || '#0a0a0a',
          muted: colors.muted || { DEFAULT: '#f3f4f6', foreground: '#6b7280' },
          destructive: colors.destructive || {
            DEFAULT: '#ef4444',
            foreground: '#ffffff',
          },
          ...colors,
        },
        null,
        6
      )
        .replace(/"([^"]+)":/g, "'$1':")
        .replace(/"/g, "'")},
      fontFamily: ${JSON.stringify(
        fonts.length
          ? fonts
          : {
              sans: ['Inter', 'system-ui', 'sans-serif'],
              mono: ['JetBrains Mono', 'monospace'],
            },
        null,
        6
      )
        .replace(/"([^"]+)":/g, "'$1':")
        .replace(/"/g, "'")},
      ${Object.keys(extend).length ? `...${JSON.stringify(extend, null, 6)},` : ''}
    },
  },
  plugins: [${plugins.map((p) => `require('${p}')`).join(', ')}],
};

export default config;
`;

        return {
          success: true,
          action: 'tailwind_config',
          code: config,
          dependencies: ['tailwindcss', ...plugins],
        };
      }

      // ── DARK MODE ──────────────────────────────────────────────────
      case 'dark_mode': {
        const strategy = params.strategy || 'class'; // 'class' or 'media'

        const themeProvider = `'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = 'system' }: { children: ReactNode; defaultTheme?: Theme }) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load theme from cookie or server preference
    const match = document.cookie.match(/(?:^|;\\s*)site_theme=([^;]+)/);
    if (match) setTheme(match[1] as Theme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let resolved: 'light' | 'dark';

    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = theme;
    }

    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    setResolvedTheme(resolved);
    // Persist theme to cookie (accessible server-side)
    document.cookie = \`site_theme=\${theme};path=/;max-age=31536000;SameSite=Lax\`;
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(e.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
`;

        const toggleButton = `'use client';

import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-muted transition-colors"
      aria-label={\`Switch to \${resolvedTheme === 'dark' ? 'light' : 'dark'} mode\`}
    >
      {resolvedTheme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
`;

        return {
          success: true,
          action: 'dark_mode',
          strategy,
          files: [
            { name: 'ThemeProvider.tsx', content: themeProvider },
            { name: 'ThemeToggle.tsx', content: toggleButton },
          ],
        };
      }

      // ── PWA SETUP ──────────────────────────────────────────────────
      case 'pwa_setup': {
        const appName = params.name || 'My App';
        const themeColor = params.themeColor || '#000000';

        const files = {};

        files['manifest.json'] = JSON.stringify(
          {
            name: appName,
            short_name: appName,
            start_url: '/',
            display: 'standalone',
            background_color: '#ffffff',
            theme_color: themeColor,
            icons: [
              {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
              },
            ],
          },
          null,
          2
        );

        files['sw-register.ts'] = `// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('SW registered:', reg.scope))
      .catch((err) => console.error('SW registration failed:', err));
  });
}
`;

        files['offline.html'] = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Offline - ${appName}</title></head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">
<div style="text-align:center"><h1>You're offline</h1><p>Check your internet connection and try again.</p></div>
</body></html>`;

        return {
          success: true,
          action: 'pwa_setup',
          name: appName,
          files: Object.entries(files).map(([name, content]) => ({
            name,
            content,
          })),
        };
      }

      // ── RESPONSIVE WRAPPER ─────────────────────────────────────────
      case 'responsive_wrapper': {
        const name = params.name || 'ResponsiveContainer';

        const code = `'use client';

import { useEffect, useState, ReactNode } from 'react';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const BREAKPOINTS: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');

  useEffect(() => {
    function update() {
      const width = window.innerWidth;
      if (width >= BREAKPOINTS['2xl']) setBreakpoint('2xl');
      else if (width >= BREAKPOINTS.xl) setBreakpoint('xl');
      else if (width >= BREAKPOINTS.lg) setBreakpoint('lg');
      else if (width >= BREAKPOINTS.md) setBreakpoint('md');
      else if (width >= BREAKPOINTS.sm) setBreakpoint('sm');
      else setBreakpoint('xs');
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return breakpoint;
}

export function useIsMobile(): boolean {
  const bp = useBreakpoint();
  return ['xs', 'sm'].includes(bp);
}

export function useIsTablet(): boolean {
  const bp = useBreakpoint();
  return bp === 'md';
}

export function useIsDesktop(): boolean {
  const bp = useBreakpoint();
  return ['lg', 'xl', '2xl'].includes(bp);
}

interface ${name}Props {
  children: ReactNode;
  mobile?: ReactNode;
  tablet?: ReactNode;
  desktop?: ReactNode;
}

export function ${name}({ children, mobile, tablet, desktop }: ${name}Props) {
  const bp = useBreakpoint();

  if (['xs', 'sm'].includes(bp) && mobile) return <>{mobile}</>;
  if (bp === 'md' && tablet) return <>{tablet}</>;
  if (['lg', 'xl', '2xl'].includes(bp) && desktop) return <>{desktop}</>;
  
  return <>{children}</>;
}
`;

        return { success: true, action: 'responsive_wrapper', name, code };
      }

      // ── ANIMATION ──────────────────────────────────────────────────
      case 'animation': {
        const type = params.type || 'fadeIn';
        const duration = params.duration || 300;
        const library = params.library || 'css';

        const animations = {
          fadeIn: {
            css: `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }\n.animate-fade-in { animation: fadeIn ${duration}ms ease-in-out; }`,
            framer: `const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: ${duration / 1000} } };`,
            tailwind: `animate-[fadeIn_${duration}ms_ease-in-out]`,
          },
          slideUp: {
            css: `@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }\n.animate-slide-up { animation: slideUp ${duration}ms ease-out; }`,
            framer: `const slideUp = { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: ${duration / 1000} } };`,
            tailwind: `animate-[slideUp_${duration}ms_ease-out]`,
          },
          slideDown: {
            css: `@keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }\n.animate-slide-down { animation: slideDown ${duration}ms ease-out; }`,
            framer: `const slideDown = { initial: { y: -20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: ${duration / 1000} } };`,
            tailwind: `animate-[slideDown_${duration}ms_ease-out]`,
          },
          slideLeft: {
            css: `@keyframes slideLeft { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }\n.animate-slide-left { animation: slideLeft ${duration}ms ease-out; }`,
            framer: `const slideLeft = { initial: { x: 20, opacity: 0 }, animate: { x: 0, opacity: 1 }, transition: { duration: ${duration / 1000} } };`,
            tailwind: `animate-[slideLeft_${duration}ms_ease-out]`,
          },
          scaleIn: {
            css: `@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }\n.animate-scale-in { animation: scaleIn ${duration}ms ease-out; }`,
            framer: `const scaleIn = { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: ${duration / 1000} } };`,
            tailwind: `animate-[scaleIn_${duration}ms_ease-out]`,
          },
          bounce: {
            css: `@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }\n.animate-bounce-custom { animation: bounce ${duration}ms ease-in-out infinite; }`,
            framer: `const bounce = { animate: { y: [0, -10, 0] }, transition: { duration: ${duration / 1000}, repeat: Infinity } };`,
            tailwind: 'animate-bounce',
          },
          pulse: {
            css: `@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }\n.animate-pulse-custom { animation: pulse ${duration * 3}ms ease-in-out infinite; }`,
            framer: `const pulse = { animate: { opacity: [1, 0.5, 1] }, transition: { duration: ${(duration * 3) / 1000}, repeat: Infinity } };`,
            tailwind: 'animate-pulse',
          },
          spin: {
            css: `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }\n.animate-spin-custom { animation: spin ${duration * 3}ms linear infinite; }`,
            framer: `const spin = { animate: { rotate: 360 }, transition: { duration: ${(duration * 3) / 1000}, repeat: Infinity, ease: 'linear' } };`,
            tailwind: 'animate-spin',
          },
          stagger: {
            css: `/* Use with delay per child: .child:nth-child(1) { animation-delay: 0ms; } .child:nth-child(2) { animation-delay: ${Math.round(duration / 5)}ms; } etc. */\n@keyframes staggerIn { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }\n.animate-stagger > * { animation: staggerIn ${duration}ms ease-out both; }`,
            framer: `const staggerContainer = { animate: { transition: { staggerChildren: ${duration / 5000} } } };\nconst staggerItem = { initial: { y: 10, opacity: 0 }, animate: { y: 0, opacity: 1 } };`,
            tailwind: `animate-[staggerIn_${duration}ms_ease-out_both]`,
          },
        };

        const anim = animations[type];
        if (!anim) {
          return {
            success: false,
            error: `Unknown animation: ${type}. Available: ${Object.keys(animations).join(', ')}`,
          };
        }

        return {
          success: true,
          action: 'animation',
          type,
          duration,
          css: anim.css,
          framerMotion: anim.framer,
          tailwind: anim.tailwind,
          allTypes: Object.keys(animations),
        };
      }

      default:
        return {
          success: false,
          error: `Unknown web_transform action: ${action}`,
        };
    }
  } catch (err) {
    return { success: false, action, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function camelToKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function generateResponsiveRecommendations(patterns, breakpoints) {
  const recs = [];
  if (patterns.flexbox === 0 && patterns.grid === 0)
    recs.push(
      'Use CSS Flexbox or Grid for layouts instead of floats/positioning'
    );
  if (patterns.fixedWidths > patterns.relativeUnits)
    recs.push('Replace fixed pixel widths with relative units (rem, %, vw)');
  if (breakpoints.length === 0)
    recs.push(
      'Add responsive breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)'
    );
  if (breakpoints.length === 1)
    recs.push(
      'Single breakpoint detected — add at least 3 for proper responsive design'
    );
  if (patterns.viewportUnits === 0)
    recs.push('Consider viewport units (vw, vh) for full-screen sections');
  return recs;
}
