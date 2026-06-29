/**
 * Newsletter & Early Access Subscription Routes
 * Handles email subscriptions, notifications, and list management
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { rateLimiters } from '../lib/cache.js';
import nodemailer from 'nodemailer';
import { verifyTurnstileToken } from '../../lib/turnstile.js';

const router = express.Router();

// SMTP Configuration
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'mail.privateemail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'noreply@mumtaz.ai',
    pass: process.env.SMTP_PASS || '',
  },
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@mumtaz.ai';
const FROM_EMAIL = process.env.SMTP_FROM || 'Mumtaz AI <noreply@mumtaz.ai>';

// Create transporter
let transporter = null;
function getTransporter() {
  if (!transporter && SMTP_CONFIG.auth.user && SMTP_CONFIG.auth.pass) {
    transporter = nodemailer.createTransport({
      host: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      secure: SMTP_CONFIG.secure,
      auth: SMTP_CONFIG.auth,
    });
  }
  return transporter;
}

// =====================================================
// EMAIL TEMPLATES
// =====================================================

function getSubscriberConfirmationEmail(name, source) {
  const greeting = name ? `Hi ${name}!` : 'Hi there!';
  const sourceText = source === 'early_access' ? 'early access list' : 'newsletter';
  
  const BRAND = {
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #0c95f1 100%)',
    primary: '#0ea5e9',
    primaryDark: '#0284c7',
    dark: '#0f172a',
    cardBg: '#ffffff',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    border: '#e2e8f0',
    surfaceLight: '#f1f5f9',
    logoUrl: process.env.BRAND_LOGO_URL || 'https://mumtaz.ai/images/logos/company-logo.png',
    siteUrl: process.env.SITE_URL || 'https://mumtaz.ai',
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Mumtaz AI</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:${BRAND.dark};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.dark};padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:${BRAND.cardBg};border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
        <!-- Header -->
        <tr><td style="background:${BRAND.gradient};padding:40px 30px;text-align:center;">
          <img src="${BRAND.logoUrl}" alt="Mumtaz AI" width="56" height="56" style="display:block;margin:0 auto 14px;border-radius:12px;" />
          <h1 style="color:#ffffff;font-size:28px;margin:0 0 6px;font-weight:700;letter-spacing:-0.3px;">🎉 You're In!</h1>
          <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;font-weight:400;">Welcome to Mumtaz AI</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 30px;color:${BRAND.textPrimary};">
          <p style="font-size:18px;color:${BRAND.primaryDark};font-weight:600;margin:0 0 16px;">${greeting}</p>
          <p style="font-size:15px;line-height:1.8;color:${BRAND.textSecondary};margin:0 0 28px;">
            Thank you for joining our ${sourceText}! You're now part of an exclusive community of AI enthusiasts and innovators.
          </p>

          <!-- What to expect card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surfaceLight};border-radius:12px;border:1px solid ${BRAND.border};margin-bottom:28px;">
            <tr><td style="padding:24px 28px;">
              <h3 style="color:${BRAND.textPrimary};margin:0 0 16px;font-size:17px;font-weight:700;">🚀 What to expect:</h3>
              <table cellpadding="0" cellspacing="0" style="width:100%;">
                <tr><td style="padding:6px 0;color:${BRAND.textSecondary};font-size:14px;line-height:1.6;">✅ Exclusive product updates &amp; new features</td></tr>
                <tr><td style="padding:6px 0;color:${BRAND.textSecondary};font-size:14px;line-height:1.6;">✅ AI tips, tutorials, and best practices</td></tr>
                <tr><td style="padding:6px 0;color:${BRAND.textSecondary};font-size:14px;line-height:1.6;">✅ Early access to new AI agents &amp; tools</td></tr>
                <tr><td style="padding:6px 0;color:${BRAND.textSecondary};font-size:14px;line-height:1.6;">✅ Special offers and promotions</td></tr>
              </table>
            </td></tr>
          </table>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 24px;">
              <a href="${BRAND.siteUrl}" style="display:inline-block;background:${BRAND.gradient};color:#ffffff !important;text-decoration:none;padding:16px 48px;border-radius:50px;font-weight:600;font-size:16px;box-shadow:0 6px 20px rgba(14,165,233,0.35);letter-spacing:0.3px;">
                Explore Mumtaz AI →
              </a>
            </td></tr>
          </table>

          <p style="font-size:14px;color:${BRAND.textMuted};text-align:center;margin:0;">
            Questions? Reach us at <a href="mailto:support@mumtaz.ai" style="color:${BRAND.primary};text-decoration:none;font-weight:600;">support@mumtaz.ai</a>
          </p>
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
            Need help? Contact us at <a href="mailto:support@mumtaz.ai" style="color:${BRAND.primary};text-decoration:none;font-weight:600;">support@mumtaz.ai</a>
          </p>
          <p style="font-size:13px;color:${BRAND.textSecondary};margin:0 0 10px;">
            <a href="${BRAND.siteUrl}" style="color:${BRAND.primary};text-decoration:none;">mumtaz.ai</a> &nbsp;|&nbsp;
            <a href="${BRAND.siteUrl}/legal/privacy-policy" style="color:${BRAND.primary};text-decoration:none;">Privacy Policy</a> &nbsp;|&nbsp;
            <a href="${BRAND.siteUrl}/legal/terms-of-service" style="color:${BRAND.primary};text-decoration:none;">Terms of Service</a>
          </p>
          <p style="font-size:12px;color:${BRAND.textMuted};margin:10px 0 0;">&copy; ${new Date().getFullYear()} Mumtaz AI. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function getAdminNotificationEmail(email, name, source, metadata) {
  const sourceLabel = {
    newsletter: '📰 Newsletter',
    early_access: '🚀 Early Access',
    footer: '📍 Footer',
    popup: '💬 Popup',
    blog: '📝 Blog',
    other: '📧 Other',
  }[source] || '📧 Subscription';

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .label { font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
    .value { font-size: 18px; color: #333; margin-bottom: 20px; font-weight: 500; }
    .meta { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .meta-item { font-size: 13px; color: #666; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${sourceLabel} Signup!</h1>
    </div>
    <div class="content">
      <div class="label">Email</div>
      <div class="value"><a href="mailto:${email}">${email}</a></div>
      
      ${name ? `<div class="label">Name</div><div class="value">${name}</div>` : ''}
      
      <div class="label">Source</div>
      <div class="value">${source}</div>
      
      <div class="label">Subscribed At</div>
      <div class="value">${new Date().toLocaleString()}</div>
      
      ${metadata ? `
      <div class="meta">
        <div class="meta-item"><strong>IP:</strong> ${metadata.ip || 'Unknown'}</div>
        <div class="meta-item"><strong>Referrer:</strong> ${metadata.referrer || 'Direct'}</div>
        <div class="meta-item"><strong>User Agent:</strong> ${metadata.userAgent || 'Unknown'}</div>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>`;
}

// =====================================================
// ROUTES
// =====================================================

/**
 * POST /api/newsletter/subscribe
 * Subscribe to newsletter or early access
 */
