/**
 * ANALYTICS TRACKER - PRISMA VERSION
 * PostgreSQL-based analytics tracking for Mumtaz AI
 */

import { prisma } from './prisma.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Track or update visitor
 */
async function trackVisitor(data) {
  try {
    // Try to find existing visitor
    const existingVisitor = await prisma.visitor.findUnique({
      where: { visitorId: data.visitorId },
    });

    if (existingVisitor) {
      // Update existing visitor
      const updated = await prisma.visitor.update({
        where: { visitorId: data.visitorId },
        data: {
          lastVisit: new Date(),
          visitCount: { increment: 1 },
          sessionId: data.sessionId,
          ...(data.userId && { userId: data.userId, isRegistered: true }),
        },
      });
      return updated;
    }

    // Create new visitor
    const visitor = await prisma.visitor.create({
      data: {
        visitorId: data.visitorId,
        sessionId: data.sessionId,
        userId: data.userId || null,
        ipAddress: data.ipAddress || 'unknown',
        userAgent: data.userAgent || 'unknown',
        country: data.country || 'Unknown',
        city: data.city || 'Unknown',
        device: data.device || 'desktop',
        browser: data.browser || 'Unknown',
        os: data.os || 'Unknown',
        referrer: data.referrer,
        landingPage: data.landingPage || '/',
        isRegistered: !!data.userId,
        isActive: true,
        firstVisit: new Date(),
        lastVisit: new Date(),
        visitCount: 1,
      },
    });
    return visitor;
  } catch (error) {
    console.error('Error tracking visitor:', error);
    return null;
  }
}

/**
 * Create or update session (atomic upsert to avoid race conditions)
 */
async function createSession(data) {
  try {
    // Use upsert for atomic create-or-update (avoids race conditions)
    const session = await prisma.session.upsert({
      where: { sessionId: data.sessionId },
      update: {
        lastActivity: new Date(),
        ...(data.userId && { userId: data.userId }),
      },
      create: {
        sessionId: data.sessionId,
        visitorId: data.visitorId,
        userId: data.userId || null,
        startTime: new Date(),
        lastActivity: new Date(),
        isActive: true,
        pageViews: 0,
        events: 0,
        duration: 0,
      },
    });
    return session;
  } catch (error) {
    console.error('Error creating/updating session:', error);
    return null;
  }
}

/**
 * Update session
 */
async function updateSession(sessionId, updates) {
  try {
    const session = await prisma.session.findUnique({
      where: { sessionId },
    });
    
    if (session) {
      const duration = Math.floor((Date.now() - session.startTime.getTime()) / 1000);
      
      // Handle increment operations
      const updateData = { ...updates };
      if (updates.$inc) {
        if (updates.$inc.pageViews) {
          updateData.pageViews = { increment: updates.$inc.pageViews };
        }
        if (updates.$inc.events) {
          updateData.events = { increment: updates.$inc.events };
        }
        if (updates.$inc.interactions) {
          updateData.events = { increment: updates.$inc.interactions };
        }
        delete updateData.$inc;
      }
      
      const updated = await prisma.session.update({
        where: { sessionId },
        data: {
          ...updateData,
          duration,
          lastActivity: new Date(),
        },
      });
      return updated;
    }
  } catch (error) {
    console.error('Error updating session:', error);
  }
  return null;
}

/**
 * End session
 */
async function endSession(sessionId, exitPage) {
  try {
    const session = await prisma.session.findUnique({
      where: { sessionId },
    });
    
    if (session) {
      const duration = Math.floor((Date.now() - session.startTime.getTime()) / 1000);
      
      const updated = await prisma.session.update({
        where: { sessionId },
        data: {
          isActive: false,
          duration,
          ...(exitPage && { exitPage }),
        },
      });
      return updated;
    }
  } catch (error) {
    console.error('Error ending session:', error);
  }
  return null;
}

/**
 * Track page view
 */
async function trackPageView(data) {
  try {
    const pageView = await prisma.pageView.create({
      data: {
        visitorId: data.visitorId,
        sessionId: data.sessionId,
        userId: data.userId || null,
        url: data.url || data.path || '/',
        title: data.title,
        referrer: data.referrer,
        timeSpent: 0,
        timestamp: new Date(),
      },
    });
    
    // Update session page views
    await updateSession(data.sessionId, { $inc: { pageViews: 1 } });
    
    return pageView;
  } catch (error) {
    console.error('Error tracking page view:', error);
    return null;
  }
}

/**
 * Update page view metrics
 */
async function updatePageViewMetrics(pageViewId, data) {
  try {
    const updated = await prisma.pageView.update({
      where: { id: pageViewId },
      data: {
        timeSpent: data.timeSpent,
        ...(data.title && { title: data.title }),
      },
    });
    return updated;
  } catch (error) {
    console.error('Error updating page view:', error);
  }
  return null;
}

