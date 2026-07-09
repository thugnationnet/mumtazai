'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Network, ArrowLeft, Calculator, Copy, Check, Download, Info, ChevronDown, ChevronUp } from 'lucide-react'

function ipToNum(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
}

function numToIp(num: number): string {
  return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.')
}

interface SubnetResult {
  networkAddress: string
  broadcastAddress: string
  subnetMask: string
  wildcardMask: string
  firstHost: string
  lastHost: string
  totalHosts: number
  usableHosts: number
  cidr: number
  ipClass: string
  isPrivate: boolean
  binaryMask: string
  hexMask: string
  networkBinary: string
}

function calculateSubnet(ip: string, cidr: number): SubnetResult {
  const ipNum = ipToNum(ip)
  const maskNum = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0
  const wildcardNum = (~maskNum) >>> 0
  const networkNum = (ipNum & maskNum) >>> 0
  const broadcastNum = (networkNum | wildcardNum) >>> 0
  const totalHosts = Math.pow(2, 32 - cidr)
  const usableHosts = cidr >= 31 ? (cidr === 32 ? 1 : 2) : totalHosts - 2

  const firstOctet = parseInt(ip.split('.')[0])
  let ipClass = 'E'
  if (firstOctet < 128) ipClass = 'A'
  else if (firstOctet < 192) ipClass = 'B'
  else if (firstOctet < 224) ipClass = 'C'
  else if (firstOctet < 240) ipClass = 'D'

  const isPrivate = (
    (firstOctet === 10) ||
    (firstOctet === 172 && parseInt(ip.split('.')[1]) >= 16 && parseInt(ip.split('.')[1]) <= 31) ||
    (firstOctet === 192 && parseInt(ip.split('.')[1]) === 168)
  )

  const binaryMask = maskNum.toString(2).padStart(32, '0').match(/.{8}/g)!.join('.')
  const hexMask = '0x' + maskNum.toString(16).padStart(8, '0').toUpperCase()
  const networkBinary = networkNum.toString(2).padStart(32, '0').match(/.{8}/g)!.join('.')

  return {
    networkAddress: numToIp(networkNum),
    broadcastAddress: numToIp(broadcastNum),
    subnetMask: numToIp(maskNum),
    wildcardMask: numToIp(wildcardNum),
    firstHost: cidr >= 31 ? numToIp(networkNum) : numToIp(networkNum + 1),
    lastHost: cidr >= 31 ? numToIp(broadcastNum) : numToIp(broadcastNum - 1),
    totalHosts, usableHosts, cidr, ipClass, isPrivate, binaryMask, hexMask, networkBinary,
  }
}

const SAMPLES = [
  { ip: '192.168.1.0', cidr: 24, label: 'Home network /24' },
  { ip: '10.0.0.0', cidr: 8, label: 'Class A private' },
  { ip: '172.16.0.0', cidr: 12, label: 'Class B private' },
  { ip: '192.168.10.0', cidr: 28, label: 'Small office /28' },
  { ip: '10.10.0.0', cidr: 16, label: 'Corporate /16' },
]

