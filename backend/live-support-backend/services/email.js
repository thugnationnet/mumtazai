/**
 * EMAIL SERVICE — Mumtaz AI
 * Handles all transactional emails via Namecheap Private Email SMTP
 * All emails sent from noreply@mumtaz.ai
 * Support contact: support@mumtaz.ai
 *
 * Brand theme: Dark background (#0f172a), brand blue (#0ea5e9 / #0284c7),
 * company logo, modern card layout matching mumtaz.ai
 */

import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma.js';

// Admin / support emails
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@mumtaz.ai';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@mumtaz.ai';

// Brand constants
const BRAND = {
  gradient: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #0c95f1 100%)',
  primary: '#0ea5e9',    // brand-500
  primaryDark: '#0284c7', // brand-600
  accent: '#0c95f1',      // accent-500
  dark: '#0f172a',         // page background
  cardBg: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  surfaceLight: '#f1f5f9',
  logoUrl: 'https://mumtaz.ai/images/logos/company-logo.png',
  siteUrl: 'https://mumtaz.ai',
};

// Namecheap Private Email SMTP Configuration
// NOTE: Read env vars lazily via getSmtpConfig() because ESM static imports
// resolve before dotenv.config() runs in server-simple.js, so process.env
// values are not yet available at module load time.
function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST || 'mail.privateemail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.SMTP_USER || 'noreply@mumtaz.ai',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.SMTP_FROM || 'Mumtaz AI <noreply@mumtaz.ai>',
  };
}

// Create SMTP transporter (singleton, lazily initialized)
let smtpTransporter = null;
function getSmtpTransporter() {
  if (!smtpTransporter) {
    const config = getSmtpConfig();
    if (config.auth.user && config.auth.pass) {
      smtpTransporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
        tls: { rejectUnauthorized: false },
      });
    }
  }
  return smtpTransporter;
}

// =====================================================
// SHARED EMAIL LAYOUT — Brand Theme
// =====================================================

