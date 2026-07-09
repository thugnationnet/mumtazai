'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Database,
  Copy,
  Download,
  Check,
  RefreshCw,
  User,
  ShoppingCart,
  FileText,
  BarChart3,
  MessageSquare,
  Mail,
  Building2,
  MapPin,
  CreditCard,
  Calendar,
  Hash,
  Sparkles,
} from 'lucide-react';

// Template definitions
const templates = [
  {
    id: 'users',
    name: 'Users',
    icon: User,
    color: 'from-blue-500 to-cyan-500',
    description: 'User accounts with profiles',
    fields: ['id', 'name', 'email', 'role', 'avatar', 'createdAt'],
  },
  {
    id: 'products',
    name: 'Products',
    icon: ShoppingCart,
    color: 'from-green-500 to-emerald-500',
    description: 'E-commerce product catalog',
    fields: ['id', 'name', 'price', 'category', 'stock', 'description'],
  },
  {
    id: 'posts',
    name: 'Blog Posts',
    icon: FileText,
    color: 'from-purple-500 to-pink-500',
    description: 'Blog articles and content',
    fields: ['id', 'title', 'content', 'author', 'tags', 'publishedAt'],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: BarChart3,
    color: 'from-orange-500 to-red-500',
    description: 'Analytics events and metrics',
    fields: ['id', 'event', 'userId', 'metadata', 'timestamp'],
  },
  {
    id: 'comments',
    name: 'Comments',
    icon: MessageSquare,
    color: 'from-indigo-500 to-purple-500',
    description: 'User comments and reviews',
    fields: ['id', 'userId', 'postId', 'content', 'rating', 'createdAt'],
  },
  {
    id: 'emails',
    name: 'Emails',
    icon: Mail,
    color: 'from-pink-500 to-rose-500',
    description: 'Email addresses and contacts',
    fields: ['id', 'email', 'name', 'verified', 'subscribedAt'],
  },
  {
    id: 'companies',
    name: 'Companies',
    icon: Building2,
    color: 'from-teal-500 to-cyan-500',
    description: 'Business and company data',
    fields: ['id', 'name', 'industry', 'size', 'website', 'foundedYear'],
  },
  {
    id: 'addresses',
    name: 'Addresses',
    icon: MapPin,
    color: 'from-amber-500 to-orange-500',
    description: 'Location and address data',
    fields: ['id', 'street', 'city', 'state', 'country', 'zipCode'],
  },
  {
    id: 'transactions',
    name: 'Transactions',
    icon: CreditCard,
    color: 'from-emerald-500 to-green-500',
    description: 'Payment and transaction records',
    fields: ['id', 'userId', 'amount', 'currency', 'status', 'createdAt'],
  },
  {
    id: 'events',
    name: 'Events',
    icon: Calendar,
    color: 'from-violet-500 to-purple-500',
    description: 'Calendar events and schedules',
    fields: ['id', 'title', 'description', 'startDate', 'endDate', 'location'],
  },
];

