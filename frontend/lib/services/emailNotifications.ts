/**
 * Email Notification Service for Support Tickets
 * 
 * Uses Nodemailer with Namecheap Private Email SMTP
 */

import nodemailer from 'nodemailer';

// Email configuration from environment (Namecheap Private Email)
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'mail.privateemail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.SMTP_USER || 'noreply@mumtaz.ai',
    pass: process.env.SMTP_PASS || '',
  },
  from: process.env.SMTP_FROM || 'Mumtaz AI <noreply@mumtaz.ai>',
};

// Admin email for notifications
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@mumtaz.ai';

// Create transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter && EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass) {
    transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
      auth: EMAIL_CONFIG.auth,
    });
  }
  return transporter;
}

// =====================================================
// Email Templates
// =====================================================

interface TicketEmailData {
  ticketNumber: number;
  ticketId: string;
  subject: string;
  userName: string;
  userEmail: string;
  status?: string;
  message?: string;
  priority?: string;
}

export function getTicketCreatedEmail(data: TicketEmailData): { subject: string; html: string; text: string } {
  return {
    subject: `[Ticket #${data.ticketNumber}] We received your request: ${data.subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1; }
          .btn { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 Support Ticket Created</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName || 'there'} 💕</p>
            <p>Thank you for reaching out! We've received your support request and our team is on it.</p>
            
            <div class="ticket-info">
              <strong>Ticket #${data.ticketNumber}</strong><br>
              <strong>Subject:</strong> ${data.subject}<br>
              <strong>Priority:</strong> ${data.priority || 'Medium'}
            </div>
            
            <p>We typically respond within 24 hours, but often much sooner! 🚀</p>
            
            <a href="https://mumtaz.ai/dashboard/support-tickets" class="btn">View Your Ticket</a>
            
            <div class="footer">
              <p>With love,<br>Mumtaz AI Support Team 🌙</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${data.userName || 'there'},

Thank you for reaching out! We've received your support request.

Ticket #${data.ticketNumber}
Subject: ${data.subject}
Priority: ${data.priority || 'Medium'}

We typically respond within 24 hours, but often much sooner!

View your ticket: https://mumtaz.ai/dashboard/support-tickets

With love,
Mumtaz AI Support Team`
  };
}

export function getNewReplyEmail(data: TicketEmailData): { subject: string; html: string; text: string } {
  return {
    subject: `[Ticket #${data.ticketNumber}] New Reply: ${data.subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .message-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .btn { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 New Reply on Your Ticket</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName || 'there'} 💕</p>
            <p>You have a new reply on Ticket #${data.ticketNumber}!</p>
            
            <div class="message-box">
              ${data.message?.substring(0, 500)}${(data.message?.length || 0) > 500 ? '...' : ''}
            </div>
            
            <a href="https://mumtaz.ai/dashboard/support-tickets" class="btn">View Full Conversation</a>
            
            <div class="footer">
              <p>With love,<br>Mumtaz AI Support Team 🌙</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${data.userName || 'there'},

You have a new reply on Ticket #${data.ticketNumber}!

---
${data.message?.substring(0, 500)}${(data.message?.length || 0) > 500 ? '...' : ''}
---

View full conversation: https://mumtaz.ai/dashboard/support-tickets

With love,
Mumtaz AI Support Team`
  };
}