function emailWrapper(title, headerTitle, headerSubtitle, bodyContent, trackingId) {
  const trackingPixel = trackingId
    ? `<img src="${BRAND.siteUrl}/api/email-tracking/pixel/${trackingId}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:${BRAND.dark};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.dark};padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:${BRAND.cardBg};border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
        <!-- Header -->
        <tr><td style="background:${BRAND.gradient};padding:36px 30px;text-align:center;">
          <img src="${BRAND.logoUrl}" alt="Mumtaz AI" width="56" height="56" style="display:block;margin:0 auto 14px;border-radius:12px;" />
          <h1 style="color:#ffffff;font-size:24px;margin:0;font-weight:700;letter-spacing:-0.3px;">${headerTitle}</h1>
          ${headerSubtitle ? `<p style="color:rgba(255,255,255,0.85);font-size:14px;margin:10px 0 0;font-weight:400;">${headerSubtitle}</p>` : ''}
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 30px;color:${BRAND.textPrimary};">
          ${bodyContent}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:${BRAND.surfaceLight};padding:28px 30px;text-align:center;border-top:1px solid ${BRAND.border};">
          <!-- Social Icons -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
            <tr>
              <td style="padding:0 6px;">
                <a href="https://x.com/mumtazai" target="_blank" rel="noopener noreferrer" title="X (Twitter)" style="display:inline-block;width:32px;height:32px;background:#1e293b;border-radius:8px;text-align:center;line-height:32px;text-decoration:none;">
                  <img src="https://img.icons8.com/ios-filled/20/ffffff/twitterx--v1.png" alt="X" width="16" height="16" style="display:inline-block;vertical-align:middle;" />
                </a>
              </td>
              <td style="padding:0 6px;">
                <a href="https://instagram.com/mumtazai" target="_blank" rel="noopener noreferrer" title="Instagram" style="display:inline-block;width:32px;height:32px;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);border-radius:8px;text-align:center;line-height:32px;text-decoration:none;">
                  <img src="https://img.icons8.com/ios-filled/20/ffffff/instagram-new--v1.png" alt="Instagram" width="16" height="16" style="display:inline-block;vertical-align:middle;" />
                </a>
              </td>
              <td style="padding:0 6px;">
                <a href="https://tiktok.com/@mumtazai" target="_blank" rel="noopener noreferrer" title="TikTok" style="display:inline-block;width:32px;height:32px;background:#010101;border-radius:8px;text-align:center;line-height:32px;text-decoration:none;">
                  <img src="https://img.icons8.com/ios-filled/20/ffffff/tiktok--v1.png" alt="TikTok" width="16" height="16" style="display:inline-block;vertical-align:middle;" />
                </a>
              </td>
              <td style="padding:0 6px;">
                <a href="https://www.facebook.com/profile.php?id=61555473113271" target="_blank" rel="noopener noreferrer" title="Facebook" style="display:inline-block;width:32px;height:32px;background:#1877F2;border-radius:8px;text-align:center;line-height:32px;text-decoration:none;">
                  <img src="https://img.icons8.com/ios-filled/20/ffffff/facebook-new.png" alt="Facebook" width="16" height="16" style="display:inline-block;vertical-align:middle;" />
                </a>
              </td>
              <td style="padding:0 6px;">
                <a href="https://github.com/aidigitalfriend" target="_blank" rel="noopener noreferrer" title="GitHub" style="display:inline-block;width:32px;height:32px;background:#24292e;border-radius:8px;text-align:center;line-height:32px;text-decoration:none;">
                  <img src="https://img.icons8.com/ios-filled/20/ffffff/github.png" alt="GitHub" width="16" height="16" style="display:inline-block;vertical-align:middle;" />
                </a>
              </td>
              <td style="padding:0 6px;">
                <a href="https://t.me/mumtazai" target="_blank" rel="noopener noreferrer" title="Telegram" style="display:inline-block;width:32px;height:32px;background:#26A5E4;border-radius:8px;text-align:center;line-height:32px;text-decoration:none;">
                  <img src="https://img.icons8.com/ios-filled/20/ffffff/telegram-app.png" alt="Telegram" width="16" height="16" style="display:inline-block;vertical-align:middle;" />
                </a>
              </td>
              <td style="padding:0 6px;">
                <a href="https://line.me/ti/p/@mumtazai" target="_blank" rel="noopener noreferrer" title="LINE" style="display:inline-block;width:32px;height:32px;background:#06C755;border-radius:8px;text-align:center;line-height:32px;text-decoration:none;">
                  <img src="https://img.icons8.com/ios-filled/20/ffffff/line-me.png" alt="LINE" width="16" height="16" style="display:inline-block;vertical-align:middle;" />
                </a>
              </td>
            </tr>
          </table>
          <p style="font-size:13px;color:${BRAND.textSecondary};margin:0 0 10px;">
            Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND.primary};text-decoration:none;font-weight:600;">${SUPPORT_EMAIL}</a>
          </p>
          <p style="font-size:13px;color:${BRAND.textSecondary};margin:0 0 10px;">
            <a href="${BRAND.siteUrl}" style="color:${BRAND.primary};text-decoration:none;">mumtaz.ai</a> &nbsp;|&nbsp;
            <a href="${BRAND.siteUrl}/legal/privacy-policy" style="color:${BRAND.primary};text-decoration:none;">Privacy Policy</a> &nbsp;|&nbsp;
            <a href="${BRAND.siteUrl}/legal/terms-of-service" style="color:${BRAND.primary};text-decoration:none;">Terms of Service</a>
          </p>
          <p style="font-size:12px;color:${BRAND.textMuted};margin:10px 0 0;">&copy; ${new Date().getFullYear()} Mumtaz AI. All rights reserved.</p>
        </td></tr>
      </table>
      ${trackingPixel}
    </td></tr>
  </table>
</body>
</html>`;
}

