import express from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import { prisma } from '../lib/prisma.js';

const execAsync = promisify(exec);
const router = express.Router();

// ============================================
// INPUT VALIDATION — prevents command injection
// ============================================

const DOMAIN_RE = /^[a-z0-9]([a-z0-9\-.]{0,251}[a-z0-9])?$/;
const IP_RE = /^(\d{1,3}\.){3}\d{1,3}$/;

function sanitizeDomain(input) {
  const clean = String(input).trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/[:\/\?#].*$/, '');
  if (!DOMAIN_RE.test(clean)) return null;
  return clean;
}

function sanitizeHost(input) {
  const clean = String(input).trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/[:\/\?#].*$/, '');
  if (DOMAIN_RE.test(clean) || IP_RE.test(clean)) return clean;
  return null;
}

function isPrivateUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    const h = u.hostname.toLowerCase();
    if (/^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.|169\.254\.)/.test(h)) return true;
    if (h === 'localhost' || h === '::1' || h === '[::1]') return true;
    if (h.endsWith('.internal') || h.endsWith('.local')) return true;
    return false;
  } catch { return true; }
}

// ============================================
// MIDDLEWARE
// ============================================

// Rate limiting for tools (stricter than general API)
const toolLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 tool requests per windowMs
  message: {
    success: false,
    message: 'Tool usage rate limit exceeded, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all tool routes
router.use(toolLimiter);

// ============================================
// TOOL USAGE TRACKING MIDDLEWARE
// Records every tool invocation to the ToolUsage table
// ============================================

const ROUTE_TO_TOOL_NAME = {
  '/whois-lookup': 'WHOIS Lookup',
  '/domain-reputation': 'Domain Reputation',
  '/dns-lookup': 'DNS Lookup',
  '/ping-test': 'Ping Test',
  '/port-scanner': 'Port Scanner',
  '/ssl-checker': 'SSL Checker',
  '/traceroute': 'Traceroute',
  '/hash': 'Hash Generator',
  '/ip-geolocation': 'IP Geolocation',
  '/mac-lookup': 'MAC Lookup',
  '/threat-intelligence': 'Threat Intelligence',
  '/website-categorization': 'Website Categorization',
  '/domain-availability': 'Domain Availability',
  '/domain-research': 'Domain Research',
  '/dns-lookup-advanced': 'DNS Lookup Advanced',
  '/ip-netblocks': 'IP Netblocks',
  '/speed-test': 'Speed Test',
  '/api-tester': 'API Tester',
};

router.use((req, res, next) => {
  const startTime = Date.now();
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    const latencyMs = Date.now() - startTime;
    const basePath = req.path.split('/').slice(0, 2).join('/'); // e.g. /whois-lookup
    const toolName = ROUTE_TO_TOOL_NAME[basePath] || basePath.replace(/^\//, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const status = res.statusCode >= 400 || (body && body.success === false) ? 'failed' : 'completed';

    // Fire and forget — don't slow down the response
    prisma.toolUsage.create({
      data: {
        toolName,
        command: req.method + ' ' + req.originalUrl,
        latencyMs: Math.round(latencyMs),
        status,
        metadata: {},
        occurredAt: new Date(),
      },
    }).catch(err => console.error('[ToolUsage] Failed to record:', err.message));

    return originalJson(body);
  };
  next();
});

// ============================================
// WHOIS LOOKUP
// ============================================

router.post('/whois-lookup', async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Domain name is required'
      });
    }

    const cleanDomain = sanitizeDomain(domain);
    if (!cleanDomain) {
      return res.status(400).json({ success: false, error: 'Invalid domain name' });
    }

    // Use whois command line tool first (no API key needed)
    try {
      const { stdout } = await execAsync(`whois ${cleanDomain}`);
      if (stdout && stdout.trim().length > 50) {
        return res.json({
          success: true,
          data: {
            domain: cleanDomain,
            whois: stdout
          }
        });
      }
      throw new Error('Empty whois response');
    } catch (execError) {
      // Fallback to WhoisJSON API if whois CLI fails
      const whoisJsonKey = process.env.WHOISJSON_API_KEY;
      if (!whoisJsonKey) {
        return res.status(500).json({
          success: false,
          error: 'WHOIS lookup failed and no fallback API key configured'
        });
      }

      const response = await fetch(`https://whoisjsonapi.com/v1/${encodeURIComponent(cleanDomain)}`, {
        headers: {
          'Authorization': `Bearer ${whoisJsonKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`WhoisJSON API returned ${response.status}`);
      }

      const data = await response.json();
      res.json({
        success: true,
        data: {
          domain: cleanDomain,
          whois: data
        }
      });
    }
  } catch (error) {
    console.error('WHOIS lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform WHOIS lookup'
    });
  }
});

// ============================================
// DOMAIN REPUTATION
// ============================================

router.post('/domain-reputation', async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Domain name is required'
      });
    }

    const cleanDomain = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .split('/')[0];

    const abuseKey = process.env.ABUSEIPDB_API_KEY;

    if (!abuseKey) {
      return res.status(500).json({
        success: false,
        error: 'Domain Reputation API key not configured'
      });
    }

    // Resolve domain to IP first, then check AbuseIPDB
    let targetIP = '';
    try {
      const { stdout } = await execAsync(`dig +short A ${cleanDomain} | head -1`);
      targetIP = stdout.trim();
    } catch {}

    if (!targetIP || !/^(\d{1,3}\.){3}\d{1,3}$/.test(targetIP)) {
      return res.status(400).json({
        success: false,
        error: 'Could not resolve domain to an IP address'
      });
    }

    const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(targetIP)}&maxAgeInDays=90&verbose`, {
      headers: {
        'Key': abuseKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`AbuseIPDB API returned ${response.status}`);
    }

    const result = await response.json();
    const data = result.data || {};
    res.json({
      success: true,
      data: {
        domain: cleanDomain,
        reputation: {
          ipAddress: data.ipAddress,
          isPublic: data.isPublic,
          abuseConfidenceScore: data.abuseConfidenceScore,
          countryCode: data.countryCode,
          usageType: data.usageType,
          isp: data.isp,
          domain: data.domain,
          totalReports: data.totalReports,
          numDistinctUsers: data.numDistinctUsers,
          lastReportedAt: data.lastReportedAt,
          isTor: data.isTor,
          isWhitelisted: data.isWhitelisted,
          reports: (data.reports || []).slice(0, 10),
        }
      }
    });
  } catch (error) {
    console.error('Domain reputation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check domain reputation'
    });
  }
});

// ============================================
// DNS LOOKUP
// ============================================

router.post('/dns-lookup', async (req, res) => {
  try {
    const { domain, type = 'A' } = req.body;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Domain name is required'
      });
    }

    const cleanDomain = sanitizeDomain(domain);
    if (!cleanDomain) return res.status(400).json({ success: false, error: "Invalid domain name" });

    const VALID_DNS_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'SRV', 'PTR', 'CAA', 'ANY'];
    const cleanType = String(type).toUpperCase();
    if (!VALID_DNS_TYPES.includes(cleanType)) {
      return res.status(400).json({ success: false, error: 'Invalid DNS record type' });
    }

    // Use dig command
    const { stdout } = await execAsync(`dig ${cleanType} ${cleanDomain} +short`);
    const records = stdout.trim().split('\n').filter(line => line.length > 0);

    res.json({
      success: true,
      data: {
        domain: cleanDomain,
        type,
        records
      }
    });
  } catch (error) {
    console.error('DNS lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform DNS lookup'
    });
  }
});

// ============================================
// PING TEST
// ============================================

router.post('/ping-test', async (req, res) => {
  try {
    const { host } = req.body;

    if (!host || typeof host !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Host is required'
      });
    }

    const cleanHost = sanitizeHost(host);
    if (!cleanHost) return res.status(400).json({ success: false, error: "Invalid hostname" });

    // Use ping command (limit to 3 packets for safety)
    const { stdout } = await execAsync(`ping -c 3 ${cleanHost}`);

    res.json({
      success: true,
      data: {
        host: cleanHost,
        result: stdout
      }
    });
  } catch (error) {
    console.error('Ping test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform ping test'
    });
  }
});

// ============================================
// PORT SCANNER
// ============================================

router.post('/port-scanner', async (req, res) => {
  try {
    const { host, ports = '80,443' } = req.body;

    if (!host || typeof host !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Host is required'
      });
    }

    const cleanHost = sanitizeHost(host);
    if (!cleanHost) return res.status(400).json({ success: false, error: "Invalid hostname" });
    const portList = ports.split(',').map(p => p.trim()).filter(p => /^\d+$/.test(p) && parseInt(p) <= 65535);
    if (portList.length === 0) return res.status(400).json({ success: false, error: 'Invalid port numbers' });
    const cleanPorts = portList.join(',');

    // Use nmap if available, otherwise nc
    try {
      const { stdout } = await execAsync(`nmap -p ${cleanPorts} ${cleanHost} --open`);
      res.json({
        success: true,
        data: {
          host: cleanHost,
          ports: portList,
          result: stdout
        }
      });
    } catch (nmapError) {
      // Fallback to nc (netcat)
      const results = [];
      for (const port of portList) {
        try {
          await execAsync(`nc -z -w1 ${cleanHost} ${port}`);
          results.push({ port: parseInt(port), status: 'open' });
        } catch {
          results.push({ port: parseInt(port), status: 'closed' });
        }
      }

      res.json({
        success: true,
        data: {
          host: cleanHost,
          ports: results
        }
      });
    }
  } catch (error) {
    console.error('Port scanner error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform port scan'
    });
  }
});