/**
 * Track chat interaction for analytics
 */
async function trackChatInteraction(data) {
  try {
    const interaction = await prisma.chatAnalyticsInteraction.create({
      data: {
        conversationId: data.conversationId || uuidv4(),
        userId: data.userId || null,
        agentId: data.agentId || null,
        channel: data.channel || 'web',
        language: data.language || 'en',
        messages: data.messages || [],
        keywords: data.keywords || [],
        actionItems: data.actionItems || [],
        totalTokens: data.totalTokens || 0,
        durationMs: data.durationMs || 0,
        turnCount: data.turnCount || 0,
        status: data.status || 'active',
        tags: data.tags || [],
        priority: data.priority || 'medium',
        startedAt: new Date(),
      },
    });
    
    // Update session if sessionId provided
    if (data.sessionId) {
      await updateSession(data.sessionId, { $inc: { interactions: 1 } });
    }
    
    return interaction;
  } catch (error) {
    console.error('Error tracking chat interaction:', error);
    return null;
  }
}

/**
 * Update chat feedback
 */
async function updateChatFeedback(interactionId, satisfied, feedback) {
  try {
    // Note: ChatAnalyticsInteraction doesn't have satisfied/feedback fields
    // This would need to use ChatFeedback model or extend the schema
    console.log('Chat feedback update:', { interactionId, satisfied, feedback });
    return { interactionId, satisfied, feedback };
  } catch (error) {
    console.error('Error updating chat feedback:', error);
  }
  return null;
}

/**
 * Track tool usage
 */
async function trackToolUsage(data) {
  try {
    const toolUsage = await prisma.toolUsage.create({
      data: {
        toolName: data.toolName,
        version: data.version,
        userId: data.userId || null,
        agentId: data.agentId || null,
        command: data.command || data.toolName,
        arguments: data.arguments,
        inputPreview: data.inputPreview,
        outputPreview: data.outputPreview,
        tokensInput: data.tokens?.input || 0,
        tokensOutput: data.tokens?.output || 0,
        latencyMs: data.latencyMs || 0,
        status: data.status || 'completed',
        integration: data.metadata?.integration,
        environment: data.metadata?.environment,
        tags: data.metadata?.tags || [],
        occurredAt: new Date(),
      },
    });
    
    // Update session if sessionId provided
    if (data.sessionId) {
      await updateSession(data.sessionId, { $inc: { interactions: 1 } });
    }
    
    return toolUsage;
  } catch (error) {
    console.error('Error tracking tool usage:', error);
    return null;
  }
}

/**
 * Track lab experiment
 */
async function trackLabExperiment(data) {
  try {
    // Use AnalyticsEvent to track lab experiments
    const event = await prisma.analyticsEvent.create({
      data: {
        visitorId: data.visitorId || 'system',
        sessionId: data.sessionId || 'system',
        userId: data.userId || null,
        eventName: 'lab_experiment',
        eventData: {
          experimentId: data.experimentId || uuidv4(),
          experimentType: data.experimentType,
          input: data.input,
          output: data.output,
          status: data.status || 'completed',
          processingTime: data.processingTime,
          tokensUsed: data.tokensUsed,
          costIncurred: data.costIncurred,
          modelUsed: data.modelUsed,
          parameters: data.parameters,
          metadata: data.metadata,
        },
        timestamp: new Date(),
      },
    });
    
    // Update session
    if (data.sessionId) {
      await updateSession(data.sessionId, { $inc: { interactions: 1 } });
    }
    
    return event;
  } catch (error) {
    console.error('Error tracking lab experiment:', error);
    return null;
  }
}

/**
 * Track transaction
 */
async function trackTransaction(data) {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        transactionId: data.transactionId || uuidv4(),
        userId: data.userId,
        stripePaymentIntentId: data.stripePaymentIntentId,
        stripeInvoiceId: data.stripeInvoiceId,
        stripeChargeId: data.stripeChargeId,
        type: data.type || 'payment',
        amount: data.amount || 0,
        currency: data.currency || 'usd',
        status: data.status || 'pending',
        description: data.description,
        items: data.items || [],
        subscription: data.subscription,
        payment: data.payment,
        billing: data.billing,
        invoiceUrl: data.invoiceUrl,
        receiptUrl: data.receiptUrl,
        metadata: data.metadata,
      },
    });
    return transaction;
  } catch (error) {
    console.error('Error tracking transaction:', error);
    return null;
  }
}

/**
 * Update transaction status
 */
