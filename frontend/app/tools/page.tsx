
'use client';

import Link from 'next/link';
import {
  Network, Globe, Wifi, MapPin, Shield, Activity, Server, Radio, Code, Search,
  Tag, Award, Cpu, Hash, FileJson, Clock, Palette, Key, Binary, Code2, Wrench,
  Mail, Lock, QrCode, FileText, Fingerprint, Type, Calculator, Zap, Globe2,
  ScanLine, ArrowLeftRight, RefreshCw, Link2, Image, FileCode, Layers, Tablet,
  CheckCircle, AlignLeft, Edit3, CreditCard, Timer, Database, Terminal, Filter,
} from 'lucide-react';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { LockedCard } from '@/components/LockedCard';

const networkIpTools = [
  { id: 'what-is-my-ip', name: 'What Is My IP', description: 'Instantly see your public IP address, location, and ISP details', icon: MapPin, href: '/tools/what-is-my-ip', color: 'from-blue-500 to-cyan-500' },
  { id: 'what-is-my-isp', name: 'What Is My ISP', description: 'Detect your Internet Service Provider, ASN, and network details', icon: Wifi, href: '/tools/what-is-my-isp', color: 'from-cyan-500 to-sky-500' },
  { id: 'ip-info', name: 'IP Information', description: 'Get detailed geolocation, ISP, and network info for any IP address', icon: Globe2, href: '/tools/ip-info', color: 'from-blue-600 to-indigo-500' },
  { id: 'ip-geolocation', name: 'IP Geolocation', description: 'Precise location data for any IP — city, country, coordinates, ISP', icon: MapPin, href: '/tools/ip-geolocation', color: 'from-cyan-500 to-blue-500' },
  { id: 'ip-netblocks', name: 'IP Netblocks', description: 'Get IP range and network block information for any IP address', icon: Network, href: '/tools/ip-netblocks', color: 'from-lime-500 to-green-500' },
  { id: 'ip-blacklist', name: 'IP Blacklist Check', description: 'Check if an IP is listed on major spam and abuse blacklists', icon: Shield, href: '/tools/ip-blacklist', color: 'from-red-500 to-rose-500' },
  { id: 'reverse-ip', name: 'Reverse IP Lookup', description: 'Find all hostnames and domains pointing to a given IP address', icon: RefreshCw, href: '/tools/reverse-ip', color: 'from-violet-500 to-purple-500' },
  { id: 'subnet-calculator', name: 'Subnet Calculator', description: 'Calculate subnet masks, IP ranges, and CIDR notation', icon: Calculator, href: '/tools/subnet-calculator', color: 'from-teal-500 to-cyan-500' },
  { id: 'website-to-ip', name: 'Website to IP', description: 'Resolve any domain or website URL to its IPv4 and IPv6 addresses', icon: ArrowLeftRight, href: '/tools/website-to-ip', color: 'from-orange-500 to-amber-500' },
  { id: 'mac-lookup', name: 'MAC Address Lookup', description: 'Find manufacturer and vendor information for any MAC address', icon: Cpu, href: '/tools/mac-lookup', color: 'from-sky-500 to-cyan-500' },
  { id: 'ping-test', name: 'Ping Test', description: 'Test network connectivity and measure latency to any host', icon: Activity, href: '/tools/ping-test', color: 'from-orange-500 to-red-500' },
  { id: 'traceroute', name: 'Traceroute', description: 'Trace the hop-by-hop path packets take to reach a destination', icon: Radio, href: '/tools/traceroute', color: 'from-indigo-500 to-purple-500' },
  { id: 'port-scanner', name: 'Port Scanner', description: 'Scan open ports on any host and identify running services', icon: Server, href: '/tools/port-scanner', color: 'from-green-500 to-emerald-500' },
  { id: 'speed-test', name: 'Speed Test', description: 'Measure your internet download and upload speeds', icon: Zap, href: '/tools/speed-test', color: 'from-pink-500 to-rose-500' },
  { id: 'ssl-checker', name: 'SSL Certificate Checker', description: 'Check SSL/TLS certificate validity, expiry, and chain details', icon: Lock, href: '/tools/ssl-checker', color: 'from-teal-500 to-green-500' },
  { id: 'http-headers', name: 'HTTP Headers Analyzer', description: 'Inspect HTTP response headers with security scoring and tips', icon: Layers, href: '/tools/http-headers', color: 'from-purple-500 to-violet-500' },
  { id: 'broken-links', name: 'Broken Links Checker', description: 'Crawl a web page and detect all broken or dead links', icon: Link2, href: '/tools/broken-links', color: 'from-rose-500 to-pink-500' },
  { id: 'user-agent', name: 'User Agent Checker', description: 'Parse your browser user-agent string and detect device/OS/browser', icon: Tablet, href: '/tools/user-agent', color: 'from-slate-500 to-gray-600' },
];

