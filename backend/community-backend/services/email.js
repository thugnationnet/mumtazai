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

export async function sendWelcomeEmail(email, name) {
  const userName = name || email.split('@')[0];
  const htmlBuilder = (trackingId) => emailWrapper(
    'Welcome to Mumtaz AI',
    'Welcome to Mumtaz AI!',
    'Your journey into the future of AI begins now',
    `
      <p style="font-size:22px;color:${BRAND.primaryDark};font-weight:600;margin:0 0 20px;">Hello ${userName}!</p>
      <p style="font-size:16px;line-height:1.6;color:${BRAND.textSecondary};margin-bottom:20px;">
        We're thrilled to have you join the Mumtaz AI community! Your account is now active and ready to go.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surfaceLight};border-radius:12px;margin:25px 0;">
        <tr>
          <td width="50%" style="padding:20px;text-align:center;border-right:1px solid ${BRAND.border};">
            <div style="width:40px;height:40px;margin:0 auto 10px;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:10px;line-height:40px;font-size:20px;color:#fff;">&#x2728;</div>
            <div style="font-weight:600;color:${BRAND.primaryDark};font-size:15px;">AI Studio</div>
            <div style="font-size:12px;color:${BRAND.textSecondary};margin-top:4px;">Chat with GPT-4o, Claude, Gemini, DeepSeek & more</div>
          </td>
          <td width="50%" style="padding:20px;text-align:center;">
            <div style="width:40px;height:40px;margin:0 auto 10px;background:linear-gradient(135deg,#8b5cf6,#ec4899);border-radius:10px;line-height:40px;font-size:20px;color:#fff;">&#x1F9EA;</div>
            <div style="font-weight:600;color:${BRAND.primaryDark};font-size:15px;">AI Lab</div>
            <div style="font-size:12px;color:${BRAND.textSecondary};margin-top:4px;">Battle Arena, Image Gen, Voice Cloning</div>
          </td>
        </tr>
        <tr>
          <td width="50%" style="padding:20px;text-align:center;border-right:1px solid ${BRAND.border};border-top:1px solid ${BRAND.border};">
            <div style="width:40px;height:40px;margin:0 auto 10px;background:linear-gradient(135deg,#10b981,#34d399);border-radius:10px;line-height:40px;font-size:20px;color:#fff;">&#x1F6E0;</div>
            <div style="font-weight:600;color:${BRAND.primaryDark};font-size:15px;">Toolbox</div>
            <div style="font-size:12px;color:${BRAND.textSecondary};margin-top:4px;">Network tools & dev utilities</div>
          </td>
          <td width="50%" style="padding:20px;text-align:center;border-top:1px solid ${BRAND.border};">
            <div style="width:40px;height:40px;margin:0 auto 10px;background:linear-gradient(135deg,#f59e0b,#f97316);border-radius:10px;line-height:40px;font-size:20px;color:#fff;">&#x1F916;</div>
            <div style="font-weight:600;color:${BRAND.primaryDark};font-size:15px;">AI Agents</div>
            <div style="font-size:12px;color:${BRAND.textSecondary};margin-top:4px;">20+ specialized agents — Coder, Writer, Analyst, Designer & more</div>
          </td>
        </tr>
        <tr>
          <td width="50%" style="padding:20px;text-align:center;border-right:1px solid ${BRAND.border};border-top:1px solid ${BRAND.border};">
            <div style="width:40px;height:40px;margin:0 auto 10px;background:linear-gradient(135deg,#6366f1,#a855f7);border-radius:10px;line-height:40px;font-size:20px;color:#fff;">&#x1F3A8;</div>
            <div style="font-weight:600;color:${BRAND.primaryDark};font-size:15px;">Canvas Studio</div>
            <div style="font-size:12px;color:${BRAND.textSecondary};margin-top:4px;">Build & deploy full web apps with AI</div>
          </td>
          <td width="50%" style="padding:20px;text-align:center;border-top:1px solid ${BRAND.border};">
            <div style="width:40px;height:40px;margin:0 auto 10px;background:linear-gradient(135deg,#0891b2,#22d3ee);border-radius:10px;line-height:40px;font-size:20px;color:#fff;">&#x1F680;</div>
            <div style="font-weight:600;color:${BRAND.primaryDark};font-size:15px;">Canvas Build</div>
            <div style="font-size:12px;color:${BRAND.textSecondary};margin-top:4px;">AI-powered code generation & live preview</div>
          </td>
        </tr>
      </table>

      <!-- Welcome Coupon -->
      <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:12px;padding:28px;margin:30px 0;text-align:center;border:2px solid ${BRAND.primary};">
        <div style="font-size:14px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">&#x1F381; Welcome Gift</div>
        <div style="font-size:20px;color:#ffffff;font-weight:700;margin-bottom:6px;">Free 1-Day Access to Any AI Agent!</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.7);margin-bottom:16px;">Use this coupon at checkout to try any agent free for 1 day</div>
        <div style="display:inline-block;background:${BRAND.surfaceLight};border:2px dashed ${BRAND.primary};border-radius:8px;padding:14px 36px;">
          <div style="font-size:28px;font-weight:800;color:${BRAND.primaryDark};letter-spacing:4px;font-family:monospace;">WELCOME1DAY</div>
        </div>
        <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:12px;">Apply this code on the Stripe checkout page &bull; 100% off your first Daily plan</div>
      </div>

      <div style="text-align:center;margin:30px 0;">
        <a href="${BRAND.siteUrl}/agents" style="display:inline-block;background:${BRAND.gradient};color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:600;font-size:16px;box-shadow:0 4px 15px rgba(14,165,233,0.35);">
          Choose Your Free Agent
        </a>
      </div>

      <p style="font-size:16px;line-height:1.6;color:${BRAND.textSecondary};">
        We can't wait to see what you'll create with Mumtaz AI. Welcome aboard!
      </p>
    `,
    trackingId
  );
  return sendTrackedEmail(email, 'Welcome to Mumtaz AI — Let\'s Get Started!', 'welcome', htmlBuilder);
}

