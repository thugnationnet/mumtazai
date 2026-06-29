/**
 * FAVORITES ROUTES
 * Handles user favorites for agents, tools, content
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

/**
 * Add to favorites
 */
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      type,
      itemId,
      itemSlug,
      itemTitle,
      metadata,
      folder,
      notes,
    } = req.body;

    if (!userId || !type || !itemId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if already favorited
    const existing = await prisma.userFavorites.findUnique({
      where: {
        userId_itemType_itemId: { userId, itemType: type, itemId },
      },
    });

    if (existing) {
      return res.status(400).json({
        error: 'Already in favorites',
        favoriteId: existing.id,
      });
    }

    const favorite = await prisma.userFavorites.create({
      data: {
        userId,
        itemType: type,
        itemId,
        itemSlug: itemSlug || null,
        itemTitle: itemTitle || null,
        metadata: metadata || undefined,
        folder: folder || null,
        notes: notes || null,
      },
    });

    res.json({
      success: true,
      favorite: {
        id: favorite.id,
        type: favorite.itemType,
        itemId: favorite.itemId,
        itemTitle: favorite.itemTitle,
      },
      message: 'Added to favorites',
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
});

/**
 * Get user's favorites
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, folder } = req.query;

    const where = { userId };
    if (type) where.itemType = type;
    if (folder) where.folder = folder;

    const favorites = await prisma.userFavorites.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Group by type for easier frontend use
    const grouped = favorites.reduce((acc, fav) => {
      const key = fav.itemType;
      if (!acc[key]) acc[key] = [];
      acc[key].push(fav);
      return acc;
    }, {});

    res.json({
      success: true,
      favorites,
      grouped,
      total: favorites.length,
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

/**
 * Check if item is favorited
 */
router.get('/check/:userId/:type/:itemId', async (req, res) => {
  try {
    const { userId, type, itemId } = req.params;

    const favorite = await prisma.userFavorites.findUnique({
      where: {
        userId_itemType_itemId: { userId, itemType: type, itemId },
      },
    });

    res.json({
      success: true,
      isFavorited: !!favorite,
      favorite: favorite || null,
    });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ error: 'Failed to check favorite' });
  }
});

/**
 * Update favorite (notes, folder, etc.)
 */
router.patch('/:favoriteId', async (req, res) => {
  try {
    const { favoriteId } = req.params;
    const { notes, folder, color, sortOrder } = req.body;

    const existing = await prisma.userFavorites.findUnique({
      where: { id: favoriteId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    const updateData = {};
    if (notes !== undefined) updateData.notes = notes;
    if (folder !== undefined) updateData.folder = folder;
    if (color !== undefined) updateData.color = color;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const favorite = await prisma.userFavorites.update({
      where: { id: favoriteId },
      data: updateData,
    });

    res.json({
      success: true,
      favorite,
      message: 'Favorite updated',
    });
  } catch (error) {
    console.error('Error updating favorite:', error);
    res.status(500).json({ error: 'Failed to update favorite' });
  }
});

/**
 * Remove from favorites
 */
router.delete('/:userId/:type/:itemId', async (req, res) => {
  try {
    const { userId, type, itemId } = req.params;

    const existing = await prisma.userFavorites.findUnique({
      where: {
        userId_itemType_itemId: { userId, itemType: type, itemId },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    await prisma.userFavorites.delete({
      where: { id: existing.id },
    });

    res.json({
      success: true,
      message: 'Removed from favorites',
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

/**
 * Track favorite usage (when user accesses the favorited item)
 */
router.post('/:favoriteId/use', async (req, res) => {
  try {
    const { favoriteId } = req.params;

    const existing = await prisma.userFavorites.findUnique({
      where: { id: favoriteId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    await prisma.userFavorites.update({
      where: { id: favoriteId },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date(),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking usage:', error);
    res.status(500).json({ error: 'Failed to track usage' });
  }
});

/**
 * Get favorite folders for user
 */
router.get('/folders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const results = await prisma.userFavorites.findMany({
      where: {
        userId,
        folder: { not: null },
      },
      select: { folder: true },
      distinct: ['folder'],
    });

    const folders = results.map(r => r.folder);

    res.json({
      success: true,
      folders,
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

export default router;