const dnsTools = [
  { id: 'dns-lookup', name: 'DNS Lookup', description: 'Perform standard DNS queries for A, MX, TXT, NS, CNAME records', icon: Globe, href: '/tools/dns-lookup', color: 'from-purple-500 to-pink-500' },
  { id: 'dns-lookup-advanced', name: 'DNS Lookup API', description: 'Comprehensive DNS records lookup via WhoisXML API', icon: Server, href: '/tools/dns-lookup-advanced', color: 'from-emerald-500 to-teal-500' },
  { id: 'dns-propagation', name: 'DNS Propagation', description: 'Check DNS record propagation across 8 global DNS servers', icon: Globe2, href: '/tools/dns-propagation', color: 'from-blue-500 to-indigo-500' },
  { id: 'dns-health', name: 'DNS Health Check', description: 'Full diagnostic — A, MX, NS, SPF, DMARC, DNSSEC health score', icon: CheckCircle, href: '/tools/dns-health', color: 'from-green-500 to-emerald-500' },
  { id: 'dnskey-lookup', name: 'DNSKEY / DS Lookup', description: 'Look up DNSSEC key records and DS records for a domain', icon: Key, href: '/tools/dnskey-lookup', color: 'from-amber-500 to-orange-500' },
  { id: 'cname-lookup', name: 'CNAME / NS Lookup', description: 'Look up CNAME, NS, SOA, and other DNS record types', icon: Search, href: '/tools/cname-lookup', color: 'from-indigo-500 to-blue-500' },
  { id: 'mx-lookup', name: 'MX Lookup', description: 'Retrieve mail exchange records and priority for any domain', icon: Mail, href: '/tools/mx-lookup', color: 'from-sky-500 to-blue-500' },
  { id: 'reverse-image-search', name: 'Reverse Image Search', description: 'Search Google, Bing, and TinEye by image URL or upload', icon: Image, href: '/tools/reverse-image-search', color: 'from-fuchsia-500 to-purple-500' },
];

const domainTools = [
  { id: 'whois-lookup', name: 'WHOIS Lookup', description: 'Full WHOIS registration data, registrant info, and DNS records', icon: Shield, href: '/tools/whois-lookup', color: 'from-yellow-500 to-orange-500' },
  { id: 'domain-availability', name: 'Domain Availability', description: 'Check if a domain is available across popular TLDs instantly', icon: Search, href: '/tools/domain-availability', color: 'from-rose-500 to-pink-500' },
  { id: 'domain-reputation', name: 'Domain Reputation', description: 'Score a domain\'s trustworthiness and security reputation', icon: Award, href: '/tools/domain-reputation', color: 'from-indigo-500 to-blue-500' },
  { id: 'domain-research', name: 'Domain Research Suite', description: 'Comprehensive domain history, WHOIS, DNS, and analysis tools', icon: Search, href: '/tools/domain-research', color: 'from-fuchsia-500 to-purple-500' },
  { id: 'website-categorization', name: 'Website Categorization', description: 'Classify any website into content categories automatically', icon: Tag, href: '/tools/website-categorization', color: 'from-amber-500 to-yellow-500' },
  { id: 'threat-intelligence', name: 'Threat Intelligence', description: 'Scan domains and IPs for malware, phishing, and threats', icon: Shield, href: '/tools/threat-intelligence', color: 'from-red-500 to-rose-600' },
  { id: 'api-tester', name: 'API Tester', description: 'Full-featured REST API testing with auth, presets, and history', icon: Code, href: '/tools/api-tester', color: 'from-violet-500 to-purple-500' },
];