// =====================================================
// 2. EMAIL VERIFICATION (6-digit code)
// =====================================================

export async function sendVerificationEmail(email, name, code) {
  const userName = name || email.split('@')[0];
  const htmlBuilder = (trackingId) => emailWrapper(
    'Verify Your Email - Mumtaz AI',
    'Verify Your Email',
    'One more step to activate your account',
    `
      <p style="font-size:22px;color:${BRAND.primaryDark};font-weight:600;margin:0 0 20px;">Hello ${userName}!</p>
      <p style="font-size:16px;line-height:1.6;color:${BRAND.textSecondary};margin-bottom:20px;">
        Please use the verification code below to confirm your email address and activate your Mumtaz AI account.
      </p>

      <div style="text-align:center;margin:30px 0;">
        <div style="display:inline-block;background:${BRAND.surfaceLight};border:2px dashed ${BRAND.primary};border-radius:12px;padding:24px 48px;">
          <div style="font-size:13px;color:${BRAND.textSecondary};margin-bottom:8px;text-transform:uppercase;letter-spacing:2px;">Verification Code</div>
          <div style="font-size:42px;font-weight:800;color:${BRAND.primaryDark};letter-spacing:12px;font-family:monospace;">${code}</div>
        </div>
      </div>

      <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:16px 20px;border-radius:8px;margin:25px 0;">
        <p style="margin:0;color:#92400e;font-size:14px;">
          This code expires in <strong>15 minutes</strong>. If you didn't create an account, please ignore this email.
        </p>
      </div>

      <p style="font-size:14px;color:${BRAND.textMuted};margin-top:20px;">
        Enter this code on the verification page to complete your signup.
      </p>
    `,
    trackingId
  );
  return sendTrackedEmail(email, `Your Verification Code: ${code}`, 'verification', htmlBuilder);
}

// =====================================================
// 3. LOGIN OTP EMAIL (email-based login verification)
// =====================================================

