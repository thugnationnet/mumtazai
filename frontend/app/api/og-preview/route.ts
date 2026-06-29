import { NextRequest, NextResponse } from 'next/server';

const OG_TIMEOUT = 5000;
const MAX_HTML_SIZE = 200_000; // 200KB limit to prevent abuse

// Allow-list for safe meta property extraction
const META_KEYS = new Set(['og:title', 'og:description', 'og:image', 'og:site_name']);
const TWITTER_KEYS = new Set(['twitter:title', 'twitter:description', 'twitter:image']);

function extractMeta(html: string) {
  const result: Record<string, string> = {};

  // Extract <title> as fallback
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) result.fallbackTitle = titleMatch[1].trim();

  // Extract meta description as fallback
  const descMatch = html.match(/<meta[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*>/i)
    || html.match(/<meta[^>]*content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']description["'][^>]*>/i);
  if (descMatch) result.fallbackDescription = descMatch[1].trim();

  // Extract all meta tags with property or name attributes
  const metaRegex = /<meta[^>]+>/gi;
  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    const tag = match[0];

    // Try property="og:..." content="..."
    const propMatch = tag.match(/property\s*=\s*["']([^"']*)["']/i);
    const nameMatch = tag.match(/name\s*=\s*["']([^"']*)["']/i);
    const contentMatch = tag.match(/content\s*=\s*["']([^"']*)["']/i);

    if (!contentMatch) continue;
    const content = contentMatch[1].trim();
    if (!content) continue;

    const key = propMatch?.[1]?.toLowerCase() || nameMatch?.[1]?.toLowerCase();
    if (!key) continue;

    if (META_KEYS.has(key) || TWITTER_KEYS.has(key)) {
      result[key] = content;
    }
  }

  return result;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'url parameter required' }, { status: 400 });
  }

  // Validate URL
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  // Only allow http(s) to prevent SSRF with file://, data:, etc.
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return NextResponse.json({ error: 'invalid protocol' }, { status: 400 });
  }

  // Block private/internal IPs to prevent SSRF
  const hostname = parsed.hostname;
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('172.') ||
    hostname === '169.254.169.254' ||
    hostname.endsWith('.internal') ||
    hostname === '[::1]'
  ) {
    return NextResponse.json({ error: 'blocked' }, { status: 403 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OG_TIMEOUT);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MumtazAI-Bot/1.0 (OG Preview)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: 'fetch failed' }, { status: 502 });
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/xhtml')) {
      return NextResponse.json({ error: 'not html' }, { status: 422 });
    }

    // Read limited amount
    const reader = res.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: 'no body' }, { status: 502 });
    }

    let html = '';
    const decoder = new TextDecoder();
    let bytesRead = 0;

    while (bytesRead < MAX_HTML_SIZE) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.length;
      html += decoder.decode(value, { stream: true });

      // Early exit if we've found the closing head tag (OG tags are in <head>)
      if (html.includes('</head>')) break;
    }
    reader.cancel();

    const meta = extractMeta(html);

    const ogData = {
      title: meta['og:title'] || meta['twitter:title'] || meta.fallbackTitle || undefined,
      description: meta['og:description'] || meta['twitter:description'] || meta.fallbackDescription || undefined,
      image: meta['og:image'] || meta['twitter:image'] || undefined,
      siteName: meta['og:site_name'] || parsed.hostname,
      url,
    };

    // Resolve relative image URLs
    if (ogData.image && !ogData.image.startsWith('http')) {
      try {
        ogData.image = new URL(ogData.image, url).href;
      } catch {
        ogData.image = undefined;
      }
    }

    return NextResponse.json(ogData, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error';
    if (message.includes('abort')) {
      return NextResponse.json({ error: 'timeout' }, { status: 504 });
    }
    return NextResponse.json({ error: 'fetch failed' }, { status: 502 });
  }
}
