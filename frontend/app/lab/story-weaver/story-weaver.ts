/**
 * Story Weaver Logic - AI Lab Module
 * Handles collaborative story creation, character development, and narrative generation
 */

export interface StoryWeaverState {
  isLoading: boolean;
  isGenerating: boolean;
  isSaving: boolean;
  error: string | null;
  success: boolean;
  currentStory: Story | null;
  stories: Story[];
  characters: Character[];
  templates: StoryTemplate[];
  collaborations: Collaboration[];
  genres: Genre[];
}

export interface Story {
  id: string;
  title: string;
  description: string;
  genre: string;
  status: 'draft' | 'active' | 'completed' | 'published' | 'archived';
  visibility: 'private' | 'public' | 'collaborative';
  chapters: Chapter[];
  characters: Character[];
  settings: StorySetting[];
  themes: string[];
  tags: string[];
  wordCount: number;
  estimatedReadTime: number;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  collaborators: string[];
  metadata: StoryMetadata;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  summary: string;
  wordCount: number;
  order: number;
  status: 'outline' | 'draft' | 'review' | 'final';
  authorId: string;
  createdAt: string;
  updatedAt: string;
  comments: ChapterComment[];
  revisions: ChapterRevision[];
}

export interface ChapterComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  type: 'suggestion' | 'question' | 'praise' | 'critique';
  position?: number; // Character position in text
  resolved: boolean;
  createdAt: string;
}

export interface ChapterRevision {
  id: string;
  content: string;
  summary: string;
  changes: string;
  authorId: string;
  createdAt: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  personality: string[];
  appearance: string;
  background: string;
  motivations: string[];
  relationships: CharacterRelationship[];
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  arc: string;
  avatar?: string;
  traits: CharacterTrait[];
  createdAt: string;
  updatedAt: string;
}

export interface CharacterRelationship {
  characterId: string;
  relationshipType:
    | 'family'
    | 'friend'
    | 'enemy'
    | 'romantic'
    | 'mentor'
    | 'rival';
  description: string;
  strength: number; // 1-10
}

export interface CharacterTrait {
  trait: string;
  value: number; // 1-10
  description?: string;
}

export interface StorySetting {
  id: string;
  name: string;
  description: string;
  type: 'location' | 'time_period' | 'culture' | 'technology';
  atmosphere: string;
  significance: string;
  details: string[];
}

export interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  genre: string;
  structure: TemplateStructure[];
  characters: CharacterTemplate[];
  prompts: string[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedChapters: number;
  popularity: number;
}

export interface TemplateStructure {
  act: string;
  chapters: string[];
  keyEvents: string[];
  characterDevelopment: string[];
}

export interface CharacterTemplate {
  role: string;
  archetype: string;
  traits: string[];
  relationships: string[];
}

export interface Genre {
  id: string;
  name: string;
  description: string;
  subgenres: string[];
  characteristics: string[];
  examples: string[];
  popularTropes: string[];
  writingTips: string[];
}

export interface Collaboration {
  id: string;
  storyId: string;
  storyTitle: string;
  role: 'owner' | 'co-author' | 'editor' | 'reviewer';
  permissions: CollaborationPermissions;
  invitedBy: string;
  joinedAt: string;
  lastActive: string;
  contributions: number;
}

export interface CollaborationPermissions {
  canEdit: boolean;
  canAddChapters: boolean;
  canEditCharacters: boolean;
  canInviteOthers: boolean;
  canPublish: boolean;
}

export interface StoryMetadata {
  targetAudience: string;
  contentWarnings: string[];
  language: string;
  inspiration: string;
  dedicatedTo?: string;
  estimatedLength: 'short' | 'novella' | 'novel' | 'epic';
  completionGoal?: string;
}

export interface GenerationRequest {
  type: 'chapter' | 'character' | 'setting' | 'plot' | 'dialogue';
  prompt: string;
  context: {
    storyId?: string;
    genre?: string;
    tone?: string;
    style?: string;
    length?: 'short' | 'medium' | 'long';
    previousContent?: string;
  };
  parameters: GenerationParameters;
}

export interface GenerationParameters {
  creativity: number; // 0-1
  coherence: number; // 0-1
  style: string;
  tone: string;
  perspective: 'first' | 'second' | 'third';
  tense: 'past' | 'present' | 'future';
}

export interface GenerationResult {
  content: string;
  suggestions: string[];
  alternatives: string[];
  continuationPrompts: string[];
  analysis: {
    wordCount: number;
    readabilityScore: number;
    tone: string;
    themes: string[];
  };
}