// ============================================
// SSL CHECKER
// ============================================

router.post('/ssl-checker', async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Domain name is required'
      });
    }

    const cleanDomain = sanitizeDomain(domain);
    if (!cleanDomain) return res.status(400).json({ success: false, error: 'Invalid domain name' });

    // Use openssl to check SSL certificate
    const { stdout } = await execAsync(`echo | openssl s_client -servername ${cleanDomain} -connect ${cleanDomain}:443 2>/dev/null | openssl x509 -noout -dates -subject -issuer`);

    res.json({
      success: true,
      data: {
        domain: cleanDomain,
        ssl_info: stdout
      }
    });
  } catch (error) {
    console.error('SSL checker error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check SSL certificate'
    });
  }
});

// ============================================
// TRACEROUTE
// ============================================

router.post('/traceroute', async (req, res) => {
  try {
    const { host } = req.body;

    if (!host || typeof host !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Host is required'
      });
    }

    const cleanHost = sanitizeHost(host);
    if (!cleanHost) return res.status(400).json({ success: false, error: "Invalid hostname" });

    // Use traceroute command
    const { stdout } = await execAsync(`traceroute -m 15 ${cleanHost}`);

    res.json({
      success: true,
      data: {
        host: cleanHost,
        trace: stdout
      }
    });
  } catch (error) {
    console.error('Traceroute error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform traceroute'
    });
  }
});

// ============================================
// HASH CALCULATOR
// ============================================

router.post('/hash', async (req, res) => {
  try {
    const { text, algorithm = 'sha256' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const VALID_ALGOS = ['md5', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512'];
    if (!VALID_ALGOS.includes(algorithm)) {
      return res.status(400).json({ success: false, error: 'Invalid algorithm' });
    }

    const hash = crypto.createHash(algorithm).update(text).digest('hex');

    res.json({
      success: true,
      data: {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        algorithm,
        hash,
      }
    });
  } catch (error) {
    console.error('Hash calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate hash'
    });
  }
});

// ============================================
// IP GEOLOCATION
// ============================================

router.post('/ip-geolocation', async (req, res) => {
  try {
    const { ip } = req.body;

    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'IP address is required'
      });
    }

    const apiKey = process.env.IPGEOLOCATION_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'IP Geolocation API key not configured'
      });
    }

    const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}&ip=${encodeURIComponent(ip)}`);

    if (!response.ok) {
      throw new Error(`IP Geolocation API returned ${response.status}`);
    }

    const data = await response.json();
    res.json({
      success: true,
      data: {
        ip,
        location: data
      }
    });
  } catch (error) {
    console.error('IP geolocation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to geolocate IP'
    });
  }
});

// ============================================
// MAC LOOKUP
// ============================================

router.post('/mac-lookup', async (req, res) => {
  try {
    const { mac } = req.body;

    if (!mac || typeof mac !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'MAC address is required'
      });
    }

    const cleanMac = mac.trim().toUpperCase().replace(/[:-]/g, '');

    // Use macvendors API (free tier)
    const response = await fetch(`https://api.macvendors.com/${cleanMac}`);

    if (!response.ok) {
      throw new Error(`MAC lookup API returned ${response.status}`);
    }

    const vendor = await response.text();
    res.json({
      success: true,
      data: {
        mac: cleanMac,
        vendor
      }
    });
  } catch (error) {
    console.error('MAC lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lookup MAC address'
    });
  }
});

// ============================================
// THREAT INTELLIGENCE
// ============================================

router.post('/threat-intelligence', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    const abuseKey = process.env.ABUSEIPDB_API_KEY;
    const shodanKey = process.env.SHODAN_API_KEY;

    if (!abuseKey && !shodanKey) {
      return res.status(500).json({
        success: false,
        error: 'Threat intelligence API keys not configured'
      });
    }

    // Check if it's an IP, domain, or hash
    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(query);
    const isDomain = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(query);
    const isHash = /^[a-fA-F0-9]{32,64}$/.test(query);

    if (!isIP && !isDomain && !isHash) {
      return res.status(400).json({
        success: false,
        error: 'Query must be an IP address, domain, or file hash'
      });
    }

    // For hashes, we can't check with AbuseIPDB/Shodan — return limited info
    if (isHash) {
      return res.json({
        success: true,
        data: {
          query,
          type: 'hash',
          analysis: {
            note: 'Hash lookup requires VirusTotal API. AbuseIPDB and Shodan only support IP/domain queries.',
            hash: query,
            hashType: query.length === 32 ? 'MD5' : query.length === 40 ? 'SHA-1' : 'SHA-256',
          }
        }
      });
    }

    // Resolve domain to IP if needed
    let targetIP = query;
    if (isDomain) {
      try {
        const { stdout } = await execAsync(`dig +short A ${query} | head -1`);
        targetIP = stdout.trim();
      } catch {}
    }

    const results = {};

    // AbuseIPDB check
    if (abuseKey && targetIP && /^(\d{1,3}\.){3}\d{1,3}$/.test(targetIP)) {
      try {
        const abuseResp = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(targetIP)}&maxAgeInDays=90&verbose`, {
          headers: { 'Key': abuseKey, 'Accept': 'application/json' }
        });
        if (abuseResp.ok) {
          const abuseData = await abuseResp.json();
          results.abuseipdb = abuseData.data;
        }
      } catch {}
    }

    // Shodan check
    if (shodanKey && targetIP && /^(\d{1,3}\.){3}\d{1,3}$/.test(targetIP)) {
      try {
        const shodanResp = await fetch(`https://api.shodan.io/shodan/host/${encodeURIComponent(targetIP)}?key=${shodanKey}`);
        if (shodanResp.ok) {
          const shodanData = await shodanResp.json();
          results.shodan = {
            ports: shodanData.ports,
            hostnames: shodanData.hostnames,
            os: shodanData.os,
            vulns: shodanData.vulns || [],
            tags: shodanData.tags || [],
            org: shodanData.org,
            isp: shodanData.isp,
            lastUpdate: shodanData.last_update,
          };
        }
      } catch {}
    }

    // Build unified analysis
    const abuse = results.abuseipdb || {};
    const shodan = results.shodan || {};
    res.json({
      success: true,
      data: {
        query,
        type: isIP ? 'ip' : 'domain',
        resolvedIP: targetIP,
        analysis: {
          abuseConfidenceScore: abuse.abuseConfidenceScore ?? null,
          totalReports: abuse.totalReports ?? 0,
          lastReportedAt: abuse.lastReportedAt || null,
          isTor: abuse.isTor ?? false,
          isWhitelisted: abuse.isWhitelisted ?? false,
          countryCode: abuse.countryCode || shodan.org || '',
          isp: abuse.isp || shodan.isp || '',
          usageType: abuse.usageType || '',
          domain: abuse.domain || '',
          openPorts: shodan.ports || [],
          hostnames: shodan.hostnames || [],
          os: shodan.os || null,
          vulnerabilities: shodan.vulns || [],
          recentReports: (abuse.reports || []).slice(0, 5),
        }
      }
    });
  } catch (error) {
    console.error('Threat intelligence error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform threat intelligence check'
    });
  }
});

// ============================================
// WEBSITE CATEGORIZATION
// ============================================

router.post('/website-categorization', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    const shodanKey = process.env.SHODAN_API_KEY;

    if (!shodanKey) {
      return res.status(500).json({
        success: false,
        error: 'Website categorization API key not configured'
      });
    }

    // Extract domain from URL
    let domain;
    try {
      domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    } catch {
      domain = url.replace(/^https?:\/\//, '').split('/')[0];
    }

    // Resolve to IP then use Shodan for host info
    let targetIP = '';
    try {
      const { stdout } = await execAsync(`dig +short A ${domain} | head -1`);
      targetIP = stdout.trim();
    } catch {}

    const results = {};

    // Shodan host lookup
    if (targetIP && /^(\d{1,3}\.){3}\d{1,3}$/.test(targetIP)) {
      try {
        const shodanResp = await fetch(`https://api.shodan.io/shodan/host/${encodeURIComponent(targetIP)}?key=${shodanKey}`);
        if (shodanResp.ok) {
          results.shodan = await shodanResp.json();
        }
      } catch {}
    }

    // Also get HTTP headers for technology detection
    let headers = {};
    try {
      const headerResp = await fetch(url.startsWith('http') ? url : `https://${url}`, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      });
      headers = Object.fromEntries(headerResp.headers.entries());
    } catch {}

    // Build categorization from available data
    const shodan = results.shodan || {};
    const technologies = [];
    const categories = [];

    // Detect from Shodan data
    if (shodan.data) {
      for (const service of shodan.data) {
        if (service.product) technologies.push(service.product);
        if (service.http?.components) {
          Object.keys(service.http.components).forEach(c => technologies.push(c));
        }
      }
    }

    // Detect from HTTP headers
    if (headers['server']) technologies.push(headers['server']);
    if (headers['x-powered-by']) technologies.push(headers['x-powered-by']);
    if (headers['x-generator']) technologies.push(headers['x-generator']);

    // Categorize based on detected technologies
    const techLower = technologies.map(t => t.toLowerCase()).join(' ');
    if (techLower.includes('wordpress') || techLower.includes('wp')) categories.push('CMS', 'Blog');
    if (techLower.includes('shopify') || techLower.includes('woocommerce')) categories.push('E-commerce');
    if (techLower.includes('nginx') || techLower.includes('apache') || techLower.includes('cloudflare')) categories.push('Web Server');
    if (shodan.ports?.includes(25) || shodan.ports?.includes(587)) categories.push('Mail Server');
    if (shodan.ports?.includes(21)) categories.push('FTP Server');

    res.json({
      success: true,
      data: {
        url,
        categories: {
          domain,
          ip: targetIP || null,
          detectedTechnologies: [...new Set(technologies)],
          categories: [...new Set(categories)],
          ports: shodan.ports || [],
          os: shodan.os || null,
          org: shodan.org || null,
          isp: shodan.isp || null,
          hostnames: shodan.hostnames || [],
          httpHeaders: headers,
        }
      }
    });
  } catch (error) {
    console.error('Website categorization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to categorize website'
    });
  }
});

