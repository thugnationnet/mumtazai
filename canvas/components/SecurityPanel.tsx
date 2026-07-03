import React from 'react';
import ToolExecutionPanel, { ToolDefinition } from './ToolExecutionPanel';
import { PreviewContent } from './PanelPreview';

const TOOLS: ToolDefinition[] = [
  {
    id: 'crypto_hash',
    icon: '🔐',
    label: 'Hash & Checksum',
    desc: 'Generate hashes: MD5, SHA-1, SHA-256, SHA-512, bcrypt, argon2. Verify file checksums.',
    color: 'rose',
    fields: [
      { key: 'input', type: 'textarea', label: 'Input Text or File Path', placeholder: 'Text to hash or ./file.bin', required: true },
      { key: 'algorithm', type: 'select', label: 'Algorithm', options: ['md5','sha1','sha256','sha512','sha3-256','bcrypt','argon2','blake2','crc32'], default: 'sha256', required: true },
      { key: 'encoding', type: 'select', label: 'Output Encoding', options: ['hex','base64','binary'], default: 'hex' },
      { key: 'verify', type: 'text', label: 'Verify Against (optional)', placeholder: 'Expected hash to compare' },
    ],
    buildInput: (v) => ({ input: v.input, algorithm: v.algorithm, encoding: v.encoding, verify: v.verify }),
  },
  {
    id: 'crypto_encrypt',
    icon: '🔒',
    label: 'Encrypt / Decrypt',
    desc: 'Symmetric and asymmetric encryption: AES-256, RSA, ChaCha20. Encrypt files, strings, or data.',
    color: 'red',
    fields: [
      { key: 'operation', type: 'select', label: 'Operation', options: ['encrypt','decrypt'], default: 'encrypt', required: true },
      { key: 'algorithm', type: 'select', label: 'Algorithm', options: ['aes-256-gcm','aes-256-cbc','aes-128-gcm','chacha20-poly1305','rsa-oaep'], default: 'aes-256-gcm' },
      { key: 'input', type: 'textarea', label: 'Input Data', placeholder: 'Text to encrypt or ciphertext to decrypt', required: true },
      { key: 'key', type: 'text', label: 'Key / Password', placeholder: 'Encryption key or passphrase', required: true },
      { key: 'encoding', type: 'select', label: 'Output Encoding', options: ['base64','hex','raw'], default: 'base64' },
    ],
    buildInput: (v) => ({ operation: v.operation, algorithm: v.algorithm, input: v.input, key: v.key, encoding: v.encoding }),
  },
  {
    id: 'crypto_sign',
    icon: '✍️',
    label: 'Sign / Verify',
    desc: 'Digital signatures: generate keypairs, sign data, verify signatures. RSA, ECDSA, Ed25519.',
    color: 'amber',
    fields: [
      { key: 'operation', type: 'select', label: 'Operation', options: ['generate_keypair','sign','verify'], default: 'generate_keypair', required: true },
      { key: 'algorithm', type: 'select', label: 'Algorithm', options: ['rsa-2048','rsa-4096','ecdsa-p256','ecdsa-p384','ed25519'], default: 'ed25519' },
      { key: 'data', type: 'textarea', label: 'Data to Sign/Verify', placeholder: 'Message or data...' },
      { key: 'private_key', type: 'textarea', label: 'Private Key (for signing)', placeholder: '-----BEGIN PRIVATE KEY-----' },
      { key: 'public_key', type: 'textarea', label: 'Public Key (for verification)', placeholder: '-----BEGIN PUBLIC KEY-----' },
      { key: 'signature', type: 'text', label: 'Signature (for verification)', placeholder: 'Base64 signature' },
    ],
    buildInput: (v) => ({ operation: v.operation, algorithm: v.algorithm, data: v.data, private_key: v.private_key, public_key: v.public_key, signature: v.signature }),
  },
  {
    id: 'scan_secrets',
    icon: '🕵️',
    label: 'Secret Scanner',
    desc: 'Scan code for leaked secrets: API keys, tokens, passwords, certificates. Supports 100+ patterns.',
    color: 'orange',
    fields: [
      { key: 'path', type: 'text', label: 'Scan Path', placeholder: './src or ./config', required: true },
      { key: 'patterns', type: 'select', label: 'Pattern Set', options: ['all','api_keys','tokens','passwords','certificates','aws','gcp','azure','github','stripe'], default: 'all' },
      { key: 'recursive', type: 'checkbox', label: 'Recursive Scan', default: true },
      { key: 'exclude', type: 'text', label: 'Exclude Patterns', placeholder: 'node_modules,dist,.git' },
      { key: 'format', type: 'select', label: 'Output Format', options: ['text','json','sarif','table'], default: 'table' },
    ],
    buildInput: (v) => ({ path: v.path, patterns: v.patterns, recursive: v.recursive === 'true' || v.recursive === true, exclude: v.exclude, format: v.format }),
  },
  {
    id: 'scan_malware',
    icon: '🛡️',
    label: 'Vulnerability Scanner',
    desc: 'Scan dependencies for known vulnerabilities. npm audit, Snyk-style checks, CVE lookup, SBOM.',
    color: 'purple',
    fields: [
      { key: 'path', type: 'text', label: 'Project Path', placeholder: './', required: true },
      { key: 'type', type: 'select', label: 'Scan Type', options: ['dependencies','code','container','full','sbom'], default: 'dependencies', required: true },
      { key: 'severity', type: 'select', label: 'Min Severity', options: ['info','low','medium','high','critical'], default: 'medium' },
      { key: 'fix', type: 'checkbox', label: 'Auto-fix Available Issues', default: false },
      { key: 'format', type: 'select', label: 'Output Format', options: ['text','json','sarif','html','table'], default: 'table' },
    ],
    buildInput: (v) => ({ path: v.path, type: v.type, severity: v.severity, fix: v.fix === 'true' || v.fix === true, format: v.format }),
  },
  {
    id: 'auth_generate',
    icon: '🔑',
    label: 'Auth Token Generator',
    desc: 'Generate JWT, API keys, passwords, TOTP secrets, OAuth tokens, session IDs, and UUIDs.',
    color: 'emerald',
    fields: [
      { key: 'type', type: 'select', label: 'Token Type', options: ['jwt','api_key','password','totp_secret','uuid','nanoid','session_id','oauth_state','csrf_token'], default: 'jwt', required: true },
      { key: 'payload', type: 'textarea', label: 'Payload / Options (JSON)', placeholder: '{"sub": "user123", "exp": "1h"}' },
      { key: 'secret', type: 'text', label: 'Secret Key (for JWT/HMAC)', placeholder: 'your-secret-key' },
      { key: 'length', type: 'number', label: 'Length (for passwords/keys)', placeholder: '32', default: 32 },
      { key: 'count', type: 'number', label: 'Count', placeholder: '1', default: 1 },
    ],
    buildInput: (v) => ({ type: v.type, payload: v.payload, secret: v.secret, length: Number(v.length) || 32, count: Number(v.count) || 1 }),
  },
];

interface Props {
  onClose?: () => void;
  onRunTool: (message: string) => void;
  onPreviewContent?: (c: PreviewContent) => void;
}

const SecurityPanel: React.FC<Props> = ({ onClose, onRunTool, onPreviewContent }) => (
  <ToolExecutionPanel
    categoryTitle="Security & Crypto"
    categorySubtitle="Crypto, Secrets, Scanning & Auth"
    categoryColor="rose"
    tools={TOOLS}
    onClose={onClose}
    onRunTool={onRunTool}
    onPreviewContent={onPreviewContent}
  />
);

export default SecurityPanel;
