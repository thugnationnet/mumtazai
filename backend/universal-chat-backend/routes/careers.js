/**
 * CAREERS ROUTES
 * Handles job applications from /careers page
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { notifyAdminJobApplication } from '../services/email.js';
import { verifyTurnstileToken } from '../../lib/turnstile.js';

const router = express.Router();

/**
 * Submit a job application
 */
router.post('/applications', async (req, res) => {
  try {
    const {
      position,
      applicant,
      userId,
      resume,
      coverLetter,
      responses,
      experience,
      compensation,
      availability,
      source,
      turnstileToken,
    } = req.body;

    // Verify Turnstile — mandatory in production
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !turnstileToken) {
      return res.status(403).json({ error: 'Bot verification is required.' });
    }
    if (turnstileToken) {
      const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip;
      const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
      if (!turnstileResult.success) {
        return res.status(403).json({ error: 'Bot verification failed. Please try again.' });
      }
    }

    if (
      !position?.id ||
      !applicant?.email ||
      !applicant?.firstName ||
      !applicant?.lastName
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for duplicate application
    const existing = await prisma.jobApplication.findFirst({
      where: {
        email: applicant.email,
        positionId: position.id,
      },
    });

    if (existing) {
      return res.status(400).json({
        error: 'You have already applied for this position',
        applicationId: existing.applicationId,
      });
    }

    const applicationId = `app_${Date.now()}_${uuidv4().slice(0, 8)}`;

    const application = await prisma.jobApplication.create({
      data: {
        applicationId,
        name: `${applicant.firstName} ${applicant.lastName}`,
        email: applicant.email,
        phone: applicant.phone || null,
        position: position.title || position.id,
        positionId: position.id,
        userId: userId || null,
        resumeUrl: resume?.url || null,
        coverLetter: coverLetter || null,
        responses: responses || undefined,
        experience: experience || undefined,
        compensation: compensation || undefined,
        availability: availability || undefined,
        source: source || null,
        status: 'submitted',
      },
    });

    // Send admin notification email
    notifyAdminJobApplication({
      position: position.title || position.id,
      applicantName: `${applicant.firstName} ${applicant.lastName}`,
      applicantEmail: applicant.email,
      phone: applicant.phone,
      applicationId: application.applicationId,
      applicationNumber: application.applicationNumber,
    }).catch((err) => console.error('Failed to send admin notification:', err));

    res.json({
      success: true,
      application: {
        applicationId: application.applicationId,
        applicationNumber: application.applicationNumber,
        status: application.status,
        appliedAt: application.appliedAt,
      },
      message: 'Application submitted successfully. We will review it shortly!',
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

/**
 * Get user's applications
 */
router.get('/applications/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const applications = await prisma.jobApplication.findMany({
      where: { userId },
      select: {
        applicationId: true,
        applicationNumber: true,
        position: true,
        status: true,
        appliedAt: true,
        lastActivityAt: true,
      },
      orderBy: { appliedAt: 'desc' },
    });

    res.json({ success: true, applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

/**
 * Get application by email (for non-logged-in users)
 */
router.get('/applications/email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const applications = await prisma.jobApplication.findMany({
      where: { email },
      select: {
        applicationId: true,
        applicationNumber: true,
        position: true,
        status: true,
        appliedAt: true,
        lastActivityAt: true,
      },
      orderBy: { appliedAt: 'desc' },
    });

    res.json({ success: true, applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

/**
 * Get application details
 */
router.get('/applications/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await prisma.jobApplication.findUnique({
      where: { applicationId },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Parse interviews JSON
    let interviews = [];
    try {
      interviews = application.interviews ? JSON.parse(JSON.stringify(application.interviews)) : [];
    } catch (_) {
      interviews = [];
    }

    // Remove sensitive internal data for applicant view
    const safeApplication = {
      applicationId: application.applicationId,
      applicationNumber: application.applicationNumber,
      position: application.position,
      name: application.name,
      email: application.email,
      status: application.status,
      appliedAt: application.appliedAt,
      interviews: Array.isArray(interviews)
        ? interviews.filter((i) => i.status === 'scheduled')
        : [],
    };

    res.json({ success: true, application: safeApplication });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

/**
 * Withdraw application
 */
router.post('/applications/:applicationId/withdraw', async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await prisma.jobApplication.findUnique({
      where: { applicationId },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (['hired', 'withdrawn', 'rejected'].includes(application.status)) {
      return res
        .status(400)
        .json({ error: 'Cannot withdraw this application' });
    }

    await prisma.jobApplication.update({
      where: { applicationId },
      data: {
        status: 'withdrawn',
        lastActivityAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Application withdrawn successfully',
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ error: 'Failed to withdraw application' });
  }
});

export default router;