export async function sendLoginOtpEmail(email, name, code) {
  const userName = name || email.split('@')[0];
  const htmlBuilder = (trackingId) => emailWrapper(
    'Login Verification - Mumtaz AI',
    'Verify Your Login',
    'Enter this code to complete your sign-in',
    `
      <p style="font-size:22px;color:${BRAND.primaryDark};font-weight:600;margin:0 0 20px;">Hello ${userName}!</p>
      <p style="font-size:16px;line-height:1.6;color:${BRAND.textSecondary};margin-bottom:20px;">
        A sign-in attempt was made to your Mumtaz AI account. Use the code below to verify it's you.
      </p>

      <div style="text-align:center;margin:30px 0;">
        <div style="display:inline-block;background:${BRAND.surfaceLight};border:2px dashed ${BRAND.primary};border-radius:12px;padding:24px 48px;">
          <div style="font-size:13px;color:${BRAND.textSecondary};margin-bottom:8px;text-transform:uppercase;letter-spacing:2px;">Login Code</div>
          <div style="font-size:42px;font-weight:800;color:${BRAND.primaryDark};letter-spacing:12px;font-family:monospace;">${code}</div>
        </div>
      </div>

      <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:16px 20px;border-radius:8px;margin:25px 0;">
        <p style="margin:0;color:#92400e;font-size:14px;">
          This code expires in <strong>10 minutes</strong>. If you didn't try to sign in, you can safely ignore this email.
        </p>
      </div>

      <div style="background:#eff6ff;border-left:4px solid ${BRAND.primary};padding:16px 20px;border-radius:8px;margin:25px 0;">
        <p style="margin:0;color:#1e40af;font-size:14px;">
          <strong>Tip:</strong> Enable Two-Factor Authentication in your security settings to use an authenticator app instead of email codes.
        </p>
      </div>

      <p style="font-size:14px;color:${BRAND.textMuted};margin-top:20px;">
        Enter this code on the verification page to complete your login.
      </p>
    `,
    trackingId
  );
  return sendTrackedEmail(email, `Your Login Code: ${code}`, 'login_otp', htmlBuilder);
}

// =====================================================
// 4. LOGIN ALERT (with IP, device, time)
// =====================================================

export async function sendLoginAlertEmail(email, name, loginDetails) {
  const userName = name || email.split('@')[0];
  const { ip, device, browser, os, location, time } = loginDetails;
  const formattedTime = time || new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' });

  const htmlBuilder = (trackingId) => emailWrapper(
    'New Login Detected - Mumtaz AI',
    'New Login Detected',
    'A new sign-in to your account was detected',
    `
      <p style="font-size:22px;color:${BRAND.primaryDark};font-weight:600;margin:0 0 20px;">Hello ${userName},</p>
      <p style="font-size:16px;line-height:1.6;color:${BRAND.textSecondary};margin-bottom:25px;">
        We detected a new sign-in to your Mumtaz AI account. Here are the details:
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surfaceLight};border-radius:12px;overflow:hidden;margin:20px 0;">
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};width:140px;">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Date &amp; Time</strong>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};color:${BRAND.textPrimary};font-size:14px;">
            ${formattedTime}
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">IP Address</strong>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};color:${BRAND.textPrimary};font-size:14px;font-family:monospace;">
            ${ip || 'Unknown'}
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Location</strong>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};color:${BRAND.textPrimary};font-size:14px;">
            ${location || 'Unknown'}
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Device</strong>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};color:${BRAND.textPrimary};font-size:14px;">
            ${device || 'Unknown'}
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Browser</strong>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};color:${BRAND.textPrimary};font-size:14px;">
            ${browser || 'Unknown'}
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Operating System</strong>
          </td>
          <td style="padding:14px 20px;color:${BRAND.textPrimary};font-size:14px;">
            ${os || 'Unknown'}
          </td>
        </tr>
      </table>

      <div style="background:#fee2e2;border-left:4px solid #ef4444;padding:16px 20px;border-radius:8px;margin:25px 0;">
        <p style="margin:0;color:#991b1b;font-size:14px;font-weight:600;">Wasn't you?</p>
        <p style="margin:8px 0 0;color:#991b1b;font-size:14px;">
          If you didn't sign in, your account may be compromised. Please 
          <a href="${BRAND.siteUrl}/auth/reset-password" style="color:#dc2626;font-weight:600;">change your password immediately</a> 
          and enable Two-Factor Authentication in your security settings.
        </p>
      </div>
    `,
    trackingId
  );
  return sendTrackedEmail(email, 'New Login to Your Mumtaz AI Account', 'login_alert', htmlBuilder);
}