export class StoryWeaverLogic {
  private state: StoryWeaverState;
  private autoSaveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.state = {
      isLoading: false,
      isGenerating: false,
      isSaving: false,
      error: null,
      success: false,
      currentStory: null,
      stories: [],
      characters: [],
      templates: [],
      collaborations: [],
      genres: [],
    };
  }

  /**
   * Initialize Story Weaver
   */
  async initialize(userId: string): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;

    try {
      const [stories, characters, templates, collaborations, genres] =
        await Promise.all([
          this.fetchUserStories(userId),
          this.fetchUserCharacters(userId),
          this.fetchStoryTemplates(),
          this.fetchCollaborations(userId),
          this.fetchGenres(),
        ]);

      this.state.stories = stories;
      this.state.characters = characters;
      this.state.templates = templates;
      this.state.collaborations = collaborations;
      this.state.genres = genres;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load Story Weaver';
      this.state.error = message;
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Fetch user stories
   */
  private async fetchUserStories(userId: string): Promise<Story[]> {
    try {
      const response = await fetch(`/api/lab/story-weaver/stories/${userId}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.stories || [];
    } catch (error) {
      console.error('Error fetching user stories:', error);
      return [];
    }
  }

  /**
   * Fetch user characters
   */
  private async fetchUserCharacters(userId: string): Promise<Character[]> {
    try {
      const response = await fetch(
        `/api/lab/story-weaver/characters/${userId}`
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.characters || [];
    } catch (error) {
      console.error('Error fetching user characters:', error);
      return [];
    }
  }

  /**
   * Fetch story templates
   */
  private async fetchStoryTemplates(): Promise<StoryTemplate[]> {
    try {
      const response = await fetch('/api/lab/story-weaver/templates');
      if (!response.ok) return [];
      const data = await response.json();
      return data.templates || [];
    } catch (error) {
      console.error('Error fetching story templates:', error);
      return [];
    }
  }

  /**
   * Fetch collaborations
   */
  private async fetchCollaborations(userId: string): Promise<Collaboration[]> {
    try {
      const response = await fetch(
        `/api/lab/story-weaver/collaborations/${userId}`
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.collaborations || [];
    } catch (error) {
      console.error('Error fetching collaborations:', error);
      return [];
    }
  }

  /**
   * Fetch available genres
   */
  private async fetchGenres(): Promise<Genre[]> {
    try {
      const response = await fetch('/api/lab/story-weaver/genres');
      if (!response.ok) return [];
      const data = await response.json();
      return data.genres || [];
    } catch (error) {
      console.error('Error fetching genres:', error);
      return [];
    }
  }

  /**
   * Create new story
   */
  async createStory(
    userId: string,
    storyData: Partial<Story>,
    templateId?: string
  ): Promise<Story> {
    this.state.isSaving = true;
    this.state.error = null;

    try {
      const response = await fetch('/api/lab/story-weaver/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          storyData,
          templateId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create story');
      }

      const newStory = data.story;
      this.state.stories.unshift(newStory);
      this.state.currentStory = newStory;
      this.state.success = true;

      this.trackStoryEvent('story_created', {
        storyId: newStory.id,
        genre: newStory.genre,
        templateId,
      });

      return newStory;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create story';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isSaving = false;
    }
  }

  /**
   * Load story for editing
   */
  async loadStory(storyId: string): Promise<Story> {
    this.state.isLoading = true;
    this.state.error = null;

    try {
      const response = await fetch(`/api/lab/story-weaver/stories/${storyId}`);

      if (!response.ok) {
        throw new Error('Story not found');
      }

      const data = await response.json();
      this.state.currentStory = data.story;

      this.trackStoryEvent('story_loaded', { storyId });

      return data.story;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load story';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Save story changes
   */
  async saveStory(storyId: string, updates: Partial<Story>): Promise<void> {
    this.state.isSaving = true;
    this.state.error = null;

    try {
      const response = await fetch(`/api/lab/story-weaver/stories/${storyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save story');
      }

      // Update local state
      if (this.state.currentStory?.id === storyId) {
        this.state.currentStory = { ...this.state.currentStory, ...updates };
      }

      const storyIndex = this.state.stories.findIndex((s) => s.id === storyId);
      if (storyIndex >= 0) {
        this.state.stories[storyIndex] = {
          ...this.state.stories[storyIndex],
          ...updates,
        };
      }

      this.state.success = true;

      this.trackStoryEvent('story_saved', { storyId });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save story';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isSaving = false;
    }
  }

  /**
   * Generate content using AI
   */
  async generateContent(request: GenerationRequest): Promise<GenerationResult> {
    this.state.isGenerating = true;
    this.state.error = null;

    try {
      const response = await fetch('/api/lab/story-weaver/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate content');
      }

      this.trackStoryEvent('content_generated', {
        type: request.type,
        storyId: request.context.storyId,
      });

      return data.result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate content';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isGenerating = false;
    }
  }

  /**
   * Add chapter to story
   */
  async addChapter(
    storyId: string,
    chapterData: Partial<Chapter>
  ): Promise<Chapter> {
    this.state.isSaving = true;
    this.state.error = null;

    try {
      const response = await fetch(
        `/api/lab/story-weaver/stories/${storyId}/chapters`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chapterData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add chapter');
      }

      const newChapter = data.chapter;

      // Update current story
      if (this.state.currentStory?.id === storyId) {
        this.state.currentStory.chapters.push(newChapter);
        this.updateWordCount(this.state.currentStory);
      }

      this.trackStoryEvent('chapter_added', {
        storyId,
        chapterId: newChapter.id,
      });

      return newChapter;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to add chapter';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isSaving = false;
    }
  }

  /**
   * Update chapter content
   */
  async updateChapter(
    storyId: string,
    chapterId: string,
    updates: Partial<Chapter>
  ): Promise<void> {
    // Immediate local update for responsive UI
    if (this.state.currentStory?.id === storyId) {
      const chapterIndex = this.state.currentStory.chapters.findIndex(
        (c) => c.id === chapterId
      );
      if (chapterIndex >= 0) {
        this.state.currentStory.chapters[chapterIndex] = {
          ...this.state.currentStory.chapters[chapterIndex],
          ...updates,
        };
        this.updateWordCount(this.state.currentStory);
      }
    }

    // Schedule auto-save
    this.scheduleAutoSave(storyId, chapterId, updates);
  }

  /**
   * Create character
   */
  async createCharacter(
    userId: string,
    characterData: Partial<Character>,
    storyId?: string
  ): Promise<Character> {
    this.state.isSaving = true;
    this.state.error = null;

    try {
      const response = await fetch('/api/lab/story-weaver/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          characterData,
          storyId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create character');
      }

      const newCharacter = data.character;
      this.state.characters.push(newCharacter);

      // Add to current story if specified
      if (storyId && this.state.currentStory?.id === storyId) {
        this.state.currentStory.characters.push(newCharacter);
      }

      this.trackStoryEvent('character_created', {
        characterId: newCharacter.id,
        storyId,
      });

      return newCharacter;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create character';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isSaving = false;
    }
  }

  /**
   * Invite collaborator
   */
  async inviteCollaborator(
    storyId: string,
    email: string,
    role: string,
    permissions: CollaborationPermissions
  ): Promise<void> {
    this.state.isSaving = true;
    this.state.error = null;

    try {
      const response = await fetch(
        `/api/lab/story-weaver/stories/${storyId}/collaborate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            role,
            permissions,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to invite collaborator');
      }

      this.state.success = true;

      this.trackStoryEvent('collaborator_invited', {
        storyId,
        role,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to invite collaborator';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isSaving = false;
    }
  }

  /**
   * Publish story
   */
  async publishStory(storyId: string, publicMetadata?: any): Promise<void> {
    this.state.isSaving = true;
    this.state.error = null;

    try {
      const response = await fetch(
        `/api/lab/story-weaver/stories/${storyId}/publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicMetadata }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to publish story');
      }

      // Update story status
      if (this.state.currentStory?.id === storyId) {
        this.state.currentStory.status = 'published';
      }

      const storyIndex = this.state.stories.findIndex((s) => s.id === storyId);
      if (storyIndex >= 0) {
        this.state.stories[storyIndex].status = 'published';
      }

      this.state.success = true;

      this.trackStoryEvent('story_published', { storyId });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to publish story';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isSaving = false;
    }
  }

  /**
   * Schedule auto-save for chapter updates
   */
  private scheduleAutoSave(
    storyId: string,
    chapterId: string,
    updates: Partial<Chapter>
  ): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(async () => {
      try {
        await fetch(
          `/api/lab/story-weaver/stories/${storyId}/chapters/${chapterId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          }
        );
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000);
  }

  /**
   * Update story word count
   */
  private updateWordCount(story: Story): void {
    const totalWords = story.chapters.reduce((count, chapter) => {
      return count + (chapter.content.split(/\s+/).length || 0);
    }, 0);

    story.wordCount = totalWords;
    story.estimatedReadTime = Math.ceil(totalWords / 200); // Assuming 200 WPM
  }

  /**
   * Get stories by status
   */
  getStoriesByStatus(status: string): Story[] {
    return this.state.stories.filter((story) => story.status === status);
  }

  /**
   * Get characters by role
   */
  getCharactersByRole(role: string, storyId?: string): Character[] {
    let characters = this.state.characters.filter((char) => char.role === role);

    if (storyId && this.state.currentStory?.id === storyId) {
      characters = this.state.currentStory.characters.filter(
        (char) => char.role === role
      );
    }

    return characters;
  }

  /**
   * Search stories
   */
  searchStories(query: string): Story[] {
    const lowerQuery = query.toLowerCase();
    return this.state.stories.filter(
      (story) =>
        story.title.toLowerCase().includes(lowerQuery) ||
        story.description.toLowerCase().includes(lowerQuery) ||
        story.genre.toLowerCase().includes(lowerQuery) ||
        story.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.state.error = null;
  }

  /**
   * Get current state
   */
  getState(): StoryWeaverState {
    return { ...this.state };
  }

  /**
   * Track story events
   */
  private trackStoryEvent(
    event: string,
    properties?: Record<string, any>
  ): void {
    try {
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('Story Weaver', {
          event,
          timestamp: new Date().toISOString(),
          ...properties,
        });
      }
    } catch (error) {
      console.error('Error tracking story event:', error);
    }
  }

  /**
   * Export story as different formats
   */
  async exportStory(
    storyId: string,
    format: 'txt' | 'pdf' | 'epub' | 'docx'
  ): Promise<void> {
    try {
      const response = await fetch(
        `/api/lab/story-weaver/stories/${storyId}/export`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format }),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `story-${storyId}.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.trackStoryEvent('story_exported', { storyId, format });
      }
    } catch (error) {
      console.error('Export failed:', error);
      this.state.error = 'Failed to export story';
    }
  }

  /**
   * Cleanup on unmount
   */
  cleanup(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
  }
}

