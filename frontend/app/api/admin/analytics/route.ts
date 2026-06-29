import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    if (path.endsWith('/stats')) {
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({
        where: {
          lastLoginAt: {
            gte: last7Days
          }
        }
      });
      const totalPageViews = await prisma.pageView.count();
      const totalEvents = await prisma.userEvent.count();
      const signupEvents = await prisma.userEvent.count({
        where: {
          eventName: 'signup'
        }
      });
      const loginEvents = await prisma.userEvent.count({
        where: {
          eventName: 'login'
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          users: { total: totalUsers, active: activeUsers },
          pageViews: { total: totalPageViews },
          events: { total: totalEvents, signups: signupEvents, logins: loginEvents },
        },
      });
    } else if (path.endsWith('/users')) {
      const users = await prisma.user.findMany({
        take: 100,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          lastLoginAt: true
        }
      });

      return NextResponse.json({ success: true, data: { users } });
    }

    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: 'Failed to get admin analytics' }, { status: 500 });
  }
}