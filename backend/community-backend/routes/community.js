/**
 * COMMUNITY ROUTES
 * Backend implementation for community features
 * Handles posts, comments, likes, and user interactions
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../lib/auth-middleware.js';

const router = express.Router();

// Rate limiting for community features
const communityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 community actions per 15 min window
  message: {
    success: false,
    message: 'Community rate limit exceeded. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
router.use(communityLimiter);

// ── Use shared auth middleware (checks neural_link_session JWT first, no DB lookup needed) ──

// ============================================
// GET /api/community/posts - List community posts
// ============================================

router.get('/posts', async (req, res) => {
  try {
    const { category, search, limit = 30, before, author } = req.query;

    // Build where clause
    const where = {};

    if (category && ['general', 'agents', 'ideas', 'help'].includes(category)) {
      where.category = category;
    }

    if (search && search.trim()) {
      where.OR = [
        { content: { contains: search.trim(), mode: 'insensitive' } },
        { authorName: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    if (author) {
      where.authorName = { contains: author, mode: 'insensitive' };
    }

    // Cursor-based pagination
    if (before) {
      const date = new Date(before);
      if (!isNaN(date.getTime())) {
        where.createdAt = { lt: date };
      }
    }

    // Fetch posts sorted by pinned first, then by date
    const posts = await prisma.communityPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      take: Math.min(parseInt(limit), 100),
    });

    // Format posts for frontend
    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      category: post.category,
      authorId: post.authorId,
      authorName: post.authorName,
      authorAvatar: post.author?.avatar || '👤',
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isPinned: post.isPinned,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      tags: post.tags || [],
    }));

    res.json({
      success: true,
      data: formattedPosts,
    });

  } catch (error) {
    console.error('Get community posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get community posts',
    });
  }
});

// ============================================
// POST /api/community/posts - Create new post
// ============================================

router.post('/posts', requireAuth, async (req, res) => {
  try {
    const { content, category = 'general', tags = [] } = req.body;
    const userId = req.userId;
    const user = req.user;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required',
      });
    }

    if (!['general', 'agents', 'ideas', 'help'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
      });
    }

    const post = await prisma.communityPost.create({
      data: {
        content: content.trim(),
        category,
        authorId: userId,
        authorName: user.name || 'Anonymous',
        tags,
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: post.id,
        content: post.content,
        category: post.category,
        authorId: post.authorId,
        authorName: post.authorName,
        authorAvatar: user.avatar || '👤',
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        isPinned: post.isPinned,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        tags: post.tags,
      },
    });

  } catch (error) {
    console.error('Create community post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create community post',
    });
  }
});

// ============================================
// GET /api/community/posts/:postId - Get specific post with comments
// ============================================

router.get('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                likes: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Format post with comments
    const formattedPost = {
      id: post.id,
      content: post.content,
      category: post.category,
      authorId: post.authorId,
      authorName: post.authorName,
      authorAvatar: post.author?.avatar || '👤',
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isPinned: post.isPinned,
      likesCount: post._count.likes,
      commentsCount: post.comments.length,
      tags: post.tags || [],
      comments: post.comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        authorId: comment.authorId,
        authorName: comment.authorName,
        authorAvatar: comment.author?.avatar || '👤',
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        likesCount: comment._count.likes,
      })),
    };

    res.json({
      success: true,
      data: formattedPost,
    });

  } catch (error) {
    console.error('Get community post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get community post',
    });
  }
});

// ============================================
// DELETE /api/community/posts/:postId - Delete post
// ============================================

router.delete('/posts/:postId', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    // Check if user owns the post
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts',
      });
    }

    // Delete post (cascade will handle comments and likes)
    await prisma.communityPost.delete({
      where: { id: postId },
    });

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });

  } catch (error) {
    console.error('Delete community post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete community post',
    });
  }
});

// ============================================
// POST /api/community/posts/:postId/like - Like/unlike post
// ============================================

router.post('/posts/:postId/like', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    // Check if post exists
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if user already liked this post
    const existingLike = await prisma.communityLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      // Unlike - remove the like
      await prisma.communityLike.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      res.json({
        success: true,
        action: 'unliked',
        message: 'Post unliked',
      });
    } else {
      // Like - add the like
      await prisma.communityLike.create({
        data: {
          userId,
          postId,
        },
      });

      res.json({
        success: true,
        action: 'liked',
        message: 'Post liked',
      });
    }

  } catch (error) {
    console.error('Like community post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like/unlike post',
    });
  }
});

// ============================================
// POST /api/community/posts/:postId/comments - Add comment
// ============================================

router.post('/posts/:postId/comments', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.userId;
    const user = req.user;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }

    // Check if post exists
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const comment = await prisma.communityComment.create({
      data: {
        content: content.trim(),
        postId,
        authorId: userId,
        authorName: user.name || 'Anonymous',
      },
      include: {
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: comment.id,
        content: comment.content,
        authorId: comment.authorId,
        authorName: comment.authorName,
        authorAvatar: user.avatar || '👤',
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        likesCount: comment._count.likes,
      },
    });

  } catch (error) {
    console.error('Create community comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
    });
  }
});

// ============================================
// GET /api/community/top-members - Get top community members
// ============================================

router.get('/top-members', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get users with post and comment counts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatar: true,
        _count: {
          select: {
            communityPosts: true,
            communityComments: true,
          },
        },
      },
      orderBy: [
        { communityPosts: { _count: 'desc' } },
        { communityComments: { _count: 'desc' } },
      ],
      take: Math.min(parseInt(limit), 50),
    });

    // Calculate engagement score
    const topMembers = users.map(user => ({
      id: user.id,
      name: user.name || 'Anonymous',
      avatar: user.avatar || '👤',
      postsCount: user._count.communityPosts,
      commentsCount: user._count.communityComments,
      engagementScore: user._count.communityPosts * 3 + user._count.communityComments,
    }));

    res.json({
      success: true,
      data: topMembers,
    });

  } catch (error) {
    console.error('Get top members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top members',
    });
  }
});

// ============================================
// POST /api/community/presence/ping - Update user presence
// ============================================

router.post('/presence/ping', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    // Upsert a session row to mark the user as recently active
    const sessionId = req.cookies.session_id || req.cookies.sessionId;
    if (sessionId) {
      await prisma.session.updateMany({
        where: { sessionId },
        data: {
          lastActivity: new Date(),
          isActive: true,
        },
      });
    }

    // Count users active in last 5 minutes
    const onlineNow = await prisma.session.count({
      where: {
        isActive: true,
        lastActivity: { gt: new Date(Date.now() - 5 * 60 * 1000) },
      },
    });

    res.json({
      success: true,
      data: { onlineNow },
    });
  } catch (error) {
    console.error('Presence ping error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update presence',
    });
  }
});

// ============================================
// GET /api/community/stream - Get community metrics (JSON, polled by frontend)
// ============================================

router.get('/stream', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent activity counts
    const totalMembers = await prisma.user.count();
    const onlineNow = await prisma.session.count({
      where: {
        isActive: true,
        lastActivity: { gt: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
      },
    });
    const totalPosts = await prisma.communityPost.count();
    const postsThisWeek = await prisma.communityPost.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    // Get recent posts
    const recentPosts = await prisma.communityPost.findMany({
      take: Math.min(parseInt(limit), 50),
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    const formattedPosts = recentPosts.map(post => ({
      id: post.id,
      content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
      category: post.category,
      authorName: post.authorName,
      authorAvatar: post.author?.avatar || '👤',
      createdAt: post.createdAt,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
    }));

    res.json({
      success: true,
      data: {
        stats: {
          totalMembers,
          onlineNow,
          totalPosts,
          postsThisWeek,
        },
        recentPosts: formattedPosts,
      },
    });

  } catch (error) {
    console.error('Get community stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get community stream',
    });
  }
});

export default router;
