/**
 * Domain Reputation Logic - Tools Module
 * Handles domain reputation analysis, security scanning, and threat intelligence
 */

export interface DomainReputationState {
  isLoading: boolean;
  isScanning: boolean;
  error: string | null;
  success: boolean;
  currentReport: ReputationReport | null;
  scanHistory: ScanRecord[];
  watchlist: string[];
  alerts: SecurityAlert[];
  settings: ReputationSettings;
}

export interface ReputationReport {
  domain: string;
  overallScore: number; // 0-100
  riskLevel: 'very-low' | 'low' | 'medium' | 'high' | 'critical';
  lastScanned: string;
  scanDuration: number;
  categories: CategoryScore[];
  threats: ThreatDetection[];
  blacklists: BlacklistStatus[];
  reputation: ReputationData;
  technical: TechnicalAnalysis;
  ssl: SSLAnalysis;
  malware: MalwareAnalysis;
  phishing: PhishingAnalysis;
  content: ContentAnalysis;
  network: NetworkAnalysis;
  historical: HistoricalData;
  recommendations: SecurityRecommendation[];
}

export interface CategoryScore {
  category: string;
  score: number; // 0-100
  weight: number;
  status: 'safe' | 'suspicious' | 'dangerous';
  details: string[];
  lastChecked: string;
}

export interface ThreatDetection {
  type:
    | 'malware'
    | 'phishing'
    | 'spam'
    | 'botnet'
    | 'c2'
    | 'crypto-mining'
    | 'scam';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  description: string;
  source: string;
  detectedAt: string;
  indicators: string[];
  mitigations: string[];
}

export interface BlacklistStatus {
  source: string;
  name: string;
  listed: boolean;
  category?: string;
  reason?: string;
  listedSince?: string;
  lastChecked: string;
  url?: string;
}

export interface ReputationData {
  trustScore: number; // 0-100
  popularityScore: number; // 0-100
  trafficRank?: number;
  socialScore: number; // 0-100
  reviewScore: number; // 0-100
  sources: ReputationSource[];
  mentions: SocialMention[];
  reviews: UserReview[];
}

export interface ReputationSource {
  name: string;
  score: number;
  category: string;
  lastUpdated: string;
  details?: string;
}

export interface SocialMention {
  platform: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  count: number;
  lastSeen: string;
}

export interface UserReview {
  platform: string;
  rating: number; // 1-5
  comment?: string;
  date: string;
}

export interface TechnicalAnalysis {
  domainAge: number; // days
  registrar: string;
  nameservers: string[];
  ipAddress: string;
  hosting: HostingInfo;
  dns: DNSAnalysis;
  subdomains: SubdomainInfo[];
  redirects: RedirectChain[];
  cookies: CookieAnalysis;
}

export interface HostingInfo {
  provider: string;
  country: string;
  asn: number;
  organization: string;
  type: 'shared' | 'dedicated' | 'cloud' | 'cdn';
  reputation: number; // 0-100
}

export interface DNSAnalysis {
  healthScore: number; // 0-100
  inconsistencies: string[];
  wildcardDNS: boolean;
  fastFlux: boolean;
  suspiciousRecords: DNSRecord[];
}

export interface DNSRecord {
  type: string;
  name: string;
  value: string;
  suspiciousReason?: string;
}

export interface SubdomainInfo {
  subdomain: string;
  active: boolean;
  riskScore: number;
  purpose?: string;
  lastSeen: string;
}

export interface RedirectChain {
  url: string;
  statusCode: number;
  suspicious: boolean;
  reason?: string;
}

export interface CookieAnalysis {
  totalCookies: number;
  trackingCookies: number;
  thirdPartyCookies: number;
  suspiciousCookies: SuspiciousCookie[];
  privacyScore: number; // 0-100
}

export interface SuspiciousCookie {
  name: string;
  domain: string;
  reason: string;
  riskLevel: string;
}

