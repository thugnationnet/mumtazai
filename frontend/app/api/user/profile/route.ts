import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic so we always validate the live session
export const dynamic = 'force-dynamic';

// Helper to get user from session
async function getUserFromSession(request: NextRequest) {
  // Get session cookie - support both names
  const sessionId = request.cookies.get('sessionId')?.value 
    || request.cookies.get('session_id')?.value;
  
  console.log('[profile] Checking session:', {
    sessionId: sessionId ? sessionId.substring(0, 10) + '...' : 'none',
    allCookies: Array.from(request.cookies.getAll()).map(c => c.name)
  });
  
  if (!sessionId) {
    return null;
  }
  
  try {
    const user = await prisma.user.findFirst({
      where: { sessionId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        phoneNumber: true,
        location: true,
        timezone: true,
        profession: true,
        company: true,
        socialLinks: true,
        preferences: true,
        createdAt: true,
        lastLoginAt: true,
        sessionExpiry: true,
      }
    });
    
    // Check if session is expired
    if (user && user.sessionExpiry && new Date(user.sessionExpiry) < new Date()) {
      console.log('[profile] Session expired for user:', user.id);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('[profile] Error finding user by session:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    
    if (!user) {
      console.log('[profile] No valid session found');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('[profile] User found:', user.id);
    
    // Build profile response
    const profile = {
      name: user.name || 'User',
      email: user.email,
      avatar: user.avatar || '',
      bio: user.bio || 'AI enthusiast exploring the future of intelligent systems.',
      phoneNumber: user.phoneNumber || '',
      location: user.location || '',
      timezone: user.timezone || 'Pacific Time (PT)',
      profession: user.profession || 'AI Developer',
      company: user.company || '',
      website: (user.socialLinks as any)?.website || '',
      socialLinks: user.socialLinks || {},
      preferences: user.preferences || {
        theme: 'dark',
        notifications: { email: true, push: true, sms: false },
        privacy: { showProfile: true, showActivity: true },
        language: { primary: 'en-US', secondary: null },
        accessibility: { fontSize: 'medium', highContrast: false, reduceMotion: false }
      },
      joinedAt: user.createdAt,
      lastActive: user.lastLoginAt || user.createdAt,
    };
    
    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('[profile] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const {
      name,
      avatar,
      bio,
      phoneNumber,
      location,
      timezone,
      profession,
      company,
      website,
      socialLinks,
      preferences,
    } = body;
    
    // Build update data
    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (location !== undefined) updateData.location = location;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (profession !== undefined) updateData.profession = profession;
    if (company !== undefined) updateData.company = company;
    if (socialLinks !== undefined) {
      updateData.socialLinks = website 
        ? { ...socialLinks, website }
        : socialLinks;
    } else if (website !== undefined) {
      updateData.socialLinks = { ...(user.socialLinks as any || {}), website };
    }
    if (preferences !== undefined) updateData.preferences = preferences;
    
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        name: updated.name,
        email: updated.email,
        avatar: updated.avatar,
        bio: updated.bio,
        phoneNumber: updated.phoneNumber,
        location: updated.location,
        timezone: updated.timezone,
        profession: updated.profession,
        company: updated.company,
        socialLinks: updated.socialLinks,
        preferences: updated.preferences,
      }
    });
  } catch (error) {
    console.error('[profile] PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