router.post('/subscribe', rateLimiters.api, async (req, res) => {
  try {
    const { email, name, source = 'newsletter', turnstileToken } = req.body;

    // Verify Turnstile — mandatory in production
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !turnstileToken) {
      return res.status(403).json({ success: false, message: 'Bot verification is required.' });
    }
    if (turnstileToken) {
      const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip;
      const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
      if (!turnstileResult.success) {
        return res.status(403).json({ success: false, message: 'Bot verification failed. Please try again.' });
      }
    }

    // Validate email
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Get metadata
    const metadata = {
      ip: req.headers['x-forwarded-for'] || req.ip || 'Unknown',
      userAgent: req.headers['user-agent'] || 'Unknown',
      referrer: req.headers['referer'] || req.body.referrer || 'Direct',
    };

    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      // If previously unsubscribed, reactivate
      if (existing.status === 'unsubscribed') {
        await prisma.newsletterSubscriber.update({
          where: { email: normalizedEmail },
          data: {
            status: 'active',
            source: source,
            name: name || existing.name,
            unsubscribedAt: null,
            confirmedAt: new Date(),
          },
        });

        return res.json({
          success: true,
          message: 'Welcome back! You have been resubscribed.',
          isResubscribe: true,
        });
      }

      // Already active subscriber — tell the user clearly
      return res.status(409).json({
        success: false,
        message: 'This email is already subscribed. Stay tuned for updates!',
        alreadySubscribed: true,
      });
    }

    // Create new subscriber
    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email: normalizedEmail,
        name: name || null,
        source: source,
        status: 'active',
        confirmedAt: new Date(),
        ipAddress: metadata.ip,
        userAgent: metadata.userAgent,
        referrer: metadata.referrer,
      },
    });

    // Send emails asynchronously (don't block response)
    const mailer = getTransporter();
    if (mailer) {
      // Send confirmation to subscriber
      mailer.sendMail({
        from: FROM_EMAIL,
        to: normalizedEmail,
        subject: '🎉 Welcome to Mumtaz AI!',
        html: getSubscriberConfirmationEmail(name, source),
      }).then(() => {
      }).catch((err) => {
        console.error('Failed to send confirmation email:', err.message);
      });

      // Notify admin
      mailer.sendMail({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `📬 New ${source === 'early_access' ? 'Early Access' : 'Newsletter'} Signup: ${normalizedEmail}`,
        html: getAdminNotificationEmail(normalizedEmail, name, source, metadata),
      }).then(() => {
      }).catch((err) => {
        console.error('Failed to send admin notification:', err.message);
      });
    }

    res.json({
      success: true,
      message: 'Successfully subscribed! Check your inbox for a confirmation.',
      subscriberId: subscriber.id,
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
    });
  }
});

/**
 * POST /api/newsletter/unsubscribe
 * Unsubscribe from newsletter
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in our mailing list.',
      });
    }

    await prisma.newsletterSubscriber.update({
      where: { email: normalizedEmail },
      data: {
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'You have been successfully unsubscribed.',
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
    });
  }
});

/**
 * GET /api/newsletter/stats
 * Get subscriber statistics (admin only - should add auth)
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await prisma.newsletterSubscriber.groupBy({
      by: ['status', 'source'],
      _count: { id: true },
    });

    const total = await prisma.newsletterSubscriber.count();
    const active = await prisma.newsletterSubscriber.count({
      where: { status: 'active' },
    });

    const recentSubscribers = await prisma.newsletterSubscriber.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        email: true,
        name: true,
        source: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      stats: {
        total,
        active,
        breakdown: stats,
        recent: recentSubscribers,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats.',
    });
  }
});

export default router;