export interface SSLAnalysis {
  hasSSL: boolean;
  isValid: boolean;
  issuer: string;
  validFrom: string;
  validTo: string;
  grade: string; // A+, A, B, C, D, F
  vulnerabilities: SSLVulnerability[];
  cipherSuites: CipherSuite[];
  protocols: string[];
  hsts: boolean;
  chainValid: boolean;
}

export interface SSLVulnerability {
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  cve?: string;
}

export interface CipherSuite {
  name: string;
  strength: number;
  secure: boolean;
}

export interface MalwareAnalysis {
  infected: boolean;
  riskScore: number; // 0-100
  detections: MalwareDetection[];
  scanEngines: ScanEngine[];
  lastFullScan: string;
  quarantineStatus: boolean;
}

export interface MalwareDetection {
  engine: string;
  result: string;
  version: string;
  lastUpdate: string;
  confidence: number;
}

export interface ScanEngine {
  name: string;
  active: boolean;
  lastScan: string;
  detectionCount: number;
}

export interface PhishingAnalysis {
  isPhishing: boolean;
  riskScore: number; // 0-100
  indicators: PhishingIndicator[];
  targetBrands: string[];
  techniques: string[];
  confidence: number;
}

export interface PhishingIndicator {
  type: string;
  description: string;
  severity: string;
  confidence: number;
}

export interface ContentAnalysis {
  safetyScore: number; // 0-100
  categories: ContentCategory[];
  adultContent: boolean;
  violentContent: boolean;
  suspiciousJavaScript: boolean;
  iframes: IframeAnalysis[];
  externalLinks: ExternalLink[];
  downloadableFiles: FileInfo[];
}

export interface ContentCategory {
  category: string;
  confidence: number;
  appropriate: boolean;
}

export interface IframeAnalysis {
  src: string;
  suspicious: boolean;
  reason?: string;
}

export interface ExternalLink {
  domain: string;
  count: number;
  reputation?: number;
  suspicious: boolean;
}

export interface FileInfo {
  filename: string;
  type: string;
  size?: number;
  suspicious: boolean;
  scanned: boolean;
  malwareDetected?: boolean;
}

export interface NetworkAnalysis {
  connectionsScore: number; // 0-100
  suspiciousIPs: SuspiciousIP[];
  geolocations: GeolocationInfo[];
  ports: PortScan[];
  services: ServiceInfo[];
  botnetActivity: boolean;
}

export interface SuspiciousIP {
  ip: string;
  reason: string;
  severity: string;
  country: string;
  asn?: number;
}

export interface GeolocationInfo {
  country: string;
  region?: string;
  city?: string;
  suspicious: boolean;
  riskFactors: string[];
}

export interface PortScan {
  port: number;
  protocol: string;
  state: 'open' | 'closed' | 'filtered';
  service?: string;
  suspicious: boolean;
}

export interface ServiceInfo {
  name: string;
  version?: string;
  port: number;
  vulnerabilities: ServiceVulnerability[];
}

export interface ServiceVulnerability {
  cve: string;
  severity: string;
  description: string;
  exploitable: boolean;
}

export interface HistoricalData {
  firstSeen: string;
  lastSeen: string;
  scanCount: number;
  riskTrend: 'improving' | 'worsening' | 'stable';
  previousScores: HistoricalScore[];
  incidents: SecurityIncident[];
  changes: DomainChange[];
}

export interface HistoricalScore {
  date: string;
  score: number;
  riskLevel: string;
}

export interface SecurityIncident {
  date: string;
  type: string;
  description: string;
  severity: string;
  resolved: boolean;
}

export interface DomainChange {
  date: string;
  type: 'ip' | 'nameserver' | 'registrar' | 'ssl' | 'content';
  description: string;
  suspicious: boolean;
}

export interface SecurityRecommendation {
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actions: string[];
  impact: string;
  effort: 'low' | 'medium' | 'high';
}

export interface ScanRecord {
  id: string;
  domain: string;
  timestamp: string;
  score: number;
  riskLevel: string;
  scanDuration: number;
  threatsFound: number;
  success: boolean;
  error?: string;
}

