/**
 * WEBINAR ROUTES
 * Handles webinar and event registrations
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

/**
 * Register for a webinar
 */
router.post('/register', async (req, res) => {
  try {
    const {
      userId,
      email,
      name,
      phone,
      webinarId,
      webinarTitle,
      webinarType,
      scheduledDate,
      timezone,
      registrationSource,
      professional,
      interests,
      questions,
      preferences,
    } = req.body;

    if (!email || !name || !webinarId || !webinarTitle || !scheduledDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for duplicate registration
    const existing = await prisma.webinarRegistration.findUnique({
      where: {
        webinarId_email: { webinarId, email },
      },
    });

    if (existing) {
      return res.status(400).json({
        error: 'You are already registered for this webinar',
        registrationId: existing.registrationId,
      });
    }

    const registrationId = `reg_${Date.now()}_${uuidv4().slice(0, 8)}`;

    const registration = await prisma.webinarRegistration.create({
      data: {
        registrationId,
        userId: userId || null,
        email,
        name,
        phone: phone || null,
        webinarId,
        webinarTitle,
        webinarType: webinarType || 'live-webinar',
        scheduledDate: new Date(scheduledDate),
        timezone: timezone || 'UTC',
        registrationSource: registrationSource || null,
        professional: professional || undefined,
        interests: interests || [],
        questions: questions || null,
        preferences: {
          receiveReminders: preferences?.receiveReminders ?? true,
          receiveRecording: preferences?.receiveRecording ?? true,
          receiveFollowUp: preferences?.receiveFollowUp ?? true,
        },
        status: 'registered',
      },
    });

    res.json({
      success: true,
      registration: {
        registrationId: registration.registrationId,
        webinarTitle: registration.webinarTitle,
        scheduledDate: registration.scheduledDate,
        status: registration.status,
      },
      message: 'Successfully registered for the webinar!',
    });
  } catch (error) {
    console.error('Error registering for webinar:', error);
    res.status(500).json({ error: 'Failed to register for webinar' });
  }
});

/**
 * Get user's webinar registrations
 */
router.get('/registrations/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const registrations = await prisma.webinarRegistration.findMany({
      where: { userId },
      select: {
        registrationId: true,
        webinarId: true,
        webinarTitle: true,
        scheduledDate: true,
        status: true,
        attended: true,
      },
      orderBy: { scheduledDate: 'desc' },
    });

    res.json({ success: true, registrations });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

/**
 * Get registrations by email
 */
router.get('/registrations/email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const registrations = await prisma.webinarRegistration.findMany({
      where: { email },
      select: {
        registrationId: true,
        webinarId: true,
        webinarTitle: true,
        scheduledDate: true,
        status: true,
        attended: true,
      },
      orderBy: { scheduledDate: 'desc' },
    });

    res.json({ success: true, registrations });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

/**
 * Get registration details
 */
router.get('/registrations/:registrationId', async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await prisma.webinarRegistration.findUnique({
      where: { registrationId },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.json({ success: true, registration });
  } catch (error) {
    console.error('Error fetching registration:', error);
    res.status(500).json({ error: 'Failed to fetch registration' });
  }
});

/**
 * Cancel webinar registration
 */
router.post('/registrations/:registrationId/cancel', async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await prisma.webinarRegistration.findUnique({
      where: { registrationId },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (['attended', 'cancelled'].includes(registration.status)) {
      return res.status(400).json({ error: 'Cannot cancel this registration' });
    }

    await prisma.webinarRegistration.update({
      where: { registrationId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Registration cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    res.status(500).json({ error: 'Failed to cancel registration' });
  }
});

/**
 * Submit webinar feedback
 */
router.post('/registrations/:registrationId/feedback', async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { rating, comment, wouldRecommend, interestedInFollowUp } = req.body;

    const registration = await prisma.webinarRegistration.findUnique({
      where: { registrationId },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    await prisma.webinarRegistration.update({
      where: { registrationId },
      data: {
        feedback: {
          rating,
          comment,
          wouldRecommend,
          interestedInFollowUp,
          submittedAt: new Date().toISOString(),
        },
      },
    });

    res.json({
      success: true,
      message: 'Thank you for your feedback!',
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

/**
 * Track webinar attendance (called when user joins)
 */
router.post('/registrations/:registrationId/join', async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await prisma.webinarRegistration.findUnique({
      where: { registrationId },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    await prisma.webinarRegistration.update({
      where: { registrationId },
      data: {
        attended: true,
        joinedAt: new Date(),
        status: 'attended',
      },
    });

    res.json({
      success: true,
      message: 'Attendance recorded',
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

export default router;