// =====================================================
// 4. PASSWORD RESET REQUEST (forgot password)
// =====================================================

export async function sendPasswordResetEmail(email, name, resetUrl) {
  const userName = name || email.split('@')[0];
  const htmlBuilder = (trackingId) => emailWrapper(
    'Reset Your Password - Mumtaz AI',
    'Password Reset Request',
    'We received a request to reset your password',
    `
      <p style="font-size:22px;color:${BRAND.primaryDark};font-weight:600;margin:0 0 20px;">Hello ${userName}!</p>
      <p style="font-size:16px;line-height:1.6;color:${BRAND.textSecondary};margin-bottom:20px;">
        We received a request to reset the password for your Mumtaz AI account. Click the button below to create a new password.
      </p>

      <div style="text-align:center;margin:30px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:${BRAND.gradient};color:#ffffff;text-decoration:none;padding:18px 45px;border-radius:8px;font-weight:600;font-size:17px;box-shadow:0 4px 15px rgba(14,165,233,0.35);">
          Reset My Password
        </a>
      </div>

      <div style="background:${BRAND.surfaceLight};border-radius:8px;padding:16px 20px;text-align:center;margin:25px 0;">
        <p style="color:${BRAND.textSecondary};font-size:14px;margin:0;">This link expires in</p>
        <p style="color:${BRAND.primaryDark};font-weight:700;font-size:20px;margin:8px 0 4px;">1 Hour</p>
        <p style="color:${BRAND.textSecondary};font-size:13px;margin:0;">You'll need to request a new link after this time.</p>
      </div>

      <div style="background:#eff6ff;border-left:4px solid ${BRAND.primary};padding:16px 20px;border-radius:8px;margin:25px 0;">
        <p style="margin:0;color:${BRAND.primaryDark};font-size:14px;font-weight:600;">Steps:</p>
        <ol style="margin:10px 0 0;padding-left:20px;color:#1e40af;font-size:14px;">
          <li>Click the "Reset My Password" button above</li>
          <li>Enter your new password (min 8 characters)</li>
          <li>Confirm your new password</li>
        </ol>
      </div>

      <div style="background:#fee2e2;border:1px solid #fecaca;border-radius:8px;padding:15px;text-align:center;margin:25px 0;">
        <p style="margin:0;color:#991b1b;font-size:14px;">
          Didn't request this? Ignore this email — your password won't change.
        </p>
      </div>

      <p style="font-size:13px;color:${BRAND.textMuted};word-break:break-all;margin-top:20px;">
        If the button doesn't work, copy this URL: ${resetUrl}
      </p>
    `,
    trackingId
  );
  return sendTrackedEmail(email, 'Reset Your Password — Mumtaz AI', 'password_reset', htmlBuilder);
}

// =====================================================
// 5. PASSWORD CHANGED ALERT
// =====================================================