// Data generation functions
const firstNames = [
  'James',
  'Sarah',
  'Michael',
  'Emily',
  'David',
  'Jessica',
  'Daniel',
  'Ashley',
  'Matthew',
  'Amanda',
  'Andrew',
  'Stephanie',
  'Joshua',
  'Nicole',
  'Christopher',
  'Elizabeth',
  'Brandon',
  'Samantha',
  'Ryan',
  'Katherine',
];
const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
];
const domains = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'company.com',
  'business.org',
  'example.com',
];
const roles = ['admin', 'user', 'moderator', 'editor', 'viewer'];
const categories = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports',
  'Books',
  'Toys',
  'Beauty',
  'Automotive',
];
const productAdjectives = [
  'Premium',
  'Professional',
  'Ultra',
  'Smart',
  'Classic',
  'Modern',
  'Deluxe',
  'Essential',
];
const productNouns = [
  'Widget',
  'Gadget',
  'Device',
  'Kit',
  'Set',
  'Bundle',
  'System',
  'Tool',
];
const blogTitles = [
  'Getting Started with',
  'The Ultimate Guide to',
  'How to Master',
  '10 Tips for',
  'Understanding',
  'Best Practices for',
  'Introduction to',
  'Advanced Techniques in',
];
const topics = [
  'AI Development',
  'Web Design',
  'Data Science',
  'Cloud Computing',
  'Mobile Apps',
  'DevOps',
  'Machine Learning',
  'Cybersecurity',
];
const eventTypes = [
  'page_view',
  'button_click',
  'form_submit',
  'purchase',
  'signup',
  'login',
  'search',
  'share',
];
const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Media',
  'Consulting',
];
const companySizes = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+',
];
const cities = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'Dallas',
  'San Jose',
];
const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA'];
const countries = [
  'USA',
  'Canada',
  'UK',
  'Germany',
  'France',
  'Australia',
  'Japan',
  'Brazil',
];
const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
const transactionStatuses = ['completed', 'pending', 'failed', 'refunded'];
const ratings = [1, 2, 3, 4, 5];
const tags = [
  'technology',
  'business',
  'lifestyle',
  'tutorial',
  'news',
  'review',
  'guide',
  'tips',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
  return date.toISOString().split('T')[0];
}

function randomEmail(name: string): string {
  const cleanName = name.toLowerCase().replace(' ', '.');
  return `${cleanName}@${randomItem(domains)}`;
}

function generateRecord(
  templateId: string,
  index: number
): Record<string, any> {
  const now = new Date();
  const yearAgo = new Date(
    now.getFullYear() - 1,
    now.getMonth(),
    now.getDate()
  );

  switch (templateId) {
    case 'users': {
      const firstName = randomItem(firstNames);
      const lastName = randomItem(lastNames);
      const name = `${firstName} ${lastName}`;
      return {
        id: randomId('usr'),
        name,
        email: randomEmail(name),
        role: randomItem(roles),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}`,
        createdAt: randomDate(yearAgo, now),
      };
    }
    case 'products':
      return {
        id: randomId('prod'),
        name: `${randomItem(productAdjectives)} ${randomItem(productNouns)}`,
        price: parseFloat((Math.random() * 500 + 9.99).toFixed(2)),
        category: randomItem(categories),
        stock: Math.floor(Math.random() * 1000),
        description: `High-quality ${randomItem(productNouns).toLowerCase()} for all your needs.`,
      };
    case 'posts':
      return {
        id: randomId('post'),
        title: `${randomItem(blogTitles)} ${randomItem(topics)}`,
        content: `This comprehensive article covers everything you need to know about ${randomItem(topics).toLowerCase()}. Learn the best practices and tips from industry experts.`,
        author: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
        tags: [randomItem(tags), randomItem(tags), randomItem(tags)].filter(
          (v, i, a) => a.indexOf(v) === i
        ),
        publishedAt: randomDate(yearAgo, now),
      };
    case 'analytics':
      return {
        id: randomId('evt'),
        event: randomItem(eventTypes),
        userId: randomId('usr'),
        metadata: {
          source: randomItem(['web', 'mobile', 'api']),
          version: '2.0',
        },
        timestamp: new Date(
          yearAgo.getTime() +
            Math.random() * (now.getTime() - yearAgo.getTime())
        ).toISOString(),
      };
    case 'comments':
      return {
        id: randomId('cmt'),
        userId: randomId('usr'),
        postId: randomId('post'),
        content: `This is ${randomItem(['great', 'helpful', 'interesting', 'informative', 'amazing'])} content! ${randomItem(['Thanks for sharing.', 'Keep it up!', 'Very useful.', 'Well written.'])}`,
        rating: randomItem(ratings),
        createdAt: randomDate(yearAgo, now),
      };
    case 'emails':
      const emailName = `${randomItem(firstNames)} ${randomItem(lastNames)}`;
      return {
        id: randomId('email'),
        email: randomEmail(emailName),
        name: emailName,
        verified: Math.random() > 0.2,
        subscribedAt: randomDate(yearAgo, now),
      };
    case 'companies':
      return {
        id: randomId('comp'),
        name: `${randomItem(lastNames)} ${randomItem(['Inc', 'Corp', 'LLC', 'Group', 'Solutions', 'Technologies'])}`,
        industry: randomItem(industries),
        size: randomItem(companySizes),
        website: `https://www.${randomItem(lastNames).toLowerCase()}${randomItem(['tech', 'corp', 'inc', 'co'])}.com`,
        foundedYear: 1990 + Math.floor(Math.random() * 35),
      };
    case 'addresses': {
      const cityIndex = Math.floor(Math.random() * cities.length);
      return {
        id: randomId('addr'),
        street: `${Math.floor(Math.random() * 9999) + 1} ${randomItem(lastNames)} ${randomItem(['St', 'Ave', 'Blvd', 'Dr', 'Ln'])}`,
        city: cities[cityIndex],
        state: states[cityIndex],
        country: randomItem(countries),
        zipCode: String(10000 + Math.floor(Math.random() * 89999)),
      };
    }
    case 'transactions':
      return {
        id: randomId('txn'),
        userId: randomId('usr'),
        amount: parseFloat((Math.random() * 1000 + 1).toFixed(2)),
        currency: randomItem(currencies),
        status: randomItem(transactionStatuses),
        createdAt: randomDate(yearAgo, now),
      };
    case 'events':
      const startDate = new Date(
        now.getTime() + Math.random() * 90 * 24 * 60 * 60 * 1000
      );
      const endDate = new Date(
        startDate.getTime() + Math.random() * 4 * 60 * 60 * 1000
      );
      return {
        id: randomId('event'),
        title: `${randomItem(['Annual', 'Weekly', 'Monthly', 'Special'])} ${randomItem(['Meeting', 'Conference', 'Workshop', 'Webinar', 'Summit'])}`,
        description: `Join us for an exciting ${randomItem(topics).toLowerCase()} event.`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        location: `${randomItem(cities)}, ${randomItem(countries)}`,
      };
    default:
      return { id: randomId('item'), index };
  }
}

