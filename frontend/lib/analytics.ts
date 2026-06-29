const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://mumtaz.ai'

// Helper to read a cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

// Helper to set a cookie (1 year expiry for visitor, session for userId)
function setCookie(name: string, value: string, maxAgeDays: number = 365): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeDays * 86400}; SameSite=Lax`
}

function getVisitorId(): string {
  if (typeof window === 'undefined') return ''
  // Check cookie first (set by backend tracking middleware or previous visit)
  let visitorId = getCookie('visitor_id') || getCookie('visitorId')
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setCookie('visitor_id', visitorId)
  }
  return visitorId
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sessionId = sessionStorage.getItem('sessionId')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('sessionId', sessionId)
  }
  return sessionId
}

function getUserId(): string | null {
  if (typeof window === 'undefined') return null
  // Read userId from cookie (set on login/signup)
  return getCookie('userId') || getCookie('user_id')
}

export async function trackPageView(path: string, title?: string) {
  try {
    await fetch(`${API_BASE}/api/analytics/track/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
        userId: getUserId(),
        url: path,
        title: title || (typeof document !== 'undefined' ? document.title : ''),
        referrer: typeof document !== 'undefined' ? document.referrer : ''
      })
    })
  } catch (error) {
    console.error('Failed to track page view:', error)
  }
}

export async function trackEvent(eventType: string, eventName: string, eventData?: any) {
  try {
    await fetch(`${API_BASE}/api/analytics/track/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
        userId: getUserId(),
        eventType,
        eventName,
        eventData
      })
    })
  } catch (error) {
    console.error('Failed to track event:', error)
  }
}

export async function trackSignup(userId: string, email: string) {
  setCookie('userId', userId, 365)
  await trackEvent('user_action', 'signup', { email })
}

export async function trackLogin(userId: string, email: string) {
  setCookie('userId', userId, 365)
  await trackEvent('user_action', 'login', { email })
}
