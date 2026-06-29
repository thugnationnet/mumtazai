/**
 * Centralized URL helper for navigating to an agent / app's runtime surface.
 *
 * Each universal-chat agent has its own subdomain ({slug}.mumtaz.ai).
 * GenCraft Pro lives on studio.mumtaz.ai and Canvas on build.mumtaz.ai.
 *
 * NEVER use the legacy `https://chat.mumtaz.ai/agents/{slug}` URL pattern —
 * it is deprecated and no longer routed in production.
 */
export function getAgentChatUrl(
  slug: string | null | undefined,
  opts?: { session?: string; fresh?: boolean }
): string {
  if (!slug) return 'https://mumtaz.ai';

  let base: string;
  if (slug === 'gencraft-pro') {
    base = 'https://studio.mumtaz.ai/';
  } else if (slug === 'canvas' || slug === 'canvas-build') {
    base = 'https://build.mumtaz.ai/';
  } else {
    base = `https://${slug}.mumtaz.ai/`;
  }

  const params = new URLSearchParams();
  if (opts?.session) params.set('session', opts.session);
  if (opts?.fresh) params.set('fresh', '1');
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
