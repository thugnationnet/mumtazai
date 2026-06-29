/**
 * Cross-Domain Authentication for Subdomain Apps
 * Handles secure token passing between main app (mumtaz.ai) and subdomains (maula.mumtaz.ai)
 */

const MAULA_SUBDOMAIN = process.env.NEXT_PUBLIC_MAULA_URL || 'https://maula.mumtaz.ai';

interface AuthTokenPayload {
  userId: string;
  email: string;
  name?: string;
  exp: number;
}

/**
 * Generate a secure handoff token for subdomain access
 * This creates a short-lived token that the subdomain can exchange for a session
 */
export async function generateSubdomainToken(userId: string): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/subdomain-token', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId,
        targetDomain: 'maula.mumtaz.ai',
        validityMinutes: 5 // Token valid for 5 minutes
      }),
    });

    if (!response.ok) {
      console.error('[CrossDomainAuth] Failed to generate token');
      return null;
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('[CrossDomainAuth] Error generating token:', error);
    return null;
  }
}

/**
 * Build the URL to access Neural Link (Maula) with auth handoff
 */
export function buildMaulaUrl(token: string): string {
  const url = new URL(MAULA_SUBDOMAIN);
  url.pathname = '/auth/callback';
  url.searchParams.set('token', token);
  url.searchParams.set('source', 'dashboard');
  return url.toString();
}

/**
 * Open Neural Link app with secure authentication handoff
 */
export async function openNeuralLink(userId: string): Promise<boolean> {
  const token = await generateSubdomainToken(userId);
  
  if (!token) {
    console.error('[CrossDomainAuth] Could not generate handoff token');
    return false;
  }

  const targetUrl = buildMaulaUrl(token);
  
  // Open in new tab (user initiated, so popup blockers won't interfere)
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
  
  return true;
}

/**
 * Navigate to Neural Link (replace current page)
 */
export async function navigateToNeuralLink(userId: string): Promise<void> {
  const token = await generateSubdomainToken(userId);
  
  if (!token) {
    // Fallback: redirect without token (will show login)
    window.location.href = MAULA_SUBDOMAIN;
    return;
  }

  window.location.href = buildMaulaUrl(token);
}

/**
 * Get the Neural Link app URL (for display/links)
 */
export function getMaulaUrl(): string {
  return MAULA_SUBDOMAIN;
}