// ============================================
// DOMAIN AVAILABILITY
// ============================================

router.post('/domain-availability', async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Domain name is required'
      });
    }

    const cleanDomain = sanitizeDomain(domain);
    if (!cleanDomain) return res.status(400).json({ success: false, error: "Invalid domain name" });

    // Use whois CLI to check domain availability (no API key needed)
    let whoisData = '';
    let isAvailable = false;
    try {
      const { stdout } = await execAsync(`whois ${cleanDomain}`);
      whoisData = stdout;

      // Check for patterns indicating domain is not registered
      const notFoundPatterns = [
        /no match/i,
        /not found/i,
        /no entries found/i,
        /no data found/i,
        /domain not found/i,
        /status:\s*free/i,
        /status:\s*available/i,
        /^%.*no match/im,
        /this domain name has not been registered/i,
      ];

      isAvailable = notFoundPatterns.some(p => p.test(whoisData));
    } catch (execError) {
      // If whois command fails entirely, domain is likely available or TLD not supported
      isAvailable = true;
    }

    // Also try DNS resolution as a secondary check
    let hasDNS = false;
    try {
      const { stdout: dnsOut } = await execAsync(`dig +short A ${cleanDomain}`);
      hasDNS = dnsOut.trim().length > 0;
    } catch {}

    // If WHOIS says not found but DNS resolves, it's probably registered
    if (isAvailable && hasDNS) {
      isAvailable = false;
    }

    res.json({
      success: true,
      data: {
        domain: cleanDomain,
        availability: {
          domainName: cleanDomain,
          isAvailable,
          isDomainAvailable: isAvailable,
          tld: '.' + (cleanDomain.split('.').pop() || ''),
          hasDNSRecords: hasDNS,
          checkedAt: new Date().toISOString(),
        }
      }
    });
  } catch (error) {
    console.error('Domain availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check domain availability'
    });
  }
});

// ============================================
// DOMAIN RESEARCH
// ============================================

router.post('/domain-research', async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Domain name is required'
      });
    }

    const cleanDomain = sanitizeDomain(domain);
    if (!cleanDomain) return res.status(400).json({ success: false, error: "Invalid domain name" });

    const whoisJsonKey = process.env.WHOISJSON_API_KEY;

    // Gather data from multiple sources in parallel
    const results = await Promise.allSettled([
      // 1. WHOIS data via WhoisJSON API or CLI
      whoisJsonKey
        ? fetch(`https://whoisjsonapi.com/v1/${encodeURIComponent(cleanDomain)}`, {
            headers: { 'Authorization': `Bearer ${whoisJsonKey}` }
          }).then(r => r.ok ? r.json() : null).catch(() => null)
        : execAsync(`whois ${cleanDomain}`).then(r => r.stdout).catch(() => ''),

      // 2. DNS records (multiple types)
      execAsync(`dig ANY ${cleanDomain} +noall +answer`).then(r => r.stdout).catch(() => ''),

      // 3. MX records
      execAsync(`dig MX ${cleanDomain} +short`).then(r => r.stdout).catch(() => ''),

      // 4. NS records
      execAsync(`dig NS ${cleanDomain} +short`).then(r => r.stdout).catch(() => ''),

      // 5. TXT records
      execAsync(`dig TXT ${cleanDomain} +short`).then(r => r.stdout).catch(() => ''),

      // 6. A records
      execAsync(`dig A ${cleanDomain} +short`).then(r => r.stdout).catch(() => ''),

      // 7. SSL cert info
      execAsync(`echo | openssl s_client -connect ${cleanDomain}:443 -servername ${cleanDomain} 2>/dev/null | openssl x509 -noout -dates -subject -issuer 2>/dev/null`).then(r => r.stdout).catch(() => ''),
    ]);

    const whoisData = results[0].status === 'fulfilled' ? results[0].value : null;
    const dnsAll = results[1].status === 'fulfilled' ? results[1].value : '';
    const mxRecords = results[2].status === 'fulfilled' ? results[2].value : '';
    const nsRecords = results[3].status === 'fulfilled' ? results[3].value : '';
    const txtRecords = results[4].status === 'fulfilled' ? results[4].value : '';
    const aRecords = results[5].status === 'fulfilled' ? results[5].value : '';
    const sslInfo = results[6].status === 'fulfilled' ? results[6].value : '';

    res.json({
      success: true,
      data: {
        domain: cleanDomain,
        research: {
          whois: whoisData || 'No WHOIS data available',
          dns: {
            allRecords: dnsAll.trim(),
            a: aRecords.trim().split('\n').filter(Boolean),
            mx: mxRecords.trim().split('\n').filter(Boolean),
            ns: nsRecords.trim().split('\n').filter(Boolean),
            txt: txtRecords.trim().split('\n').filter(Boolean),
          },
          ssl: sslInfo.trim() || 'No SSL certificate detected',
          tld: '.' + (cleanDomain.split('.').pop() || ''),
          checkedAt: new Date().toISOString(),
        }
      }
    });
  } catch (error) {
    console.error('Domain research error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform domain research'
    });
  }
});

// ============================================
// DNS LOOKUP ADVANCED
// ============================================

router.post('/dns-lookup-advanced', async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Domain name is required'
      });
    }

    const cleanDomain = sanitizeDomain(domain);
    if (!cleanDomain) return res.status(400).json({ success: false, error: "Invalid domain name" });

    // Get all DNS records
    const { stdout } = await execAsync(`dig ${cleanDomain} ANY +noall +answer`);

    res.json({
      success: true,
      data: {
        domain: cleanDomain,
        records: stdout
      }
    });
  } catch (error) {
    console.error('DNS lookup advanced error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform advanced DNS lookup'
    });
  }
});

// ============================================
// IP NETBLOCKS
// ============================================

router.post('/ip-netblocks', async (req, res) => {
  try {
    const { ip } = req.body;

    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'IP address is required'
      });
    }

    // Use whois CLI to get netblock information (no API key needed)
    let whoisRaw = '';
    try {
      const { stdout } = await execAsync(`whois ${ip}`);
      whoisRaw = stdout;
    } catch (execError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to query WHOIS for IP netblock information'
      });
    }

    // Parse netblock-related fields from WHOIS output
    const parseField = (raw, patterns) => {
      for (const p of patterns) {
        const match = raw.match(p);
        if (match) return match[1].trim();
      }
      return '';
    };

    const netRange = parseField(whoisRaw, [/NetRange:\s*(.+)/i, /inetnum:\s*(.+)/i]);
    const cidr = parseField(whoisRaw, [/CIDR:\s*(.+)/i]);
    const netName = parseField(whoisRaw, [/NetName:\s*(.+)/i, /netname:\s*(.+)/i]);
    const orgName = parseField(whoisRaw, [/OrgName:\s*(.+)/i, /org-name:\s*(.+)/i, /Organization:\s*(.+)/i]);
    const orgId = parseField(whoisRaw, [/OrgId:\s*(.+)/i]);
    const country = parseField(whoisRaw, [/Country:\s*(.+)/i]);
    const regDate = parseField(whoisRaw, [/RegDate:\s*(.+)/i, /created:\s*(.+)/i]);
    const updated = parseField(whoisRaw, [/Updated:\s*(.+)/i, /last-modified:\s*(.+)/i]);
    const originAS = parseField(whoisRaw, [/OriginAS:\s*(.+)/i, /origin:\s*(.+)/i]);
    const abuseEmail = parseField(whoisRaw, [/OrgAbuseEmail:\s*(.+)/i, /abuse-mailbox:\s*(.+)/i]);

    res.json({
      success: true,
      data: {
        ip,
        netblocks: {
          ip,
          netRange: netRange || 'Unknown',
          cidr: cidr || 'Unknown',
          netName: netName || 'Unknown',
          organization: orgName || 'Unknown',
          orgId: orgId || '',
          country: country || 'Unknown',
          registrationDate: regDate || '',
          lastUpdated: updated || '',
          asn: originAS || '',
          abuseContact: abuseEmail || '',
          raw: whoisRaw,
        }
      }
    });
  } catch (error) {
    console.error('IP netblocks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get IP netblocks'
    });
  }
});

// ============================================
// SPEED TEST
// ============================================

router.post('/speed-test', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    if (isPrivateUrl(url)) {
      return res.status(400).json({ success: false, error: 'Cannot test internal URLs' });
    }

    // Use fetch instead of curl to avoid shell injection
    const startTime = Date.now();
    await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
    const elapsed = (Date.now() - startTime) / 1000;

    res.json({
      success: true,
      data: {
        url,
        response_time_seconds: parseFloat(elapsed.toFixed(3))
      }
    });
  } catch (error) {
    console.error('Speed test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform speed test'
    });
  }
});

