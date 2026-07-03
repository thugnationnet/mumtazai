import React from 'react';
import ToolExecutionPanel, { ToolDefinition } from './ToolExecutionPanel';
import { PreviewContent } from './PanelPreview';

const TOOLS: ToolDefinition[] = [
  {
    id: 'send_email',
    icon: '📧',
    label: 'Send Email',
    desc: 'Send transactional or marketing emails via Resend, SendGrid, or SES. Supports HTML templates.',
    color: 'blue',
    fields: [
      { key: 'to', type: 'text', label: 'To', placeholder: 'recipient@example.com', required: true },
      { key: 'subject', type: 'text', label: 'Subject', placeholder: 'Welcome to our platform', required: true },
      { key: 'body', type: 'textarea', label: 'Body (HTML)', rows: 8, placeholder: '<h1>Welcome!</h1><p>Thank you for signing up.</p>' },
      { key: 'from', type: 'text', label: 'From (optional)', placeholder: 'noreply@example.com' },
      { key: 'reply_to', type: 'text', label: 'Reply-To (optional)', placeholder: 'support@example.com' },
    ],
    buildInput: (v) => ({ to: v.to, subject: v.subject, body: v.body, from: v.from, reply_to: v.reply_to }),
  },
  {
    id: 'send_webhook',
    icon: '🔗',
    label: 'Send Webhook',
    desc: 'Send webhook notifications with custom payloads, HMAC signatures, and retry logic.',
    color: 'cyan',
    fields: [
      { key: 'url', type: 'text', label: 'Webhook URL', placeholder: 'https://hooks.example.com/event', required: true },
      { key: 'payload', type: 'json', label: 'Payload (JSON)', rows: 6, placeholder: '{"event":"user.created","data":{"id":"123","email":"user@example.com"}}' },
      { key: 'secret', type: 'text', label: 'Signing Secret (optional)', placeholder: 'whsec_...' },
      { key: 'method', type: 'select', label: 'Method', options: ['POST','PUT','PATCH'], default: 'POST' },
    ],
    buildInput: (v) => {
      let payload;
      try { payload = v.payload ? JSON.parse(v.payload) : {}; } catch { payload = {}; }
      return { url: v.url, payload, secret: v.secret, method: v.method };
    },
  },
  {
    id: 'send_push',
    icon: '🔔',
    label: 'Push Notification',
    desc: 'Send push notifications via FCM, APNs, or web push. Supports data payloads and click actions.',
    color: 'amber',
    fields: [
      { key: 'token', type: 'text', label: 'Device Token / Topic', placeholder: 'FCM token or /topics/news', required: true },
      { key: 'title', type: 'text', label: 'Title', placeholder: 'New message received', required: true },
      { key: 'body', type: 'textarea', label: 'Body', rows: 3, placeholder: 'You have a new notification from...' },
      { key: 'data', type: 'json', label: 'Data Payload (JSON)', rows: 3, placeholder: '{"action":"open_chat","chatId":"abc123"}' },
      { key: 'click_action', type: 'text', label: 'Click Action URL', placeholder: 'https://app.example.com/messages' },
    ],
    buildInput: (v) => {
      let data;
      try { data = v.data ? JSON.parse(v.data) : undefined; } catch { data = undefined; }
      return { token: v.token, title: v.title, body: v.body, data, click_action: v.click_action };
    },
  },
  {
    id: 'send_sms',
    icon: '📱',
    label: 'Send SMS',
    desc: 'Send SMS messages via Twilio, Vonage, or AWS SNS. Supports international numbers.',
    color: 'emerald',
    fields: [
      { key: 'to', type: 'text', label: 'To (E.164 format)', placeholder: '+1234567890', required: true },
      { key: 'message', type: 'textarea', label: 'Message', rows: 3, placeholder: 'Your verification code is 123456', required: true },
      { key: 'from', type: 'text', label: 'From Number (optional)', placeholder: '+1987654321' },
    ],
    buildInput: (v) => ({ to: v.to, message: v.message, from: v.from }),
  },
];

interface Props {
  onClose?: () => void;
  onRunTool: (message: string) => void;
  onPreviewContent?: (c: PreviewContent) => void;
}

const CommunicationPanel: React.FC<Props> = ({ onClose, onRunTool, onPreviewContent }) => (
  <ToolExecutionPanel
    categoryTitle="Communication"
    categorySubtitle="Email, SMS, Push & Webhooks"
    categoryColor="blue"
    tools={TOOLS}
    onClose={onClose}
    onRunTool={onRunTool}
    onPreviewContent={onPreviewContent}
  />
);

export default CommunicationPanel;
