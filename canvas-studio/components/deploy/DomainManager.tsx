/**
 * DomainManager — Custom domain configuration
 * Manage domains, DNS records, SSL status
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Plus,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';

type SSLStatus = 'active' | 'pending' | 'error' | 'none';
type DNSStatus = 'verified' | 'pending' | 'error';

export interface CustomDomain {
  id: string;
  domain: string;
  sslStatus: SSLStatus;
  dnsStatus: DNSStatus;
  isPrimary: boolean;
  addedAt: string;
  dnsRecords?: { type: string; name: string; value: string }[];
}

interface DomainManagerProps {
  domains: CustomDomain[];
  onAdd: (domain: string) => void;
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
  onRefreshDNS: (id: string) => void;
  className?: string;
}

const sslConfig: Record<SSLStatus, { icon: React.FC<any>; color: string; label: string }> = {
  active: { icon: ShieldCheck, color: 'text-violet-400', label: 'SSL Active' },
  pending: { icon: Shield, color: 'text-amber-400', label: 'SSL Pending' },
  error: { icon: ShieldAlert, color: 'text-red-400', label: 'SSL Error' },
  none: { icon: Shield, color: 'text-slate-500', label: 'No SSL' },
};

const dnsColor: Record<DNSStatus, string> = {
  verified: 'text-violet-400',
  pending: 'text-amber-400',
  error: 'text-red-400',
};

const DomainManager: React.FC<DomainManagerProps> = ({
  domains,
  onAdd,
  onRemove,
  onSetPrimary,
  onRefreshDNS,
  className = '',
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newDomain.trim()) return;
    onAdd(newDomain.trim().toLowerCase());
    setNewDomain('');
    setShowAddForm(false);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className={`flex flex-col bg-[#0a0a0c] rounded-xl border border-slate-200 dark:border-white/[0.06] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-[#111113] border-b border-slate-200 dark:border-white/[0.06] flex items-center gap-2">
        <Globe className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm text-slate-800 dark:text-slate-200 font-medium">Custom Domains</h3>
        <span className="text-[10px] text-slate-600">({domains.length})</span>
        <div className="flex-1" />
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gradient-to-r from-violet-500/20 to-violet-500/20 text-violet-300 border border-violet-500/20 hover:border-violet-500/40 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Domain
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-slate-200 dark:border-white/[0.06] overflow-hidden"
          >
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  className="flex-1 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 font-mono placeholder-gray-600 outline-none focus:border-violet-500/30"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  autoFocus
                />
                <button
                  onClick={handleAdd}
                  disabled={!newDomain.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-500 to-violet-500 text-slate-900 dark:text-white disabled:opacity-30 hover:opacity-90 transition-opacity"
                >
                  Add
                </button>
              </div>
              <p className="text-[10px] text-slate-600">
                You'll need to configure DNS records after adding the domain
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Domain list */}
      <div className="divide-y divide-white/[0.04]">
        {domains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-600 gap-2">
            <Globe className="w-6 h-6 opacity-40" />
            <span className="text-xs">No custom domains configured</span>
          </div>
        ) : (
          domains.map((domain) => {
            const ssl = sslConfig[domain.sslStatus];
            const SSLIcon = ssl.icon;
            const isExpanded = expandedId === domain.id;

            return (
              <div key={domain.id}>
                <div
                  className="px-4 py-3 hover:bg-white/[0.02] cursor-pointer group"
                  onClick={() => setExpandedId(isExpanded ? null : domain.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Expand chevron */}
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                    )}

                    {/* Domain name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-800 dark:text-slate-200 font-mono">{domain.domain}</span>
                        {domain.isPrimary && (
                          <span className="px-1.5 py-0 rounded text-[9px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className={`text-[10px] flex items-center gap-1 ${ssl.color}`}>
                          <SSLIcon className="w-3 h-3" />
                          {ssl.label}
                        </span>
                        <span className={`text-[10px] flex items-center gap-1 ${dnsColor[domain.dnsStatus]}`}>
                          DNS: {domain.dnsStatus}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRefreshDNS(domain.id);
                        }}
                        className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        title="Refresh DNS"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                      <a
                        href={`https://${domain.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {!domain.isPrimary && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(domain.id);
                          }}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* DNS Records */}
                <AnimatePresence>
                  {isExpanded && domain.dnsRecords && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mx-4 mb-3 p-3 bg-slate-50 dark:bg-white/[0.02] rounded-lg border border-slate-200 dark:border-white/[0.06]">
                        <h4 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                          DNS Records
                        </h4>
                        <div className="space-y-2">
                          {domain.dnsRecords.map((record, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-[11px] font-mono"
                            >
                              <span className="w-12 text-violet-400/70 shrink-0">
                                {record.type}
                              </span>
                              <span className="text-slate-600 dark:text-slate-400 truncate flex-1">
                                {record.name}
                              </span>
                              <span className="text-slate-500 truncate flex-1">
                                {record.value}
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(record.value, `${domain.id}-${i}`)
                                }
                                className="p-0.5 text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 transition-colors shrink-0"
                              >
                                {copiedField === `${domain.id}-${i}` ? (
                                  <Check className="w-3 h-3 text-violet-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>

                        {!domain.isPrimary && (
                          <button
                            onClick={() => onSetPrimary(domain.id)}
                            className="mt-3 w-full py-1.5 rounded-lg text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
                          >
                            Set as Primary Domain
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DomainManager;
