/**
 * BILLING ROUTES
 * Handles transactions, invoices, and payment history
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma.js';
import {
  trackTransaction,
  updateTransactionStatus,
} from '../lib/analytics-tracker.js';

const router = express.Router();

// ============================================
// TRANSACTIONS
// ============================================

/**
 * Record a new transaction
 */
router.post('/transactions', async (req, res) => {
  try {
    const {
      userId,
      stripePaymentIntentId,
      stripeInvoiceId,
      stripeChargeId,
      type,
      amount,
      currency,
      status,
      description,
      items,
      subscription,
      payment,
      billing,
      invoiceUrl,
      receiptUrl,
      metadata,
    } = req.body;

    if (!userId || !type || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transaction = await trackTransaction({
      transactionId: `txn_${Date.now()}_${uuidv4().slice(0, 8)}`,
      userId,
      stripePaymentIntentId,
      stripeInvoiceId,
      stripeChargeId,
      type,
      amount,
      currency: currency || 'usd',
      status: status || 'pending',
      description,
      items,
      subscription,
      payment,
      billing,
      invoiceUrl,
      receiptUrl,
      metadata,
    });

    res.json({
      success: true,
      transaction: {
        transactionId: transaction.transactionId,
        status: transaction.status,
        amount: transaction.amount,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

/**
 * Get user's transaction history
 */
router.get('/transactions/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, status, page = 1, limit = 20 } = req.query;

    const where = { userId };
    if (type) where.type = type;
    if (status) where.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calculate totals by type for completed transactions
    const completedTransactions = await prisma.transaction.findMany({
      where: { userId, status: 'completed' },
      select: { type: true, amount: true },
    });

    const typeMap = {};
    completedTransactions.forEach(t => {
      const tType = t.type || 'unknown';
      if (!typeMap[tType]) {
        typeMap[tType] = { _id: tType, total: 0, count: 0 };
      }
      typeMap[tType].total += t.amount || 0;
      typeMap[tType].count += 1;
    });
    const totals = Object.values(typeMap);

    res.json({
      success: true,
      transactions,
      totals,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

/**
 * Get transaction details
 */
router.get('/transactions/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { transactionId },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ success: true, transaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

/**
 * Update transaction status (for webhooks)
 */
router.patch('/transactions/:transactionId/status', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status, ...additionalData } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const transaction = await updateTransactionStatus(
      transactionId,
      status,
      additionalData,
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      success: true,
      transaction: {
        transactionId: transaction.transactionId,
        status: transaction.status,
      },
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

/**
 * Get user's billing summary
 */
router.get('/billing/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get monthly completed transactions
    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'completed',
        createdAt: { gte: startOfMonth },
      },
      select: { amount: true },
    });

    const monthlyTotal = monthlyTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    // All-time stats by type
    const completedTransactions = await prisma.transaction.findMany({
      where: { userId, status: 'completed' },
      select: { type: true, amount: true },
    });

    const typeMap = {};
    completedTransactions.forEach(t => {
      const type = t.type || 'unknown';
      if (!typeMap[type]) {
        typeMap[type] = { _id: type, total: 0, count: 0 };
      }
      typeMap[type].total += t.amount || 0;
      typeMap[type].count += 1;
    });
    const allTimeStats = Object.values(typeMap);

    // Recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.json({
      success: true,
      summary: {
        monthlySpend: monthlyTotal,
        monthlyTransactions: monthlyTransactions.length,
        allTimeStats,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('Error fetching billing summary:', error);
    res.status(500).json({ error: 'Failed to fetch billing summary' });
  }
});

export default router;