// ============================================
// API TESTER
// ============================================

router.post('/api-tester', async (req, res) => {
  try {
    const { url, method = 'GET', headers = {}, body } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    if (isPrivateUrl(url)) {
      return res.status(400).json({ success: false, error: 'Cannot test internal URLs' });
    }

    const requestOptions = {
      method: method.toUpperCase(),
      headers: {
        'User-Agent': 'MumtazAI-Tool/1.0',
        ...headers
      }
    };

    if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')) {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      requestOptions.headers['Content-Type'] = 'application/json';
    }

    const startTime = Date.now();
    const response = await fetch(url, requestOptions);
    const endTime = Date.now();

    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let responseBody;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    res.json({
      success: true,
      data: {
        url,
        method: method.toUpperCase(),
        status: response.status,
        statusText: response.statusText,
        responseTime: endTime - startTime,
        headers: responseHeaders,
        body: responseBody
      }
    });
  } catch (error) {
    console.error('API tester error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test API endpoint'
    });
  }
});


// ============================================
// DOMAIN REPUTATION — ENHANCED SCAN
// Returns rich report format for DomainReputation service class
// ============================================

router.post('/domain-reputation/scan', async (req, res) => {
  try {
    const { domain, settings } = req.body;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Domain name is required'
      });
    }

    const cleanDomain = sanitizeDomain(domain);
    if (!cleanDomain) return res.status(400).json({ success: false, error: 'Invalid domain name' });

    const abuseKey = process.env.ABUSEIPDB_API_KEY;

    // Resolve domain to IP for AbuseIPDB check
    let targetIP = '';
    try {
      const { stdout: ipOut } = await execAsync(`dig +short A ${cleanDomain} | head -1`);
      targetIP = ipOut.trim();
    } catch {}

    // Gather data from multiple sources in parallel
    const results = await Promise.allSettled([
      // 1. AbuseIPDB reputation check (replaces apilayer domain_reputation)
      (abuseKey && targetIP && /^(\d{1,3}\.){3}\d{1,3}$/.test(targetIP))
        ? fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(targetIP)}&maxAgeInDays=90&verbose`, {
            headers: { 'Key': abuseKey, 'Accept': 'application/json' }
          }).then(r => r.ok ? r.json() : null).catch(() => null)
        : Promise.resolve(null),

      // 2. WHOIS data for technical analysis
      execAsync(`whois ${cleanDomain}`).then(r => r.stdout).catch(() => ''),

      // 3. DNS records
      execAsync(`dig ANY ${cleanDomain} +short`).then(r => r.stdout).catch(() => ''),

      // 4. SSL certificate check
      execAsync(`echo | openssl s_client -connect ${cleanDomain}:443 -servername ${cleanDomain} 2>/dev/null | openssl x509 -noout -dates -subject -issuer 2>/dev/null`).then(r => r.stdout).catch(() => ''),
    ]);

    const [reputationResult, whoisResult, dnsResult, sslResult] = results;
    const reputationData = reputationResult.status === 'fulfilled' ? reputationResult.value : null;
    const whoisRaw = whoisResult.status === 'fulfilled' ? whoisResult.value : '';
    const dnsRaw = dnsResult.status === 'fulfilled' ? dnsResult.value : '';
    const sslRaw = sslResult.status === 'fulfilled' ? sslResult.value : '';

    // Parse WHOIS data
    const registrar = whoisRaw.match(/Registrar:\s*(.+)/i)?.[1]?.trim() || 'Unknown';
    const creationDate = whoisRaw.match(/Creation Date:\s*(.+)/i)?.[1]?.trim() || '';
    const nameservers = [...whoisRaw.matchAll(/Name Server:\s*(.+)/gi)].map(m => m[1].trim().toLowerCase());
    const domainAgeDays = creationDate ? Math.floor((Date.now() - new Date(creationDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // Parse SSL data
    const sslNotBefore = sslRaw.match(/notBefore=(.+)/)?.[1]?.trim() || '';
    const sslNotAfter = sslRaw.match(/notAfter=(.+)/)?.[1]?.trim() || '';
    const sslIssuer = sslRaw.match(/issuer=(.+)/)?.[1]?.trim() || '';
    const sslSubject = sslRaw.match(/subject=(.+)/)?.[1]?.trim() || '';
    const hasSSL = sslNotBefore.length > 0;

    // Calculate scores
    let overallScore = 50; // Base score
    const categories = [];
    const threats = [];
    const blacklists = [];

    // Domain age scoring
    const ageScore = domainAgeDays > 365 ? 90 : domainAgeDays > 180 ? 70 : domainAgeDays > 30 ? 50 : 20;
    categories.push({
      category: 'Domain Age',
      score: ageScore,
      weight: 0.15,
      status: ageScore > 60 ? 'safe' : ageScore > 40 ? 'suspicious' : 'dangerous',
      details: [
        `Domain is ${domainAgeDays} days old`,
        domainAgeDays > 365 ? 'Established domain' : 'Relatively new domain',
      ],
      lastChecked: new Date().toISOString(),
    });

    // SSL scoring
    const sslScore = hasSSL ? 85 : 10;
    categories.push({
      category: 'SSL Certificate',
      score: sslScore,
      weight: 0.2,
      status: hasSSL ? 'safe' : 'dangerous',
      details: hasSSL
        ? [`Valid SSL certificate`, `Issuer: ${sslIssuer}`, `Expires: ${sslNotAfter}`]
        : ['No SSL certificate detected — site may be insecure'],
      lastChecked: new Date().toISOString(),
    });

    if (!hasSSL) {
      threats.push({
        type: 'phishing',
        severity: 'medium',
        confidence: 60,
        description: 'No SSL certificate — data in transit is not encrypted',
        source: 'SSL Check',
        detectedAt: new Date().toISOString(),
        indicators: ['Missing HTTPS'],
        mitigations: ['Install an SSL certificate'],
      });
    }

    // DNS health scoring
    const dnsRecords = dnsRaw.trim().split('\n').filter(l => l.length > 0);
    const dnsScore = dnsRecords.length > 0 ? 80 : 30;
    categories.push({
      category: 'DNS Health',
      score: dnsScore,
      weight: 0.15,
      status: dnsRecords.length > 0 ? 'safe' : 'suspicious',
      details: [
        `${dnsRecords.length} DNS records found`,
        `Name servers: ${nameservers.length > 0 ? nameservers.join(', ') : 'Unknown'}`,
      ],
      lastChecked: new Date().toISOString(),
    });

    // Reputation from AbuseIPDB
    let trustScore = 50;
    if (reputationData && reputationData.data) {
      const abuse = reputationData.data;
      // AbuseIPDB abuseConfidenceScore: 0 = clean, 100 = malicious
      // Convert to trust score: high abuse = low trust
      const abuseScore = abuse.abuseConfidenceScore ?? 0;
      trustScore = Math.max(0, 100 - abuseScore);

      if (abuse.totalReports > 0) {
        threats.push({
          type: 'abuse',
          severity: abuseScore > 50 ? 'high' : abuseScore > 20 ? 'medium' : 'low',
          confidence: abuseScore,
          description: `${abuse.totalReports} abuse reports from ${abuse.numDistinctUsers || 0} distinct users`,
          source: 'AbuseIPDB',
          detectedAt: abuse.lastReportedAt || new Date().toISOString(),
          indicators: [
            `Abuse confidence: ${abuseScore}%`,
            abuse.isTor ? 'Known Tor exit node' : '',
            abuse.usageType || '',
          ].filter(Boolean),
          mitigations: ['Review IP reputation', 'Consider blocking if score is high'],
        });
      }
    }

    categories.push({
      category: 'Trust & Reputation',
      score: trustScore,
      weight: 0.25,
      status: trustScore > 60 ? 'safe' : trustScore > 40 ? 'suspicious' : 'dangerous',
      details: [
        `Trust score: ${trustScore}/100`,
        `Registrar: ${registrar}`,
      ],
      lastChecked: new Date().toISOString(),
    });

    // Nameserver diversity scoring
    const nsScore = nameservers.length >= 2 ? 80 : nameservers.length === 1 ? 50 : 20;
    categories.push({
      category: 'Infrastructure',
      score: nsScore,
      weight: 0.1,
      status: nsScore > 60 ? 'safe' : 'suspicious',
      details: [
        `${nameservers.length} nameserver(s) configured`,
        nameservers.length >= 2 ? 'Good DNS redundancy' : 'Limited DNS redundancy',
      ],
      lastChecked: new Date().toISOString(),
    });

    // Calculate weighted overall score
    const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
    overallScore = Math.round(
      categories.reduce((sum, c) => sum + c.score * c.weight, 0) / totalWeight
    );

    // Determine risk level
    let riskLevel = 'low';
    if (overallScore < 25) riskLevel = 'critical';
    else if (overallScore < 40) riskLevel = 'high';
    else if (overallScore < 60) riskLevel = 'medium';
    else if (overallScore < 80) riskLevel = 'low';
    else riskLevel = 'very-low';

    // Build recommendations
    const recommendations = [];
    if (!hasSSL) {
      recommendations.push({
        id: 'ssl-missing',
        priority: 'high',
        title: 'Install SSL Certificate',
        description: 'Enable HTTPS to encrypt data in transit and improve trust.',
        category: 'security',
      });
    }
    if (domainAgeDays < 30) {
      recommendations.push({
        id: 'new-domain',
        priority: 'medium',
        title: 'New Domain Warning',
        description: 'Domain is very new. Exercise caution with sensitive data.',
        category: 'trust',
      });
    }
    if (nameservers.length < 2) {
      recommendations.push({
        id: 'dns-redundancy',
        priority: 'low',
        title: 'Improve DNS Redundancy',
        description: 'Configure at least 2 nameservers for reliability.',
        category: 'infrastructure',
      });
    }

    const report = {
      domain: cleanDomain,
      overallScore,
      riskLevel,
      lastScanned: new Date().toISOString(),
      scanDuration: 0, // Client will override with actual timing
      categories,
      threats,
      blacklists,
      reputation: {
        trustScore,
        popularityScore: 0,
        socialScore: 0,
        reviewScore: 0,
        sources: [],
        mentions: [],
        reviews: [],
      },
      technical: {
        domainAge: domainAgeDays,
        registrar,
        nameservers,
        ipAddress: dnsRecords[0] || '',
        hosting: {
          provider: 'Unknown',
          country: 'Unknown',
          asn: 0,
          organization: 'Unknown',
          type: 'unknown',
          reputation: 50,
        },
        dns: {
          healthScore: dnsScore,
          inconsistencies: [],
          wildcardDNS: false,
          fastFlux: false,
          suspiciousRecords: [],
        },
        subdomains: [],
        redirects: [],
        cookies: { totalCookies: 0, trackingCookies: 0, secureCookiePercentage: 0, sameSitePercentage: 0, thirdPartyCookies: 0, consentRequired: false },
      },
      ssl: {
        hasSSL,
        issuer: sslIssuer,
        subject: sslSubject,
        validFrom: sslNotBefore,
        validTo: sslNotAfter,
        daysUntilExpiry: sslNotAfter ? Math.floor((new Date(sslNotAfter).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
        grade: hasSSL ? 'A' : 'F',
        protocols: [],
        vulnerabilities: [],
      },
      malware: { detected: false, scanners: [], lastScan: new Date().toISOString(), threats: [] },
      phishing: { detected: false, similarity: 0, targets: [], indicators: [], lastScan: new Date().toISOString() },
      content: { category: 'unknown', language: 'unknown', hasAdultContent: false, hasGambling: false, hasDrugs: false, hasViolence: false },
      network: { ipReputation: 50, sharedHosting: false, neighborDomains: 0, suspiciousNeighbors: 0 },
      historical: { scoreHistory: [], incidentHistory: [], ownershipChanges: [], significantEvents: [] },
      recommendations,
    };

    res.json({ success: true, report });
  } catch (error) {
    console.error('Domain reputation scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan domain reputation'
    });
  }
});


// ============================================
// DOMAIN REPUTATION — EXPORT
// Returns scan results in requested format
// ============================================

router.post('/domain-reputation/export', async (req, res) => {
  try {
    const { format, report } = req.body;

    if (!report || !format) {
      return res.status(400).json({
        success: false,
        message: 'Format and report data are required'
      });
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="domain-reputation-${report.domain || 'report'}.json"`);
      return res.send(JSON.stringify(report, null, 2));
    }

    if (format === 'csv') {
      const rows = [
        ['Category', 'Score', 'Status', 'Weight'],
        ...(report.categories || []).map(c => [c.category, c.score, c.status, c.weight]),
        [],
        ['Metric', 'Value'],
        ['Domain', report.domain || ''],
        ['Overall Score', report.overallScore || 0],
        ['Risk Level', report.riskLevel || ''],
        ['Threats Found', (report.threats || []).length],
        ['Has SSL', report.ssl?.hasSSL ? 'Yes' : 'No'],
        ['Domain Age (days)', report.technical?.domainAge || 0],
        ['Registrar', report.technical?.registrar || ''],
      ];

      const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="domain-reputation-${report.domain || 'report'}.csv"`);
      return res.send(csv);
    }

    // PDF-like text export (plain text formatted report)
    const text = [
      `DOMAIN REPUTATION REPORT`,
      `========================`,
      `Domain: ${report.domain || 'Unknown'}`,
      `Overall Score: ${report.overallScore || 0}/100`,
      `Risk Level: ${report.riskLevel || 'Unknown'}`,
      `Scan Date: ${report.lastScanned || new Date().toISOString()}`,
      ``,
      `CATEGORY SCORES`,
      `---------------`,
      ...(report.categories || []).map(c => `${c.category}: ${c.score}/100 (${c.status})`),
      ``,
      `THREATS (${(report.threats || []).length})`,
      `-------`,
      ...(report.threats || []).map(t => `[${t.severity}] ${t.type}: ${t.description}`),
      ``,
      `SSL CERTIFICATE`,
      `---------------`,
      `Has SSL: ${report.ssl?.hasSSL ? 'Yes' : 'No'}`,
      report.ssl?.hasSSL ? `Issuer: ${report.ssl.issuer}` : '',
      report.ssl?.hasSSL ? `Valid To: ${report.ssl.validTo}` : '',
      ``,
      `RECOMMENDATIONS`,
      `---------------`,
      ...(report.recommendations || []).map(r => `[${r.priority}] ${r.title}: ${r.description}`),
    ].filter(Boolean).join('\n');

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="domain-reputation-${report.domain || 'report'}.txt"`);
    return res.send(text);
  } catch (error) {
    console.error('Domain reputation export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export results'
    });
  }
});


