/**
 * WHOIS Lookup Logic - Tools Module
 * Handles domain WHOIS queries, DNS lookups, and domain information analysis
 */

export interface WHOISLookupState {
  isLoading: boolean;
  isQuerying: boolean;
  error: string | null;
  success: boolean;
  currentResult: WHOISResult | null;
  queryHistory: WHOISQuery[];
  favorites: string[];
  bulkResults: BulkLookupResult[];
  settings: WHOISSettings;
}

export interface WHOISResult {
  domain: string;
  registrar: RegistrarInfo;
  registrant: ContactInfo;
  administrative: ContactInfo;
  technical: ContactInfo;
  billing?: ContactInfo;
  dates: DomainDates;
  nameservers: string[];
  status: string[];
  dnssec: boolean;
  whoisServer: string;
  rawData: string;
  domainInfo: DomainInfo;
  security: SecurityInfo;
  availability: AvailabilityInfo;
  timestamp: string;
  queryTime: number;
}

export interface RegistrarInfo {
  name: string;
  ianaId?: string;
  url?: string;
  abuseContactEmail?: string;
  abuseContactPhone?: string;
  whoisServer?: string;
}

export interface ContactInfo {
  name?: string;
  organization?: string;
  email?: string;
  phone?: string;
  fax?: string;
  address: AddressInfo;
}

export interface AddressInfo {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface DomainDates {
  created?: string;
  updated?: string;
  expires?: string;
  registrarExpiration?: string;
  lastChanged?: string;
}

export interface DomainInfo {
  tld: string;
  sld: string;
  subdomain?: string;
  isInternational: boolean;
  punycode?: string;
  length: number;
  type: 'generic' | 'country-code' | 'sponsored' | 'infrastructure';
  category: string;
}

export interface SecurityInfo {
  hasPrivacyProtection: boolean;
  hasDNSSEC: boolean;
  sslCertificate?: SSLInfo;
  reputation: ReputationInfo;
  blacklists: BlacklistInfo[];
  riskScore: number; // 0-100
}

export interface SSLInfo {
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  fingerprint: string;
  algorithm: string;
  keySize: number;
  isValid: boolean;
  isExpired: boolean;
}

export interface ReputationInfo {
  score: number; // 0-100
  category: 'excellent' | 'good' | 'neutral' | 'poor' | 'dangerous';
  sources: string[];
  lastChecked: string;
}

export interface BlacklistInfo {
  name: string;
  listed: boolean;
  reason?: string;
  detectedAt?: string;
}

export interface AvailabilityInfo {
  isAvailable: boolean;
  isPremium: boolean;
  price?: number;
  currency?: string;
  alternatives: string[];
  suggestions: string[];
}

export interface WHOISQuery {
  id: string;
  domain: string;
  timestamp: string;
  queryTime: number;
  success: boolean;
  error?: string;
  resultId?: string;
  queryType: 'domain' | 'ip' | 'bulk';
}

export interface BulkLookupResult {
  id: string;
  domains: string[];
  results: Map<string, WHOISResult | null>;
  progress: number;
  total: number;
  completed: number;
  failed: number;
  startTime: string;
  endTime?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}

export interface WHOISSettings {
  defaultServer?: string;
  timeout: number;
  followReferrals: boolean;
  includeRawData: boolean;
  checkSSL: boolean;
  checkReputation: boolean;
  checkAvailability: boolean;
  privacyMode: boolean;
  maxBulkQueries: number;
  cacheResults: boolean;
  cacheDuration: number; // hours
}

export interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl: number;
  priority?: number;
}

export interface DNSLookupResult {
  domain: string;
  records: DNSRecord[];
  nameservers: string[];
  soa: SOARecord;
  mx: MXRecord[];
  timestamp: string;
}

export interface SOARecord {
  primaryNS: string;
  responsible: string;
  serial: number;
  refresh: number;
  retry: number;
  expire: number;
  minimum: number;
}

