import type { MetadataRoute } from 'next';

/**
 * Dynamic sitemap for Google Search Console indexing.
 * Next.js serves this at /sitemap.xml automatically.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://mumtaz.ai';
  const now = new Date().toISOString();

  // Static public pages
  const staticPages = [
    { url: '/', priority: 1.0, changeFrequency: 'weekly' as const },
    { url: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/pricing', priority: 0.9, changeFrequency: 'weekly' as const },
    { url: '/contact', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/contact', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/docs', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/community', priority: 0.7, changeFrequency: 'daily' as const },
    { url: '/support', priority: 0.5, changeFrequency: 'monthly' as const },
    { url: '/webinars', priority: 0.6, changeFrequency: 'weekly' as const },
    { url: '/resources', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/solutions', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/industries', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/demo', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/voice-demo', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/rewards', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/status', priority: 0.4, changeFrequency: 'daily' as const },
    { url: '/security', priority: 0.5, changeFrequency: 'monthly' as const },
    { url: '/overview', priority: 0.7, changeFrequency: 'monthly' as const },
    // Legal pages
    { url: '/legal/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { url: '/legal/terms', priority: 0.3, changeFrequency: 'yearly' as const },
    // Auth (for SEO — login/signup pages)
    { url: '/auth/login', priority: 0.5, changeFrequency: 'monthly' as const },
    { url: '/auth/signup', priority: 0.5, changeFrequency: 'monthly' as const },
  ];

  // Tool pages
  const toolPages = [
    '/tools/whois-lookup',
    '/tools/domain-reputation',
    '/tools/uuid-generator',
  ];

  // Lab pages
  const labPages = [
    '/lab/battle-arena',
    '/lab/emotion-visualizer',
    '/lab/story-weaver',
  ];

  // Subdomain pages
  const subdomainPages = [
    { url: 'https://mumtaz.ai/agents', priority: 0.9, changeFrequency: 'weekly' as const },
    { url: 'https://demo.mumtaz.ai', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: 'https://studio.mumtaz.ai', priority: 0.8, changeFrequency: 'weekly' as const },
  ];

  return [
    ...staticPages.map((page) => ({
      url: `${baseUrl}${page.url}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...subdomainPages.map((page) => ({
      url: page.url,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...toolPages.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...labPages.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