// ============================================
// WHOIS LOOKUP — DOMAIN (Enhanced)
// Returns structured result for WHOISLookup service class
// ============================================

router.post('/whois-lookup/domain', async (req, res) => {
  try {
    const { domain, settings } = req.body;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Domain name is required'
      });
    }

    const cleanDomain = sanitizeDomain(domain);
    if (!cleanDomain) return res.status(400).json({ success: false, error: 'Invalid domain name' });

    // Run whois command
    let whoisRaw = '';
    try {
      const { stdout } = await execAsync(`whois ${cleanDomain}`);
      whoisRaw = stdout;
    } catch (execError) {
      // Fallback to WhoisJSON API
      const whoisJsonKey = process.env.WHOISJSON_API_KEY;
      if (whoisJsonKey) {
        try {
          const response = await fetch(`https://whoisjsonapi.com/v1/${encodeURIComponent(cleanDomain)}`, {
            headers: { 'Authorization': `Bearer ${whoisJsonKey}` }
          });
          if (response.ok) {
            const data = await response.json();
            whoisRaw = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
          }
        } catch {}
      }
    }

    if (!whoisRaw) {
      return res.status(404).json({ success: false, message: 'WHOIS data not found for this domain' });
    }

    // Parse WHOIS fields
    const parseField = (raw, patterns) => {
      for (const p of patterns) {
        const match = raw.match(p);
        if (match) return match[1].trim();
      }
      return '';
    };

    const registrarName = parseField(whoisRaw, [/Registrar:\s*(.+)/i, /registrar_name:\s*(.+)/i]);
    const registrarUrl = parseField(whoisRaw, [/Registrar URL:\s*(.+)/i]);
    const registrarAbuseEmail = parseField(whoisRaw, [/Registrar Abuse Contact Email:\s*(.+)/i]);
    const createdDate = parseField(whoisRaw, [/Creation Date:\s*(.+)/i, /created:\s*(.+)/i]);
    const updatedDate = parseField(whoisRaw, [/Updated Date:\s*(.+)/i, /changed:\s*(.+)/i]);
    const expiryDate = parseField(whoisRaw, [/Registry Expiry Date:\s*(.+)/i, /Expiration Date:\s*(.+)/i, /expires:\s*(.+)/i]);
    const registrantName = parseField(whoisRaw, [/Registrant Name:\s*(.+)/i]);
    const registrantOrg = parseField(whoisRaw, [/Registrant Organization:\s*(.+)/i, /Registrant Org:\s*(.+)/i]);
    const registrantCountry = parseField(whoisRaw, [/Registrant Country:\s*(.+)/i]);
    const registrantEmail = parseField(whoisRaw, [/Registrant Email:\s*(.+)/i]);

    const nameservers = [...whoisRaw.matchAll(/Name Server:\s*(.+)/gi)]
      .map(m => m[1].trim().toLowerCase());

    const statuses = [...whoisRaw.matchAll(/Domain Status:\s*(.+)/gi)]
      .map(m => m[1].trim());

    // Build structured result
    const result = {
      domain: cleanDomain,
      registrar: {
        name: registrarName || 'Unknown',
        url: registrarUrl || '',
        abuseEmail: registrarAbuseEmail || '',
        whoisServer: '',
      },
      registrant: {
        name: registrantName || 'REDACTED',
        organization: registrantOrg || '',
        email: registrantEmail || 'REDACTED',
        country: registrantCountry || '',
        state: '',
        city: '',
      },
      dates: {
        created: createdDate || '',
        updated: updatedDate || '',
        expires: expiryDate || '',
        registeredFor: createdDate && expiryDate
          ? `${Math.floor((new Date(expiryDate).getTime() - new Date(createdDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} years`
          : '',
      },
      nameservers,
      statuses,
      domainInfo: {
        tld: cleanDomain.split('.').pop() || '',
        isAvailable: false,
        isPremium: false,
        isIDN: false,
      },
      security: {
        dnssec: whoisRaw.toLowerCase().includes('dnssec: signed') || whoisRaw.toLowerCase().includes('dnssec:yes'),
        privacyProtected: registrantName === '' || registrantName.toLowerCase().includes('redacted') || registrantName.toLowerCase().includes('privacy'),
      },
      raw: whoisRaw,
    };

    res.json({ success: true, result });
  } catch (error) {
    console.error('WHOIS domain lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform WHOIS lookup'
    });
  }
});


