/**
 * LAB — STORY WEAVER sub-routes
 *
 * POST   /generate                              — AI content generation
 * POST   /stories                               — Create story
 * GET    /stories/:storyId                       — Load story (or user stories list)
 * PUT    /stories/:storyId                       — Update story
 * POST   /stories/:storyId/chapters              — Add chapter
 * PUT    /stories/:storyId/chapters/:chapterId   — Update chapter
 * POST   /stories/:storyId/export                — Export story
 * POST   /stories/:storyId/publish               — Publish story
 * POST   /stories/:storyId/collaborate           — Invite collaborator
 * GET    /characters/:userId                     — List user characters
 * POST   /characters                             — Create character
 * GET    /collaborations/:userId                 — List collaborations
 * GET    /templates                              — Story templates
 * GET    /genres                                 — Genre catalogue
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { generateWithAI } from '../lib/ai-provider.js';

const router = express.Router();

// ── POST /generate ──────────────────────────────────────────────

router.post('/generate', async (req, res) => {
  const id = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const start = Date.now();
  try {
    const { type, prompt, context, parameters } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

    await prisma.labExperiment.create({
      data: { experimentId: id, experimentType: 'story-weaver-generate', input: req.body, status: 'processing', startedAt: new Date() },
    });

    const style = parameters?.style || 'descriptive';
    const tone = parameters?.tone || 'neutral';
    const perspective = parameters?.perspective || 'third';
    const tense = parameters?.tense || 'past';
    const genre = context?.genre || 'fantasy';

    let sys = '', usr = '';
    switch (type) {
      case 'chapter':
        sys = `You are a masterful ${genre} writer. Write in ${perspective} person, ${tense} tense, with a ${tone} tone and ${style} style.`;
        usr = `Write a new chapter for this story:\n\nContext: ${context?.previousContent?.slice(-1000) || 'A new story begins.'}\n\nPrompt: ${prompt}\n\nWrite 3-5 paragraphs:`; break;
      case 'character':
        sys = `You are a character development expert for ${genre} stories.`;
        usr = `Create a detailed character based on:\n${prompt}\n\nInclude: name, description, personality traits, appearance, background, motivations.`; break;
      case 'setting':
        sys = `You are a world-building expert for ${genre} stories.`;
        usr = `Describe this setting:\n${prompt}\n\nInclude atmosphere, sensory details, history, significance.`; break;
      case 'plot':
        sys = `You are a plot architect for ${genre} stories.`;
        usr = `Develop a plot outline:\n${prompt}\n\nInclude key events, character arcs, conflicts, resolution.`; break;
      case 'dialogue':
        sys = `You are a dialogue writer for ${genre} stories.`;
        usr = `Write dialogue for:\n${prompt}\n\nMake it natural and character-driven.`; break;
      default:
        sys = `You are a creative ${genre} writer. Be vivid and engaging.`;
        usr = prompt;
    }

    const { text, tokens } = await generateWithAI(sys, usr, { maxTokens: 32768, temperature: 0.9 });
    const pt = Date.now() - start;

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const themes = (text.match(/\b(love|war|betrayal|hope|fear|power|revenge|discovery|friendship|courage)\b/gi) || []).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);

    const result = {
      content: text,
      suggestions: ['Try adding more sensory details', 'Consider introducing a subplot', 'A cliffhanger could increase tension'],
      alternatives: [],
      continuationPrompts: ['What happens next when the character faces their fear?', 'How does this revelation change the dynamic?', 'Introduce a new character who shakes things up'],
      analysis: { wordCount, readabilityScore: 75, tone, themes },
    };

    await prisma.labExperiment.update({
      where: { experimentId: id },
      data: { output: { result }, status: 'completed', processingTime: pt, tokensUsed: tokens, completedAt: new Date() },
    });

    res.json({ success: true, result, experimentId: id });
  } catch (err) {
    try { await prisma.labExperiment.update({ where: { experimentId: id }, data: { status: 'failed', errorMessage: err.message } }); } catch {}
    res.status(500).json({ message: err.message || 'Generation failed' });
  }
});

// ── POST /stories ───────────────────────────────────────────────

router.post('/stories', async (req, res) => {
  try {
    const { userId, storyData, templateId } = req.body;
    const storyId = `story_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const story = {
      id: storyId,
      title: storyData?.title || 'Untitled Story',
      description: storyData?.description || '',
      genre: storyData?.genre || 'fantasy',
      status: 'draft',
      visibility: storyData?.visibility || 'private',
      chapters: [], characters: [], settings: [],
      themes: storyData?.themes || [],
      tags: storyData?.tags || [],
      wordCount: 0, estimatedReadTime: 0,
      createdAt: now, updatedAt: now,
      authorId: userId || 'anonymous',
      collaborators: [],
      metadata: storyData?.metadata || { targetAudience: 'general', contentWarnings: [], language: 'en' },
    };

    await prisma.labExperiment.create({
      data: { experimentId: storyId, experimentType: 'story-weaver-story', userId: userId || null, input: { templateId }, output: { story }, status: 'completed', startedAt: new Date(), completedAt: new Date() },
    });

    res.json({ success: true, story });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to create story' });
  }
});

// ── GET /stories/:storyId ───────────────────────────────────────

router.get('/stories/:storyId', async (req, res) => {
  try {
    const { storyId } = req.params;

    // Try as specific story first
    const record = await prisma.labExperiment.findUnique({ where: { experimentId: storyId } });
    if (record && record.experimentType === 'story-weaver-story') {
      return res.json({ story: record.output?.story });
    }

    // Treat as userId — list user's stories
    const records = await prisma.labExperiment.findMany({
      where: { userId: storyId, experimentType: 'story-weaver-story' },
      select: { output: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ stories: records.map((r) => r.output?.story).filter(Boolean) });
  } catch (err) {
    res.json({ stories: [], story: null });
  }
});

// ── PUT /stories/:storyId ───────────────────────────────────────

router.put('/stories/:storyId', async (req, res) => {
  try {
    const { storyId } = req.params;
    const updates = req.body;

    const record = await prisma.labExperiment.findUnique({ where: { experimentId: storyId } });
    if (!record) return res.status(404).json({ message: 'Story not found' });

    const existing = record.output?.story || {};
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };

    if (updated.chapters) {
      updated.wordCount = updated.chapters.reduce((c, ch) => c + (ch.content?.split(/\s+/).length || 0), 0);
      updated.estimatedReadTime = Math.ceil(updated.wordCount / 200);
    }

    await prisma.labExperiment.update({ where: { experimentId: storyId }, data: { output: { story: updated } } });
    res.json({ success: true, story: updated });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update story' });
  }
});

// ── POST /stories/:storyId/chapters ─────────────────────────────

router.post('/stories/:storyId/chapters', async (req, res) => {
  try {
    const { storyId } = req.params;
    const chapterData = req.body;

    const record = await prisma.labExperiment.findUnique({ where: { experimentId: storyId } });
    if (!record) return res.status(404).json({ message: 'Story not found' });

    const story = record.output?.story || {};
    const chapters = story.chapters || [];

    const chapter = {
      id: `chapter_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: chapterData.title || `Chapter ${chapters.length + 1}`,
      content: chapterData.content || '',
      summary: chapterData.summary || '',
      wordCount: (chapterData.content || '').split(/\s+/).filter(Boolean).length,
      order: chapters.length + 1,
      status: chapterData.status || 'draft',
      authorId: chapterData.authorId || story.authorId || 'anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [], revisions: [],
    };

    chapters.push(chapter);
    story.chapters = chapters;
    story.wordCount = chapters.reduce((c, ch) => c + (ch.wordCount || 0), 0);
    story.estimatedReadTime = Math.ceil(story.wordCount / 200);
    story.updatedAt = new Date().toISOString();

    await prisma.labExperiment.update({ where: { experimentId: storyId }, data: { output: { story } } });
    res.json({ success: true, chapter });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to add chapter' });
  }
});

// ── PUT /stories/:storyId/chapters/:chapterId ───────────────────

router.put('/stories/:storyId/chapters/:chapterId', async (req, res) => {
  try {
    const { storyId, chapterId } = req.params;
    const updates = req.body;

    const record = await prisma.labExperiment.findUnique({ where: { experimentId: storyId } });
    if (!record) return res.status(404).json({ message: 'Story not found' });

    const story = record.output?.story || {};
    const chapters = story.chapters || [];
    const idx = chapters.findIndex((c) => c.id === chapterId);
    if (idx === -1) return res.status(404).json({ message: 'Chapter not found' });

    chapters[idx] = {
      ...chapters[idx],
      ...updates,
      wordCount: updates.content ? updates.content.split(/\s+/).filter(Boolean).length : chapters[idx].wordCount,
      updatedAt: new Date().toISOString(),
    };

    story.chapters = chapters;
    story.wordCount = chapters.reduce((c, ch) => c + (ch.wordCount || 0), 0);
    story.estimatedReadTime = Math.ceil(story.wordCount / 200);
    story.updatedAt = new Date().toISOString();

    await prisma.labExperiment.update({ where: { experimentId: storyId }, data: { output: { story } } });
    res.json({ success: true, chapter: chapters[idx] });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update chapter' });
  }
});

// ── POST /stories/:storyId/export ───────────────────────────────

router.post('/stories/:storyId/export', async (req, res) => {
  try {
    const { storyId } = req.params;
    const { format } = req.body;

    const record = await prisma.labExperiment.findUnique({ where: { experimentId: storyId } });
    if (!record) return res.status(404).json({ message: 'Story not found' });

    const story = record.output?.story || {};

    if (format === 'json') {
      res.set({ 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="${story.title || 'story'}.json"` });
      return res.send(JSON.stringify(story, null, 2));
    }

    let content = `${story.title || 'Untitled'}\n${'='.repeat(story.title?.length || 8)}\n\n`;
    content += `Genre: ${story.genre || 'Unknown'}\nWord Count: ${story.wordCount || 0}\nStatus: ${story.status || 'draft'}\n\n`;
    if (story.description) content += `${story.description}\n\n`;
    for (const ch of (story.chapters || [])) {
      content += `\n---\n\n## ${ch.title || `Chapter ${ch.order}`}\n\n${ch.content || ''}\n`;
    }

    res.set({ 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': `attachment; filename="${story.title || 'story'}.${format || 'txt'}"` });
    res.send(content);
  } catch (err) {
    res.status(500).json({ message: 'Export failed' });
  }
});

// ── POST /stories/:storyId/publish ──────────────────────────────

router.post('/stories/:storyId/publish', async (req, res) => {
  try {
    const { storyId } = req.params;
    const body = req.body;

    const record = await prisma.labExperiment.findUnique({ where: { experimentId: storyId } });
    if (!record) return res.status(404).json({ message: 'Story not found' });

    const story = record.output?.story || {};
    story.status = 'published';
    story.visibility = 'public';
    story.updatedAt = new Date().toISOString();
    if (body?.publicMetadata) story.metadata = { ...story.metadata, ...body.publicMetadata };

    await prisma.labExperiment.update({ where: { experimentId: storyId }, data: { output: { story } } });
    res.json({ success: true, message: 'Story published successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to publish story' });
  }
});

// ── POST /stories/:storyId/collaborate ──────────────────────────

router.post('/stories/:storyId/collaborate', async (req, res) => {
  try {
    const { storyId } = req.params;
    const { email } = req.body;

    const record = await prisma.labExperiment.findUnique({ where: { experimentId: storyId } });
    if (!record) return res.status(404).json({ message: 'Story not found' });

    const story = record.output?.story || {};
    story.collaborators = [...(story.collaborators || []), email];

    await prisma.labExperiment.update({ where: { experimentId: storyId }, data: { output: { story } } });
    res.json({ success: true, message: `Collaboration invite sent to ${email}` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to invite collaborator' });
  }
});

// ── GET /characters/:userId ─────────────────────────────────────

router.get('/characters/:userId', async (req, res) => {
  try {
    const records = await prisma.labExperiment.findMany({
      where: { userId: req.params.userId, experimentType: 'story-weaver-character' },
      select: { output: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ characters: records.map((r) => r.output?.character).filter(Boolean) });
  } catch { res.json({ characters: [] }); }
});

// ── POST /characters ────────────────────────────────────────────

router.post('/characters', async (req, res) => {
  try {
    const { userId, characterData, storyId } = req.body;
    const characterId = `char_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const character = {
      id: characterId,
      name: characterData?.name || 'Unnamed Character',
      description: characterData?.description || '',
      personality: characterData?.personality || [],
      appearance: characterData?.appearance || '',
      background: characterData?.background || '',
      motivations: characterData?.motivations || [],
      relationships: characterData?.relationships || [],
      role: characterData?.role || 'supporting',
      arc: characterData?.arc || '',
      avatar: characterData?.avatar,
      traits: characterData?.traits || [],
      createdAt: now, updatedAt: now,
    };

    await prisma.labExperiment.create({
      data: { experimentId: characterId, experimentType: 'story-weaver-character', userId: userId || null, input: { storyId }, output: { character }, status: 'completed', completedAt: new Date() },
    });

    // Add character to story if storyId provided
    if (storyId) {
      try {
        const storyRecord = await prisma.labExperiment.findUnique({ where: { experimentId: storyId } });
        if (storyRecord) {
          const story = storyRecord.output?.story || {};
          story.characters = [...(story.characters || []), character];
          await prisma.labExperiment.update({ where: { experimentId: storyId }, data: { output: { story } } });
        }
      } catch {}
    }

    res.json({ success: true, character });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to create character' });
  }
});

// ── GET /collaborations/:userId ─────────────────────────────────

router.get('/collaborations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const records = await prisma.labExperiment.findMany({
      where: { experimentType: 'story-weaver-story', status: 'completed' },
      select: { output: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const collaborations = records
      .map((r) => {
        const story = r.output?.story;
        if (!story) return null;
        const isCollaborator = (story.collaborators || []).includes(userId) || story.authorId === userId;
        if (!isCollaborator || story.authorId === userId) return null;
        return {
          id: story.id, storyId: story.id, storyTitle: story.title, role: 'co-author',
          permissions: { canEdit: true, canAddChapters: true, canEditCharacters: true, canInviteOthers: false, canPublish: false },
          invitedBy: story.authorId, joinedAt: r.createdAt.toISOString(), lastActive: r.createdAt.toISOString(), contributions: 0,
        };
      })
      .filter(Boolean);

    res.json({ collaborations });
  } catch { res.json({ collaborations: [] }); }
});

// ── GET /templates ──────────────────────────────────────────────

router.get('/templates', (_req, res) => {
  res.json({
    templates: [
      {
        id: 'heros-journey', name: "Hero's Journey", description: 'Classic monomyth structure following a hero through transformation', genre: 'fantasy',
        structure: [
          { act: 'Act 1: Departure', chapters: ['The Ordinary World', 'The Call to Adventure', 'Crossing the Threshold'] },
          { act: 'Act 2: Initiation', chapters: ['Tests & Allies', 'The Ordeal', 'The Reward'] },
          { act: 'Act 3: Return', chapters: ['The Road Back', 'Resurrection', 'Return with Elixir'] },
        ],
        characters: [
          { role: 'Protagonist', archetype: 'The Hero' },
          { role: 'Mentor', archetype: 'The Sage' },
          { role: 'Antagonist', archetype: 'The Shadow' },
        ],
        prompts: ['A young farmhand discovers a magical artifact...', 'An outcast receives a mysterious summons...'],
        tags: ['classic', 'adventure'], difficulty: 'beginner', estimatedChapters: 9, popularity: 95,
      },
      {
        id: 'mystery-whodunit', name: 'Classic Whodunit', description: 'A detective investigates a crime with multiple suspects', genre: 'mystery',
        structure: [
          { act: 'Act 1: The Crime', chapters: ['Discovery', 'Initial Investigation', 'First Suspect'] },
          { act: 'Act 2: Investigation', chapters: ['Deepening Mystery', 'Second Crime', 'The Twist'] },
          { act: 'Act 3: Resolution', chapters: ['The Reveal', 'Confrontation', 'Justice'] },
        ],
        characters: [{ role: 'Detective', archetype: 'The Investigator' }, { role: 'Suspect', archetype: 'The Trickster' }],
        prompts: ['A locked room murder in a luxury hotel...', 'A renowned art collector is found dead...'],
        tags: ['detective', 'puzzle'], difficulty: 'intermediate', estimatedChapters: 9, popularity: 88,
      },
      {
        id: 'romance-arc', name: 'Romance Arc', description: 'Two characters find love through conflict and connection', genre: 'romance',
        structure: [
          { act: 'Act 1: Meeting', chapters: ['First Encounter', 'The Spark', 'Growing Connection'] },
          { act: 'Act 2: Conflict', chapters: ['The Obstacle', 'Misunderstanding', 'Separation'] },
          { act: 'Act 3: Resolution', chapters: ['Grand Gesture', 'Reconciliation', 'Happy Ending'] },
        ],
        characters: [{ role: 'Lead 1', archetype: 'The Lover' }, { role: 'Lead 2', archetype: 'The Lover' }],
        prompts: ['Two rival bakery owners in a small town...', 'A second-chance romance at a reunion...'],
        tags: ['love', 'relationships'], difficulty: 'beginner', estimatedChapters: 9, popularity: 82,
      },
      {
        id: 'scifi-first-contact', name: 'First Contact', description: 'Humanity encounters alien intelligence', genre: 'sci-fi',
        structure: [
          { act: 'Act 1: Discovery', chapters: ['The Signal', 'First Response', 'The World Reacts'] },
          { act: 'Act 2: Contact', chapters: ['Meeting', 'Cultural Exchange', 'The Crisis'] },
          { act: 'Act 3: Resolution', chapters: ['The Decision', 'New Dawn'] },
        ],
        characters: [{ role: 'Scientist', archetype: 'The Explorer' }],
        prompts: ['A deep space signal changes everything...', 'An alien ship appears over a small town...'],
        tags: ['alien', 'space'], difficulty: 'advanced', estimatedChapters: 8, popularity: 75,
      },
    ],
  });
});

// ── GET /genres ──────────────────────────────────────────────────

router.get('/genres', (_req, res) => {
  res.json({
    genres: [
      { id: 'fantasy', name: 'Fantasy', description: 'Stories set in magical worlds', subgenres: ['High Fantasy', 'Urban Fantasy', 'Dark Fantasy', 'Fairy Tale', 'Mythic Fantasy'] },
      { id: 'sci-fi', name: 'Science Fiction', description: 'Speculative fiction exploring futuristic technology', subgenres: ['Space Opera', 'Cyberpunk', 'Hard Sci-Fi', 'Post-Apocalyptic', 'Time Travel'] },
      { id: 'mystery', name: 'Mystery', description: 'Stories centered around solving a crime or puzzle', subgenres: ['Cozy Mystery', 'Noir', 'Police Procedural', 'Psychological Thriller', 'Legal Thriller'] },
      { id: 'romance', name: 'Romance', description: 'Stories focused on romantic relationships', subgenres: ['Contemporary', 'Historical', 'Paranormal', 'Romantic Comedy', 'Romantic Suspense'] },
      { id: 'horror', name: 'Horror', description: 'Stories designed to frighten and unsettle', subgenres: ['Psychological Horror', 'Gothic', 'Cosmic Horror', 'Supernatural', 'Body Horror'] },
      { id: 'adventure', name: 'Adventure', description: 'Action-packed stories of exploration', subgenres: ['Action', 'Survival', 'Historical Adventure', 'Treasure Hunt', 'Exploration'] },
    ],
  });
});

export default router;