export default function SubnetCalculatorPage() {
  const [ip, setIp] = useState('192.168.1.0')
  const [cidr, setCidr] = useState(24)
  const [result, setResult] = useState<SubnetResult | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [history, setHistory] = useState<{ ip: string; cidr: number; network: string }[]>([])
  const [showInfo, setShowInfo] = useState(false)

  const calculate = () => {
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) return
    const r = calculateSubnet(ip, cidr)
    setResult(r)
    setHistory(prev => [{ ip, cidr, network: r.networkAddress }, ...prev.filter(h => !(h.ip === ip && h.cidr === cidr))].slice(0, 15))
  }

  const copyField = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(label)
    setTimeout(() => setCopiedField(null), 1200)
  }

  const exportTxt = () => {
    if (!result) return
    const lines = resultRows.map(r => `${r.label}: ${r.value}`).join('\n')
    const blob = new Blob([lines], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `subnet-${result.networkAddress}-${result.cidr}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  const resultRows = result ? [
    { label: 'Network Address', value: result.networkAddress, color: 'text-blue-600' },
    { label: 'Broadcast Address', value: result.broadcastAddress, color: 'text-purple-600' },
    { label: 'Subnet Mask', value: result.subnetMask, color: 'text-green-600' },
    { label: 'Wildcard Mask', value: result.wildcardMask, color: 'text-amber-600' },
    { label: 'First Usable Host', value: result.firstHost, color: 'text-cyan-600' },
    { label: 'Last Usable Host', value: result.lastHost, color: 'text-cyan-600' },
    { label: 'Total Addresses', value: result.totalHosts.toLocaleString() },
    { label: 'Usable Hosts', value: result.usableHosts.toLocaleString() },
    { label: 'CIDR Notation', value: `${result.networkAddress}/${result.cidr}` },
    { label: 'IP Class', value: `Class ${result.ipClass}` },
    { label: 'Private IP', value: result.isPrivate ? 'Yes (RFC 1918)' : 'No (Public)' },
    { label: 'Hex Mask', value: result.hexMask },
    { label: 'Binary Mask', value: result.binaryMask },
    { label: 'Network (Binary)', value: result.networkBinary },
  ] : []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 py-12">
        <div className="container-custom">
          <Link href="/tools" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to Tools
          </Link>
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <Network className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Subnet <span className="text-blue-100">Calculator</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Calculate subnet masks, network ranges, and host counts</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Input */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold text-gray-700 mb-2">IP Address</label>
                <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} onKeyDown={e => e.key === 'Enter' && calculate()} placeholder="192.168.1.0" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="w-24">
                <label className="block text-sm font-semibold text-gray-700 mb-2">CIDR</label>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">/</span>
                  <input type="number" min={0} max={32} value={cidr} onChange={(e) => setCidr(parseInt(e.target.value) || 0)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-3 text-gray-900 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <button onClick={calculate} className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors font-semibold flex items-center gap-2">
                <Calculator className="w-4 h-4" />Calculate
              </button>
            </div>
            {/* CIDR shortcuts */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[8, 16, 20, 24, 25, 26, 27, 28, 29, 30, 32].map(c => (
                <button key={c} onClick={() => { setCidr(c); }} className={`px-2 py-1 rounded text-xs font-mono transition-colors ${cidr === c ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>/{c}</button>
              ))}
            </div>
            {/* Samples */}
            <div className="mt-3 flex flex-wrap gap-2">
              {SAMPLES.map(s => (
                <button key={s.label} onClick={() => { setIp(s.ip); setCidr(s.cidr); setResult(calculateSubnet(s.ip, s.cidr)); }} className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs transition-colors">{s.label}</button>
              ))}
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Results</h3>
                <div className="flex gap-2">
                  <button onClick={() => { const txt = resultRows.map(r => r.value).join('\n'); navigator.clipboard.writeText(txt) }} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1.5 text-xs">
                    <Copy className="w-3.5 h-3.5" />Copy All
                  </button>
                  <button onClick={exportTxt} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1.5 text-xs">
                    <Download className="w-3.5 h-3.5" />Export
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {resultRows.map(row => (
                  <div key={row.label} onClick={() => copyField(row.label, row.value)} className="flex items-center justify-between py-2 px-2 border-b border-gray-100 hover:bg-gray-50 rounded cursor-pointer group transition-colors">
                    <span className="text-sm text-gray-600">{row.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold font-mono ${row.color || 'text-gray-900'}`}>{row.value}</span>
                      {copiedField === row.label ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />}
                    </div>
                  </div>
                ))}
              </div>

              {/* Visual range bar */}
              <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">IP Range Visualization</div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-blue-600">{result.networkAddress}</span>
                  <div className="flex-1 h-3 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 rounded-full relative">
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                  <span className="text-purple-600">{result.broadcastAddress}</span>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>First: {result.firstHost}</span>
                  <span>{result.usableHosts.toLocaleString()} usable hosts</span>
                  <span>Last: {result.lastHost}</span>
                </div>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Lookups</h3>
              <div className="flex flex-wrap gap-2">
                {history.map((h, i) => (
                  <button key={i} onClick={() => { setIp(h.ip); setCidr(h.cidr); setResult(calculateSubnet(h.ip, h.cidr)); }} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono text-gray-700 transition-colors">{h.ip}/{h.cidr}</button>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
            <button onClick={() => setShowInfo(!showInfo)} className="w-full flex items-center justify-between p-6">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Info className="w-4 h-4" />About Subnetting</h3>
              {showInfo ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showInfo && (
              <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: 'CIDR Notation', desc: 'Classless Inter-Domain Routing uses /prefix to denote the number of network bits (e.g. /24 = 256 addresses).' },
                  { title: 'Subnet Mask', desc: 'A 32-bit mask separating the network portion from the host portion. /24 = 255.255.255.0.' },
                  { title: 'Wildcard Mask', desc: 'Inverse of the subnet mask, used in ACLs and OSPF configs. /24 wildcard = 0.0.0.255.' },
                  { title: 'Private Ranges', desc: '10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 are reserved for private networks (RFC 1918).' },
                ].map(c => (
                  <div key={c.title} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="font-semibold text-gray-900 text-sm">{c.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{c.desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