// ============================================
// WHOIS LOOKUP — IP (IP address information)
// ============================================

router.post('/whois-lookup/ip', async (req, res) => {
  try {
    const { ip } = req.body;

    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'IP address is required'
      });
    }

    const cleanIP = sanitizeHost(ip);
    if (!cleanIP) return res.status(400).json({ success: false, error: 'Invalid IP address' });

    // Validate IP format
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    if (!ipv4Pattern.test(cleanIP) && !ipv6Pattern.test(cleanIP)) {
      return res.status(400).json({ success: false, message: 'Invalid IP address format' });
    }

    // Gather IP info in parallel
    const results = await Promise.allSettled([
      // WHOIS for IP
      execAsync(`whois ${cleanIP}`).then(r => r.stdout).catch(() => ''),
      // Reverse DNS
      execAsync(`dig -x ${cleanIP} +short`).then(r => r.stdout.trim()).catch(() => ''),
      // Geolocation API (if available)
      process.env.IPGEOLOCATION_API_KEY
        ? fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.IPGEOLOCATION_API_KEY}&ip=${encodeURIComponent(cleanIP)}`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        : Promise.resolve(null),
    ]);

    const whoisRaw = results[0].status === 'fulfilled' ? results[0].value : '';
    const reverseDNS = results[1].status === 'fulfilled' ? results[1].value : '';
    const geoData = results[2].status === 'fulfilled' ? results[2].value : null;

    // Parse WHOIS IP data
    const parseField = (raw, patterns) => {
      for (const p of patterns) {
        const match = raw.match(p);
        if (match) return match[1].trim();
      }
      return '';
    };

    const orgName = parseField(whoisRaw, [/OrgName:\s*(.+)/i, /org-name:\s*(.+)/i, /Organization:\s*(.+)/i]);
    const netRange = parseField(whoisRaw, [/NetRange:\s*(.+)/i, /inetnum:\s*(.+)/i]);
    const cidr = parseField(whoisRaw, [/CIDR:\s*(.+)/i]);
    const country = geoData?.country_name || parseField(whoisRaw, [/Country:\s*(.+)/i]);
    const city = geoData?.city || '';
    const region = geoData?.state_prov || '';
    const isp = geoData?.isp || orgName;

    const result = {
      ip: cleanIP,
      reverseDNS: reverseDNS || '',
      location: {
        country: country || 'Unknown',
        city: city || '',
        region: region || '',
        latitude: geoData?.latitude || 0,
        longitude: geoData?.longitude || 0,
        timezone: geoData?.time_zone?.name || '',
      },
      network: {
        range: netRange || '',
        cidr: cidr || '',
        organization: orgName || 'Unknown',
      },
      isp: {
        name: isp || 'Unknown',
        asn: parseField(whoisRaw, [/OriginAS:\s*(.+)/i, /origin:\s*(.+)/i]),
      },
      abuse: {
        email: parseField(whoisRaw, [/OrgAbuseEmail:\s*(.+)/i, /abuse-mailbox:\s*(.+)/i]),
        phone: parseField(whoisRaw, [/OrgAbusePhone:\s*(.+)/i]),
      },
      raw: whoisRaw,
    };

    res.json({ success: true, result });
  } catch (error) {
    console.error('WHOIS IP lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform IP lookup'
    });
  }
});


// ============================================
// WHOIS LOOKUP — DNS (DNS record lookup)
// ============================================

router.post('/whois-lookup/dns', async (req, res) => {
  try {
    const { domain, recordType } = req.body;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Domain name is required'
      });
    }

    const cleanDomain = sanitizeDomain(domain);
    if (!cleanDomain) return res.status(400).json({ success: false, error: "Invalid domain name" });
    const types = recordType ? [recordType] : ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA'];

    // Query all record types in parallel
    const dnsResults = await Promise.allSettled(
      types.map(async (type) => {
        try {
          const { stdout } = await execAsync(`dig ${type} ${cleanDomain} +short`);
          const values = stdout.trim().split('\n').filter(l => l.length > 0);
          return values.map(value => ({
            type,
            name: cleanDomain,
            value: value.trim(),
            ttl: 0,
          }));
        } catch {
          return [];
        }
      })
    );

    const records = dnsResults
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    // Get authoritative nameservers
    let authoritative = [];
    try {
      const { stdout } = await execAsync(`dig NS ${cleanDomain} +short`);
      authoritative = stdout.trim().split('\n').filter(l => l.length > 0).map(ns => ns.trim());
    } catch { /* ignore */ }

    const result = {
      domain: cleanDomain,
      records,
      authoritative,
      totalRecords: records.length,
      queriedTypes: types,
    };

    res.json({ success: true, result });
  } catch (error) {
    console.error('WHOIS DNS lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform DNS lookup'
    });
  }
});


// ============================================
// WHOIS LOOKUP — EXPORT
// Export WHOIS results in requested format
// ============================================

router.post('/whois-lookup/export', async (req, res) => {
  try {
    const { format, result } = req.body;

    if (!result || !format) {
      return res.status(400).json({
        success: false,
        message: 'Format and result data are required'
      });
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="whois-${result.domain || 'report'}.json"`);
      return res.send(JSON.stringify(result, null, 2));
    }

    if (format === 'csv') {
      const rows = [
        ['Field', 'Value'],
        ['Domain', result.domain || ''],
        ['Registrar', result.registrar?.name || ''],
        ['Created', result.dates?.created || ''],
        ['Expires', result.dates?.expires || ''],
        ['Updated', result.dates?.updated || ''],
        ['Registrant', result.registrant?.name || ''],
        ['Organization', result.registrant?.organization || ''],
        ['Country', result.registrant?.country || ''],
        ['DNSSEC', result.security?.dnssec ? 'Yes' : 'No'],
        ['Privacy Protected', result.security?.privacyProtected ? 'Yes' : 'No'],
        [],
        ['Name Servers'],
        ...(result.nameservers || []).map(ns => ['', ns]),
        [],
        ['Statuses'],
        ...(result.statuses || []).map(s => ['', s]),
      ];

      const csv = rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="whois-${result.domain || 'report'}.csv"`);
      return res.send(csv);
    }

    // Plain text
    const text = [
      `WHOIS REPORT`,
      `============`,
      `Domain: ${result.domain || ''}`,
      ``,
      `REGISTRAR`,
      `---------`,
      `Name: ${result.registrar?.name || ''}`,
      `URL: ${result.registrar?.url || ''}`,
      ``,
      `REGISTRANT`,
      `----------`,
      `Name: ${result.registrant?.name || ''}`,
      `Organization: ${result.registrant?.organization || ''}`,
      `Country: ${result.registrant?.country || ''}`,
      ``,
      `DATES`,
      `-----`,
      `Created: ${result.dates?.created || ''}`,
      `Updated: ${result.dates?.updated || ''}`,
      `Expires: ${result.dates?.expires || ''}`,
      ``,
      `NAME SERVERS`,
      `------------`,
      ...(result.nameservers || []).map(ns => ns),
      ``,
      `RAW WHOIS`,
      `---------`,
      result.raw || '',
    ].join('\n');

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="whois-${result.domain || 'report'}.txt"`);
    return res.send(text);
  } catch (error) {
    console.error('WHOIS export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export results'
    });
  }
});

// ============================================
// HTTP HEADERS CHECK
// ============================================

router.post('/http-headers', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl;

    const response = await fetch(targetUrl, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000) });
    const headers = {};
    response.headers.forEach((value, key) => { headers[key] = value; });

    res.json({
      success: true,
      data: { url: targetUrl, status: response.status, statusText: response.statusText, headers }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch headers' });
  }
});

// ============================================
// REVERSE IP LOOKUP
// ============================================

router.post('/reverse-ip', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({ success: false, error: 'IP address is required' });
    }
    // Validate IPv4 format to prevent command injection
    const cleanIp = ip.trim();
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(cleanIp)) {
      return res.status(400).json({ success: false, error: 'Invalid IP address format' });
    }

    try {
      const { stdout } = await execAsync(`dig -x ${cleanIp} +short`, { timeout: 10000 });
      const hostnames = stdout.trim().split('\n').filter(Boolean).map(h => h.replace(/\.$/, ''));
      res.json({ success: true, data: { ip: cleanIp, hostnames } });
    } catch {
      res.json({ success: true, data: { ip: cleanIp, hostnames: [] } });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Reverse IP lookup failed' });
  }
});

// ============================================
// MX LOOKUP
// ============================================

router.post('/mx-lookup', async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ success: false, error: 'Domain is required' });
    }
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!/^[a-z0-9]([a-z0-9\-\.]{0,251}[a-z0-9])?$/.test(clean)) {
      return res.status(400).json({ success: false, error: 'Invalid domain name' });
    }

    const { stdout } = await execAsync(`dig MX ${clean} +short`, { timeout: 10000 });
    const records = stdout.trim().split('\n').filter(Boolean).map(line => {
      const parts = line.trim().split(/\s+/);
      return { priority: parseInt(parts[0]) || 0, host: (parts[1] || '').replace(/\.$/, '') };
    }).sort((a, b) => a.priority - b.priority);

    res.json({ success: true, data: { domain: clean, records } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'MX lookup failed' });
  }
});