const emailTools = [
  { id: 'smtp-test', name: 'SMTP Test', description: 'Verify MX records and test SMTP server reachability on port 25', icon: Mail, href: '/tools/smtp-test', color: 'from-blue-500 to-cyan-500' },
  { id: 'spf-checker', name: 'SPF Checker', description: 'Validate SPF records and retrieve all TXT DNS records', icon: Shield, href: '/tools/spf-checker', color: 'from-green-500 to-teal-500' },
  { id: 'spf-record-generator', name: 'SPF Record Generator', description: 'Build a valid SPF record for your domain step by step', icon: FileCode, href: '/tools/spf-record-generator', color: 'from-emerald-500 to-green-600' },
  { id: 'dkim-checker', name: 'DKIM Checker', description: 'Look up DKIM public key records for any domain and selector', icon: Key, href: '/tools/dkim-checker', color: 'from-indigo-500 to-violet-500' },
  { id: 'dmarc-checker', name: 'DMARC Checker', description: 'Validate DMARC policy, RUA/RUF reporting, and alignment', icon: CheckCircle, href: '/tools/dmarc-checker', color: 'from-purple-500 to-pink-500' },
  { id: 'dmarc-record-generator', name: 'DMARC Record Generator', description: 'Generate a DMARC TXT record with the right policy settings', icon: FileCode, href: '/tools/dmarc-record-generator', color: 'from-violet-500 to-purple-600' },
  { id: 'bimi-checker', name: 'BIMI Checker', description: 'Check BIMI records for brand logo in email clients', icon: Image, href: '/tools/bimi-checker', color: 'from-pink-500 to-rose-500' },
];

const developerTools = [
  { id: 'json-formatter', name: 'JSON Formatter', description: 'Format, validate, and beautify JSON with syntax highlighting', icon: FileJson, href: '/tools/json-formatter', color: 'from-blue-500 to-cyan-500' },
  { id: 'base64', name: 'Base64 Encoder/Decoder', description: 'Encode and decode Base64 strings and files easily', icon: Binary, href: '/tools/base64', color: 'from-purple-500 to-pink-500' },
  { id: 'hash-generator', name: 'Hash Generator', description: 'Generate MD5, SHA-1, SHA-256, SHA-512 hashes', icon: Hash, href: '/tools/hash-generator', color: 'from-green-500 to-emerald-500' },
  { id: 'uuid-generator', name: 'UUID Generator', description: 'Generate UUID v1/v4/v5 and GUID unique identifiers', icon: Key, href: '/tools/uuid-generator', color: 'from-orange-500 to-red-500' },
  { id: 'regex-tester', name: 'Regex Tester', description: 'Test and debug regular expressions with live matching', icon: Code2, href: '/tools/regex-tester', color: 'from-teal-500 to-green-500' },
  { id: 'url-parser', name: 'URL Parser', description: 'Parse and decode URLs to extract all components', icon: Code2, href: '/tools/url-parser', color: 'from-pink-500 to-rose-500' },
  { id: 'timestamp-converter', name: 'Timestamp Converter', description: 'Convert Unix timestamps to human-readable dates and back', icon: Clock, href: '/tools/timestamp-converter', color: 'from-yellow-500 to-orange-500' },
  { id: 'color-picker', name: 'Color Picker', description: 'Pick colors and convert between HEX, RGB, and HSL', icon: Palette, href: '/tools/color-picker', color: 'from-indigo-500 to-purple-500' },
  { id: 'data-generator', name: 'Data Generator', description: 'Generate fake test data: names, emails, addresses, and more', icon: Database, href: '/tools/data-generator', color: 'from-emerald-500 to-green-500' },
  { id: 'binary-text', name: 'Binary ↔ Text', description: 'Convert text to binary code and binary back to text', icon: Terminal, href: '/tools/binary-text', color: 'from-slate-600 to-gray-700' },
  { id: 'ip-to-decimal', name: 'IP to Decimal', description: 'Convert IP addresses to decimal, hex, and binary formats', icon: ArrowLeftRight, href: '/tools/ip-to-decimal', color: 'from-cyan-500 to-blue-500' },
  { id: 'ipv4-to-ipv6', name: 'IPv4 to IPv6', description: 'Convert IPv4 addresses to their IPv6 mapped equivalents', icon: ArrowLeftRight, href: '/tools/ipv4-to-ipv6', color: 'from-violet-500 to-indigo-500' },
  { id: 'punycode-converter', name: 'Punycode Converter', description: 'Convert internationalized domain names to/from Punycode', icon: Globe, href: '/tools/punycode-converter', color: 'from-orange-500 to-amber-500' },
];

