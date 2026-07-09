'use client'

import { useState } from 'react'
import { ArrowLeft, Network, Loader2, XCircle, Globe, Building2, Calendar, Server, MapPin, Hash } from 'lucide-react'
import Link from 'next/link'

interface NetblockData {
  ip: string;
  range: string;
  rangeStart: string;
  rangeEnd: string;
  rangeSize: number;
  netname: string;
  nethandle: string;
  nettype: string;
  cidr: string;
  parent?: string;
  organization: string;
  orgId: string;
  country: string;
  city?: string;
  updated: string;
  created: string;
  description: string;
  source: string;
  status: string;
  as: {
    asn: string;
    name: string;
    route: string;
    domain: string;
    type?: string;
  };
  abuseContact?: {
    email: string;
    phone: string;
    role: string;
  } | null;
  adminContact?: {
    email: string;
    role: string;
  } | null;
  totalNetblocks: number;
  allNetblocks: Array<{
    range: string;
    netname: string;
    organization: string;
    cidr: string;
    size: number;
    asn?: string;
    asnName?: string;
  }>;
}

export default function IPNetblocksPage() {
  const [ip, setIp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<NetblockData | null>(null)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ip.trim()) {
      setError('Please enter an IP address')
      return
    }

    setLoading(true)
    setError('')
    setData(null)

    try {
      const response = await fetch('/api/tools/ip-netblocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: ip.trim() })
      })

      const result = await response.json()
      if (!result.success) {
        setError(result.error || 'Failed to lookup IP netblocks')
        return
      }
      setData(result.data)
    } catch (err) {
      setError('An error occurred while looking up IP netblocks')
    } finally {
      setLoading(false)
    }
  }

  const formatSize = (size: number) => {
    if (!size || size === 0) return 'N/A'
    if (size >= 1000000) return `${(size / 1000000).toFixed(1)}M IPs`
    if (size >= 1000) return `${(size / 1000).toFixed(1)}K IPs`
    return `${size} IPs`
  }

  const InfoCard = ({ icon: Icon, label, value, highlight = false }: { icon: any; label: string; value: string | number; highlight?: boolean }) => (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className={`text-lg ${highlight ? 'font-mono text-blue-600' : 'text-gray-900'}`}>
        {value || 'N/A'}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 py-12">
        <div className="container-custom">
          <Link href="/tools" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Network Tools
          </Link>
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <Network className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              IP <span className="text-blue-100">Netblocks</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Get IP range, network block, and organization information
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-12">
        {/* Search Form */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleLookup} className="relative">
            <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
              <Network className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="Enter IP address (e.g., 8.8.8.8)"
                className="w-full pl-12 pr-36 py-4 bg-white border-0 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-0 transition-all outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !ip.trim()}
                className="absolute right-4 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:from-gray-400 disabled:to-gray-400 rounded-lg font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:cursor-not-allowed"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Looking...</> : <><Network className="w-4 h-4" />Lookup</>}
              </button>
            </div>
          </form>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {data && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Main Netblock Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Network className="w-5 h-5 text-blue-600" />
                Netblock Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard icon={Globe} label="IP Address" value={data.ip} highlight />
                <InfoCard icon={Network} label="IP Range" value={data.range} highlight />
                <InfoCard icon={Hash} label="CIDR" value={data.cidr} highlight />
                <InfoCard icon={Server} label="Range Size" value={formatSize(data.rangeSize)} />
                <InfoCard icon={Server} label="Network Name" value={data.netname} />
                <InfoCard icon={Server} label="Network Type" value={data.nettype} />
                <InfoCard icon={Server} label="Network Handle" value={data.nethandle} />
                <InfoCard icon={Server} label="Status" value={data.status} />
              </div>
            </div>

            {/* Organization Info */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-500" />
                Organization
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard icon={Building2} label="Organization" value={data.organization} />
                <InfoCard icon={Hash} label="Org ID" value={data.orgId} />
                <InfoCard icon={MapPin} label="Country" value={data.country} />
                <InfoCard icon={Server} label="Source" value={data.source} />
              </div>
              {data.description && data.description !== 'N/A' && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Description</div>
                  <div className="text-gray-900">{data.description}</div>
                </div>
              )}
            </div>

            {/* ASN Info */}
            {data.as && data.as.asn !== 'N/A' && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-500" />
                  ASN Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoCard icon={Hash} label="ASN" value={data.as.asn} highlight />
                  <InfoCard icon={Building2} label="ASN Name" value={data.as.name} />
                  <InfoCard icon={Network} label="Route" value={data.as.route} />
                  <InfoCard icon={Globe} label="Domain" value={data.as.domain} />
                  {data.as.type && <InfoCard icon={Server} label="Type" value={data.as.type} />}
                </div>
              </div>
            )}

            {/* Abuse Contact */}
            {data.abuseContact && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  Abuse Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InfoCard icon={Building2} label="Role" value={data.abuseContact.role} />
                  <InfoCard icon={Globe} label="Email" value={data.abuseContact.email} />
                  <InfoCard icon={Server} label="Phone" value={data.abuseContact.phone} />
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                Registration Dates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard icon={Calendar} label="Created" value={data.created} />
                <InfoCard icon={Calendar} label="Last Updated" value={data.updated} />
              </div>
            </div>

            {/* All Netblocks */}
            {data.allNetblocks && data.allNetblocks.length > 1 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Network className="w-5 h-5 text-blue-500" />
                  Related Netblocks ({data.totalNetblocks} total)
                </h3>
                <div className="space-y-3">
                  {data.allNetblocks.map((nb, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                          <span className="text-sm text-gray-500 block">Range</span>
                          <span className="font-mono text-blue-600">{nb.range || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 block">CIDR</span>
                          <span className="font-mono text-gray-900">{nb.cidr || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 block">Name</span>
                          <span className="text-gray-900">{nb.netname || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 block">Size</span>
                          <span className="text-gray-900">{formatSize(nb.size)}</span>
                        </div>
                        {nb.asn && nb.asn !== 'N/A' && (
                          <div>
                            <span className="text-sm text-gray-500 block">ASN</span>
                            <span className="text-green-600">{nb.asn}</span>
                          </div>
                        )}
                        {nb.asnName && nb.asnName !== 'N/A' && (
                          <div>
                            <span className="text-sm text-gray-500 block">ASN Name</span>
                            <span className="text-gray-900">{nb.asnName}</span>
                          </div>
                        )}
                      </div>
                      {nb.organization && nb.organization !== 'N/A' && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <span className="text-sm text-gray-500">Organization: </span>
                          <span className="text-gray-900">{nb.organization}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Card */}
        {!data && !loading && (
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About IP Netblocks</h3>
              <div className="space-y-3 text-gray-600">
                <p>Get comprehensive information about IP address ranges. Perfect for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Network administration and planning</li>
                  <li>Security research and threat analysis</li>
                  <li>Understanding IP address allocation</li>
                  <li>Identifying network ownership</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