// =====================================================
// CORE SEND FUNCTIONS
// =====================================================

async function sendEmail(to, subject, html, text) {
  const transporter = getSmtpTransporter();
  if (!transporter) {
    console.log(`[EMAIL] SMTP not configured. Would send "${subject}" to ${to}`);
    return false;
  }
  try {
    const config = getSmtpConfig();
    await transporter.sendMail({
      from: config.from,
      to,
      subject,
      html,
      text: text || subject,
      replyTo: SUPPORT_EMAIL,
    });
    console.log(`[EMAIL] Sent: "${subject}" -> ${to}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed: "${subject}" -> ${to}:`, error.message);
    return false;
  }
}

/**
 * Send a tracked email — creates a tracking record, embeds pixel, sends email
 * @param {string} to — recipient email
 * @param {string} subject — email subject
 * @param {string} emailType — type key (welcome, verification, etc.)
 * @param {Function} htmlBuilder — (trackingId) => html string
 * @param {string} [userId] — optional user ID
 * @param {object} [metadata] — optional metadata (planName, agentName, etc.)
 */
async function sendTrackedEmail(to, subject, emailType, htmlBuilder, userId, metadata) {
  let trackingId = null;
  try {
    const record = await prisma.emailTracking.create({
      data: {
        email: to,
        userId: userId || null,
        emailType,
        subject,
        metadata: metadata || undefined,
      },
    });
    trackingId = record.trackingId;
  } catch (err) {
    console.error('[EMAIL] Tracking record creation failed:', err.message);
    // Continue sending email without tracking
  }

  const html = htmlBuilder(trackingId);
  return sendEmail(to, subject, html);
}

async function sendAdminEmail(subject, html, text) {
  return sendEmail(ADMIN_EMAIL, subject, html, text);
}

// =====================================================
// 1. WELCOME EMAIL (after signup)
// =====================================================

export async function sendContactAutoReply(email, name, subject, ticketId) {
  const userName = name || email.split('@')[0];
  const htmlBuilder = (trackingId) => emailWrapper(
    'We Received Your Message - Mumtaz AI',
    'We Got Your Message!',
    'Our team will respond shortly',
    `
      <p style="font-size:22px;color:${BRAND.primaryDark};font-weight:600;margin:0 0 20px;">Hello ${userName},</p>
      <p style="font-size:16px;line-height:1.6;color:${BRAND.textSecondary};margin-bottom:20px;">
        Thank you for reaching out to us! We've received your message and our team will review it soon.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surfaceLight};border-radius:12px;overflow:hidden;margin:20px 0;">
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};width:140px;">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Subject</strong>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};color:${BRAND.textPrimary};font-size:14px;">
            ${subject}
          </td>
        </tr>
        ${ticketId ? `<tr>
          <td style="padding:14px 20px;">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Reference</strong>
          </td>
          <td style="padding:14px 20px;color:${BRAND.textPrimary};font-size:14px;font-family:monospace;">
            ${ticketId}
          </td>
        </tr>` : ''}
      </table>

      <div style="background:#eff6ff;border-left:4px solid ${BRAND.primary};padding:16px 20px;border-radius:8px;margin:25px 0;">
        <p style="margin:0;color:#1e40af;font-size:14px;">
          <strong>Expected response time:</strong> Within 24 hours. For urgent matters, email us directly at 
          <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND.primaryDark};font-weight:600;">${SUPPORT_EMAIL}</a>.
        </p>
      </div>

      <p style="font-size:14px;color:${BRAND.textMuted};">
        Please keep this email for your records. You can reply to this email if you need to add more information.
      </p>
    `,
    trackingId
  );
  return sendTrackedEmail(email, `We Received Your Message — ${subject}`, 'contact_reply', htmlBuilder);
}

// =====================================================
// 8. AUTO-REPLY — Support Ticket Created
// =====================================================