export async function sendPasswordChangedEmail(email, name, changeDetails) {
  const userName = name || email.split('@')[0];
  const { ip, time } = changeDetails || {};
  const formattedTime = time || new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' });

  const htmlBuilder = (trackingId) => emailWrapper(
    'Password Changed - Mumtaz AI',
    'Password Changed Successfully',
    'Your account password has been updated',
    `
      <p style="font-size:22px;color:${BRAND.primaryDark};font-weight:600;margin:0 0 20px;">Hello ${userName},</p>
      <p style="font-size:16px;line-height:1.6;color:${BRAND.textSecondary};margin-bottom:20px;">
        Your Mumtaz AI account password was successfully changed.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surfaceLight};border-radius:12px;overflow:hidden;margin:20px 0;">
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};width:140px;">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Date &amp; Time</strong>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};color:${BRAND.textPrimary};font-size:14px;">
            ${formattedTime}
          </td>
        </tr>
        ${ip ? `<tr>
          <td style="padding:14px 20px;">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">IP Address</strong>
          </td>
          <td style="padding:14px 20px;color:${BRAND.textPrimary};font-size:14px;font-family:monospace;">
            ${ip}
          </td>
        </tr>` : ''}
      </table>

      <div style="background:#dcfce7;border-left:4px solid #22c55e;padding:16px 20px;border-radius:8px;margin:25px 0;">
        <p style="margin:0;color:#166534;font-size:14px;">
          If you made this change, no further action is needed.
        </p>
      </div>

      <div style="background:#fee2e2;border-left:4px solid #ef4444;padding:16px 20px;border-radius:8px;margin:25px 0;">
        <p style="margin:0;color:#991b1b;font-size:14px;font-weight:600;">Didn't make this change?</p>
        <p style="margin:8px 0 0;color:#991b1b;font-size:14px;">
          Contact us immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color:#dc2626;font-weight:600;">${SUPPORT_EMAIL}</a> 
          to secure your account.
        </p>
      </div>
    `,
    trackingId
  );
  return sendTrackedEmail(email, 'Your Password Was Changed — Mumtaz AI', 'password_changed', htmlBuilder);
}

// =====================================================
// 6. PLAN PURCHASE / SUBSCRIPTION CONFIRMATION
// =====================================================

