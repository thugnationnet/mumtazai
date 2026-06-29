/**
 * SECURITY TOOLS
 * 6 tools: crypto_hash, crypto_encrypt, crypto_sign, scan_secrets, scan_malware, auth_generate
 */

import crypto from 'crypto';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const SECURITY_TOOL_DEFINITIONS = [
  {
    name: 'crypto_hash',
    description: 'Hash data using SHA-256, SHA-512, MD5, or bcrypt-style (SHA-256 with salt).',
    input_schema: {
      type: 'object',
      properties: {
        data:      { type: 'string', description: 'Data to hash' },
        algorithm: { type: 'string', enum: ['sha256', 'sha512', 'md5', 'sha1'],
                     description: 'Hash algorithm (default: sha256)' },
        encoding:  { type: 'string', enum: ['hex', 'base64'], description: 'Output encoding (default: hex)' },
        salt:      { type: 'string', description: 'Optional salt to prepend to data before hashing' },
      },
      required: ['data'],
    },
  },
  {
    name: 'crypto_encrypt',
    description: 'Encrypt or decrypt data using AES-256-GCM.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['encrypt', 'decrypt'], description: 'Operation to perform' },
        data:      { type: 'string', description: 'Plaintext to encrypt or ciphertext to decrypt' },
        key:       { type: 'string', description: '32-byte hex key (auto-generated if not provided)' },
        iv:        { type: 'string', description: '16-byte hex IV (auto-generated if not provided, returned in output)' },
      },
      required: ['operation', 'data'],
    },
  },
  {
    name: 'crypto_sign',
    description: 'Create or verify HMAC-SHA256 signatures.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['sign', 'verify'], description: 'Operation' },
        data:      { type: 'string', description: 'Data to sign or verify' },
        key:       { type: 'string', description: 'Secret key for HMAC' },
        signature: { type: 'string', description: 'Signature to verify (for verify operation)' },
      },
      required: ['operation', 'data', 'key'],
    },
  },
  {
    name: 'scan_secrets',
    description: 'Scan files for exposed API keys, tokens, credentials, and secrets.',
    input_schema: {
      type: 'object',
      properties: {
        path:     { type: 'string', description: 'File or directory to scan' },
        patterns: { type: 'array', items: { type: 'string' },
                    description: 'Additional regex patterns to search for (optional)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'scan_malware',
    description: 'Scan a file for known malicious patterns and suspicious content.',
    input_schema: {
      type: 'object',
      properties: {
        path:    { type: 'string', description: 'File path to scan' },
        content: { type: 'string', description: 'File content to scan (alternative to path)' },
      },
      required: [],
    },
  },
  {
    name: 'auth_generate',
    description: 'Generate JWT tokens, OAuth tokens, API keys, or secure random secrets.',
    input_schema: {
      type: 'object',
      properties: {
        type:    { type: 'string', enum: ['jwt', 'api_key', 'secret', 'token'],
                   description: 'Type of auth credential to generate' },
        payload: { type: 'object', description: 'JWT payload data (for jwt type)' },
        secret:  { type: 'string', description: 'JWT signing secret (auto-generated if not provided)' },
        expires: { type: 'string', description: 'JWT expiration (e.g. "7d", "1h", default: "24h")' },
        length:  { type: 'number', description: 'Length in bytes for random token/key (default: 32)' },
      },
      required: ['type'],
    },
  },
];

// ============================================================================
// EXECUTORS
// ============================================================================

// Secret patterns to scan for
const SECRET_PATTERNS = [
  { name: 'AWS Access Key',    pattern: /AKIA[0-9A-Z]{16}/g },
  { name: 'AWS Secret Key',    pattern: /aws_secret.*?=\s*['"]?([A-Za-z0-9/+=]{40})/gi },
  { name: 'GitHub Token',      pattern: /gh[pousr]_[A-Za-z0-9_]{36,251}/g },
  { name: 'OpenAI Key',        pattern: /sk-[A-Za-z0-9]{48}/g },
  { name: 'Stripe Key',        pattern: /sk_(test|live)_[A-Za-z0-9]{24,}/g },
  { name: 'Google API Key',    pattern: /AIza[0-9A-Za-z\-_]{35}/g },
  { name: 'Private Key Block', pattern: /-----BEGIN (RSA |EC |OPENSSH |)?PRIVATE KEY/g },
  { name: 'Generic Secret',    pattern: /(?:secret|password|passwd|api_key|apikey)\s*[:=]\s*['"]?[^\s'"]{8,}/gi },
];

function generateJWT(payload, secret, expiresIn = '24h') {
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp     = Math.floor(Date.now() / 1000) + parseDuration(expiresIn);
  const fullPay = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp })).toString('base64url');
  const sig     = crypto.createHmac('sha256', secret).update(`${header}.${fullPay}`).digest('base64url');
  return `${header}.${fullPay}.${sig}`;
}

function parseDuration(d) {
  const m = d.match(/^(\d+)([smhd])$/);
  if (!m) return 86400;
  const v = parseInt(m[1]);
  const map = { s: 1, m: 60, h: 3600, d: 86400 };
  return v * (map[m[2]] || 86400);
}

export async function executeSecurityTool(toolName, input, ctx = {}) {
  const root = ctx.workspaceRoot || process.cwd();

  try {
    switch (toolName) {
      case 'crypto_hash': {
        const alg  = input.algorithm || 'sha256';
        const enc  = input.encoding  || 'hex';
        const data = (input.salt || '') + input.data;
        const hash = crypto.createHash(alg).update(data).digest(enc);
        return { result: JSON.stringify({ status: 'success', algorithm: alg, encoding: enc, hash }) };
      }

      case 'crypto_encrypt': {
        if (input.operation === 'encrypt') {
          const key = input.key ? Buffer.from(input.key, 'hex') : crypto.randomBytes(32);
          const iv  = crypto.randomBytes(12);
          const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
          const encrypted = Buffer.concat([cipher.update(input.data, 'utf8'), cipher.final()]);
          const tag = cipher.getAuthTag();
          return { result: JSON.stringify({
            status: 'success',
            ciphertext: Buffer.concat([encrypted, tag]).toString('base64'),
            key:  key.toString('hex'),
            iv:   iv.toString('hex'),
            note: 'Keep the key and IV safe — required for decryption',
          }) };
        } else {
          if (!input.key || !input.iv) throw new Error('key and iv required for decryption');
          const key        = Buffer.from(input.key, 'hex');
          const iv         = Buffer.from(input.iv, 'hex');
          const cipherbuf  = Buffer.from(input.data, 'base64');
          const tag        = cipherbuf.slice(-16);
          const encrypted  = cipherbuf.slice(0, -16);
          const decipher   = crypto.createDecipheriv('aes-256-gcm', key, iv);
          decipher.setAuthTag(tag);
          const decrypted  = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
          return { result: JSON.stringify({ status: 'success', plaintext: decrypted }) };
        }
      }

      case 'crypto_sign': {
        const sig = crypto.createHmac('sha256', input.key).update(input.data).digest('hex');
        if (input.operation === 'sign') {
          return { result: JSON.stringify({ status: 'success', signature: sig }) };
        } else {
          const valid = crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(input.signature || '', 'hex'));
          return { result: JSON.stringify({ status: 'success', valid }) };
        }
      }

      case 'scan_secrets': {
        const fp = path.resolve(root, input.path || '.');
        const isDir = fs.statSync(fp).isDirectory();
        const files = isDir
          ? fs.readdirSync(fp, { withFileTypes: true }).filter(e => e.isFile()).map(e => path.join(fp, e.name))
          : [fp];

        const findings = [];
        for (const file of files.slice(0, 50)) { // limit to 50 files
          try {
            const content = fs.readFileSync(file, 'utf8');
            for (const { name, pattern } of SECRET_PATTERNS) {
              const matches = content.match(pattern);
              if (matches) findings.push({ file, secret_type: name, count: matches.length });
            }
          } catch { /* unreadable file */ }
        }
        return { result: JSON.stringify({ status: 'success', scanned: files.length, findings }) };
      }

      case 'scan_malware': {
        const content = input.content || (input.path ? fs.readFileSync(path.resolve(root, input.path), 'utf8') : '');
        const MALWARE_PATTERNS = [
          { name: 'eval injection',    pattern: /eval\s*\(\s*(?:atob|unescape|decodeURIComponent)\s*\(/gi },
          { name: 'obfuscated hex',    pattern: /\\x[0-9a-f]{2}\\x[0-9a-f]{2}\\x[0-9a-f]{2}/gi },
          { name: 'crypto mining',     pattern: /coinhive|cryptonight|miner\.start/gi },
          { name: 'data exfiltration', pattern: /document\.cookie.*?xmlhttprequest|fetch.*?document\.cookie/gi },
          { name: 'cmd injection',     pattern: /exec\s*\([^)]*\$\{[^}]*\}/gi },
        ];
        const findings = MALWARE_PATTERNS.filter(p => p.pattern.test(content)).map(p => p.name);
        return { result: JSON.stringify({ status: 'success', clean: findings.length === 0, threats: findings }) };
      }

      case 'auth_generate': {
        switch (input.type) {
          case 'jwt': {
            const secret = input.secret || crypto.randomBytes(32).toString('hex');
            const token  = generateJWT(input.payload || {}, secret, input.expires || '24h');
            return { result: JSON.stringify({ status: 'success', token, secret, expires: input.expires || '24h' }) };
          }
          case 'api_key': {
            const key = 'sk_' + crypto.randomBytes(input.length || 24).toString('hex');
            return { result: JSON.stringify({ status: 'success', api_key: key }) };
          }
          case 'secret':
          case 'token': {
            const bytes = crypto.randomBytes(input.length || 32);
            return { result: JSON.stringify({
              status: 'success',
              token:  bytes.toString('hex'),
              base64: bytes.toString('base64'),
              length: bytes.length,
            }) };
          }
          default: throw new Error(`Unknown auth type: ${input.type}`);
        }
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isSecurityTool = (name) => SECURITY_TOOL_DEFINITIONS.some(t => t.name === name);