export async function sendTicketAutoReply(email, name, subject, ticketNumber, category, priority) {
  const userName = name || email.split('@')[0];
  const priorityColors = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };
  const priorityColor = priorityColors[priority] || BRAND.primary;

  const htmlBuilder = (trackingId) => emailWrapper(
    'Support Ticket Created - Mumtaz AI',
    'Support Ticket Created',
    `Ticket #${ticketNumber} has been opened`,
    `
      <p style="font-size:22px;color:${BRAND.primaryDark};font-weight:600;margin:0 0 20px;">Hello ${userName},</p>
      <p style="font-size:16px;line-height:1.6;color:${BRAND.textSecondary};margin-bottom:20px;">
        Your support ticket has been created and assigned to our team. We'll get back to you as soon as possible.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surfaceLight};border-radius:12px;overflow:hidden;margin:20px 0;">
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};width:140px;">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Ticket #</strong>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};color:${BRAND.textPrimary};font-size:14px;font-weight:700;">
            ${ticketNumber}
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Subject</strong>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};color:${BRAND.textPrimary};font-size:14px;">
            ${subject}
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Category</strong>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};color:${BRAND.textPrimary};font-size:14px;">
            ${category || 'General'}
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Priority</strong>
          </td>
          <td style="padding:14px 20px;">
            <span style="display:inline-block;background:${priorityColor};color:#fff;padding:3px 12px;border-radius:4px;font-size:12px;font-weight:600;text-transform:uppercase;">
              ${priority || 'medium'}
            </span>
          </td>
        </tr>
      </table>

      <div style="text-align:center;margin:30px 0;">
        <a href="${BRAND.siteUrl}/support" style="display:inline-block;background:${BRAND.gradient};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;box-shadow:0 4px 15px rgba(14,165,233,0.35);">
          View Your Tickets
        </a>
      </div>

      <p style="font-size:14px;color:${BRAND.textMuted};">
        You can track your ticket status at any time from our support page. Reply to this email if you need to add more details.
      </p>
    `,
    trackingId
  );
  return sendTrackedEmail(email, `Support Ticket #${ticketNumber} Created — ${subject}`, 'ticket_reply', htmlBuilder);
}

// =====================================================
// 9. AUTO-REPLY — Consultation Booked
// =====================================================

export async function sendConsultationAutoReply(email, name, consultationType, consultationNumber) {
  const userName = name || email.split('@')[0];
  const htmlBuilder = (trackingId) => emailWrapper(
    'Consultation Request Received - Mumtaz AI',
    'Consultation Request Received',
    `Reference: ${consultationNumber}`,
    `
      <p style="font-size:22px;color:${BRAND.primaryDark};font-weight:600;margin:0 0 20px;">Hello ${userName},</p>
      <p style="font-size:16px;line-height:1.6;color:${BRAND.textSecondary};margin-bottom:20px;">
        Thank you for your <strong>${consultationType}</strong> consultation request! Our team will review your request and get in touch to schedule a session.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surfaceLight};border-radius:12px;overflow:hidden;margin:20px 0;">
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};width:140px;">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Type</strong>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};color:${BRAND.textPrimary};font-size:14px;font-weight:600;">
            ${consultationType}
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Reference</strong>
          </td>
          <td style="padding:14px 20px;color:${BRAND.textPrimary};font-size:14px;font-family:monospace;">
            ${consultationNumber}
          </td>
        </tr>
      </table>

      <div style="background:#eff6ff;border-left:4px solid ${BRAND.primary};padding:16px 20px;border-radius:8px;margin:25px 0;">
        <p style="margin:0;color:#1e40af;font-size:14px;">
          We'll contact you within <strong>24-48 hours</strong> to schedule your consultation. Keep an eye on your inbox!
        </p>
      </div>
    `,
    trackingId
  );
  return sendTrackedEmail(email, `Consultation Request Received — ${consultationType}`, 'consultation_reply', htmlBuilder);
}