const textTools = [
  { id: 'word-counter', name: 'Word Counter', description: 'Count words, characters, sentences, paragraphs, and reading time', icon: AlignLeft, href: '/tools/word-counter', color: 'from-blue-500 to-cyan-500' },
  { id: 'lorem-ipsum', name: 'Lorem Ipsum Generator', description: 'Generate placeholder text paragraphs for design mockups', icon: FileText, href: '/tools/lorem-ipsum', color: 'from-violet-500 to-purple-500' },
  { id: 'notepad-online', name: 'Online Notepad', description: 'Simple distraction-free online notepad with auto-save', icon: Edit3, href: '/tools/notepad-online', color: 'from-yellow-500 to-amber-500' },
  { id: 'morse-code', name: 'Morse Code Translator', description: 'Translate text to Morse code and Morse code to text', icon: Radio, href: '/tools/morse-code', color: 'from-orange-500 to-red-500' },
  { id: 'rot13', name: 'ROT13 Encoder', description: 'Encode and decode text using the ROT13 cipher', icon: RefreshCw, href: '/tools/rot13', color: 'from-rose-500 to-pink-500' },
  { id: 'small-text-generator', name: 'Small Text Generator', description: 'Convert text to small superscript and subscript Unicode characters', icon: Type, href: '/tools/small-text-generator', color: 'from-teal-500 to-cyan-500' },
];

const generatorTools = [
  { id: 'password-generator', name: 'Password Generator', description: 'Generate strong, random passwords with custom rules', icon: Lock, href: '/tools/password-generator', color: 'from-green-500 to-emerald-500' },
  { id: 'password-strength', name: 'Password Strength', description: 'Analyze how strong your password is and get improvement tips', icon: Fingerprint, href: '/tools/password-strength', color: 'from-amber-500 to-orange-500' },
  { id: 'password-encryption', name: 'Password Encryption', description: 'Encrypt and hash passwords using bcrypt, SHA, and MD5', icon: Lock, href: '/tools/password-encryption', color: 'from-red-500 to-rose-500' },
  { id: 'qr-code-generator', name: 'QR Code Generator', description: 'Generate QR codes for URLs, text, WiFi, and contact cards', icon: QrCode, href: '/tools/qr-code-generator', color: 'from-blue-500 to-indigo-500' },
  { id: 'qr-scanner', name: 'QR Code Scanner', description: 'Scan and decode QR codes from your camera or an image file', icon: ScanLine, href: '/tools/qr-scanner', color: 'from-violet-500 to-purple-500' },
  { id: 'open-graph-generator', name: 'Open Graph Generator', description: 'Generate Open Graph meta tags for link preview cards', icon: Image, href: '/tools/open-graph-generator', color: 'from-sky-500 to-cyan-500' },
  { id: 'robots-txt-generator', name: 'Robots.txt Generator', description: 'Build a robots.txt file to control search engine crawling', icon: FileCode, href: '/tools/robots-txt-generator', color: 'from-slate-500 to-gray-600' },
  { id: 'htaccess-generator', name: '.htaccess Generator', description: 'Generate Apache .htaccess rules for redirects and security', icon: FileText, href: '/tools/htaccess-generator', color: 'from-orange-500 to-red-500' },
  { id: 'url-rewrite-generator', name: 'URL Rewrite Generator', description: 'Build mod_rewrite rules and URL rewrite patterns', icon: RefreshCw, href: '/tools/url-rewrite-generator', color: 'from-teal-500 to-green-500' },
  { id: 'credit-card-checker', name: 'Credit Card Checker', description: 'Validate credit card numbers using the Luhn algorithm', icon: CreditCard, href: '/tools/credit-card-checker', color: 'from-indigo-500 to-blue-500' },
  { id: 'time-card-calculator', name: 'Time Card Calculator', description: 'Calculate total work hours and overtime from time entries', icon: Timer, href: '/tools/time-card-calculator', color: 'from-pink-500 to-rose-500' },
];

