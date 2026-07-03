import React, { useState, useEffect, useCallback } from 'react';
import { PreviewContent } from './PanelPreview';
import {
  Rocket,
  Globe,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Settings,
  Link2,
  Shield,
  Clock,
  Eye,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Key,
  HelpCircle,
  X,
  Zap,
} from 'lucide-react';
import {
  deployProject,
  DeployRequest,
  DeployResponse,
} from '@shared/api';
import { fetchWithCredentials } from '../fetchUtil';

// ============================================================================
// CLOUD PROVIDER TYPES AND CONFIG
// ============================================================================

export type CloudProvider =
  | 'mumtazai'
  | 'vercel'
  | 'netlify'
  | 'railway'
  | 'render'
  | 'cloudflare';

interface ProviderConfig {
  id: CloudProvider;
  name: string;
  icon: string;
  color: string;
  category: 'builtin' | 'frontend' | 'fullstack' | 'cloud';
  description: string;
  features: string[];
}

const cloudProviders: ProviderConfig[] = [
  {
    id: 'mumtazai',
    name: 'OneLastAI Hosting',
    icon: '⚡',
    color: 'bg-gradient-to-br from-cyan-500 to-purple-500',
    category: 'builtin',
    description: 'Free instant hosting - No config needed',
    features: ['Free Hosting', 'SSL', 'Custom Domains', 'Analytics'],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    icon: '▲',
    color: 'bg-black',
    category: 'frontend',
    description: 'Best for React & Next.js apps',
    features: ['Edge Functions', 'Analytics', 'Preview URLs'],
  },
  {
    id: 'netlify',
    name: 'Netlify',
    icon: '◆',
    color: 'bg-teal-500',
    category: 'frontend',
    description: 'Static sites & serverless functions',
    features: ['Forms', 'Functions', 'Split Testing'],
  },
  {
    id: 'railway',
    name: 'Railway',
    icon: '🚂',
    color: 'bg-purple-600',
    category: 'fullstack',
    description: 'Full-stack apps with databases',
    features: ['Databases', 'Environment Variables', 'Preview Environments'],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Pages',
    icon: '☁️',
    color: 'bg-orange-500',
    category: 'cloud',
    description: 'Fast global CDN deployment',
    features: ['Edge Network', 'Workers', 'Web Analytics'],
  },
  {
    id: 'render',
    name: 'Render',
    icon: '🚀',
    color: 'bg-green-600',
    category: 'fullstack',
    description: 'Modern cloud for web apps',
    features: ['Auto Deploy', 'Managed DB', 'Private Network'],
  },
];

// ============================================================================
// SERVER-SIDE CREDENTIAL TYPES
// ============================================================================

interface ServerCredential {
  id: string;
  provider: string;
  username: string | null;
  isValid: boolean;
  lastValidatedAt: string | null;
}

// Map cloudDeploy provider IDs → server credential provider IDs
const PROVIDER_MAP: Record<string, string> = {
  mumtazai: 'MUMTAZAI',
  vercel: 'VERCEL',
  netlify: 'NETLIFY',
  railway: 'RAILWAY',
  cloudflare: 'CLOUDFLARE',
  render: 'RENDER',
};
const REVERSE_PROVIDER_MAP: Record<string, CloudProvider> = Object.fromEntries(
  Object.entries(PROVIDER_MAP).map(([k, v]) => [v, k as CloudProvider])
);

// ============================================================================
// TYPES
// ============================================================================

export interface DeployedApp {
  id: string;
  slug: string;
  name: string;
  url: string;
  previewUrl?: string;
  customDomain?: string;
  status: 'ACTIVE' | 'PAUSED' | 'BUILDING' | 'FAILED';
  language: string;
  framework?: string;
  viewCount: number;
  lastDeployedAt?: string;
  createdAt: string;
  sslEnabled: boolean;
}

interface DeployPanelProps {
  code: string;
  language: string;
  appName: string;
  files?: Record<string, string>;
  originalPrompt?: string;
  onDeploySuccess?: (app: DeployedApp) => void;
  onClose?: () => void;
  onPreviewContent?: (content: PreviewContent) => void;
}

type DeployTab = 'deploy' | 'history' | 'logs' | 'env' | 'tasks';

// ============================================================================
// DEPLOY PANEL COMPONENT
// ============================================================================

