/**
 * COMMUNICATION TOOLS  —  email, SMS, push notifications, webhooks
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

export const COMMUNICATION_TOOL_DEFINITIONS = [
  {
    name: 'send_email',
    description: 'Send an email using SMTP (Nodemailer) or a transactional email API (Resend/SendGrid).',
    input_schema: {
      type: 'object',
      properties: {
        to:       { type: 'string', description: 'Recipient email address' },
        subject:  { type: 'string', description: 'Email subject' },
        body:     { type: 'string', description: 'Email body (HTML supported)' },
        from:     { type: 'string', description: 'Sender email (default: from env MAIL_FROM)' },
        reply_to: { type: 'string', description: 'Reply-to address' },
        provider: { type: 'string', enum: ['resend','sendgrid','smtp'], description: 'Email provider (default: smtp if SMTP_HOST set, else resend)' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'send_webhook',
    description: 'Send a POST request to a webhook URL with a JSON payload.',
    input_schema: {
      type: 'object',
      properties: {
        url:     { type: 'string', description: 'Webhook endpoint URL' },
        payload: { type: 'object', description: 'JSON payload to send' },
        headers: { type: 'object', description: 'Additional headers (e.g. Authorization)' },
        secret:  { type: 'string', description: 'HMAC secret for signing the payload (sets X-Signature header)' },
      },
      required: ['url', 'payload'],
    },
  },
  {
    name: 'send_push',
    description: 'Send a push notification via Web Push or Firebase FCM.',
    input_schema: {
      type: 'object',
      properties: {
        token:   { type: 'string', description: 'Device/subscription token' },
        title:   { type: 'string', description: 'Notification title' },
        body:    { type: 'string', description: 'Notification body' },
        data:    { type: 'object', description: 'Extra data payload' },
        provider: { type: 'string', enum: ['fcm','apns'], description: 'Push provider (default: fcm)' },
      },
      required: ['token', 'title', 'body'],
    },
  },
  {
    name: 'send_sms',
    description: 'Send an SMS via Twilio.',
    input_schema: {
      type: 'object',
      properties: {
        to:      { type: 'string', description: 'Recipient phone number (E.164 e.g. +14155552671)' },
        message: { type: 'string', description: 'SMS message text' },
        from:    { type: 'string', description: 'Sender phone number (default: from TWILIO_FROM env)' },
      },
      required: ['to', 'message'],
    },
  },
];

// ─────────────────────────────────────────────────── helpers ──

function post(url, body, headers = {}, timeout = 15000) {
  return new Promise((resolve, reject) => {
    try {
      const parsed   = new URL(url);
      const requester = parsed.protocol === 'https:' ? https : http;
      const bodyStr  = JSON.stringify(body);
      const opts = {
        hostname: parsed.hostname, port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr), ...headers },
        timeout,
      };
      const req = requester.request(opts, (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      req.write(bodyStr); req.end();
    } catch (e) { reject(e); }
  });
}

import crypto from 'crypto';

export async function executeCommunicationTool(toolName, input, ctx = {}) {
  try {
    switch (toolName) {
      case 'send_email': {
        // Try Resend API first, fall back to guidance
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey) {
          const res = await post('https://api.resend.com/emails', {
            from:    input.from || process.env.MAIL_FROM || 'onboarding@resend.dev',
            to:      [input.to],
            subject: input.subject,
            html:    input.body,
            reply_to: input.reply_to,
          }, { Authorization: `Bearer ${apiKey}` });
          const parsed = (() => { try { return JSON.parse(res.body); } catch { return {}; } })();
          return { result: JSON.stringify({ status: res.status < 300 ? 'success' : 'error', id: parsed.id, http_status: res.status }) };
        }
        // SendGrid fallback
        const sgKey = process.env.SENDGRID_API_KEY;
        if (sgKey) {
          const res = await post('https://api.sendgrid.com/v3/mail/send', {
            personalizations: [{ to: [{ email: input.to }], subject: input.subject }],
            from: { email: input.from || process.env.MAIL_FROM || 'noreply@mumtaz.ai' },
            content: [{ type: 'text/html', value: input.body }],
          }, { Authorization: `Bearer ${sgKey}` });
          return { result: JSON.stringify({ status: res.status < 300 ? 'success' : 'error', http_status: res.status }) };
        }
        return { result: JSON.stringify({ status: 'error', error: 'No email provider configured. Set RESEND_API_KEY or SENDGRID_API_KEY in environment.' }) };
      }

      case 'send_webhook': {
        const headers = { ...(input.headers || {}) };
        if (input.secret) {
          const sig = crypto.createHmac('sha256', input.secret).update(JSON.stringify(input.payload)).digest('hex');
          headers['X-Signature-256'] = `sha256=${sig}`;
        }
        const res = await post(input.url, input.payload, headers);
        return { result: JSON.stringify({ status: res.status < 300 ? 'success' : 'error', http_status: res.status, body: res.body.slice(0, 500) }) };
      }

      case 'send_push': {
        const fcmKey = process.env.FCM_SERVER_KEY;
        if (!fcmKey) return { result: JSON.stringify({ status: 'error', error: 'FCM_SERVER_KEY not set in environment' }) };
        const res = await post('https://fcm.googleapis.com/fcm/send', {
          to: input.token,
          notification: { title: input.title, body: input.body },
          data: input.data || {},
        }, { Authorization: `key=${fcmKey}` });
        return { result: JSON.stringify({ status: res.status < 300 ? 'success' : 'error', http_status: res.status }) };
      }

      case 'send_sms': {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken  = process.env.TWILIO_AUTH_TOKEN;
        const from       = input.from || process.env.TWILIO_FROM;
        if (!accountSid || !authToken) return { result: JSON.stringify({ status: 'error', error: 'TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN required' }) };
        const url     = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const body    = new URLSearchParams({ To: input.to, From: from || '', Body: input.message }).toString();
        const auth    = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        // POST as form-urlencoded
        const res = await new Promise((resolve, reject) => {
          const parsed   = new URL(url);
          const opts = {
            hostname: parsed.hostname, port: 443, path: parsed.pathname, method: 'POST',
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
          };
          const req = https.request(opts, (r) => { let d=''; r.on('data',c=>{d+=c;}); r.on('end',()=>resolve({status:r.statusCode,body:d})); });
          req.on('error', reject); req.write(body); req.end();
        });
        return { result: JSON.stringify({ status: res.status < 300 ? 'success' : 'error', http_status: res.status }) };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isCommunicationTool = (name) => COMMUNICATION_TOOL_DEFINITIONS.some(t => t.name === name);