export async function sendPlanPurchaseEmail(email, name, purchaseDetails) {
  const userName = name || email.split('@')[0];
  const { planName, agentName, price, currency, expiryDate, transactionId } = purchaseDetails;

  const htmlBuilder = (trackingId) => emailWrapper(
    'Subscription Confirmed - Mumtaz AI',
    'Subscription Confirmed!',
    `You're now subscribed to ${agentName || planName || 'a plan'}`,
    `
      <p style="font-size:22px;color:${BRAND.primaryDark};font-weight:600;margin:0 0 20px;">Hello ${userName}!</p>
      <p style="font-size:16px;line-height:1.6;color:${BRAND.textSecondary};margin-bottom:25px;">
        Thank you for your purchase! Your subscription is now active.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surfaceLight};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;margin:20px 0;">
        <tr>
          <td colspan="2" style="padding:16px 20px;background:${BRAND.gradient};text-align:center;">
            <strong style="color:#ffffff;font-size:16px;">Subscription Details</strong>
          </td>
        </tr>
        ${agentName ? `<tr>
          <td style="padding:12px 20px;border-bottom:1px solid ${BRAND.border};width:140px;">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Agent</strong>
          </td>
          <td style="padding:12px 20px;border-bottom:1px solid ${BRAND.border};color:${BRAND.textPrimary};font-size:14px;">
            ${agentName}
          </td>
        </tr>` : ''}
        <tr>
          <td style="padding:12px 20px;border-bottom:1px solid ${BRAND.border};">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Plan</strong>
          </td>
          <td style="padding:12px 20px;border-bottom:1px solid ${BRAND.border};color:${BRAND.textPrimary};font-size:14px;font-weight:600;">
            ${planName || 'Premium'}
          </td>
        </tr>
        <tr>
          <td style="padding:12px 20px;border-bottom:1px solid ${BRAND.border};">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Amount</strong>
          </td>
          <td style="padding:12px 20px;border-bottom:1px solid ${BRAND.border};color:${BRAND.textPrimary};font-size:14px;">
            $${(price || 0).toFixed(2)} ${(currency || 'USD').toUpperCase()}
          </td>
        </tr>
        ${expiryDate ? `<tr>
          <td style="padding:12px 20px;border-bottom:1px solid ${BRAND.border};">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Valid Until</strong>
          </td>
          <td style="padding:12px 20px;border-bottom:1px solid ${BRAND.border};color:${BRAND.textPrimary};font-size:14px;">
            ${new Date(expiryDate).toLocaleDateString('en-US', { dateStyle: 'long' })}
          </td>
        </tr>` : ''}
        ${transactionId ? `<tr>
          <td style="padding:12px 20px;">
            <strong style="color:${BRAND.textSecondary};font-size:13px;">Transaction ID</strong>
          </td>
          <td style="padding:12px 20px;color:${BRAND.textPrimary};font-size:13px;font-family:monospace;">
            ${transactionId}
          </td>
        </tr>` : ''}
      </table>

      <div style="text-align:center;margin:30px 0;">
        <a href="${BRAND.siteUrl}/dashboard" style="display:inline-block;background:${BRAND.gradient};color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:600;font-size:16px;box-shadow:0 4px 15px rgba(14,165,233,0.35);">
          Go to Dashboard
        </a>
      </div>

      <!-- What's Included -->
      <div style="background:${BRAND.surfaceLight};border-radius:12px;padding:20px;margin:25px 0;">
        <p style="font-weight:700;color:${BRAND.primaryDark};font-size:15px;margin:0 0 12px;">What's included with your plan:</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;color:${BRAND.textSecondary};font-size:14px;">&#x2705; Access to AI Studio — GPT-4o, Claude, Gemini, DeepSeek</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:${BRAND.textSecondary};font-size:14px;">&#x2705; 20+ Specialized AI Agents — Coder, Writer, Analyst & more</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:${BRAND.textSecondary};font-size:14px;">&#x2705; Canvas Studio & Canvas Build — create and deploy web apps</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:${BRAND.textSecondary};font-size:14px;">&#x2705; AI Lab — Battle Arena, Image Gen, Voice Cloning</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:${BRAND.textSecondary};font-size:14px;">&#x2705; Priority support & early access to new features</td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;margin:20px 0;">
        <a href="${BRAND.siteUrl}/agents" style="color:${BRAND.primary};text-decoration:none;font-weight:600;font-size:14px;margin:0 12px;">Browse Agents</a>
        <span style="color:${BRAND.textMuted};">|</span>
        <a href="${BRAND.siteUrl}/canvas" style="color:${BRAND.primary};text-decoration:none;font-weight:600;font-size:14px;margin:0 12px;">Open Canvas</a>
        <span style="color:${BRAND.textMuted};">|</span>
        <a href="${BRAND.siteUrl}/ai-studio" style="color:${BRAND.primary};text-decoration:none;font-weight:600;font-size:14px;margin:0 12px;">AI Studio</a>
      </div>

      <p style="font-size:14px;color:${BRAND.textMuted};">
        Your subscription receipt has been recorded. If you have any questions about your plan, contact us at ${SUPPORT_EMAIL}.
      </p>
    `,
    trackingId
  );
  return sendTrackedEmail(email, `Subscription Confirmed — ${agentName || planName || 'Mumtaz AI'}`, 'plan_purchase', htmlBuilder, null, { planName, agentName, price });
}

// =====================================================
// 7. AUTO-REPLY — Contact Form Received
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

export async function notifyAdminJobApplication(data) {
  const subject = `New Application: ${data.position} — ${data.applicantName}`;
  const html = emailWrapper(
    'New Job Application - Admin',
    'New Job Application',
    '',
    `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Position:</strong> ${data.position}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Application #:</strong> ${data.applicationNumber}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Applicant:</strong> ${data.applicantName}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Email:</strong> <a href="mailto:${data.applicantEmail}" style="color:${BRAND.primary};">${data.applicantEmail}</a></td></tr>
        ${data.phone ? `<tr><td style="padding:8px 0;color:${BRAND.textPrimary};"><strong>Phone:</strong> ${data.phone}</td></tr>` : ''}
      </table>
      <div style="text-align:center;margin-top:25px;">
        <a href="mailto:${data.applicantEmail}?subject=Re: Application for ${encodeURIComponent(data.position)}" style="display:inline-block;background:${BRAND.gradient};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">Contact Applicant</a>
      </div>
    `
  );
  return sendAdminEmail(subject, html, `Application: ${data.position}\nFrom: ${data.applicantName} (${data.applicantEmail})`);
}

