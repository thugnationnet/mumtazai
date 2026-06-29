/**
 * SecureTrace — Device Tracking Agent
 *
 * Usage:
 *   import { deviceTracker } from '@/services/deviceTrackingService';
 *   deviceTracker.start();   // call once on app load
 *   deviceTracker.stop();    // call on unmount if needed
 *
 * The service:
 *  1. On first run: generates a stable fingerprint and registers with backend → stores deviceToken in DB
 *  2. Every X minutes (dynamic, set by server): sends a GPS ping
 *  3. Runs silently — no UI, no console output in production
 *  ZERO localStorage — all state stored in DB via /api/user/preferences/ui-flags
 */

const API_BASE = '/api/tracking';

interface StoredDevice {
  deviceToken: string;
  deviceId: string;
}

function getAppVersion(): string {
  // Can read from env or hardcode
  return process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
}

/** Generate a stable browser fingerprint — NOT user-identifiable, device-level only */
async function generateFingerprint(): Promise<string> {
  const parts: string[] = [];

  // Screen dimensions
  parts.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
  // Timezone
  parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  // Language
  parts.push(navigator.language);
  // Platform
  parts.push(navigator.platform);
  // Hardware concurrency
  parts.push(String(navigator.hardwareConcurrency || 0));
  // Memory (Chrome only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parts.push(String((navigator as any).deviceMemory || 0));
  // User agent hash
  parts.push(navigator.userAgent.slice(0, 100));

  const raw = parts.join('|');

  // Hash it so we never send raw UA
  if (window.crypto?.subtle) {
    const buf = await window.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(raw)
    );
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback (older browsers)
  return btoa(raw).replace(/[^a-zA-Z0-9]/g, '').slice(0, 64);
}

function detectOS(): { os: string; osVersion: string } {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) {
    const m = ua.match(/Android ([\d.]+)/);
    return { os: 'android', osVersion: m?.[1] || '' };
  }
  if (/iPad|iPhone|iPod/.test(ua)) {
    const m = ua.match(/OS ([\d_]+)/);
    return { os: 'ios', osVersion: m?.[1]?.replace(/_/g, '.') || '' };
  }
  if (/Windows/.test(ua)) return { os: 'windows', osVersion: '' };
  if (/Mac/.test(ua)) return { os: 'macos', osVersion: '' };
  if (/Linux/.test(ua)) return { os: 'linux', osVersion: '' };
  return { os: 'web', osVersion: '' };
}

function getDeviceModel(): string {
  const ua = navigator.userAgent;
  // Try to extract model from UA
  const m = ua.match(/\(([^)]+)\)/);
  return m?.[1]?.slice(0, 100) || 'Unknown';
}

/** In-memory cache so sync callers can read without await */
let cachedDevice: StoredDevice | null = null;

async function loadStoredDevice(): Promise<StoredDevice | null> {
  if (cachedDevice) return cachedDevice;
  try {
    const res = await fetch('/api/user/preferences', { credentials: 'include' });
    if (!res.ok) return null;
    const json = await res.json();
    const stored = json?.data?.uiFlags?.sct_device as StoredDevice | undefined;
    if (stored?.deviceToken && stored?.deviceId) {
      cachedDevice = stored;
      return stored;
    }
  } catch { /* offline or unauthenticated */ }
  return null;
}

async function saveDevice(d: StoredDevice): Promise<void> {
  cachedDevice = d;
  try {
    await fetch('/api/user/preferences/ui-flags', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sct_device: d }),
    });
  } catch { /* fire-and-forget */ }
}

async function register(): Promise<StoredDevice | null> {
  try {
    const fingerprint = await generateFingerprint();
    const { os, osVersion } = detectOS();

    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fingerprint,
        deviceName: `${os} device`,
        deviceModel: getDeviceModel(),
        deviceOS: os,
        deviceOSVersion: osVersion,
        appVersion: getAppVersion(),
      }),
    });

    const data = await res.json();

    if (!data.success) {
      // Already registered (409) or error — don't retry
      return null;
    }

    const stored: StoredDevice = { deviceToken: data.deviceToken, deviceId: data.deviceId };
    await saveDevice(stored);
    return stored;
  } catch {
    return null;
  }
}

function getPosition(): Promise<GeolocationPosition | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getBattery(): Promise<number | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    if (nav.getBattery) {
      return nav.getBattery().then((b: any) => Math.round(b.level * 100)).catch(() => null);
    }
  } catch {
    // not supported
  }
  return Promise.resolve(null);
}

function getNetworkType(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) return String(conn.effectiveType || conn.type || 'unknown').slice(0, 20);
  } catch {
    // not supported
  }
  return 'unknown';
}

async function sendPing(token: string, pingIntervalRef: { current: number }): Promise<void> {
  try {
    const [position, battery] = await Promise.all([getPosition(), getBattery()]);
    const network = getNetworkType();

    const body: Record<string, unknown> = { network };
    if (battery != null) body.battery = battery;

    if (position) {
      body.lat = position.coords.latitude;
      body.lng = position.coords.longitude;
      body.accuracy = position.coords.accuracy;
      body.altitude = position.coords.altitude;
      body.speed = position.coords.speed;
      body.heading = position.coords.heading;
    } else {
      // No GPS — still send network/battery update with dummy coords omitted
      // Backend requires lat/lng — skip ping if no location
      return;
    }

    const res = await fetch(`${API_BASE}/ping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.pingIntervalMs && data.pingIntervalMs !== pingIntervalRef.current) {
        pingIntervalRef.current = data.pingIntervalMs;
      }
    }
  } catch {
    // silent
  }
}

class DeviceTracker {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private token: string | null = null;
  private pingIntervalRef = { current: 300000 }; // default 5 min

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    // Load or register device
    let stored = await loadStoredDevice();
    if (!stored) {
      stored = await register();
    }
    if (!stored) {
      // Registration blocked (already registered or server error) — stop silently
      this.running = false;
      return;
    }
    this.token = stored.deviceToken;

    // Schedule pings
    this.schedulePing();
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private schedulePing(): void {
    if (!this.running || !this.token) return;

    sendPing(this.token, this.pingIntervalRef).finally(() => {
      if (!this.running) return;
      this.timer = setTimeout(() => this.schedulePing(), this.pingIntervalRef.current);
    });
  }
}

export const deviceTracker = new DeviceTracker();