async function updateTransactionStatus(transactionId, status, additionalData = {}) {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: { transactionId },
    });
    
    if (transaction) {
      const updated = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status,
          ...additionalData,
        },
      });
      return updated;
    }
  } catch (error) {
    console.error('Error updating transaction:', error);
  }
  return null;
}

/**
 * Track user event
 */
async function trackUserEvent(data) {
  try {
    const event = await prisma.userEvent.create({
      data: {
        userId: data.userId || null,
        eventType: data.eventType,
        category: data.category,
        action: data.action,
        label: data.label,
        value: data.value,
        properties: data.properties,
        durationMs: data.metrics?.durationMs,
        success: data.metrics?.success,
        source: data.source || 'web',
        tags: data.metadata?.tags || [],
        featureFlag: data.metadata?.featureFlag,
        occurredAt: new Date(),
      },
    });
    
    // Update session
    if (data.sessionId) {
      await updateSession(data.sessionId, { $inc: { interactions: 1 } });
    }
    
    return event;
  } catch (error) {
    console.error('Error tracking user event:', error);
    return null;
  }
}

/**
 * Track API usage
 */
async function trackApiUsage(data) {
  try {
    const apiUsage = await prisma.apiUsage.create({
      data: {
        visitorId: data.visitorId,
        sessionId: data.sessionId,
        userId: data.userId || null,
        endpoint: data.endpoint,
        method: data.method,
        statusCode: data.statusCode,
        responseTime: data.responseTime,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        timestamp: new Date(),
      },
    });
    return apiUsage;
  } catch (error) {
    console.error('Error tracking API usage:', error);
    return null;
  }
}

/**
 * Get visitor stats
 */
async function getVisitorStats(visitorId) {
  try {
    const visitor = await prisma.visitor.findUnique({
      where: { visitorId },
    });
    
    const sessions = await prisma.session.findMany({
      where: { visitorId },
      orderBy: { startTime: 'desc' },
    });
    
    const pageViews = await prisma.pageView.count({
      where: { visitorId },
    });
    
    const chats = await prisma.chatAnalyticsInteraction.count({
      where: { userId: visitor?.userId },
    });
    
    const tools = await prisma.toolUsage.count({
      where: { userId: visitor?.userId },
    });
    
    const events = await prisma.userEvent.count({
      where: { userId: visitor?.userId },
    });
    
    return {
      visitor,
      sessions: sessions.length,
      pageViews,
      chats,
      tools,
      events,
      recentSessions: sessions.slice(0, 5),
    };
  } catch (error) {
    console.error('Error getting visitor stats:', error);
    return null;
  }
}

/**
 * Get session stats
 */
async function getSessionStats(sessionId) {
  try {
    const session = await prisma.session.findUnique({
      where: { sessionId },
    });
    
    const pageViews = await prisma.pageView.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });
    
    const events = await prisma.analyticsEvent.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });
    
    return {
      session,
      pageViews,
      events,
    };
  } catch (error) {
    console.error('Error getting session stats:', error);
    return null;
  }
}

/**
 * Get realtime stats
 */
async function getRealtimeStats() {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const activeSessions = await prisma.session.count({
      where: {
        isActive: true,
        lastActivity: { gte: fiveMinutesAgo },
      },
    });
    
    const recentPageViews = await prisma.pageView.count({
      where: { timestamp: { gte: fiveMinutesAgo } },
    });
    
    const recentChats = await prisma.chatAnalyticsInteraction.count({
      where: { startedAt: { gte: fiveMinutesAgo } },
    });
    
    const recentTools = await prisma.toolUsage.count({
      where: { occurredAt: { gte: fiveMinutesAgo } },
    });
    
    return {
      activeSessions,
      recentPageViews,
      recentChats,
      recentTools,
      timestamp: now,
    };
  } catch (error) {
    console.error('Error getting realtime stats:', error);
    return null;
  }
}

/**
 * Generate visitor ID
 */
function generateVisitorId() {
  return uuidv4();
}

/**
 * Generate session ID
 */
function generateSessionId() {
  return uuidv4();
}

/**
 * Detect device type from user agent
 */
function detectDevice(userAgent) {
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Detect browser from user agent
 */
function detectBrowser(userAgent) {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
}

/**
 * Detect OS from user agent
 */
function detectOS(userAgent) {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
}

export {
  createSession,
  detectBrowser,
  detectDevice,
  detectOS,
  endSession,
  generateSessionId,
  generateVisitorId,
  getRealtimeStats,
  getSessionStats,
  getVisitorStats,
  trackApiUsage,
  trackChatInteraction,
  trackLabExperiment,
  trackPageView,
  trackToolUsage,
  trackTransaction,
  trackUserEvent,
  trackVisitor,
  updateChatFeedback,
  updatePageViewMetrics,
  updateSession,
  updateTransactionStatus,
};