export async function notifyAdminNewUser(data) {
  const subject = `New User: ${data.name} (${data.email})`;
  const html = emailWrapper(
    'New User - Admin',
    'New User Registered!',
    '',
    `
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:24px;color:${BRAND.primaryDark};font-weight:600;">${data.name}</div>
        <div style="color:${BRAND.textSecondary};margin-top:8px;">${data.email}</div>
        <p style="color:${BRAND.textMuted};margin-top:16px;font-size:14px;">A new user just joined Mumtaz AI!</p>
      </div>
    `
  );
  return sendAdminEmail(subject, html, `New User: ${data.name} (${data.email})`);
}

// =====================================================
// UTILITY: Parse User-Agent & IP for login alerts
// =====================================================

/**
 * Extract the real client IP from behind NGINX / load balancers.
 * Priority: X-Forwarded-For → X-Real-IP → req.ip (Express trust proxy) → socket
 */
function getClientIp(req) {
  let ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.ip ||  // Express respects trust proxy
    req.socket?.remoteAddress ||
    'Unknown';

  // Strip IPv4-mapped IPv6 prefix (::ffff:1.2.3.4 → 1.2.3.4)
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);

  return ip;
}

/**
 * Check if an IP is a loopback / private address
 */
function isLocalIp(ip) {
  return ['127.0.0.1', '::1', 'localhost', '0.0.0.0'].includes(ip) ||
         ip.startsWith('10.') ||
         ip.startsWith('192.168.') ||
         /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
}

/**
 * Try to get geo location from IP using free ip-api.com service.
 * Returns "City, Country" or "N/A" on failure. Non-blocking with timeout.
 */
async function getIpLocation(ip) {
  if (!ip || ip === 'Unknown' || isLocalIp(ip)) {
    return isLocalIp(ip) ? 'Local / Server' : 'N/A';
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();
    if (data.status === 'success') {
      const parts = [data.city, data.regionName, data.country].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'N/A';
    }
  } catch {
    // Timeout or network error — non-critical
  }
  return 'N/A';
}

/**
 * Parse browser name + version from User-Agent string
 */
function parseBrowser(ua) {
  if (!ua) return 'Unknown';

  // Order matters — check specific browsers before generic ones
  const browsers = [
    { name: 'Samsung Internet', regex: /SamsungBrowser\/([\d.]+)/ },
    { name: 'Opera', regex: /(?:OPR|Opera)\/([\d.]+)/ },
    { name: 'Brave', regex: /Brave\/([\d.]+)/ },
    { name: 'Vivaldi', regex: /Vivaldi\/([\d.]+)/ },
    { name: 'Microsoft Edge', regex: /Edg(?:e|A|iOS)?\/([\d.]+)/ },
    { name: 'Firefox', regex: /Firefox\/([\d.]+)/ },
    { name: 'Chrome', regex: /Chrome\/([\d.]+)/ },
    { name: 'Safari', regex: /Version\/([\d.]+).*Safari/ },
    { name: 'Mobile Safari', regex: /Mobile\/\w+ Safari/ },
  ];

  for (const { name, regex } of browsers) {
    const match = ua.match(regex);
    if (match) return match[1] ? `${name} ${match[1]}` : name;
  }

  // Fallback for bots / tools
  if (ua.includes('curl')) return 'curl';
  if (ua.includes('PostmanRuntime')) return 'Postman';
  if (ua.includes('axios')) return 'axios (API client)';
  if (ua.includes('node-fetch') || ua.includes('undici')) return 'Node.js (server)';

  return 'Unknown';
}

/**
 * Parse operating system from User-Agent string
 */