const DeployPanel: React.FC<DeployPanelProps> = ({
  code,
  language,
  appName,
  files,
  originalPrompt,
  onDeploySuccess,
  onClose,
  onPreviewContent,
}) => {
  // Provider selection
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider | null>(null);
  const [providerCategory, setProviderCategory] = useState<'all' | 'builtin' | 'frontend' | 'fullstack' | 'cloud'>('all');

  // Server-side credential status (replaces client-side tokens)
  const [serverCredentials, setServerCredentials] = useState<Record<string, ServerCredential>>({});
  const [loadingCredentials, setLoadingCredentials] = useState(true);

  // Deploy state
  const [activeTab, setActiveTab] = useState<DeployTab>('deploy');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<DeploymentResult | null>(null);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);

  // Project settings
  const [projectName, setProjectName] = useState(appName?.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'my-project');
  const [buildCommand, setBuildCommand] = useState('npm run build');
  const [outputDir, setOutputDir] = useState('dist');
  const [branch, setBranch] = useState('main');
  const [installCommand, setInstallCommand] = useState('npm install');

  // Environment variables
  const [envVars, setEnvVars] = useState<{ key: string; value: string; isSecret: boolean }[]>([]);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');

  // My apps
  const [myApps, setMyApps] = useState<DeployedApp[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Clipboard
  const [copied, setCopied] = useState(false);

  // Fetch server-side credentials on mount
  const fetchCredentials = useCallback(async () => {
    try {
      const res = await fetchWithCredentials('/api/credentials?sourceApp=canvas', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const credMap: Record<string, ServerCredential> = {};
        (data.credentials || []).forEach((c: ServerCredential) => {
          credMap[c.provider] = c;
        });
        setServerCredentials(credMap);
      }
    } catch (err) {
      console.error('[DeployPanel] Credential fetch error:', err);
    } finally {
      setLoadingCredentials(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  // Check if a cloud provider has a valid credential
  const hasCredential = (provider: CloudProvider): boolean => {
    if (provider === 'mumtazai') return true;
    const serverKey = PROVIDER_MAP[provider];
    return !!(serverKey && serverCredentials[serverKey]?.isValid);
  };

  const getCredentialUser = (provider: CloudProvider): string | null => {
    const serverKey = PROVIDER_MAP[provider];
    return serverKey ? serverCredentials[serverKey]?.username || null : null;
  };

  const addLog = (message: string) => {
    setDeployLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleDeploy = async () => {
    if (!selectedProvider) return;
    if (!code.trim()) {
      setDeployResult({ success: false, error: 'No code to deploy' });
      return;
    }

    setIsDeploying(true);
    setDeployResult(null);
    setDeployLogs([]);
    setActiveTab('logs');

    const providerInfo = cloudProviders.find(p => p.id === selectedProvider);
    addLog(`🚀 Starting deployment to ${providerInfo?.name}...`);
    addLog(`📦 Project: ${projectName}`);
    addLog(`🔤 Language: ${language}`);
    onPreviewContent?.({
      type: 'html', title: 'DEPLOY_PROGRESS', icon: '🚀',
      html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a;color:#e5e7eb;font-family:system-ui;min-height:100vh;display:flex;align-items:center;justify-content:center}.card{text-align:center;max-width:400px;padding:32px}.spinner{width:48px;height:48px;border:3px solid #1f2937;border-top-color:#22c55e;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 20px}@keyframes spin{to{transform:rotate(360deg)}}.title{font-size:16px;font-weight:700;color:#22c55e;margin-bottom:8px}.sub{font-size:12px;color:#6b7280}.badge{background:#1f2937;border:1px solid #374151;border-radius:20px;padding:4px 16px;font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-top:16px;display:inline-block}</style></head><body><div class="card"><div class="spinner"></div><div class="title">Deploying to ' + (providerInfo?.name || selectedProvider) + '...</div><div class="sub">Project: ' + projectName + '</div><div class="badge">🚀 In Progress</div></div></body></html>',
    });

    try {
      const envVarsObj = envVars.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      // For OneLast AI built-in, use the old flow
      if (selectedProvider === 'mumtazai') {
        const result = await deployToProvider(code, files || null, language, {
          provider: selectedProvider,
          projectName,
          buildCommand,
          outputDir,
          envVars: envVarsObj,
        });
        if (result.logs) result.logs.forEach(log => addLog(log));
        if (result.success) {
          addLog(`✅ Deployment successful!`);
          addLog(`🌐 URL: ${result.url}`);
          setDeployResult(result);
          if (onPreviewContent && result.url) {
            onPreviewContent({ type: 'url', src: result.url, title: 'Deployed App', icon: '🚀' });
          }
          if (onDeploySuccess && result.url) {
            onDeploySuccess({
              id: result.deploymentId || Date.now().toString(),
              slug: projectName,
              name: projectName,
              url: result.url,
              previewUrl: result.previewUrl,
              status: 'ACTIVE',
              language,
              viewCount: 0,
              createdAt: new Date().toISOString(),
              sslEnabled: true,
            });
          }
        } else {
          addLog(`❌ Deployment failed: ${result.error}`);
          setDeployResult(result);
        }
      } else {
        // Use server-side credentials for external providers
        const serverProviderKey = PROVIDER_MAP[selectedProvider];
        if (!serverProviderKey) {
          throw new Error(`Provider ${selectedProvider} not supported for server-side deploy`);
        }

        addLog('🔐 Using server-encrypted credentials...');

        // Build files map
        const deployFiles: Record<string, string> = {};
        if (files && Object.keys(files).length > 0) {
          Object.entries(files).forEach(([path, content]) => {
            deployFiles[path.replace(/^\//, '')] = content;
          });
        } else {
          const isHtml = code.includes('<!DOCTYPE') || code.includes('<html');
          const filename = isHtml ? 'index.html' : 'index.tsx';
          deployFiles[filename] = code;
          if (!isHtml) {
            deployFiles['package.json'] = JSON.stringify({
              name: projectName || 'canvas-app',
              version: '1.0.0',
              private: true,
              scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
              dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
              devDependencies: {
                '@types/react': '^18.2.0', '@types/react-dom': '^18.2.0',
                '@vitejs/plugin-react': '^4.0.0', typescript: '^5.0.0', vite: '^5.0.0',
              },
            }, null, 2);
            deployFiles['vite.config.ts'] = `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()] });`;
            deployFiles['index.html'] = `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${projectName}</title></head>\n<body><div id="root"></div><script type="module" src="/index.tsx"></script></body>\n</html>`;
          }
        }

        addLog(`📦 Preparing ${Object.keys(deployFiles).length} files...`);

        const res = await fetchWithCredentials('/api/credentials/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            provider: serverProviderKey,
            projectName,
            files: deployFiles,
            buildCommand,
            outputDir,
            envVars: envVarsObj,
            sourceApp: 'canvas',
          }),
        });

        const data = await res.json();

        if (data.success) {
          addLog('✅ Deployment successful!');
          if (data.url) addLog(`🌐 URL: ${data.url}`);
          if (data.message) addLog(`💬 ${data.message}`);
          setDeployResult({ success: true, url: data.url, deploymentId: data.deploymentId, logs: deployLogs });
          if (onPreviewContent && data.url) {
            onPreviewContent({ type: 'url', src: data.url, title: 'Deployed App', icon: '🚀' });
          }
          if (onDeploySuccess && data.url) {
            onDeploySuccess({
              id: data.deploymentId || Date.now().toString(),
              slug: projectName,
              name: projectName,
              url: data.url,
              status: 'ACTIVE',
              language,
              viewCount: 0,
              createdAt: new Date().toISOString(),
              sslEnabled: true,
            });
          }
        } else {
          addLog(`❌ Deployment failed: ${data.error}`);
          setDeployResult({ success: false, error: data.error });
        }
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      setDeployResult({ success: false, error: error.message });
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addEnvVar = () => {
    if (newEnvKey.trim()) {
      setEnvVars(prev => [...prev, { key: newEnvKey, value: newEnvValue, isSecret: false }]);
      setNewEnvKey('');
      setNewEnvValue('');
    }
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(prev => prev.filter((_, i) => i !== index));
  };

  const filteredProviders = providerCategory === 'all'
    ? cloudProviders
    : cloudProviders.filter(p => p.category === providerCategory);

  const provider = selectedProvider ? cloudProviders.find(p => p.id === selectedProvider) : null;

  // ============================================================================
  // PROVIDER SELECTION VIEW
  // ============================================================================
  if (!selectedProvider) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-[#0a0a0a]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1c1c1c] bg-slate-50 dark:bg-[#0d0d0d] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Rocket className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Deploy Your App
            </h2>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
              Choose a hosting provider
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#2a2a2a] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="px-4 py-2 border-b border-[#1c1c1c]">
          <div className="flex gap-1 flex-wrap">
            {(['all', 'builtin', 'frontend', 'fullstack', 'cloud'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setProviderCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${providerCategory === cat
                  ? 'bg-cyan-500 text-slate-900 dark:text-white'
                  : 'bg-slate-100 dark:bg-[#1a1a1a] text-slate-700 dark:text-slate-300 hover:bg-[#2a2a2a]'
                  }`}
              >
                {cat === 'all' ? 'All' : cat === 'builtin' ? '⚡ Built-in' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Provider Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 gap-3">
            {filteredProviders.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedProvider(p.id);
                  setActiveTab('deploy');
                }}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all text-left group ${p.id === 'mumtazai'
                  ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-indigo-500/30 hover:border-cyan-400'
                  : 'bg-slate-50 dark:bg-[#0d0d0d] border-[#1c1c1c] hover:border-indigo-500/50'
                  }`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 ${p.color} flex items-center justify-center text-slate-900 dark:text-white text-xl font-bold rounded-lg shadow-lg flex-shrink-0`}>
                  {p.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:text-indigo-400 transition-colors">
                      {p.name}
                    </h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.category === 'builtin' ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400' :
                      p.category === 'frontend' ? 'bg-blue-500/20 text-blue-400' :
                        p.category === 'fullstack' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-orange-500/20 text-orange-400'
                      }`}>
                      {p.category === 'builtin' ? 'FREE' : p.category}
                    </span>
                    {hasCredential(p.id) && p.id !== 'mumtazai' && (
                      <CheckCircle className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{p.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.features.slice(0, 3).map(feature => (
                      <span key={feature} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1a1a1a] text-slate-500 dark:text-slate-400">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-gray-500 group-hover:text-indigo-600 dark:text-indigo-400 transition-colors">
                  →
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // PROVIDER DEPLOY VIEW
  // ============================================================================
  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1c1c1c] bg-slate-50 dark:bg-[#0d0d0d]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedProvider(null)}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to providers
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#2a2a2a] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <div className={`w-10 h-10 ${provider?.color} flex items-center justify-center text-slate-900 dark:text-white text-lg font-bold rounded-lg`}>
            {provider?.icon}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{provider?.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{provider?.description}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#1c1c1c] bg-slate-50 dark:bg-[#0d0d0d]">
        {([
          { id: 'deploy', icon: Rocket, label: 'Deploy' },
          { id: 'history', icon: Clock, label: 'History' },
          { id: 'logs', icon: Eye, label: 'Logs' },
          { id: 'env', icon: Key, label: 'Env Vars' },
          { id: 'tasks', icon: Zap, label: 'Tasks' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all ${activeTab === tab.id
              ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-[#1a1a1a]'
              }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Deploy Tab */}
        {activeTab === 'deploy' && (
          <div className="space-y-4">
            {/* Credential Status (for external providers) */}
            {provider && provider.id !== 'mumtazai' && (
              <div className={`p-4 rounded-lg border ${hasCredential(selectedProvider)
                ? 'border-violet-500/30 bg-green-500/5'
                : 'border-yellow-500/30 bg-yellow-500/5'
                }`}>
                {hasCredential(selectedProvider) ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
                        ✓ Connected{getCredentialUser(selectedProvider) ? ` as ${getCredentialUser(selectedProvider)}` : ''}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Token encrypted on server · Ready to deploy
                      </p>
                    </div>
                    <button
                      onClick={() => fetchCredentials()}
                      className="p-1.5 rounded hover:bg-[#2a2a2a] text-gray-500 hover:text-indigo-600 dark:text-indigo-400 transition-colors"
                      title="Refresh status"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <p className="text-xs font-medium text-yellow-400">
                        No token configured for {provider.name}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">
                      Go to Deploy Credentials panel to securely add your {provider.name} token.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Project Settings */}
            <div className="p-4 rounded-lg border border-[#1c1c1c] bg-slate-50 dark:bg-[#0d0d0d]">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-3">Project Settings</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    maxLength={64}
                    className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-[#2a2a2a] text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Branch</label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-[#2a2a2a] text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="main">main</option>
                      <option value="master">master</option>
                      <option value="develop">develop</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Output Dir</label>
                    <input
                      type="text"
                      value={outputDir}
                      onChange={(e) => setOutputDir(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-[#2a2a2a] text-indigo-600 dark:text-indigo-400 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Build Command</label>
                  <input
                    type="text"
                    value={buildCommand}
                    onChange={(e) => setBuildCommand(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-[#2a2a2a] text-orange-400 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Install Command</label>
                  <input
                    type="text"
                    value={installCommand}
                    onChange={(e) => setInstallCommand(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-[#2a2a2a] text-purple-400 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Deploy Result */}
            {deployResult && (
              <div className={`p-4 rounded-lg border ${deployResult.success
                ? 'border-violet-500/30 bg-green-500/10'
                : 'border-red-500/30 bg-red-500/10'
                }`}>
                {deployResult.success ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Deployment Successful!</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={deployResult.url}
                        readOnly
                        className="flex-1 px-3 py-2 rounded bg-white dark:bg-[#0a0a0a] border border-violet-500/30 text-slate-900 dark:text-white text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(deployResult.url!)}
                        className="p-2 rounded bg-green-500/20 text-violet-600 dark:text-violet-400 hover:bg-green-500/30 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <a
                        href={deployResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded bg-green-500/20 text-violet-600 dark:text-violet-400 hover:bg-green-500/30 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-red-400">
                    <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{deployResult.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="h-full">
            <div className="bg-slate-50 dark:bg-[#0d0d0d] rounded-lg border border-[#1c1c1c] p-4 h-full overflow-auto font-mono text-xs">
              {deployLogs.length === 0 ? (
                <p className="text-gray-500">No deployment logs yet. Start a deployment to see logs.</p>
              ) : (
                <div className="space-y-1">
                  {deployLogs.map((log, index) => (
                    <div key={index} className={`${log.includes('❌') ? 'text-red-400' :
                      log.includes('✅') ? 'text-violet-600 dark:text-violet-400' :
                        log.includes('🌐') ? 'text-indigo-600 dark:text-indigo-400' :
                          'text-slate-700 dark:text-slate-300'
                      }`}>
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Environment Variables Tab */}
        {activeTab === 'env' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-[#1c1c1c] bg-slate-50 dark:bg-[#0d0d0d]">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-3">Environment Variables</h3>

              {/* Add new env var */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newEnvKey}
                  onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
                  placeholder="KEY"
                  className="flex-1 px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-[#2a2a2a] text-slate-900 dark:text-white text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={newEnvValue}
                  onChange={(e) => setNewEnvValue(e.target.value)}
                  placeholder="value"
                  className="flex-1 px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-[#2a2a2a] text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={addEnvVar}
                  disabled={!newEnvKey.trim()}
                  className="px-4 py-2 rounded bg-cyan-500 text-slate-900 dark:text-white text-sm font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Env vars list */}
              {envVars.length === 0 ? (
                <p className="text-xs text-gray-500">No environment variables added yet.</p>
              ) : (
                <div className="space-y-2">
                  {envVars.map((env, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded bg-slate-100 dark:bg-[#1a1a1a]">
                      <span className="text-indigo-600 dark:text-indigo-400 text-sm font-mono">{env.key}</span>
                      <span className="text-gray-500">=</span>
                      <span className="flex-1 text-slate-700 dark:text-slate-300 text-sm font-mono truncate">
                        {env.isSecret ? '••••••••' : env.value}
                      </span>
                      <button
                        onClick={() => removeEnvVar(index)}
                        className="p-1 rounded hover:bg-red-500/20 text-slate-500 dark:text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="p-4 rounded-lg border border-[#1c1c1c] bg-slate-50 dark:bg-[#0d0d0d]">
            <p className="text-xs text-gray-500 text-center py-8">
              Deployment history will appear here after your first deployment.
            </p>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-3">
            {[
              { id: 'build', label: 'Build', command: buildCommand, icon: '🔨' },
              { id: 'test', label: 'Run Tests', command: 'npm test', icon: '🧪' },
              { id: 'lint', label: 'Lint', command: 'npm run lint', icon: '📋' },
            ].map(task => (
              <button
                key={task.id}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-[#1c1c1c] bg-slate-50 dark:bg-[#0d0d0d] hover:border-indigo-500/50 transition-all text-left group"
              >
                <span className="text-xl">{task.icon}</span>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:text-indigo-400 transition-colors">
                    {task.label}
                  </h4>
                  <p className="text-xs text-gray-500 font-mono">{task.command}</p>
                </div>
                <Zap className="w-4 h-4 text-gray-500 group-hover:text-indigo-600 dark:text-indigo-400 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Deploy Button */}
      {activeTab === 'deploy' && (
        <div className="p-4 border-t border-[#1c1c1c] bg-slate-50 dark:bg-[#0d0d0d]">
          <button
            onClick={handleDeploy}
            disabled={isDeploying || !hasCredential(selectedProvider)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all ${isDeploying
              ? 'bg-gray-600 text-slate-700 dark:text-slate-300 cursor-not-allowed'
              : provider?.id === 'mumtazai'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-slate-900 dark:text-white hover:from-cyan-400 hover:to-purple-400'
                : 'bg-cyan-500 text-slate-900 dark:text-white hover:bg-cyan-400'
              }`}
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                Deploy to {provider?.name}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default DeployPanel;