export interface MXRecord {
  priority: number;
  exchange: string;
}

export interface IPLookupResult {
  ip: string;
  hostname?: string;
  location: IPLocation;
  isp: ISPInfo;
  organization?: string;
  asn: ASNInfo;
  security: IPSecurityInfo;
  timestamp: string;
}

export interface IPLocation {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface ISPInfo {
  name: string;
  organization?: string;
  asn?: number;
}

export interface ASNInfo {
  number: number;
  name: string;
  description?: string;
  country?: string;
}

export interface IPSecurityInfo {
  isMalicious: boolean;
  isProxy: boolean;
  isTor: boolean;
  isVPN: boolean;
  threats: string[];
  riskScore: number;
}

export class WHOISLookupLogic {
  private state: WHOISLookupState;
  private cache: Map<string, WHOISResult> = new Map();
  private abortController: AbortController | null = null;

  constructor() {
    this.state = {
      isLoading: false,
      isQuerying: false,
      error: null,
      success: false,
      currentResult: null,
      queryHistory: [],
      favorites: [],
      bulkResults: [],
      settings: {
        timeout: 30000,
        followReferrals: true,
        includeRawData: true,
        checkSSL: true,
        checkReputation: true,
        checkAvailability: false,
        privacyMode: false,
        maxBulkQueries: 100,
        cacheResults: true,
        cacheDuration: 24,
      },
    };
  }