export interface SecurityAlert {
  id: string;
  domain: string;
  type:
    | 'threat-detected'
    | 'score-change'
    | 'blacklist-added'
    | 'ssl-issue'
    | 'content-change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionRequired: boolean;
  relatedScan?: string;
}

export interface ReputationSettings {
  scanDepth: 'basic' | 'standard' | 'comprehensive' | 'deep';
  includeMalwareScan: boolean;
  includePhishingCheck: boolean;
  includeContentAnalysis: boolean;
  includeNetworkScan: boolean;
  includeSSLAnalysis: boolean;
  blacklistSources: string[];
  alertThreshold: number; // 0-100
  autoRescan: boolean;
  rescanInterval: number; // hours
  privacyMode: boolean;
  shareResults: boolean;
}

export class DomainReputationLogic {
  private state: DomainReputationState;
  private scanAbortController: AbortController | null = null;

  constructor() {
    this.state = {
      isLoading: false,
      isScanning: false,
      error: null,
      success: false,
      currentReport: null,
      scanHistory: [],
      watchlist: [],
      alerts: [],
      settings: {
        scanDepth: 'standard',
        includeMalwareScan: true,
        includePhishingCheck: true,
        includeContentAnalysis: true,
        includeNetworkScan: false,
        includeSSLAnalysis: true,
        blacklistSources: ['default'],
        alertThreshold: 60,
        autoRescan: false,
        rescanInterval: 24,
        privacyMode: false,
        shareResults: false,
      },
    };
  }

