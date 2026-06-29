/**
 * SUPPORT ROUTES — Direct Prisma (no model adapters)
 * Handles support tickets, consultations, and contact messages
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import {
  notifyAdminContactForm,
  notifyAdminSupportTicket,
  notifyAdminConsultation,
  sendTicketAutoReply,
  sendContactAutoReply,
  sendConsultationAutoReply,
} from '../services/email.js';
import { verifyTurnstileToken } from '../../lib/turnstile.js';

const router = express.Router();

// ============================================
// SUPPORT TICKETS
// ============================================

router.post('/tickets', async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      userName,
      subject,
      description,
      category,
      priority,
      relatedAgent,
      relatedSubscription,
      turnstileToken,
    } = req.body;

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

    if (!userId || !userEmail || !subject || !description || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: userId.startsWith('guest_') ? null : userId,
        email: userEmail,
        name: userName || null,
        subject,
        description,
        category,
        priority: priority || 'medium',
        status: 'open',
        metadata: {
          relatedAgent,
          relatedSubscription,
          chatMessages: [{
            sender: 'customer',
            senderId: userId,
            senderName: userName,
            message: description,
            createdAt: new Date().toISOString(),
          }],
        },
      },
    });

    const ticketNumber = parseInt(ticket.id.slice(-6), 36);

    notifyAdminSupportTicket({
      ticketId: ticket.id,
      ticketNumber,
      subject,
      userName: userName || 'Unknown',
      userEmail,
      category,
      priority: priority || 'medium',
    }).catch(err => console.error('Failed to send admin notification:', err));

    sendTicketAutoReply(
      userEmail, userName, subject,
      ticketNumber, category, priority || 'medium'
    ).catch(err => console.error('Failed to send ticket auto-reply:', err));

    res.json({
      success: true,
      ticket: {
        ticketId: ticket.id,
        ticketNumber,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
      message: 'Support ticket created successfully',
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

router.get('/tickets/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const where = { userId };
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        select: {
          id: true, subject: true, category: true, status: true,
          priority: true, createdAt: true, updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.supportTicket.count({ where }),
    ]);

    res.json({
      success: true,
      tickets: tickets.map(t => ({ ...t, ticketId: t.id, ticketNumber: parseInt(t.id.slice(-6), 36) })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

router.get('/tickets/:ticketId', async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.ticketId } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ success: true, ticket: { ...ticket, ticketId: ticket.id, ticketNumber: parseInt(ticket.id.slice(-6), 36) } });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

router.post('/tickets/:ticketId/messages', async (req, res) => {
  try {
    const { senderId, senderName, message } = req.body;
    const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.ticketId } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const metadata = ticket.metadata || {};
    const messages = metadata.chatMessages || [];
    messages.push({ sender: 'customer', senderId, senderName, message, createdAt: new Date().toISOString() });

    await prisma.supportTicket.update({
      where: { id: req.params.ticketId },
      data: { status: 'open', metadata: { ...metadata, chatMessages: messages } },
    });

    res.json({ success: true, message: 'Message added successfully' });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

router.post('/tickets/:ticketId/satisfaction', async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.ticketId } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const metadata = ticket.metadata || {};
    await prisma.supportTicket.update({
      where: { id: req.params.ticketId },
      data: { metadata: { ...metadata, satisfaction: { rating, feedback, ratedAt: new Date().toISOString() } } },
    });

    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (error) {
    console.error('Error submitting satisfaction:', error);
    res.status(500).json({ error: 'Failed to submit satisfaction' });
  }
});

// ============================================
// CONSULTATIONS
// ============================================

router.post('/consultations', async (req, res) => {
  try {
    const {
      userId, userEmail, userName, userPhone,
      consultationType, company, project,
      preferredDates, timezone, source,
    } = req.body;

    if (!userEmail || !userName || !consultationType || !project?.description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const consultation = await prisma.consultation.create({
      data: {
        name: userName,
        email: userEmail,
        phone: userPhone || null,
        company: company?.name || company || null,
        topic: consultationType,
        description: project?.description || null,
        preferredDate: preferredDates?.[0] ? new Date(preferredDates[0]) : null,
        timezone: timezone || null,
        status: 'requested',
      },
    });

    notifyAdminConsultation({
      consultationId: consultation.id,
      consultationNumber: parseInt(consultation.id.slice(-6), 36),
      userName, userEmail, userPhone,
      consultationType,
      projectDescription: project?.description || '',
    }).catch(err => console.error('Failed to send admin notification:', err));

    sendConsultationAutoReply(
      userEmail, userName, consultationType,
      parseInt(consultation.id.slice(-6), 36)
    ).catch(err => console.error('Failed to send consultation auto-reply:', err));

    res.json({
      success: true,
      consultation: { consultationId: consultation.id, status: consultation.status, createdAt: consultation.createdAt },
      message: 'Consultation request submitted. We will contact you soon!',
    });
  } catch (error) {
    console.error('Error creating consultation:', error);
    res.status(500).json({ error: 'Failed to create consultation request' });
  }
});

router.get('/consultations/user/:userId', async (req, res) => {
  try {
    // Consultation table has no userId — look up user email first
    const user = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { email: true } });
    if (!user) return res.json({ success: true, consultations: [] });

    const consultations = await prisma.consultation.findMany({
      where: { email: user.email },
      select: { id: true, topic: true, status: true, scheduledAt: true, meetingUrl: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      consultations: consultations.map(c => ({
        consultationId: c.id, consultationType: c.topic,
        status: c.status, scheduledAt: c.scheduledAt,
        meeting: c.meetingUrl ? { url: c.meetingUrl } : null,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

router.get('/consultations/:consultationId', async (req, res) => {
  try {
    const consultation = await prisma.consultation.findUnique({ where: { id: req.params.consultationId } });
    if (!consultation) return res.status(404).json({ error: 'Consultation not found' });
    res.json({ success: true, consultation });
  } catch (error) {
    console.error('Error fetching consultation:', error);
    res.status(500).json({ error: 'Failed to fetch consultation' });
  }
});

router.post('/consultations/:consultationId/feedback', async (req, res) => {
  try {
    const { rating, comment, wouldRecommend } = req.body;
    await prisma.consultation.update({
      where: { id: req.params.consultationId },
      data: { notes: JSON.stringify({ rating, comment, wouldRecommend, submittedAt: new Date().toISOString() }) },
    });
    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// ============================================
// CONTACT MESSAGES
// ============================================

router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message, turnstileToken } = req.body;

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

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const contactMessage = await prisma.contactMessage.create({
      data: { name, email, subject, message, source: 'website' },
    });

    notifyAdminContactForm({ name, email, subject, message, ticketId: contactMessage.id })
      .catch(err => console.error('Failed to send admin notification:', err));

    sendContactAutoReply(email, name, subject, contactMessage.id)
      .catch(err => console.error('Failed to send contact auto-reply:', err));

    res.json({ success: true, message: "Thank you for your message! We'll get back to you soon.", ticketId: contactMessage.id });
  } catch (error) {
    console.error('Error submitting contact message:', error);
    res.status(500).json({ error: 'Failed to submit message' });
  }
});

router.get('/contact', async (req, res) => {
  try {
    const { isRead, page = 1, limit = 20, sortOrder = 'desc' } = req.query;

    const where = {};
    if (isRead === 'true') where.isRead = true;
    if (isRead === 'false') where.isRead = false;

    const [messages, total, unreadCount] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.contactMessage.count({ where }),
      prisma.contactMessage.count({ where: { isRead: false } }),
    ]);

    res.json({
      success: true,
      data: messages,
      pagination: { page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total, limit: parseInt(limit) },
      stats: { total, pending: unreadCount, read: total - unreadCount },
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.get('/contact/stats/overview', async (req, res) => {
  try {
    const [total, unreadCount, thirtyDayCount] = await Promise.all([
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { isRead: false } }),
      prisma.contactMessage.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    ]);

    res.json({
      success: true,
      data: {
        overview: { total, pending: unreadCount, read: total - unreadCount, recentActivity: thirtyDayCount },
      },
    });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

router.get('/contact/:id', async (req, res) => {
  try {
    const message = await prisma.contactMessage.findUnique({ where: { id: req.params.id } });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Error fetching contact message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

router.patch('/contact/:id/status', async (req, res) => {
  try {
    const { isRead } = req.body;
    const message = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: { isRead: isRead !== undefined ? isRead : true },
    });
    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Error updating contact message:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

export default router;