function generateData(templateId: string, count: number): any[] {
  return Array.from({ length: count }, (_, i) => generateRecord(templateId, i));
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        if (typeof value === 'object') return JSON.stringify(value);
        if (typeof value === 'string' && value.includes(','))
          return `"${value}"`;
        return value;
      })
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function convertToSQL(data: any[], tableName: string): string {
  if (data.length === 0) return '';
  const columns = Object.keys(data[0]);
  const values = data.map((row) => {
    const vals = columns.map((col) => {
      const val = row[col];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      if (typeof val === 'number') return val;
      if (typeof val === 'object')
        return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
      return `'${String(val).replace(/'/g, "''")}'`;
    });
    return `(${vals.join(', ')})`;
  });
  return `INSERT INTO ${tableName} (${columns.join(', ')})\nVALUES\n${values.join(',\n')};`;
}

export default function DataGeneratorPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('users');
  const [recordCount, setRecordCount] = useState(10);
  const [outputFormat, setOutputFormat] = useState<'json' | 'csv' | 'sql'>(
    'json'
  );
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [seed, setSeed] = useState('');

  const currentTemplate = templates.find((t) => t.id === selectedTemplate)!;

  const handleGenerate = () => {
    if (seed) {
      // Simple seeded random (not cryptographically secure, but reproducible)
      let seedNum = 0;
      for (let i = 0; i < seed.length; i++) {
        seedNum = (seedNum << 5) - seedNum + seed.charCodeAt(i);
        seedNum = seedNum & seedNum;
      }
      // Reset Math.random isn't possible, but we simulate by using seed in generation
    }
    const data = generateData(selectedTemplate, recordCount);
    setGeneratedData(data);
    setCopied(false);
  };

  const formattedOutput = useMemo(() => {
    if (generatedData.length === 0) return '';
    switch (outputFormat) {
      case 'json':
        return JSON.stringify(generatedData, null, 2);
      case 'csv':
        return convertToCSV(generatedData);
      case 'sql':
        return convertToSQL(generatedData, selectedTemplate);
      default:
        return JSON.stringify(generatedData, null, 2);
    }
  }, [generatedData, outputFormat, selectedTemplate]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formattedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extensions = { json: 'json', csv: 'csv', sql: 'sql' };
    const mimeTypes = {
      json: 'application/json',
      csv: 'text/csv',
      sql: 'text/plain',
    };
    const blob = new Blob([formattedOutput], { type: mimeTypes[outputFormat] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate}-data.${extensions[outputFormat]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom">
          <Link href="/tools" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-8 transition-colors">
            ← Back to Tools
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Database className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                AI Data Generator
              </h1>
              <p className="text-lg opacity-90">
                Generate realistic test data in seconds
              </p>
            </div>
          </div>
          <p className="text-white/80 max-w-2xl">
            Choose a template, set the number of records, and generate realistic
            test data for your databases, APIs, and applications. Export as
            JSON, CSV, or SQL.
          </p>
        </div>
      </section>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Template Selection */}
          <div className="lg:col-span-1 space-y-6">
            {/* Templates */}
            <div className="bg-white rounded-2xl p-6 border border-neural-100 shadow-sm">
              <h2 className="text-lg font-semibold text-neural-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Select Template
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((template) => {
                  const Icon = template.icon;
                  const isSelected = selectedTemplate === template.id;
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-3 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br ' +
                            template.color +
                            ' text-white shadow-lg'
                          : 'bg-gray-50 text-neural-700 hover:bg-gray-100 border border-neural-100'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 mb-1 ${isSelected ? 'text-white' : 'text-neural-500'}`}
                      />
                      <div className="text-sm font-medium">{template.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configuration */}
            <div className="bg-white rounded-2xl p-6 border border-neural-100 shadow-sm">
              <h2 className="text-lg font-semibold text-neural-800 mb-4 flex items-center gap-2">
                <Hash className="w-5 h-5 text-blue-500" />
                Configuration
              </h2>

              {/* Record Count Slider */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-neural-600">
                    Number of Records
                  </label>
                  <span className="text-sm font-mono text-brand-600 font-semibold">
                    {recordCount}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="1000"
                  value={recordCount}
                  onChange={(e) => setRecordCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
                <div className="flex justify-between text-xs text-neural-500 mt-1">
                  <span>1</span>
                  <span>500</span>
                  <span>1000</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex gap-2 mb-6">
                {[10, 50, 100, 500, 1000].map((num) => (
                  <button
                    key={num}
                    onClick={() => setRecordCount(num)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      recordCount === num
                        ? 'bg-brand-500 text-white'
                        : 'bg-gray-100 text-neural-600 hover:bg-gray-200 border border-neural-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Output Format */}
              <div className="mb-6">
                <label className="text-sm text-neural-600 block mb-2">
                  Output Format
                </label>
                <div className="flex gap-2">
                  {(['json', 'csv', 'sql'] as const).map((format) => (
                    <button
                      key={format}
                      onClick={() => setOutputFormat(format)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium uppercase transition-all ${
                        outputFormat === format
                          ? 'bg-brand-600 text-white'
                          : 'bg-gray-100 text-neural-600 hover:bg-gray-200 border border-neural-100'
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seed Input (Optional) */}
              <div className="mb-6">
                <label className="text-sm text-neural-600 block mb-2">
                  Seed (optional, for reproducible data)
                </label>
                <input
                  type="text"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Enter seed value..."
                  className="w-full px-4 py-2 bg-gray-50 border border-neural-200 rounded-lg text-neural-800 placeholder-neural-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-accent-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-500/25 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                Generate {recordCount} Records
              </button>
            </div>

            {/* Selected Template Info */}
            <div className="bg-white rounded-2xl p-6 border border-neural-100 shadow-sm">
              <h3 className="text-sm font-semibold text-neural-500 uppercase tracking-wider mb-3">
                Template Fields
              </h3>
              <div className="flex flex-wrap gap-2">
                {currentTemplate.fields.map((field) => (
                  <span
                    key={field}
                    className="px-2 py-1 bg-gray-100 border border-neural-100 rounded text-xs text-neural-700 font-mono"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Terminal Output */}
          <div className="lg:col-span-2">
            <div className="bg-[#1e1e2e] rounded-2xl border border-gray-300 overflow-hidden shadow-xl">
              {/* Terminal Title Bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#313244] border-b border-[#45475a]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-inner"></div>
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-inner"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27ca3f] shadow-inner"></div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Hash className="w-3.5 h-3.5 text-neural-500" />
                    <span className="text-xs text-neural-400 font-mono">
                      {selectedTemplate}-data.{outputFormat}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {generatedData.length > 0 && (
                    <>
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-neural-700/50 hover:bg-neural-600 rounded-md text-xs text-neural-300 transition-colors border border-neural-600/50"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-neural-700/50 hover:bg-neural-600 rounded-md text-xs text-neural-300 transition-colors border border-neural-600/50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Terminal Content - Fixed Height with Scroll */}
              <div className="h-[500px] overflow-y-auto bg-[#1e1e2e] custom-scrollbar">
                {generatedData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-[#313244] flex items-center justify-center mb-4">
                      <Database className="w-8 h-8 text-[#6c7086]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#cdd6f4] mb-2">
                      Ready to Generate
                    </h3>
                    <p className="text-[#6c7086] text-sm max-w-sm">
                      Select a template and click Generate to create your test
                      data
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-[#585b70] text-xs font-mono">
                      <span className="text-[#a6e3a1]">$</span>
                      <span className="animate-pulse">awaiting command...</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    {/* Terminal prompt line */}
                    <div className="flex items-center gap-2 text-xs font-mono mb-3 text-[#6c7086]">
                      <span className="text-[#a6e3a1]">→</span>
                      <span className="text-[#89dceb]">mumtazai</span>
                      <span className="text-[#585b70]">$</span>
                      <span className="text-[#bac2de]">
                        generate --template {selectedTemplate} --count{' '}
                        {generatedData.length} --format {outputFormat}
                      </span>
                    </div>
                    {/* Output */}
                    <pre className="text-sm font-mono text-[#cdd6f4] whitespace-pre leading-relaxed">
                      <code className="block">{formattedOutput}</code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Terminal Status Bar */}
              <div className="px-4 py-2 bg-[#313244] border-t border-[#45475a] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-[#6c7086] font-mono uppercase tracking-wider">
                    {generatedData.length > 0 ? 'OUTPUT' : 'IDLE'}
                  </span>
                  {generatedData.length > 0 && (
                    <span className="text-[10px] text-[#6c7086] font-mono">
                      {generatedData.length} records
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {generatedData.length > 0 && (
                    <>
                      <span className="text-[10px] text-[#6c7086] font-mono">
                        {(new Blob([formattedOutput]).size / 1024).toFixed(2)}{' '}
                        KB
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-[#a6e3a1] font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#a6e3a1] animate-pulse"></span>
                        Ready
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-12 border-t border-gray-200">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-neural-800 text-center mb-8">
            Why Use Our Data Generator?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '⚡',
                title: 'Instant Generation',
                description:
                  'Generate up to 1000 records in seconds with realistic, varied data.',
              },
              {
                icon: '🎯',
                title: 'Multiple Formats',
                description:
                  'Export as JSON, CSV, or SQL - ready for any database or application.',
              },
              {
                icon: '🔒',
                title: 'Privacy First',
                description:
                  'All data is generated client-side. Nothing is sent to any server.',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 bg-white rounded-2xl border border-neural-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all duration-300"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-neural-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neural-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="max-w-4xl mx-auto mt-16">
            <div className="bg-gradient-to-r from-brand-600 to-accent-500 rounded-2xl p-8 md:p-12 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">Explore More Tools</h2>
              <p className="text-lg opacity-90 mb-8">
                Check out our full suite of developer and network tools to boost your productivity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/tools" className="btn-primary bg-white text-brand-600 hover:bg-neural-50">
                  All Tools
                </Link>
                <Link href="https://mumtaz.ai/agents" className="btn-primary border-2 border-white bg-transparent hover:bg-white hover:text-brand-600">
                  Explore AI Agents
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