const categories = [
  { title: 'Network & IP Tools', icon: Network, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-100', text: 'text-blue-700', tools: networkIpTools },
  { title: 'DNS Tools', icon: Globe, color: 'from-purple-500 to-violet-500', bg: 'bg-purple-100', text: 'text-purple-700', tools: dnsTools },
  { title: 'Domain & Security', icon: Shield, color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-100', text: 'text-yellow-700', tools: domainTools },
  { title: 'Email & DMARC Tools', icon: Mail, color: 'from-sky-500 to-blue-500', bg: 'bg-sky-100', text: 'text-sky-700', tools: emailTools },
  { title: 'Developer Tools', icon: Code, color: 'from-green-500 to-emerald-500', bg: 'bg-green-100', text: 'text-green-700', tools: developerTools },
  { title: 'Text & Writing', icon: Type, color: 'from-rose-500 to-pink-500', bg: 'bg-rose-100', text: 'text-rose-700', tools: textTools },
  { title: 'Generators & Utilities', icon: Wrench, color: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-100', text: 'text-indigo-700', tools: generatorTools },
];

const totalTools = categories.reduce((sum, c) => sum + c.tools.length, 0);

export default function ToolsPage() {
  const { hasActiveSubscription } = useSubscriptionStatus();

  return (
    <div className="min-h-screen themed-section-bg">
      {/* Hero */}
      <section className="themed-section-bg relative py-14 md:py-20 overflow-hidden rounded-b-[2rem]">
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10 text-center">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-300/40 rounded-full text-purple-700 text-xs font-bold uppercase tracking-wider mb-5">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              Developer & Network Tools
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent leading-tight">Professional Tool Suite</h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              A professional suite of {totalTools}+ tools for developers, network engineers, and security teams
            </p>
          </div>
        </div>
      </section>

      <div className="container-custom section-padding">
        {/* Stats */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50/60 backdrop-blur-sm rounded-xl border border-purple-100/50">
                <div className="text-2xl font-bold text-purple-600">{totalTools}+</div>
                <div className="text-xs text-slate-500">Total Tools</div>
              </div>
              <div className="text-center p-4 bg-indigo-50/60 backdrop-blur-sm rounded-xl border border-indigo-100/50">
                <div className="text-2xl font-bold text-indigo-600">{categories.length}</div>
                <div className="text-xs text-slate-500">Categories</div>
              </div>
              <div className="text-center p-4 bg-emerald-50/60 backdrop-blur-sm rounded-xl border border-emerald-100/50">
                <div className="text-2xl font-bold text-emerald-600">Free</div>
                <div className="text-xs text-slate-500">No Limits</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor"><path d="M16.309 9.313a1.12 1.12 0 0 0-.962-.085l-2.3.946L15.393.39A.466.466 0 0 0 15 0a.473.473 0 0 0-.42.228L7.6 11.986c-.14.222-.12.5.045.7a.69.69 0 0 0 .596.252l2.715-.372-1.477 5.605a.465.465 0 0 0 .253.529c.076.037.16.056.243.056a.47.47 0 0 0 .324-.126l6.5-6.06c.183-.17.24-.434.146-.67z"/></svg>
              <span>Protected by Cloudflare</span>
            </div>
          </div>
        </div>

        {/* Category sections */}
        {categories.map((cat) => (
          <div key={cat.title} className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                <cat.icon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-700">{cat.title}</h2>
              <span className={`px-3 py-1 ${cat.bg} ${cat.text} text-sm font-medium rounded-full`}>
                {cat.tools.length} tools
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cat.tools.map((tool) => (
                <LockedCard key={tool.id} isLocked={!hasActiveSubscription} title={tool.name}>
                  <Link
                    href={tool.href}
                    className="group bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6 hover:-translate-y-1 transition-all duration-300 block h-full"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <tool.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2 group-hover:text-purple-600 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">{tool.description}</p>
                    <div className="flex items-center text-purple-600 text-sm font-semibold group-hover:translate-x-2 transition-transform">
                      Launch Tool →
                    </div>
                  </Link>
                </LockedCard>
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="themed-section-bg relative py-14 overflow-hidden rounded-[2rem]">
            <div className="absolute -top-20 -left-10 w-[160px] h-[450px] rotate-[25deg] rounded-[80px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
            <div className="absolute -top-24 right-[10%] w-[140px] h-[500px] rotate-[-20deg] rounded-[80px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
            <div className="absolute -bottom-32 left-[30%] w-[120px] h-[400px] rotate-[35deg] rounded-[80px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
            <div className="absolute -bottom-16 -right-10 w-[180px] h-[420px] rotate-[-30deg] rounded-[80px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
            <div className="relative z-10 text-center px-8 md:px-12">
              <h2 className="text-3xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Need AI-Powered Assistance?</h2>
              <p className="text-base md:text-lg text-slate-600 mb-8 leading-relaxed">
                Explore our intelligent AI agents for coding, analysis, and automation tasks.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="https://mumtaz.ai/agents" className="px-7 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105">
                  Explore AI Agents
                </Link>
                <Link href="https://demo.mumtaz.ai" className="px-7 py-3 bg-white/50 border border-white/60 text-slate-700 font-bold rounded-xl hover:bg-white/70 transition-all duration-300 backdrop-blur-sm">
                  Try AI Studio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