function parseOS(ua) {
  if (!ua) return 'Unknown';

  // Check specific before generic
  const systems = [
    { name: 'iOS', regex: /(?:iPhone|iPad|iPod).*OS ([\d_]+)/ },
    { name: 'Android', regex: /Android ([\d.]+)/ },
    { name: 'Chrome OS', regex: /CrOS/ },
    { name: 'macOS', regex: /Mac OS X ([\d_.]+)/ },
    { name: 'Windows 11', regex: /Windows NT 10\.0.*Build\/(?:2[2-9]\d{3}|[3-9]\d{4})/ },
    { name: 'Windows 10', regex: /Windows NT 10/ },
    { name: 'Windows 8.1', regex: /Windows NT 6\.3/ },
    { name: 'Windows 8', regex: /Windows NT 6\.2/ },
    { name: 'Windows 7', regex: /Windows NT 6\.1/ },
    { name: 'Windows', regex: /Windows/ },
    { name: 'Ubuntu', regex: /Ubuntu/ },
    { name: 'Linux', regex: /Linux/ },
  ];

  for (const { name, regex } of systems) {
    const match = ua.match(regex);
    if (match) {
      if (match[1]) {
        const ver = match[1].replace(/_/g, '.');
        return `${name} ${ver}`;
      }
      return name;
    }
  }

  return 'Unknown';
}

/**
 * Parse device type from User-Agent string
 */
function parseDevice(ua) {
  if (!ua) return 'Unknown';
  if (/Tablet|iPad/i.test(ua)) return 'Tablet';
  if (/Mobile|iPhone|Android.*Mobile|iPod/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

export function parseLoginDetails(req) {
  const ua = req.get('User-Agent') || req.headers['user-agent'] || '';
  const ip = getClientIp(req);

  const browser = parseBrowser(ua);
  const os = parseOS(ua);
  const device = parseDevice(ua);

  // Fetch geo location async — returns promise; callers can await or fire-and-forget
  const locationPromise = getIpLocation(ip);

  return {
    ip: isLocalIp(ip) ? `${ip} (local)` : ip,
    browser,
    os,
    device,
    location: 'Resolving...',
    time: new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short',
    }),
    _locationPromise: locationPromise,
  };
}

/**
 * Async version — resolves geo before returning.
 * Use: const details = await parseLoginDetailsAsync(req);
 */
export async function parseLoginDetailsAsync(req) {
  const details = parseLoginDetails(req);
  try {
    details.location = await details._locationPromise;
  } catch {
    details.location = 'N/A';
  }
  delete details._locationPromise;
  return details;
}

// Keep backward compatibility for legacy template callers
export function getWelcomeEmailTemplate(name) {
  return emailWrapper(
    'Welcome to Mumtaz AI',
    'Welcome to Mumtaz AI!',
    'Your journey into the future of AI begins now',
    `<p style="font-size:22px;color:${BRAND.primaryDark};font-weight:600;margin:0 0 20px;">Hello ${name}!</p>
     <p style="font-size:16px;line-height:1.6;color:${BRAND.textSecondary};">Welcome aboard! Start exploring at <a href="${BRAND.siteUrl}/dashboard" style="color:${BRAND.primary};">mumtaz.ai/dashboard</a></p>`
  );
}

export function getPasswordResetEmailTemplate(name, resetUrl) {
  return emailWrapper(
    'Reset Your Password - Mumtaz AI',
    'Password Reset Request',
    '',
    `<p style="font-size:22px;color:${BRAND.primaryDark};font-weight:600;margin:0 0 20px;">Hello ${name}!</p>
     <p style="font-size:16px;line-height:1.6;color:${BRAND.textSecondary};">Click below to reset your password:</p>
     <div style="text-align:center;margin:30px 0;">
       <a href="${resetUrl}" style="display:inline-block;background:${BRAND.gradient};color:#fff;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:600;font-size:16px;box-shadow:0 4px 15px rgba(14,165,233,0.35);">Reset Password</a>
     </div>
     <p style="font-size:13px;color:${BRAND.textMuted};word-break:break-all;">URL: ${resetUrl}</p>`
  );
}