  /**
   * Initialize WHOIS Lookup
   */
  async initialize(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;

    try {
      const [history, favorites, settings] = await Promise.all([
        this.loadQueryHistory(),
        this.loadFavorites(),
        this.loadSettings(),
      ]);

      this.state.queryHistory = history;
      this.state.favorites = favorites;

      if (settings) {
        this.state.settings = { ...this.state.settings, ...settings };
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to initialize WHOIS Lookup';
      this.state.error = message;
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Perform WHOIS lookup for domain
   */
  async lookupDomain(domain: string): Promise<WHOISResult> {
    const cleanDomain = this.sanitizeDomain(domain);

    if (!this.isValidDomain(cleanDomain)) {
      throw new Error('Invalid domain format');
    }

    // Check cache first
    if (this.state.settings.cacheResults) {
      const cached = this.getCachedResult(cleanDomain);
      if (cached) {
        this.state.currentResult = cached;
        return cached;
      }
    }

    this.state.isQuerying = true;
    this.state.error = null;

    const startTime = Date.now();
    this.abortController = new AbortController();

    try {
      const response = await fetch('/api/tools/whois-lookup/domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: this.abortController.signal,
        body: JSON.stringify({
          domain: cleanDomain,
          settings: this.state.settings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'WHOIS lookup failed');
      }

      const result: WHOISResult = {
        ...data.result,
        queryTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      // Cache result
      if (this.state.settings.cacheResults) {
        this.setCachedResult(cleanDomain, result);
      }

      // Add to history
      this.addToHistory({
        id: `query_${Date.now()}`,
        domain: cleanDomain,
        timestamp: new Date().toISOString(),
        queryTime: result.queryTime,
        success: true,
        resultId: result.timestamp,
        queryType: 'domain',
      });

      this.state.currentResult = result;
      this.state.success = true;

      this.trackWHOISEvent('domain_lookup', {
        domain: cleanDomain,
        queryTime: result.queryTime,
        hasRegistrant: !!result.registrant.name,
      });

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'WHOIS lookup failed';

      // Add failed query to history
      this.addToHistory({
        id: `query_${Date.now()}`,
        domain: cleanDomain,
        timestamp: new Date().toISOString(),
        queryTime: Date.now() - startTime,
        success: false,
        error: message,
        queryType: 'domain',
      });

      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isQuerying = false;
      this.abortController = null;
    }
  }

  /**
   * Perform bulk WHOIS lookup
   */
  async bulkLookup(domains: string[]): Promise<BulkLookupResult> {
    const cleanDomains = domains
      .map((d) => this.sanitizeDomain(d))
      .filter((d) => this.isValidDomain(d));

    if (cleanDomains.length === 0) {
      throw new Error('No valid domains provided');
    }

    if (cleanDomains.length > this.state.settings.maxBulkQueries) {
      throw new Error(
        `Too many domains. Maximum allowed: ${this.state.settings.maxBulkQueries}`
      );
    }

    const bulkResult: BulkLookupResult = {
      id: `bulk_${Date.now()}`,
      domains: cleanDomains,
      results: new Map(),
      progress: 0,
      total: cleanDomains.length,
      completed: 0,
      failed: 0,
      startTime: new Date().toISOString(),
      status: 'running',
    };

    this.state.bulkResults.unshift(bulkResult);
    this.state.isQuerying = true;
    this.state.error = null;

    try {
      for (let i = 0; i < cleanDomains.length; i++) {
        const domain = cleanDomains[i];

        try {
          const result = await this.lookupDomain(domain);
          bulkResult.results.set(domain, result);
          bulkResult.completed++;
        } catch (error) {
          bulkResult.results.set(domain, null);
          bulkResult.failed++;
        }

        bulkResult.progress = Math.round(((i + 1) / cleanDomains.length) * 100);

        // Small delay between requests to avoid rate limiting
        if (i < cleanDomains.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      bulkResult.status = 'completed';
      bulkResult.endTime = new Date().toISOString();

      this.trackWHOISEvent('bulk_lookup', {
        total: bulkResult.total,
        completed: bulkResult.completed,
        failed: bulkResult.failed,
      });

      return bulkResult;
    } catch (error) {
      bulkResult.status = 'failed';
      bulkResult.endTime = new Date().toISOString();

      const message =
        error instanceof Error ? error.message : 'Bulk lookup failed';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isQuerying = false;
    }
  }

  /**
   * Lookup IP address information
   */
  async lookupIP(ip: string): Promise<IPLookupResult> {
    if (!this.isValidIP(ip)) {
      throw new Error('Invalid IP address format');
    }

    this.state.isQuerying = true;
    this.state.error = null;

    try {
      const response = await fetch('/api/tools/whois-lookup/ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'IP lookup failed');
      }

      const result: IPLookupResult = {
        ...data.result,
        timestamp: new Date().toISOString(),
      };

      this.addToHistory({
        id: `query_${Date.now()}`,
        domain: ip,
        timestamp: new Date().toISOString(),
        queryTime: 0,
        success: true,
        queryType: 'ip',
      });

      this.trackWHOISEvent('ip_lookup', {
        ip,
        country: result.location.country,
        isp: result.isp.name,
      });

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'IP lookup failed';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isQuerying = false;
    }
  }

  /**
   * Perform DNS lookup
   */
  async lookupDNS(
    domain: string,
    recordType?: string
  ): Promise<DNSLookupResult> {
    const cleanDomain = this.sanitizeDomain(domain);

    if (!this.isValidDomain(cleanDomain)) {
      throw new Error('Invalid domain format');
    }

    this.state.isQuerying = true;
    this.state.error = null;

    try {
      const response = await fetch('/api/tools/whois-lookup/dns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: cleanDomain,
          recordType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'DNS lookup failed');
      }

      const result: DNSLookupResult = {
        ...data.result,
        timestamp: new Date().toISOString(),
      };

      this.trackWHOISEvent('dns_lookup', {
        domain: cleanDomain,
        recordType,
        recordCount: result.records.length,
      });

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'DNS lookup failed';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isQuerying = false;
    }
  }

  /**
   * Add domain to favorites
   */
  addToFavorites(domain: string): void {
    const cleanDomain = this.sanitizeDomain(domain);

    if (!this.state.favorites.includes(cleanDomain)) {
      this.state.favorites.push(cleanDomain);
      this.saveFavorites();

      this.trackWHOISEvent('domain_favorited', { domain: cleanDomain });
    }
  }

  /**
   * Remove domain from favorites
   */
  removeFromFavorites(domain: string): void {
    const cleanDomain = this.sanitizeDomain(domain);
    const index = this.state.favorites.indexOf(cleanDomain);

    if (index >= 0) {
      this.state.favorites.splice(index, 1);
      this.saveFavorites();

      this.trackWHOISEvent('domain_unfavorited', { domain: cleanDomain });
    }
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<WHOISSettings>): void {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.saveSettings();

    this.trackWHOISEvent('settings_updated', {
      changes: Object.keys(newSettings),
    });
  }

  /**
   * Cancel current query
   */
  cancelQuery(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.state.isQuerying = false;
    this.trackWHOISEvent('query_cancelled');
  }

  /**
   * Clear query history
   */
  clearHistory(): void {
    this.state.queryHistory = [];
    this.saveQueryHistory();
    this.trackWHOISEvent('history_cleared');
  }

  /**
   * Export results
   */
  async exportResults(
    format: 'csv' | 'json' | 'txt',
    data?: WHOISResult[]
  ): Promise<void> {
    try {
      const exportData =
        data || (this.state.currentResult ? [this.state.currentResult] : []);

      if (exportData.length === 0) {
        throw new Error('No data to export');
      }

      const response = await fetch('/api/tools/whois-lookup/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          data: exportData,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `whois-results-${Date.now()}.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.trackWHOISEvent('results_exported', {
          format,
          count: exportData.length,
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      this.state.error = 'Failed to export results';
    }
  }

  /**
   * Private helper methods
   */
  private sanitizeDomain(domain: string): string {
    return domain
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');
  }

  private isValidDomain(domain: string): boolean {
    const domainRegex =
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
    return domainRegex.test(domain);
  }

  private isValidIP(ip: string): boolean {
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  private getCachedResult(domain: string): WHOISResult | null {
    const cached = this.cache.get(domain);
    if (cached) {
      const cacheAge = Date.now() - new Date(cached.timestamp).getTime();
      const maxAge = this.state.settings.cacheDuration * 60 * 60 * 1000;

      if (cacheAge < maxAge) {
        return cached;
      } else {
        this.cache.delete(domain);
      }
    }
    return null;
  }

  private setCachedResult(domain: string, result: WHOISResult): void {
    this.cache.set(domain, result);
  }

  private addToHistory(query: WHOISQuery): void {
    this.state.queryHistory.unshift(query);

    // Limit history size
    if (this.state.queryHistory.length > 1000) {
      this.state.queryHistory = this.state.queryHistory.slice(0, 1000);
    }

    this.saveQueryHistory();
  }

  private async loadQueryHistory(): Promise<WHOISQuery[]> {
    try {
      const res = await fetch('/api/user/preferences/tool-state/whois_lookup', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data?.history || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading query history:', error);
      return [];
    }
  }

  private async loadFavorites(): Promise<string[]> {
    try {
      const res = await fetch('/api/user/preferences/tool-state/whois_lookup', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data?.favorites || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }

  private async loadSettings(): Promise<Partial<WHOISSettings> | null> {
    try {
      const res = await fetch('/api/user/preferences/tool-state/whois_lookup', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data?.settings || null;
      }
      return null;
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  }

  private saveQueryHistory(): void {
    try {
      fetch('/api/user/preferences/tool-state/whois_lookup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ history: this.state.queryHistory }),
      }).catch(err => console.error('Error saving query history:', err));
    } catch (error) {
      console.error('Error saving query history:', error);
    }
  }

  private saveFavorites(): void {
    try {
      fetch('/api/user/preferences/tool-state/whois_lookup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ favorites: this.state.favorites }),
      }).catch(err => console.error('Error saving favorites:', err));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }

  private saveSettings(): void {
    try {
      fetch('/api/user/preferences/tool-state/whois_lookup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ settings: this.state.settings }),
      }).catch(err => console.error('Error saving settings:', err));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  private trackWHOISEvent(
    event: string,
    properties?: Record<string, any>
  ): void {
    try {
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('WHOIS Lookup', {
          event,
          timestamp: new Date().toISOString(),
          ...properties,
        });
      }
    } catch (error) {
      console.error('Error tracking WHOIS event:', error);
    }
  }

  /**
   * Public getters
   */
  getState(): WHOISLookupState {
    return { ...this.state };
  }

  getCurrentResult(): WHOISResult | null {
    return this.state.currentResult;
  }

  getQueryHistory(): WHOISQuery[] {
    return this.state.queryHistory;
  }

  getFavorites(): string[] {
    return this.state.favorites;
  }

  getBulkResults(): BulkLookupResult[] {
    return this.state.bulkResults;
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.state.error = null;
  }
}

// Export singleton instance
export const whoisLookupLogic = new WHOISLookupLogic();

// Export utility functions
export const whoisLookupUtils = {
  /**
   * Format domain expiration
   */
  formatExpiration(date?: string): string {
    if (!date) return 'Unknown';

    const expiration = new Date(date);
    const now = new Date();
    const daysUntil = Math.ceil(
      (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 0) {
      return `Expired ${Math.abs(daysUntil)} days ago`;
    } else if (daysUntil === 0) {
      return 'Expires today';
    } else if (daysUntil === 1) {
      return 'Expires tomorrow';
    } else if (daysUntil <= 30) {
      return `Expires in ${daysUntil} days`;
    } else {
      return expiration.toLocaleDateString();
    }
  },

  /**
   * Get expiration status color
   */
  getExpirationColor(date?: string): string {
    if (!date) return '#6B7280';

    const expiration = new Date(date);
    const now = new Date();
    const daysUntil = Math.ceil(
      (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 0) return '#DC2626'; // Expired - red
    if (daysUntil <= 7) return '#EA580C'; // Warning - orange
    if (daysUntil <= 30) return '#D97706'; // Caution - amber
    return '#059669'; // Safe - green
  },

  /**
   * Format contact info
   */
  formatContact(contact?: ContactInfo): string {
    if (!contact || (!contact.name && !contact.organization)) {
      return 'Private/Protected';
    }

    const parts = [];
    if (contact.name) parts.push(contact.name);
    if (contact.organization) parts.push(`(${contact.organization})`);

    return parts.join(' ');
  },

  /**
   * Get domain age
   */
  getDomainAge(createdDate?: string): string {
    if (!createdDate) return 'Unknown';

    const created = new Date(createdDate);
    const now = new Date();
    const ageMs = now.getTime() - created.getTime();
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    const ageYears = Math.floor(ageDays / 365);

    if (ageYears > 0) {
      return `${ageYears} year${ageYears > 1 ? 's' : ''} old`;
    } else {
      return `${ageDays} day${ageDays > 1 ? 's' : ''} old`;
    }
  },

  /**
   * Format nameservers
   */
  formatNameservers(nameservers: string[]): string {
    if (!nameservers || nameservers.length === 0) {
      return 'None found';
    }

    return nameservers.join(', ');
  },

  /**
   * Get risk level color
   */
  getRiskColor(riskScore: number): string {
    if (riskScore >= 80) return '#DC2626'; // High risk - red
    if (riskScore >= 60) return '#EA580C'; // Medium-high - orange
    if (riskScore >= 40) return '#D97706'; // Medium - amber
    if (riskScore >= 20) return '#CA8A04'; // Low-medium - yellow
    return '#059669'; // Low risk - green
  },

  /**
   * Format risk level
   */
  formatRiskLevel(riskScore: number): string {
    if (riskScore >= 80) return 'High Risk';
    if (riskScore >= 60) return 'Medium-High Risk';
    if (riskScore >= 40) return 'Medium Risk';
    if (riskScore >= 20) return 'Low-Medium Risk';
    return 'Low Risk';
  },
};
