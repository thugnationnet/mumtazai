import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// SMTP Configuration (Namecheap Private Email)
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'mail.privateemail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'noreply@onelastai.co',
    pass: process.env.SMTP_PASS || '',
  },
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@onelastai.co';

// Create transporter
function getTransporter() {
  if (SMTP_CONFIG.auth.user && SMTP_CONFIG.auth.pass) {
    return nodemailer.createTransport({
      host: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      secure: SMTP_CONFIG.secure,
      auth: SMTP_CONFIG.auth,
    });
  }
  return null;
}

// Demo Request Email Template for Admin
function getDemoRequestAdminEmail(data: {
  name: string;
  email: string;
  company: string;
  phone: string;
  interest: string;
  date: string;
  time: string;
  message: string;
}): string {
  const interestLabels: Record<string, string> = {
    'ai-agents': 'AI Agent Marketplace',
    'enterprise': 'Enterprise Solutions',
    'custom-agents': 'Custom AI Agent Development',
    'integration': 'API Integration',
    'consulting': 'AI Strategy Consulting',
    'other': 'Other',
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Demo Request - One Last AI</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 28px; margin: 0; }
    .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; }
    .content { padding: 40px 30px; }
    .info-card { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 25px; margin-bottom: 25px; border-left: 4px solid #667eea; }
    .info-row { display: flex; margin-bottom: 15px; }
    .info-label { font-weight: 600; color: #64748b; min-width: 140px; }
    .info-value { color: #1e293b; font-weight: 500; }
    .highlight { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700; }
    .message-box { background: #fef3c7; border-radius: 12px; padding: 20px; margin-top: 20px; border-left: 4px solid #f59e0b; }
    .message-label { font-weight: 600; color: #92400e; margin-bottom: 8px; }
    .message-text { color: #78350f; line-height: 1.6; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer-text { color: #64748b; font-size: 12px; margin: 0; }
    .badge { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .priority { background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-block; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 New Demo Request!</h1>
      <p>Someone wants to see One Last AI in action</p>
    </div>
    <div class="content">
      <div style="text-align: center; margin-bottom: 25px;">
        <span class="badge">${interestLabels[data.interest] || data.interest}</span>
        <div class="priority">📅 ${data.date} at ${data.time}</div>
      </div>
      
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">👤 Name:</span>
          <span class="info-value highlight">${data.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📧 Email:</span>
          <span class="info-value">${data.email}</span>
        </div>
        ${data.company ? `
        <div class="info-row">
          <span class="info-label">🏢 Company:</span>
          <span class="info-value">${data.company}</span>
        </div>
        ` : ''}
        ${data.phone ? `
        <div class="info-row">
          <span class="info-label">📱 Phone:</span>
          <span class="info-value">${data.phone}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">🎯 Interest:</span>
          <span class="info-value">${interestLabels[data.interest] || data.interest}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📅 Preferred Date:</span>
          <span class="info-value">${data.date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">⏰ Preferred Time:</span>
          <span class="info-value">${data.time}</span>
        </div>
      </div>
      
      ${data.message ? `
      <div class="message-box">
        <div class="message-label">💬 Additional Details:</div>
        <div class="message-text">${data.message}</div>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #64748b; font-size: 14px;">
          Reply to this email or contact <strong>${data.email}</strong> to confirm the demo.
        </p>
      </div>
    </div>
    <div class="footer">
      <p class="footer-text">
        This notification was sent from One Last AI Demo Request Form<br>
        © ${new Date().getFullYear()} One Last AI. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Confirmation Email for User
function getDemoRequestUserEmail(data: { name: string; date: string; time: string }): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo Request Received - One Last AI</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 32px; margin: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 22px; color: #667eea; font-weight: 600; margin: 0 0 20px; }
    .message { font-size: 16px; line-height: 1.8; color: #555; margin-bottom: 25px; }
    .schedule-card { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; border: 2px dashed #667eea; }
    .schedule-date { font-size: 24px; font-weight: 700; color: #667eea; }
    .schedule-time { font-size: 18px; color: #64748b; margin-top: 5px; }
    .next-steps { background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 25px 0; }
    .next-steps h3 { color: #166534; margin: 0 0 15px; }
    .next-steps ul { margin: 0; padding-left: 20px; }
    .next-steps li { color: #15803d; margin-bottom: 8px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 600; font-size: 16px; margin-top: 20px; }
    .footer { background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer-text { color: #64748b; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Demo Request Received!</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi ${data.name}! 👋</p>
      <p class="message">
        Thank you for your interest in One Last AI! We're excited to show you how our AI agents can transform your workflow.
      </p>
      
      <div class="schedule-card">
        <div style="font-size: 14px; color: #64748b; margin-bottom: 10px;">📅 Your Requested Time</div>
        <div class="schedule-date">${data.date}</div>
        <div class="schedule-time">at ${data.time}</div>
      </div>
      
      <div class="next-steps">
        <h3>📋 What happens next?</h3>
        <ul>
          <li>Our team will review your request within 24 hours</li>
          <li>You'll receive a calendar invite with the meeting link</li>
          <li>Prepare any questions you'd like to discuss</li>
        </ul>
      </div>
      
      <p class="message">
        In the meantime, feel free to explore our AI agents and see what we have to offer!
      </p>
      
      <div style="text-align: center;">
        <a href="https://onelastai.co/agents" class="btn">Explore AI Agents →</a>
      </div>
    </div>
    <div class="footer">
      <p class="footer-text">
        Questions? Reply to this email or contact support@onelastai.co<br>
        © ${new Date().getFullYear()} One Last AI. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * POST /api/demo-request
 * Handle demo booking requests
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, company, phone, interest, date, time, message } = await request.json();

    // Validation
    if (!name || !email || !interest || !date || !time) {
      return NextResponse.json(
        { success: false, message: 'Please fill in all required fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const transporter = getTransporter();

    // Send notification to admin
    if (transporter) {
      try {
        // Admin notification
        await transporter.sendMail({
          from: 'One Last AI <noreply@onelastai.co>',
          to: ADMIN_EMAIL,
          replyTo: email,
          subject: `🎯 New Demo Request from ${name}${company ? ` (${company})` : ''}`,
          html: getDemoRequestAdminEmail({ name, email, company, phone, interest, date, time, message }),
        });
        console.log(`✅ Demo request admin notification sent for ${email}`);

        // User confirmation
        await transporter.sendMail({
          from: 'One Last AI <noreply@onelastai.co>',
          to: email,
          subject: '🎉 Demo Request Received - One Last AI',
          html: getDemoRequestUserEmail({ name, date, time }),
        });
        console.log(`✅ Demo request confirmation sent to ${email}`);
      } catch (emailError: any) {
        console.error('❌ Failed to send demo request emails:', emailError.message);
        // Don't fail the request - form submission is still valid
      }
    } else {
      console.log('[DEMO REQUEST] SMTP not configured. Demo request from:', email);
    }

    return NextResponse.json({
      success: true,
      message: 'Demo request submitted successfully!',
    });
  } catch (error) {
    console.error('Demo request error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit request. Please try again.' },
      { status: 500 }
    );
  }
}