export function getStatusChangeEmail(data: TicketEmailData): { subject: string; html: string; text: string } {
  const statusEmoji: Record<string, string> = {
    'open': '📬',
    'in-progress': '⚙️',
    'waiting-customer': '⏳',
    'resolved': '✅',
    'closed': '📁'
  };
  
  const emoji = statusEmoji[data.status || ''] || '📋';
  
  return {
    subject: `[Ticket #${data.ticketNumber}] Status Update: ${data.status?.replace('-', ' ')}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-badge { display: inline-block; padding: 10px 20px; background: #10b981; color: white; border-radius: 20px; font-size: 18px; margin: 20px 0; }
          .btn { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${emoji} Ticket Status Updated</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName || 'there'} 💕</p>
            <p>Your ticket #${data.ticketNumber} status has been updated:</p>
            
            <div style="text-align: center;">
              <span class="status-badge">${data.status?.replace('-', ' ').toUpperCase()}</span>
            </div>
            
            <p><strong>Subject:</strong> ${data.subject}</p>
            
            ${data.status === 'resolved' ? `
              <p>🎉 Great news! Your issue has been resolved. If you're satisfied, we'd love to hear your feedback!</p>
            ` : ''}
            
            ${data.status === 'waiting-customer' ? `
              <p>⏳ We need your response to continue. Please check your ticket and reply when you can!</p>
            ` : ''}
            
            <a href="https://mumtaz.ai/dashboard/support-tickets" class="btn">View Ticket Details</a>
            
            <div class="footer">
              <p>With love,<br>Mumtaz AI Support Team 🌙</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${data.userName || 'there'},

Your ticket #${data.ticketNumber} status has been updated to: ${data.status?.replace('-', ' ').toUpperCase()}

Subject: ${data.subject}

${data.status === 'resolved' ? 'Great news! Your issue has been resolved. If you\'re satisfied, we\'d love to hear your feedback!' : ''}
${data.status === 'waiting-customer' ? 'We need your response to continue. Please check your ticket and reply when you can!' : ''}

View ticket: https://mumtaz.ai/dashboard/support-tickets

With love,
Mumtaz AI Support Team`
  };
}

