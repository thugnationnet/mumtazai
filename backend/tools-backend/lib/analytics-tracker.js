/**
 * ANALYTICS TRACKER - PRISMA VERSION
 * PostgreSQL-based analytics tracking for Mumtaz AI
 */

import { prisma } from './prisma.js';
import { v4 as uuidv4 } from 'uuid';

async function trackVisitor(data) {
  try {
    const existingVisitor = await prisma.visitor.findUnique({
      where: { visitorId: data.visitorId },
    });

    if (existingVisitor) {
      return await prisma.visitor.update({
        where: { visitorId: data.visitorId },
        data: {
          lastVisit: new Date(),
          visitCount: { increment: 1 },
          sessionId: data.sessionId,
          ...(data.userId && { userId: data.userId, isRegistered: true }),
        },
      });
    }

    return await prisma.visitor.create({
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
  } catch (error) {
    console.error('Error tracking visitor:', error);
    return null;
  }
}

async function createSession(data) {
  try {
    return await prisma.session.upsert({
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
  } catch (error) {
    console.error('Error creating/updating session:', error);
    return null;
  }
}

async function updateSession(sessionId, updates) {
  try {
    const session = await prisma.session.findUnique({ where: { sessionId } });
    if (!session) return null;

    const duration = Math.floor((Date.now() - session.startTime.getTime()) / 1000);
    const updateData = { ...updates };
    if (updates.$inc) {
      if (updates.$inc.pageViews) updateData.pageViews = { increment: updates.$inc.pageViews };
      if (updates.$inc.events) updateData.events = { increment: updates.$inc.events };
      if (updates.$inc.interactions) updateData.events = { increment: updates.$inc.interactions };
      delete updateData.$inc;
    }

    return await prisma.session.update({
      where: { sessionId },
      data: { ...updateData, duration, lastActivity: new Date() },
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return null;
  }
}

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
    await updateSession(data.sessionId, { $inc: { pageViews: 1 } });
    return pageView;
  } catch (error) {
    console.error('Error tracking page view:', error);
    return null;
  }
}

async function trackApiUsage(data) {
  try {
    return await prisma.apiUsage.create({
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
  } catch (error) {
    console.error('Error tracking API usage:', error);
    return null;
  }
}

function generateVisitorId() { return uuidv4(); }
function generateSessionId() { return uuidv4(); }

function detectDevice(userAgent) {
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) return 'mobile';
  return 'desktop';
}

function detectBrowser(userAgent) {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
}

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
  generateSessionId,
  generateVisitorId,
  trackApiUsage,
  trackPageView,
  trackVisitor,
  updateSession,
};