// =====================================================
// ADMIN NOTIFICATION EMAILS
// =====================================================

export async function notifyAdminContactForm(data) {
  const subject = `New Contact Form: ${data.subject}`;
  const html = emailWrapper(
    'New Contact Form - Admin',
    'New Contact Message',
    '',
    `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>From:</strong> ${data.name}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Email:</strong> <a href="mailto:${data.email}" style="color:${BRAND.primary};">${data.email}</a></td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Subject:</strong> ${data.subject}</td></tr>
        ${data.ticketId ? `<tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Ticket ID:</strong> ${data.ticketId}</td></tr>` : ''}
      </table>
      <div style="background:${BRAND.surfaceLight};padding:20px;border-radius:8px;border-left:4px solid ${BRAND.primary};white-space:pre-wrap;font-size:14px;line-height:1.6;color:${BRAND.textPrimary};">
        ${data.message}
      </div>
      <div style="text-align:center;margin-top:25px;">
        <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" style="display:inline-block;background:${BRAND.gradient};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">Reply to ${data.name}</a>
      </div>
    `
  );
  return sendAdminEmail(subject, html, `New Contact: ${data.subject}\nFrom: ${data.name} (${data.email})\n\n${data.message}`);
}

export async function notifyAdminSupportTicket(data) {
  const subject = `New Support Ticket #${data.ticketNumber}: ${data.subject}`;
  const html = emailWrapper(
    'New Support Ticket - Admin',
    'New Support Ticket',
    '',
    `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Ticket #:</strong> ${data.ticketNumber}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Subject:</strong> ${data.subject}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Customer:</strong> ${data.userName} (<a href="mailto:${data.userEmail}" style="color:${BRAND.primary};">${data.userEmail}</a>)</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Category:</strong> ${data.category}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Priority:</strong> <span style="color:${data.priority === 'urgent' ? '#dc3545' : data.priority === 'high' ? '#fd7e14' : BRAND.primary};font-weight:600;">${data.priority}</span></td></tr>
      </table>
      <div style="text-align:center;margin-top:25px;">
        <a href="${BRAND.siteUrl}/admin/support" style="display:inline-block;background:${BRAND.gradient};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">View in Admin</a>
      </div>
    `
  );
  return sendAdminEmail(subject, html, `Ticket #${data.ticketNumber}: ${data.subject}\nFrom: ${data.userName} (${data.userEmail})\nPriority: ${data.priority}`);
}

export async function notifyAdminConsultation(data) {
  const subject = `New Consultation: ${data.consultationType} — ${data.userName}`;
  const html = emailWrapper(
    'New Consultation - Admin',
    'New Consultation Request',
    '',
    `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Type:</strong> ${data.consultationType}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Reference:</strong> ${data.consultationNumber}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Name:</strong> ${data.userName}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Email:</strong> <a href="mailto:${data.userEmail}" style="color:${BRAND.primary};">${data.userEmail}</a></td></tr>
        ${data.userPhone ? `<tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Phone:</strong> ${data.userPhone}</td></tr>` : ''}
      </table>
      <div style="background:${BRAND.surfaceLight};padding:20px;border-radius:8px;border-left:4px solid ${BRAND.primary};white-space:pre-wrap;font-size:14px;line-height:1.6;color:${BRAND.textPrimary};">
        ${data.projectDescription}
      </div>
      <div style="text-align:center;margin-top:25px;">
        <a href="mailto:${data.userEmail}?subject=Re: ${encodeURIComponent(data.consultationType)} Consultation" style="display:inline-block;background:${BRAND.gradient};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">Schedule Call</a>
      </div>
    `
  );
  return sendAdminEmail(subject, html, `Consultation: ${data.consultationType}\nFrom: ${data.userName} (${data.userEmail})\n\n${data.projectDescription}`);
}