export function getSlaBreachEmail(data: TicketEmailData): { subject: string; html: string; text: string } {
  return {
    subject: `🚨 SLA BREACHED: Ticket #${data.ticketNumber} requires immediate attention`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
          .btn { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 SLA BREACHED</h1>
          </div>
          <div class="content">
            <p><strong>URGENT: This ticket requires immediate attention!</strong></p>
            
            <div class="alert-box">
              <strong>Ticket #${data.ticketNumber}</strong><br>
              <strong>Subject:</strong> ${data.subject}<br>
              <strong>Customer:</strong> ${data.userEmail}<br>
              <strong>Priority:</strong> ESCALATED TO URGENT
            </div>
            
            <p>The SLA for this ticket has been breached. Please respond immediately.</p>
            
            <a href="https://mumtaz.ai/admin/support" class="btn">Handle Ticket Now</a>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `🚨 SLA BREACHED - URGENT

Ticket #${data.ticketNumber} requires immediate attention!

Subject: ${data.subject}
Customer: ${data.userEmail}
Priority: ESCALATED TO URGENT

Please respond immediately: https://mumtaz.ai/admin/support`
  };
}

// =====================================================
// Send Email Function
// =====================================================

export async function sendSupportEmail(
  to: string,
  template: { subject: string; html: string; text: string }
): Promise<{ success: boolean; error?: string }> {
  const transport = getTransporter();
  
  if (!transport) {
    return { success: true }; // Return success even without SMTP for dev
  }

  try {
    await transport.sendMail({
      from: EMAIL_CONFIG.from,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('[EMAIL] Failed to send:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// Convenience Functions
// =====================================================

export async function notifyTicketCreated(data: TicketEmailData) {
  const template = getTicketCreatedEmail(data);
  // Send to customer
  await sendSupportEmail(data.userEmail, template);
  // Also notify admin
  await notifyAdminNewTicket(data);
  return { success: true };
}

export async function notifyNewReply(data: TicketEmailData) {
  const template = getNewReplyEmail(data);
  return sendSupportEmail(data.userEmail, template);
}

export async function notifyStatusChange(data: TicketEmailData) {
  const template = getStatusChangeEmail(data);
  return sendSupportEmail(data.userEmail, template);
}

export async function notifySlaBreach(data: TicketEmailData, adminEmail: string = ADMIN_EMAIL) {
  const template = getSlaBreachEmail(data);
  return sendSupportEmail(adminEmail, template);
}

// =====================================================
// Admin Notification Functions
// =====================================================

export async function notifyAdminNewTicket(data: TicketEmailData) {
  const template = {
    subject: `🎫 New Support Ticket #${data.ticketNumber}: ${data.subject}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .label { font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
    .value { font-size: 16px; color: #333; margin-bottom: 20px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎫 New Support Ticket</h1>
    </div>
    <div class="content">
      <div class="label">Ticket Number</div>
      <div class="value">#${data.ticketNumber}</div>
      
      <div class="label">Subject</div>
      <div class="value">${data.subject}</div>
      
      <div class="label">Customer</div>
      <div class="value">${data.userName} (${data.userEmail})</div>
      
      <div class="label">Status</div>
      <div class="value">${data.status || 'Open'}</div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://mumtaz.ai/admin/support" class="btn">View in Admin Panel</a>
      </div>
    </div>
  </div>
</body>
</html>`,
    text: `New Support Ticket #${data.ticketNumber}\n\nSubject: ${data.subject}\nCustomer: ${data.userName} (${data.userEmail})\n\nView: https://mumtaz.ai/admin/support`
  };
  
  return sendSupportEmail(ADMIN_EMAIL, template);
}

export async function notifyAdminContactForm(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const template = {
    subject: `📬 New Contact Form: ${data.subject}`,
    html: `
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
    .value { font-size: 16px; color: #333; margin-bottom: 20px; }
    .message-box { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #11998e; }
    .btn { display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📬 New Contact Message</h1>
    </div>
    <div class="content">
      <div class="label">From</div>
      <div class="value">${data.name}</div>
      
      <div class="label">Email</div>
      <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
      
      <div class="label">Subject</div>
      <div class="value">${data.subject}</div>
      
      <div class="label">Message</div>
      <div class="message-box">${data.message.replace(/\n/g, '<br>')}</div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" class="btn">Reply to ${data.name}</a>
      </div>
    </div>
  </div>
</body>
</html>`,
    text: `New Contact Form Submission\n\nFrom: ${data.name}\nEmail: ${data.email}\nSubject: ${data.subject}\n\nMessage:\n${data.message}`
  };
  
  return sendSupportEmail(ADMIN_EMAIL, template);
}

export async function notifyAdminJobApplication(data: {
  name: string;
  email: string;
  position: string;
  phone?: string;
  resumeUrl?: string;
  coverLetter?: string;
}) {
  const template = {
    subject: `💼 New Job Application: ${data.position} - ${data.name}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .label { font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
    .value { font-size: 16px; color: #333; margin-bottom: 20px; }
    .cover-letter { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #f5576c; }
    .btn { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💼 New Job Application</h1>
    </div>
    <div class="content">
      <div class="label">Position</div>
      <div class="value" style="font-size: 20px; font-weight: 600; color: #f5576c;">${data.position}</div>
      
      <div class="label">Applicant Name</div>
      <div class="value">${data.name}</div>
      
      <div class="label">Email</div>
      <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
      
      ${data.phone ? `<div class="label">Phone</div><div class="value">${data.phone}</div>` : ''}
      
      ${data.coverLetter ? `<div class="label">Cover Letter</div><div class="cover-letter">${data.coverLetter.replace(/\n/g, '<br>')}</div>` : ''}
      
      <div style="text-align: center; margin-top: 30px;">
        ${data.resumeUrl ? `<a href="${data.resumeUrl}" class="btn">📄 View Resume</a>` : ''}
        <a href="mailto:${data.email}?subject=Re: Your Application for ${encodeURIComponent(data.position)}" class="btn">Reply</a>
      </div>
    </div>
  </div>
</body>
</html>`,
    text: `New Job Application\n\nPosition: ${data.position}\nName: ${data.name}\nEmail: ${data.email}${data.phone ? `\nPhone: ${data.phone}` : ''}${data.coverLetter ? `\n\nCover Letter:\n${data.coverLetter}` : ''}`
  };
  
  return sendSupportEmail(ADMIN_EMAIL, template);
}

export async function notifyAdminEarlyAccess(data: {
  email: string;
  name?: string;
  source?: string;
}) {
  const template = {
    subject: `🚀 New Early Access Signup: ${data.email}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 30px; text-align: center; }
    .email { font-size: 24px; color: #4facfe; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 New Early Access Signup!</h1>
    </div>
    <div class="content">
      <p style="color: #666;">Someone just signed up for early access!</p>
      <div class="email">${data.email}</div>
      ${data.name ? `<p style="color: #333; margin-top: 10px;">Name: ${data.name}</p>` : ''}
      ${data.source ? `<p style="color: #666; font-size: 14px;">Source: ${data.source}</p>` : ''}
    </div>
  </div>
</body>
</html>`,
    text: `New Early Access Signup!\n\nEmail: ${data.email}${data.name ? `\nName: ${data.name}` : ''}${data.source ? `\nSource: ${data.source}` : ''}`
  };
  
  return sendSupportEmail(ADMIN_EMAIL, template);
}

export async function notifyAdminNewUser(data: {
  email: string;
  name: string;
}) {
  const template = {
    subject: `👋 New User Registered: ${data.name}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 30px; text-align: center; }
    .name { font-size: 24px; color: #667eea; font-weight: 600; }
    .email { color: #666; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>👋 New User Registered!</h1>
    </div>
    <div class="content">
      <div class="name">${data.name}</div>
      <div class="email">${data.email}</div>
      <p style="color: #888; margin-top: 20px; font-size: 14px;">A new user just joined Mumtaz AI!</p>
    </div>
  </div>
</body>
</html>`,
    text: `New User Registered!\n\nName: ${data.name}\nEmail: ${data.email}`
  };
  
  return sendSupportEmail(ADMIN_EMAIL, template);
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail(data: {
  email: string;
  name: string;
}) {
  const template = {
    subject: `🎉 Welcome to Mumtaz AI, ${data.name}!`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Mumtaz AI</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 32px; margin: 0 0 10px; }
    .header p { color: rgba(255,255,255,0.9); font-size: 18px; margin: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 24px; color: #764ba2; font-weight: 600; margin: 0 0 20px; }
    .message { font-size: 16px; line-height: 1.8; color: #555; margin-bottom: 30px; }
    .features { margin: 30px 0; }
    .feature { display: flex; align-items: flex-start; margin: 15px 0; }
    .feature-icon { font-size: 24px; margin-right: 15px; }
    .feature-text { font-size: 15px; color: #555; }
    .feature-title { font-weight: 600; color: #333; margin-bottom: 3px; }
    .btn-container { text-align: center; margin: 40px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; text-decoration: none; padding: 16px 50px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4); }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
    .footer-text { color: #6c757d; font-size: 12px; margin: 0; }
    .social { margin: 20px 0; }
    .social a { margin: 0 10px; text-decoration: none; font-size: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌟 Welcome to Mumtaz AI!</h1>
      <p>Your journey to smarter AI assistants starts here</p>
    </div>
    <div class="content">
      <p class="greeting">Hi ${data.name}! 👋</p>
      <p class="message">
        Thank you for joining Mumtaz AI! We're thrilled to have you as part of our community. 
        You now have access to powerful AI agents designed to help you work smarter, not harder.
      </p>
      
      <div class="features">
        <div class="feature">
          <span class="feature-icon">🤖</span>
          <div>
            <div class="feature-title">AI Agents Marketplace</div>
            <div class="feature-text">Discover and deploy specialized AI agents for any task</div>
          </div>
        </div>
        <div class="feature">
          <span class="feature-icon">💬</span>
          <div>
            <div class="feature-title">Universal Chat</div>
            <div class="feature-text">Chat with multiple AI models in one unified interface</div>
          </div>
        </div>
        <div class="feature">
          <span class="feature-icon">🎨</span>
          <div>
            <div class="feature-title">Canvas Builder</div>
            <div class="feature-text">Create stunning visuals and apps with AI assistance</div>
          </div>
        </div>
        <div class="feature">
          <span class="feature-icon">📊</span>
          <div>
            <div class="feature-title">Personal Dashboard</div>
            <div class="feature-text">Track your usage, manage subscriptions, and more</div>
          </div>
        </div>
      </div>
      
      <div class="btn-container">
        <a href="https://mumtaz.ai/dashboard" class="btn">Go to Dashboard →</a>
      </div>
      
      <p class="message" style="margin-top: 30px;">
        If you have any questions, feel free to reach out to our support team. We're here to help! 💕
      </p>
    </div>
    <div class="footer">
      <div class="social">
        <span>Follow us:</span>
      </div>
      <p class="footer-text">
        You received this email because you signed up for Mumtaz AI.<br>
        © ${new Date().getFullYear()} Mumtaz AI. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`,
    text: `Welcome to Mumtaz AI, ${data.name}!

Thank you for joining us! You now have access to:

🤖 AI Agents Marketplace - Discover and deploy specialized AI agents
💬 Universal Chat - Chat with multiple AI models in one interface
🎨 Canvas Builder - Create stunning visuals with AI assistance
📊 Personal Dashboard - Track usage and manage subscriptions

Get started: https://mumtaz.ai/dashboard

If you have any questions, our support team is here to help!

© ${new Date().getFullYear()} Mumtaz AI. All rights reserved.`
  };
  
  const transport = getTransporter();
  if (!transport) {
    return { success: false, message: 'SMTP not configured' };
  }

  try {
    await transport.sendMail({
      from: EMAIL_CONFIG.from,
      to: data.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send welcome email:', error.message);
    return { success: false, message: error.message };
  }
}
