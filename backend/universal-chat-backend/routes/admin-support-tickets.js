/**
 * ADMIN SUPPORT TICKETS — routes for the admin support dashboard
 *
 * GET  /api/admin/support-tickets     — list tickets with filters + stats
 * POST /api/admin/support-tickets     — update a ticket (status, reply, assign)
 *
 * All routes require admin authentication (requireAdmin middleware).
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../lib/auth-middleware.js';

const router = express.Router();
router.use(requireAdmin);

// Map Prisma enum values → frontend display values
function mapStatus(prismaStatus) {
  const map = {
    open: 'open',
    in_progress: 'in-progress',
    waiting: 'waiting-customer',
    resolved: 'resolved',
    closed: 'closed',
  };
  return map[prismaStatus] || prismaStatus;
}

// Map frontend display values → Prisma enum values
function unmapStatus(frontendStatus) {
  const map = {
    'open': 'open',
    'in-progress': 'in_progress',
    'waiting-customer': 'waiting',
    'waiting-internal': 'waiting',
    'resolved': 'resolved',
    'closed': 'closed',
  };
  return map[frontendStatus] || frontendStatus;
}

// Transform Prisma ticket → frontend-compatible shape
function transformTicket(t) {
  const messages = [];
  const meta = typeof t.metadata === 'object' && t.metadata ? t.metadata : {};

  // If metadata has messages array, include them
  if (Array.isArray(meta.messages)) {
    messages.push(...meta.messages);
  }

  // Initial description as first message
  if (messages.length === 0) {
    messages.push({
      sender: t.userId || 'user',
      senderName: t.name || t.email || 'Customer',
      message: t.description,
      createdAt: t.createdAt?.toISOString?.() || t.createdAt,
      isInternal: false,
    });
  }

  return {
    _id: t.id,
    ticketId: t.id,
    ticketNumber: 0, // not stored in schema
    userId: t.userId || '',
    userEmail: t.email || '',
    userName: t.name || '',
    subject: t.subject,
    description: t.description,
    category: t.category || 'general',
    priority: t.priority || 'medium',
    status: mapStatus(t.status),
    assignedTo: t.assignedTo || null,
    assignedName: meta.assignedName || null,
    messages,
    sla: meta.sla || null,
    satisfaction: meta.satisfaction || null,
    createdAt: t.createdAt?.toISOString?.() || t.createdAt,
    updatedAt: t.updatedAt?.toISOString?.() || t.updatedAt,
    lastActivityAt: t.updatedAt?.toISOString?.() || t.updatedAt,
  };
}

/**
 * GET /api/admin/support-tickets
 * List all tickets with optional filters and aggregate stats.
 */
router.get('/', async (req, res) => {
  try {
    const { status, priority, category, search, slaBreached } = req.query;

    const where = {};

    if (status && status !== 'all') {
      const prismaStatus = unmapStatus(status);
      where.status = prismaStatus;
    }
    if (priority && priority !== 'all') {
      where.priority = priority;
    }
    if (category && category !== 'all') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch tickets
    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });

    // Compute stats from all tickets (not just filtered)
    const allTickets = await prisma.supportTicket.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const urgentCount = await prisma.supportTicket.count({
      where: { priority: 'urgent', status: { notIn: ['resolved', 'closed'] } },
    });

    const statusCounts = {};
    for (const row of allTickets) {
      statusCounts[row.status] = row._count.id;
    }

    const stats = {
      total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      open: statusCounts.open || 0,
      inProgress: statusCounts.in_progress || 0,
      waitingCustomer: statusCounts.waiting || 0,
      resolved: statusCounts.resolved || 0,
      closed: statusCounts.closed || 0,
      breachedSla: 0, // SLA not tracked in current schema
      urgent: urgentCount,
    };

    res.json({
      success: true,
      tickets: tickets.map(transformTicket),
      stats,
    });
  } catch (error) {
    console.error('[Admin Support] List error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
});

/**
 * POST /api/admin/support-tickets
 * Update a ticket: change status, assign, or add an admin reply/note.
 *
 * Body: { ticketId, message?, isInternal?, newStatus?, assignTo?, agentName? }
 */
router.post('/', async (req, res) => {
  try {
    const { ticketId, message, isInternal, newStatus, assignTo, agentName } = req.body;

    if (!ticketId) {
      return res.status(400).json({ success: false, message: 'ticketId is required' });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const updateData = {};
    const meta = typeof ticket.metadata === 'object' && ticket.metadata ? { ...ticket.metadata } : {};

    // Append message to metadata.messages
    if (message) {
      if (!Array.isArray(meta.messages)) meta.messages = [];
      meta.messages.push({
        sender: req.adminUser?.id || 'admin',
        senderName: agentName || req.adminUser?.name || 'Support Agent',
        message,
        createdAt: new Date().toISOString(),
        isInternal: !!isInternal,
      });
    }

    // Update status
    if (newStatus) {
      const prismaStatus = unmapStatus(newStatus);
      updateData.status = prismaStatus;
      if (prismaStatus === 'resolved') {
        updateData.resolvedAt = new Date();
      }
    }

    // Assign agent
    if (assignTo) {
      updateData.assignedTo = assignTo;
      meta.assignedName = agentName || assignTo;
    }

    updateData.metadata = meta;

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    res.json({
      success: true,
      ticket: transformTicket(updated),
    });
  } catch (error) {
    console.error('[Admin Support] Update error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update ticket' });
  }
});

export default router;