// Export singleton instance
export const storyWeaverLogic = new StoryWeaverLogic();

// Export utility functions
export const storyWeaverUtils = {
  /**
   * Format word count
   */
  formatWordCount(wordCount: number): string {
    if (wordCount < 1000) return wordCount.toString();
    if (wordCount < 1000000) return `${(wordCount / 1000).toFixed(1)}K`;
    return `${(wordCount / 1000000).toFixed(1)}M`;
  },

  /**
   * Estimate reading time
   */
  estimateReadingTime(wordCount: number): string {
    const minutes = Math.ceil(wordCount / 200);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  },

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colors = {
      draft: '#6B7280',
      active: '#3B82F6',
      completed: '#10B981',
      published: '#8B5CF6',
      archived: '#F97316',
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  },

  /**
   * Generate character name suggestions
   */
  generateCharacterNames(genre: string, gender?: string): string[] {
    // This would typically call an API, but here's a simple implementation
    const names = {
      fantasy: {
        male: ['Aldric', 'Theron', 'Kael', 'Darian', 'Eldric'],
        female: ['Lyra', 'Seraphina', 'Aria', 'Celeste', 'Nova'],
        neutral: ['Sage', 'River', 'Phoenix', 'Rowan', 'Ember'],
      },
      scifi: {
        male: ['Zane', 'Orion', 'Cypher', 'Neo', 'Atlas'],
        female: ['Luna', 'Vega', 'Nova', 'Iris', 'Echo'],
        neutral: ['Zero', 'Flux', 'Nexus', 'Quantum', 'Vector'],
      },
      romance: {
        male: ['Alexander', 'Sebastian', 'Gabriel', 'Nicholas', 'Adrian'],
        female: ['Isabella', 'Sophia', 'Olivia', 'Emma', 'Grace'],
        neutral: ['Taylor', 'Jordan', 'Casey', 'Riley', 'Sage'],
      },
    };

    const genreNames = names[genre as keyof typeof names];
    if (!genreNames) return [];

    if (gender && genreNames[gender as keyof typeof genreNames]) {
      return genreNames[gender as keyof typeof genreNames];
    }

    // Return mixed names if no gender specified
    return [
      ...genreNames.male.slice(0, 2),
      ...genreNames.female.slice(0, 2),
      ...genreNames.neutral.slice(0, 1),
    ];
  },
};
