import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
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

// Password Reset Email Template
function getPasswordResetEmailTemplate(userName: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - One Last AI</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 28px; margin: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 22px; color: #f5576c; font-weight: 600; margin: 0 0 20px; }
    .message { font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 30px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white !important; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; }
    .btn-container { text-align: center; margin: 30px 0; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .warning-text { color: #856404; font-size: 14px; margin: 0; }
    .url-fallback { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; word-break: break-all; font-size: 12px; color: #666; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; }
    .footer-text { color: #6c757d; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi ${userName}!</p>
      <p class="message">
        We received a request to reset your password for your One Last AI account.
        Click the button below to create a new password:
      </p>
      
      <div class="btn-container">
        <a href="${resetUrl}" class="btn">Reset My Password</a>
      </div>
      
      <div class="warning">
        <p class="warning-text">⏰ This link will expire in <strong>1 hour</strong> for security reasons.</p>
      </div>
      
      <p class="message">
        If you didn't request this password reset, you can safely ignore this email.
        Your password will remain unchanged.
      </p>
      
      <div class="url-fallback">
        <strong>Can't click the button?</strong> Copy and paste this link:<br>
        ${resetUrl}
      </div>
    </div>
    <div class="footer">
      <p class="footer-text">
        This email was sent by One Last AI<br>
        © ${new Date().getFullYear()} One Last AI. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * POST /api/auth/reset-password
 * Request a password reset email
 */
export async function POST(request: NextRequest) {
  try {
    const { email, token, newPassword } = await request.json();

    // If token and newPassword are provided, this is the actual password reset
    if (token && newPassword) {
      // Hash the token to compare with stored hash
      const tokenHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with valid reset token using Prisma
      const user = await prisma.user.findFirst({
        where: {
          resetPasswordToken: tokenHash,
          resetPasswordExpires: { gt: new Date() }
        }
      });

      if (!user) {
        return NextResponse.json(
          { message: 'Invalid or expired reset token' },
          { status: 400 }
        );
      }

      // Validate new password
      if (newPassword.length < 8) {
        return NextResponse.json(
          { message: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }

      // Import bcrypt dynamically
      const bcrypt = await import('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Password has been reset successfully',
      });
    }

    // Otherwise, this is a request for a reset email
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save token to user (expires in 1 hour)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      }
    });

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'https://onelastai.co';
    const resetUrl = `${baseUrl}/auth/reset-password/confirm?token=${resetToken}`;

    // Send email
    const transporter = getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: 'One Last AI <noreply@onelastai.co>',
          to: user.email,
          subject: '🔐 Reset Your Password - One Last AI',
          html: getPasswordResetEmailTemplate(user.name || 'User', resetUrl),
        });
        console.log(`✅ Password reset email sent to ${user.email}`);
      } catch (emailError: any) {
        console.error('❌ Failed to send password reset email:', emailError.message);
        // Don't fail the request - token is saved, user can try again
      }
    } else {
      console.log('[PASSWORD RESET] SMTP not configured. Reset URL:', resetUrl);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { message: 'Failed to process request' },
      { status: 500 }
    );
  }
}