  /**
   * Initialize Domain Reputation
   */
  async initialize(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;

    try {
      const [history, watchlist, alerts, settings] = await Promise.all([
        this.loadScanHistory(),
        this.loadWatchlist(),
        this.loadAlerts(),
        this.loadSettings(),
      ]);

      this.state.scanHistory = history;
      this.state.watchlist = watchlist;
      this.state.alerts = alerts;

      if (settings) {
        this.state.settings = { ...this.state.settings, ...settings };
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to initialize Domain Reputation';
      this.state.error = message;
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Scan domain reputation
   */
  async scanDomain(domain: string): Promise<ReputationReport> {
    const cleanDomain = this.sanitizeDomain(domain);

    if (!this.isValidDomain(cleanDomain)) {
      throw new Error('Invalid domain format');
    }

    this.state.isScanning = true;
    this.state.error = null;

    const startTime = Date.now();
    this.scanAbortController = new AbortController();

    try {
      const response = await fetch('/api/tools/domain-reputation/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: this.scanAbortController.signal,
        body: JSON.stringify({
          domain: cleanDomain,
          settings: this.state.settings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Domain reputation scan failed');
      }

      const report: ReputationReport = {
        ...data.report,
        scanDuration: Date.now() - startTime,
        lastScanned: new Date().toISOString(),
      };

      // Add to scan history
      this.addToScanHistory({
        id: `scan_${Date.now()}`,
        domain: cleanDomain,
        timestamp: report.lastScanned,
        score: report.overallScore,
        riskLevel: report.riskLevel,
        scanDuration: report.scanDuration,
        threatsFound: report.threats.length,
        success: true,
      });

      // Check for alerts
      this.checkForAlerts(report);

      this.state.currentReport = report;
      this.state.success = true;

      this.trackReputationEvent('domain_scanned', {
        domain: cleanDomain,
        score: report.overallScore,
        riskLevel: report.riskLevel,
        threatsFound: report.threats.length,
        scanDuration: report.scanDuration,
      });

      return report;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Domain reputation scan failed';

      // Add failed scan to history
      this.addToScanHistory({
        id: `scan_${Date.now()}`,
        domain: cleanDomain,
        timestamp: new Date().toISOString(),
        score: 0,
        riskLevel: 'unknown',
        scanDuration: Date.now() - startTime,
        threatsFound: 0,
        success: false,
        error: message,
      });

      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isScanning = false;
      this.scanAbortController = null;
    }
  }

  /**
   * Add domain to watchlist
   */
  addToWatchlist(domain: string, alertThreshold?: number): void {
    const cleanDomain = this.sanitizeDomain(domain);

    if (!this.state.watchlist.includes(cleanDomain)) {
      this.state.watchlist.push(cleanDomain);
      this.saveWatchlist();

      this.trackReputationEvent('domain_added_to_watchlist', {
        domain: cleanDomain,
      });
    }
  }

  /**
   * Remove domain from watchlist
   */
  removeFromWatchlist(domain: string): void {
    const cleanDomain = this.sanitizeDomain(domain);
    const index = this.state.watchlist.indexOf(cleanDomain);

    if (index >= 0) {
      this.state.watchlist.splice(index, 1);
      this.saveWatchlist();

      this.trackReputationEvent('domain_removed_from_watchlist', {
        domain: cleanDomain,
      });
    }
  }

  /**
   * Check watchlist domains
   */
  async checkWatchlist(): Promise<void> {
    if (this.state.watchlist.length === 0) return;

    this.state.isLoading = true;

    try {
      for (const domain of this.state.watchlist) {
        try {
          const report = await this.scanDomain(domain);

          // Check if score has changed significantly
          const previousScan = this.getPreviousScan(domain);
          if (
            previousScan &&
            Math.abs(report.overallScore - previousScan.score) >= 10
          ) {
            this.createAlert({
              id: `alert_${Date.now()}`,
              domain,
              type: 'score-change',
              severity:
                report.overallScore < previousScan.score ? 'high' : 'medium',
              title: 'Reputation Score Changed',
              description: `Score changed from ${previousScan.score} to ${report.overallScore}`,
              timestamp: new Date().toISOString(),
              read: false,
              actionRequired:
                report.overallScore < this.state.settings.alertThreshold,
            });
          }

          // Small delay between scans
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Failed to scan watchlist domain ${domain}:`, error);
        }
      }
    } catch (error) {
      console.error('Watchlist check failed:', error);
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Get domain comparison
   */
  async compareDomains(
    domains: string[]
  ): Promise<Map<string, ReputationReport>> {
    const results = new Map<string, ReputationReport>();

    for (const domain of domains) {
      try {
        const report = await this.scanDomain(domain);
        results.set(domain, report);

        // Small delay between scans
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to scan domain ${domain}:`, error);
      }
    }

    this.trackReputationEvent('domains_compared', {
      count: domains.length,
      successful: results.size,
    });

    return results;
  }

  /**
   * Export scan results
   */
  async exportResults(
    format: 'pdf' | 'json' | 'csv',
    report?: ReputationReport
  ): Promise<void> {
    try {
      const exportData = report || this.state.currentReport;

      if (!exportData) {
        throw new Error('No scan results to export');
      }

      const response = await fetch('/api/tools/domain-reputation/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          report: exportData,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `domain-reputation-${
          exportData.domain
        }-${Date.now()}.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.trackReputationEvent('results_exported', {
          format,
          domain: exportData.domain,
          score: exportData.overallScore,
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      this.state.error = 'Failed to export results';
    }
  }

  /**
   * Mark alert as read
   */
  markAlertAsRead(alertId: string): void {
    const alert = this.state.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.read = true;
      this.saveAlerts();
    }
  }

  /**
   * Dismiss alert
   */
  dismissAlert(alertId: string): void {
    const index = this.state.alerts.findIndex((a) => a.id === alertId);
    if (index >= 0) {
      this.state.alerts.splice(index, 1);
      this.saveAlerts();
    }
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<ReputationSettings>): void {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.saveSettings();

    this.trackReputationEvent('settings_updated', {
      changes: Object.keys(newSettings),
    });
  }

  /**
   * Cancel current scan
   */
  cancelScan(): void {
    if (this.scanAbortController) {
      this.scanAbortController.abort();
      this.scanAbortController = null;
    }

    this.state.isScanning = false;
    this.trackReputationEvent('scan_cancelled');
  }

  /**
   * Clear scan history
   */
  clearScanHistory(): void {
    this.state.scanHistory = [];
    this.saveScanHistory();
    this.trackReputationEvent('scan_history_cleared');
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

  private addToScanHistory(record: ScanRecord): void {
    this.state.scanHistory.unshift(record);

    // Limit history size
    if (this.state.scanHistory.length > 500) {
      this.state.scanHistory = this.state.scanHistory.slice(0, 500);
    }

    this.saveScanHistory();
  }

  private getPreviousScan(domain: string): ScanRecord | null {
    const domainScans = this.state.scanHistory.filter(
      (scan) => scan.domain === domain && scan.success
    );
    return domainScans.length > 1 ? domainScans[1] : null;
  }

  private checkForAlerts(report: ReputationReport): void {
    // Check for high-risk score
    if (report.overallScore >= this.state.settings.alertThreshold) {
      this.createAlert({
        id: `alert_${Date.now()}_risk`,
        domain: report.domain,
        type: 'threat-detected',
        severity: 'high',
        title: 'High Risk Score Detected',
        description: `Domain scored ${report.overallScore}/100, above alert threshold`,
        timestamp: new Date().toISOString(),
        read: false,
        actionRequired: true,
        relatedScan: report.lastScanned,
      });
    }

    // Check for new threats
    if (report.threats.length > 0) {
      const criticalThreats = report.threats.filter(
        (t) => t.severity === 'critical'
      );
      if (criticalThreats.length > 0) {
        this.createAlert({
          id: `alert_${Date.now()}_threats`,
          domain: report.domain,
          type: 'threat-detected',
          severity: 'critical',
          title: 'Critical Threats Detected',
          description: `${criticalThreats.length} critical threat(s) found`,
          timestamp: new Date().toISOString(),
          read: false,
          actionRequired: true,
          relatedScan: report.lastScanned,
        });
      }
    }

    // Check for blacklist additions
    const newBlacklists = report.blacklists.filter((bl) => bl.listed);
    if (newBlacklists.length > 0) {
      this.createAlert({
        id: `alert_${Date.now()}_blacklist`,
        domain: report.domain,
        type: 'blacklist-added',
        severity: 'high',
        title: 'Domain Blacklisted',
        description: `Found on ${newBlacklists.length} blacklist(s)`,
        timestamp: new Date().toISOString(),
        read: false,
        actionRequired: true,
        relatedScan: report.lastScanned,
      });
    }

    // Check SSL issues
    if (report.ssl && !report.ssl.isValid) {
      this.createAlert({
        id: `alert_${Date.now()}_ssl`,
        domain: report.domain,
        type: 'ssl-issue',
        severity: 'medium',
        title: 'SSL Certificate Issues',
        description: 'SSL certificate is invalid or expired',
        timestamp: new Date().toISOString(),
        read: false,
        actionRequired: false,
        relatedScan: report.lastScanned,
      });
    }
  }

  private createAlert(alert: SecurityAlert): void {
    this.state.alerts.unshift(alert);

    // Limit alerts
    if (this.state.alerts.length > 100) {
      this.state.alerts = this.state.alerts.slice(0, 100);
    }

    this.saveAlerts();
  }

  private async loadScanHistory(): Promise<ScanRecord[]> {
    try {
      const res = await fetch('/api/user/preferences/tool-state/domain_reputation', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data?.history || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading scan history:', error);
      return [];
    }
  }

  private async loadWatchlist(): Promise<string[]> {
    try {
      const res = await fetch('/api/user/preferences/tool-state/domain_reputation', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data?.watchlist || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading watchlist:', error);
      return [];
    }
  }

  private async loadAlerts(): Promise<SecurityAlert[]> {
    try {
      const res = await fetch('/api/user/preferences/tool-state/domain_reputation', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data?.alerts || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading alerts:', error);
      return [];
    }
  }

  private async loadSettings(): Promise<Partial<ReputationSettings> | null> {
    try {
      const res = await fetch('/api/user/preferences/tool-state/domain_reputation', { credentials: 'include' });
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

  private saveScanHistory(): void {
    try {
      fetch('/api/user/preferences/tool-state/domain_reputation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ history: this.state.scanHistory }),
      }).catch(err => console.error('Error saving scan history:', err));
    } catch (error) {
      console.error('Error saving scan history:', error);
    }
  }

  private saveWatchlist(): void {
    try {
      fetch('/api/user/preferences/tool-state/domain_reputation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ watchlist: this.state.watchlist }),
      }).catch(err => console.error('Error saving watchlist:', err));
    } catch (error) {
      console.error('Error saving watchlist:', error);
    }
  }

  private saveAlerts(): void {
    try {
      fetch('/api/user/preferences/tool-state/domain_reputation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ alerts: this.state.alerts }),
      }).catch(err => console.error('Error saving alerts:', err));
    } catch (error) {
      console.error('Error saving alerts:', error);
    }
  }

  private saveSettings(): void {
    try {
      fetch('/api/user/preferences/tool-state/domain_reputation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ settings: this.state.settings }),
      }).catch(err => console.error('Error saving settings:', err));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  private trackReputationEvent(
    event: string,
    properties?: Record<string, any>
  ): void {
    try {
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('Domain Reputation', {
          event,
          timestamp: new Date().toISOString(),
          ...properties,
        });
      }
    } catch (error) {
      console.error('Error tracking reputation event:', error);
    }
  }

  /**
   * Public getters
   */
  getState(): DomainReputationState {
    return { ...this.state };
  }

  getCurrentReport(): ReputationReport | null {
    return this.state.currentReport;
  }

  getScanHistory(): ScanRecord[] {
    return this.state.scanHistory;
  }

  getWatchlist(): string[] {
    return this.state.watchlist;
  }

  getAlerts(): SecurityAlert[] {
    return this.state.alerts;
  }

  getUnreadAlerts(): SecurityAlert[] {
    return this.state.alerts.filter((alert) => !alert.read);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.state.error = null;
  }
}

// Export singleton instance
export const domainReputationLogic = new DomainReputationLogic();

// Export utility functions
export const domainReputationUtils = {
  /**
   * Get risk level color
   */
  getRiskColor(riskLevel: string): string {
    const colors = {
      'very-low': '#059669', // green
      low: '#65A30D', // lime
      medium: '#D97706', // amber
      high: '#DC2626', // red
      critical: '#991B1B', // dark red
    };
    return colors[riskLevel as keyof typeof colors] || '#6B7280';
  },

  /**
   * Format threat severity
   */
  formatThreatSeverity(severity: string): { color: string; label: string } {
    const severityMap = {
      low: { color: '#65A30D', label: 'Low Risk' },
      medium: { color: '#D97706', label: 'Medium Risk' },
      high: { color: '#DC2626', label: 'High Risk' },
      critical: { color: '#991B1B', label: 'Critical Risk' },
    };
    return (
      severityMap[severity as keyof typeof severityMap] || {
        color: '#6B7280',
        label: 'Unknown',
      }
    );
  },

  /**
   * Calculate overall security grade
   */
  calculateSecurityGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  },

  /**
   * Format scan duration
   */
  formatScanDuration(milliseconds: number): string {
    const seconds = Math.round(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  },

  /**
   * Get recommendation priority color
   */
  getRecommendationColor(priority: string): string {
    const colors = {
      low: '#6B7280',
      medium: '#D97706',
      high: '#DC2626',
      critical: '#991B1B',
    };
    return colors[priority as keyof typeof colors] || '#6B7280';
  },

  /**
   * Format blacklist status
   */
  formatBlacklistStatus(blacklists: BlacklistStatus[]): {
    listed: number;
    total: number;
    percentage: number;
  } {
    const total = blacklists.length;
    const listed = blacklists.filter((bl) => bl.listed).length;
    const percentage = total > 0 ? Math.round((listed / total) * 100) : 0;

    return { listed, total, percentage };
  },
};
