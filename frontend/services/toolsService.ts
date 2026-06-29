import { AdminAnalyticsData, AdminStatsData } from '@/models/adminAnalytics';
import { PUBLIC_API_URL as BACKEND_URL } from '@/lib/backend-url';


export interface ToolRequest {
  domain?: string;
  host?: string;
  ip?: string;
  mac?: string;
  query?: string;
  url?: string;
  text?: string;
  algorithm?: string;
  ports?: string;
}

export interface ToolResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class ToolsService {
  private async makeRequest(endpoint: string, data: ToolRequest): Promise<ToolResponse> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tools/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `Request failed with status ${response.status}`,
        };
      }

      return result;
    } catch (error) {
      console.error(`Tools API error for ${endpoint}:`, error);
      return {
        success: false,
        error: 'Network error or service unavailable',
      };
    }
  }

  async whoisLookup(domain: string): Promise<ToolResponse> {
    return this.makeRequest('whois-lookup', { domain });
  }

  async domainReputation(domain: string): Promise<ToolResponse> {
    return this.makeRequest('domain-reputation', { domain });
  }

  async dnsLookup(domain: string, type: string = 'A'): Promise<ToolResponse> {
    return this.makeRequest('dns-lookup', { domain, type });
  }

  async pingTest(host: string): Promise<ToolResponse> {
    return this.makeRequest('ping-test', { host });
  }

  async portScanner(host: string, ports: string = '80,443'): Promise<ToolResponse> {
    return this.makeRequest('port-scanner', { host, ports });
  }

  async sslChecker(domain: string): Promise<ToolResponse> {
    return this.makeRequest('ssl-checker', { domain });
  }

  async traceroute(host: string): Promise<ToolResponse> {
    return this.makeRequest('traceroute', { host });
  }

  async hash(text: string, algorithm: string = 'sha256'): Promise<ToolResponse> {
    return this.makeRequest('hash', { text, algorithm });
  }

  async ipGeolocation(ip: string): Promise<ToolResponse> {
    return this.makeRequest('ip-geolocation', { ip });
  }

  async macLookup(mac: string): Promise<ToolResponse> {
    return this.makeRequest('mac-lookup', { mac });
  }

  async threatIntelligence(query: string): Promise<ToolResponse> {
    return this.makeRequest('threat-intelligence', { query });
  }

  async websiteCategorization(url: string): Promise<ToolResponse> {
    return this.makeRequest('website-categorization', { url });
  }

  async domainAvailability(domain: string): Promise<ToolResponse> {
    return this.makeRequest('domain-availability', { domain });
  }

  async domainResearch(domain: string): Promise<ToolResponse> {
    return this.makeRequest('domain-research', { domain });
  }

  async dnsLookupAdvanced(domain: string): Promise<ToolResponse> {
    return this.makeRequest('dns-lookup-advanced', { domain });
  }

  async ipNetblocks(ip: string): Promise<ToolResponse> {
    return this.makeRequest('ip-netblocks', { ip });
  }

  async speedTest(url: string): Promise<ToolResponse> {
    return this.makeRequest('speed-test', { url });
  }

  async apiTester(url: string, method: string = 'GET', headers: Record<string, string> = {}, body?: any): Promise<ToolResponse> {
    return this.makeRequest('api-tester', { url, method, headers, body });
  }
}

export const toolsService = new ToolsService();