// ============================================
// SPF CHECKER
// ============================================

router.post('/spf-checker', async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ success: false, error: 'Domain is required' });
    }
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!/^[a-z0-9]([a-z0-9\-\.]{0,251}[a-z0-9])?$/.test(clean)) {
      return res.status(400).json({ success: false, error: 'Invalid domain name' });
    }

    const { stdout } = await execAsync(`dig TXT ${clean} +short`, { timeout: 10000 });
    const txtRecords = stdout.trim().split('\n').filter(Boolean).map(r => r.replace(/^"|"$/g, ''));
    const spfRecord = txtRecords.find(r => r.startsWith('v=spf1'));

    res.json({
      success: true,
      data: { domain: clean, spfRecord: spfRecord || null, allTxtRecords: txtRecords, valid: !!spfRecord }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'SPF check failed' });
  }
});

// ============================================
// DKIM CHECKER
// ============================================

router.post('/dkim-checker', async (req, res) => {
  try {
    const { domain, selector } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ success: false, error: 'Domain is required' });
    }
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!/^[a-z0-9]([a-z0-9\-\.]{0,251}[a-z0-9])?$/.test(clean)) {
      return res.status(400).json({ success: false, error: 'Invalid domain name' });
    }
    const sel = ((selector || 'default').trim()).replace(/[^a-z0-9\-_]/gi, '');
    const lookupDomain = `${sel}._domainkey.${clean}`;

    let record = null;
    try {
      const { stdout } = await execAsync(`dig TXT ${lookupDomain} +short`, { timeout: 10000 });
      const txt = stdout.trim().replace(/^"|"$/g, '').replace(/"\s*"/g, '');
      if (txt && txt.includes('v=DKIM1')) record = txt;
    } catch {}

    res.json({
      success: true,
      data: { domain: clean, selector: sel, lookupDomain, record, valid: !!record }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'DKIM check failed' });
  }
});

// ============================================
// DMARC CHECKER
// ============================================

router.post('/dmarc-checker', async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ success: false, error: 'Domain is required' });
    }
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!/^[a-z0-9]([a-z0-9\-\.]{0,251}[a-z0-9])?$/.test(clean)) {
      return res.status(400).json({ success: false, error: 'Invalid domain name' });
    }

    const { stdout } = await execAsync(`dig TXT _dmarc.${clean} +short`, { timeout: 10000 });
    const record = stdout.trim().replace(/^"|"$/g, '').replace(/"\s*"/g, '');
    const valid = record.includes('v=DMARC1');

    const parseTag = (tag) => {
      const match = record.match(new RegExp(`${tag}=([^;]+)`));
      return match ? match[1].trim() : null;
    };

    res.json({
      success: true,
      data: {
        domain: clean, record: valid ? record : null, valid,
        policy: parseTag('p'), subdomainPolicy: parseTag('sp'),
        rua: parseTag('rua'), ruf: parseTag('ruf'),
        pct: parseTag('pct'), adkim: parseTag('adkim'), aspf: parseTag('aspf'),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'DMARC check failed' });
  }
});

// ============================================
// CNAME / NS LOOKUP
// ============================================

router.post('/cname-lookup', async (req, res) => {
  try {
    const { domain, recordType } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ success: false, error: 'Domain is required' });
    }
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!/^[a-z0-9]([a-z0-9\-\.]{0,251}[a-z0-9])?$/.test(clean)) {
      return res.status(400).json({ success: false, error: 'Invalid domain name' });
    }
    const type = ['CNAME', 'NS', 'A', 'AAAA', 'SOA', 'TXT'].includes(recordType) ? recordType : 'CNAME';

    const { stdout } = await execAsync(`dig ${type} ${clean} +short`, { timeout: 10000 });
    const records = stdout.trim().split('\n').filter(Boolean).map(r => r.replace(/\.$/, ''));

    res.json({ success: true, data: { domain: clean, type, records } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'DNS lookup failed' });
  }
});

// ============================================
// WEBSITE TO IP
// ============================================

router.post('/website-to-ip', async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ success: false, error: 'Domain is required' });
    }
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!/^[a-z0-9]([a-z0-9\-\.]{0,251}[a-z0-9])?$/.test(clean)) {
      return res.status(400).json({ success: false, error: 'Invalid domain name' });
    }

    const { stdout: ipv4 } = await execAsync(`dig A ${clean} +short`, { timeout: 10000 });
    let ipv6 = '';
    try {
      const result = await execAsync(`dig AAAA ${clean} +short`, { timeout: 10000 });
      ipv6 = result.stdout;
    } catch {}

    res.json({
      success: true,
      data: {
        domain: clean,
        ipv4: ipv4.trim().split('\n').filter(Boolean),
        ipv6: ipv6.trim().split('\n').filter(Boolean),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'DNS resolution failed' });
  }
});

// ============================================
// SMTP TEST
// ============================================

router.post('/smtp-test', async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ success: false, error: 'Domain is required' });
    }
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!/^[a-z0-9]([a-z0-9\-\.]{0,251}[a-z0-9])?$/.test(clean)) {
      return res.status(400).json({ success: false, error: 'Invalid domain name' });
    }

    const { stdout: mxOut } = await execAsync(`dig MX ${clean} +short`, { timeout: 10000 });
    const mxRecords = mxOut.trim().split('\n').filter(Boolean).map(line => {
      const parts = line.trim().split(/\s+/);
      return { priority: parseInt(parts[0]) || 0, host: (parts[1] || '').replace(/\.$/, '') };
    }).sort((a, b) => a.priority - b.priority);

    if (mxRecords.length === 0) {
      return res.json({ success: true, data: { domain: clean, mxRecords: [], smtpReachable: false, message: 'No MX records found' } });
    }

    const primaryMx = mxRecords[0].host;
    // Validate the MX hostname before using in shell command
    if (!/^[a-z0-9]([a-z0-9\-\.]{0,251}[a-z0-9])?$/i.test(primaryMx)) {
      return res.json({ success: true, data: { domain: clean, mxRecords, primaryMx, smtpReachable: false, banner: '' } });
    }

    let smtpReachable = false;
    let banner = '';
    try {
      const { stdout: ncOut } = await execAsync(`echo "QUIT" | nc -w 5 ${primaryMx} 25 2>&1 || true`, { timeout: 10000 });
      banner = ncOut.trim().split('\n')[0] || '';
      smtpReachable = banner.includes('220');
    } catch {}

    res.json({
      success: true,
      data: { domain: clean, mxRecords, primaryMx, smtpReachable, banner }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'SMTP test failed' });
  }
});

// ============================================
// IP BLACKLIST CHECK
// ============================================

router.post('/ip-blacklist', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({ success: false, error: 'IP address is required' });
    }
    // Validate IPv4 format strictly to prevent injection
    const cleanIp = ip.trim();
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(cleanIp)) {
      return res.status(400).json({ success: false, error: 'Invalid IPv4 address format' });
    }
    const parts = cleanIp.split('.').map(Number);
    if (parts.some(n => n > 255)) {
      return res.status(400).json({ success: false, error: 'Invalid IPv4 address' });
    }
    const reversed = parts.reverse().join('.');

    const blacklists = [
      'zen.spamhaus.org', 'bl.spamcop.net', 'b.barracudacentral.org',
      'dnsbl.sorbs.net', 'spam.dnsbl.sorbs.net', 'cbl.abuseat.org',
      'dnsbl-1.uceprotect.net',
    ];

    const results = await Promise.allSettled(
      blacklists.map(async (bl) => {
        try {
          const { stdout } = await execAsync(`dig +short ${reversed}.${bl}`, { timeout: 5000 });
          const listed = stdout.trim().length > 0;
          return { blacklist: bl, listed, response: stdout.trim() || null };
        } catch {
          return { blacklist: bl, listed: false, response: null };
        }
      })
    );

    const checks = results.map(r => r.status === 'fulfilled' ? r.value : { blacklist: 'unknown', listed: false, response: null });
    const listedCount = checks.filter(c => c.listed).length;

    res.json({
      success: true,
      data: { ip: cleanIp, totalChecked: blacklists.length, listedCount, checks }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Blacklist check failed' });
  }
});

// ============================================
// DNS PROPAGATION CHECK
// ============================================

router.post('/dns-propagation', async (req, res) => {
  try {
    const { domain, recordType } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ success: false, error: 'Domain is required' });
    }
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!/^[a-z0-9]([a-z0-9\-\.]{0,251}[a-z0-9])?$/.test(clean)) {
      return res.status(400).json({ success: false, error: 'Invalid domain name' });
    }
    const type = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA'].includes(recordType) ? recordType : 'A';

    const dnsServers = [
      { name: 'Google', ip: '8.8.8.8' },
      { name: 'Cloudflare', ip: '1.1.1.1' },
      { name: 'OpenDNS', ip: '208.67.222.222' },
      { name: 'Quad9', ip: '9.9.9.9' },
      { name: 'Level3', ip: '4.2.2.1' },
      { name: 'Comodo', ip: '8.26.56.26' },
      { name: 'Verisign', ip: '64.6.64.6' },
      { name: 'AdGuard', ip: '94.140.14.14' },
    ];

    const results = await Promise.allSettled(
      dnsServers.map(async (server) => {
        try {
          const { stdout } = await execAsync(`dig @${server.ip} ${type} ${clean} +short +time=3`, { timeout: 8000 });
          const records = stdout.trim().split('\n').filter(Boolean);
          return { server: server.name, ip: server.ip, records, success: true };
        } catch {
          return { server: server.name, ip: server.ip, records: [], success: false };
        }
      })
    );

    const propagation = results.map(r => r.status === 'fulfilled' ? r.value : { server: 'unknown', ip: '', records: [], success: false });

    res.json({ success: true, data: { domain: clean, type, propagation } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'DNS propagation check failed' });
  }
});

// ============================================
// DNSKEY / DS LOOKUP
// ============================================

router.post('/dnskey-lookup', async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ success: false, error: 'Domain is required' });
    }
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!/^[a-z0-9]([a-z0-9\-\.]{0,251}[a-z0-9])?$/.test(clean)) {
      return res.status(400).json({ success: false, error: 'Invalid domain name' });
    }

    const { stdout: dnskeyOut } = await execAsync(`dig DNSKEY ${clean} +short`, { timeout: 10000 });
    let dsOut = '';
    try {
      const result = await execAsync(`dig DS ${clean} +short`, { timeout: 10000 });
      dsOut = result.stdout;
    } catch {}

    const dnskeys = dnskeyOut.trim().split('\n').filter(Boolean);
    const dsRecords = dsOut.trim().split('\n').filter(Boolean);

    res.json({
      success: true,
      data: { domain: clean, dnskeys, dsRecords, dnssecEnabled: dnskeys.length > 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'DNSKEY lookup failed' });
  }
});

// ============================================
// BROKEN LINKS CHECKER
// ============================================

router.post('/broken-links', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl;

    const pageResponse = await fetch(targetUrl, { signal: AbortSignal.timeout(15000) });
    if (!pageResponse.ok) {
      return res.status(400).json({ success: false, error: `Failed to fetch page: ${pageResponse.status}` });
    }
    const html = await pageResponse.text();

    const linkRegex = /href=["']([^"']+)["']/gi;
    const links = new Set();
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      try {
        const href = match[1];
        if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
        const resolved = new URL(href, targetUrl).href;
        links.add(resolved);
      } catch {}
    }

    const linksArray = Array.from(links).slice(0, 20);
    const results = await Promise.allSettled(
      linksArray.map(async (link) => {
        try {
          const r = await fetch(link, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(8000) });
          return { url: link, status: r.status, ok: r.ok };
        } catch (e) {
          return { url: link, status: 0, ok: false, error: e.message };
        }
      })
    );

    const checked = results.map(r => r.status === 'fulfilled' ? r.value : { url: 'unknown', status: 0, ok: false });
    const broken = checked.filter(c => !c.ok);

    res.json({
      success: true,
      data: { url: targetUrl, totalLinks: links.size, checkedLinks: linksArray.length, brokenCount: broken.length, results: checked }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Broken links check failed' });
  }
});

// ============================================
// BIMI CHECKER
// ============================================

router.post('/bimi-checker', async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ success: false, error: 'Domain is required' });
    }
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!/^[a-z0-9]([a-z0-9\-\.]{0,251}[a-z0-9])?$/.test(clean)) {
      return res.status(400).json({ success: false, error: 'Invalid domain name' });
    }

    const { stdout } = await execAsync(`dig TXT default._bimi.${clean} +short`, { timeout: 10000 });
    const record = stdout.trim().replace(/^"|"$/g, '').replace(/"\s*"/g, '');
    const valid = record.includes('v=BIMI1');

    const parseBimi = (tag) => {
      const m = record.match(new RegExp(`${tag}=([^;]+)`));
      return m ? m[1].trim() : null;
    };

    res.json({
      success: true,
      data: { domain: clean, record: valid ? record : null, valid, logoUrl: parseBimi('l'), certificateUrl: parseBimi('a') }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'BIMI check failed' });
  }
});

// ============================================
// DNS HEALTH CHECK
// ============================================

router.post('/dns-health', async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ success: false, error: 'Domain is required' });
    }
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!/^[a-z0-9]([a-z0-9\-\.]{0,251}[a-z0-9])?$/.test(clean)) {
      return res.status(400).json({ success: false, error: 'Invalid domain name' });
    }

    const runDig = async (type, target) => {
      try {
        const { stdout } = await execAsync(`dig ${type} ${target || clean} +short`, { timeout: 8000 });
        return stdout.trim().split('\n').filter(Boolean);
      } catch { return []; }
    };

    const [aRecords, aaaaRecords, mxRecords, nsRecords, txtRecords, soaRecords, cnameRecords] = await Promise.all([
      runDig('A'), runDig('AAAA'), runDig('MX'), runDig('NS'), runDig('TXT'), runDig('SOA'), runDig('CNAME'),
    ]);

    const spf = txtRecords.find(r => r.replace(/"/g, '').startsWith('v=spf1'));
    const dmarcRecords = await runDig('TXT', `_dmarc.${clean}`);
    const dmarc = dmarcRecords.find(r => r.replace(/"/g, '').startsWith('v=DMARC1'));

    const issues = [];
    if (aRecords.length === 0 && cnameRecords.length === 0) issues.push('No A or CNAME records found');
    if (nsRecords.length === 0) issues.push('No NS records found');
    if (mxRecords.length === 0) issues.push('No MX records found — email may not work');
    if (!spf) issues.push('No SPF record found');
    if (!dmarc) issues.push('No DMARC record found');

    const score = Math.max(0, 100 - issues.length * 15);

    res.json({
      success: true,
      data: {
        domain: clean, score, issues,
        records: { a: aRecords, aaaa: aaaaRecords, mx: mxRecords, ns: nsRecords, txt: txtRecords, soa: soaRecords, cname: cnameRecords },
        spf: spf || null, dmarc: dmarc || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'DNS health check failed' });
  }
});

// ============================================
// IP INFO / GEOLOCATION (was previously a Next.js API route)
// ============================================

router.post('/ip-info', async (req, res) => {
  try {
    const { ip } = req.body;

    // Use provided IP or detect from request headers
    const forwardedFor = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '';
    const realIP = req.headers['x-real-ip'] || '';
    const targetIP = (ip && typeof ip === 'string' ? ip.trim() : '') || forwardedFor || realIP || '';

    // Primary: ip-api.com (free, no key needed)
    const ipApiFields = 'status,message,query,reverse,country,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,mobile,proxy,hosting';
    const ipApiUrl = `http://ip-api.com/json/${encodeURIComponent(targetIP || '')}?fields=${ipApiFields}`;

    let raw = null;
    let source = 'ip-api.com';

    try {
      const response = await fetch(ipApiUrl, { headers: { Accept: 'application/json' } });
      raw = await response.json();
      if (!response.ok || raw?.status === 'fail') {
        throw new Error(raw?.message || 'ip-api.com lookup failed');
      }
    } catch (err) {
      // Fallback: ipapi.co
      const ipapiUrl = `https://ipapi.co/${encodeURIComponent(targetIP || '')}/json/`;
      const response2 = await fetch(ipapiUrl, { headers: { Accept: 'application/json' } });
      const json2 = await response2.json();
      if (!response2.ok || json2?.error) {
        return res.status(502).json({ success: false, error: json2?.reason || 'IP lookup failed' });
      }
      raw = json2;
      source = 'ipapi.co';
    }

    const isIpApi = source === 'ip-api.com';
    const detectedIP = isIpApi ? raw.query || '' : raw.ip || '';
    const city = isIpApi ? raw.city : raw.city;
    const region = isIpApi ? raw.regionName : raw.region || raw.region_code;
    const country = isIpApi ? raw.country : raw.country_name || raw.country;
    const postal = isIpApi ? raw.zip : raw.postal;
    const timezone = isIpApi ? raw.timezone : raw.timezone;
    const lat = isIpApi ? raw.lat : raw.latitude;
    const lon = isIpApi ? raw.lon : raw.longitude;
    const isp = isIpApi ? raw.isp : raw.org;
    const org = isIpApi ? raw.org : raw.org;
    const asFull = isIpApi ? raw.as : raw.asn || '';
    const asName = isIpApi ? raw.asname : raw.asn_name || '';
    const reverse = isIpApi ? raw.reverse : raw.hostname || '';
    const proxy = isIpApi ? !!raw.proxy : !!raw.proxy;
    const hosting = isIpApi ? !!raw.hosting : raw.hosting === true || /cloud|hosting|datacenter/i.test(org || isp || '');

    let asn = '';
    if (asFull) {
      const m = String(asFull).match(/AS\d+/i);
      asn = m ? m[0].toUpperCase() : String(asFull);
    }

    const data = {
      ip: detectedIP,
      location: {
        city, region, country,
        coordinates: lat && lon ? { lat, lng: lon } : undefined,
        postal, timezone,
      },
      network: {
        isp, organization: org, asn, asnName: asName,
        domain: reverse ? reverse.split('.').slice(-2).join('.') : undefined,
        type: hosting ? 'hosting' : proxy ? 'proxy' : 'residential',
      },
      security: {
        isVPN: proxy && !hosting,
        isProxy: proxy,
        isTor: false,
        isHosting: hosting,
        threat: proxy || hosting ? 'medium' : 'low',
      },
      metadata: {
        hostname: reverse || undefined,
        lastUpdated: new Date().toISOString(),
        source,
      },
    };

    res.json({ success: true, data, raw });
  } catch (error) {
    console.error('IP info error:', error);
    res.status(500).json({ success: false, error: error.message || 'IP lookup failed' });
  }
});

export default router;
