/**
 * Drafts Store — Zustand state for saving/resuming work-in-progress sessions
 * When the user clicks "+", the current app is saved as a draft.
 * Drafts are persisted to IndexedDB via the same dbStorage engine.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { dbStorage } from '../services/dbStorage';
import { GeneratedApp } from '../types';

export interface Draft {
  id: string;
  name: string;
  prompt: string;
  savedAt: number;
  app: GeneratedApp;
}

interface DraftsState {
  drafts: Draft[];
  saveDraft: (app: GeneratedApp) => void;
  removeDraft: (id: string) => void;
  clearDrafts: () => void;
}

export const useDraftsStore = create<DraftsState>()(
  persist(
    (set, get) => ({
      drafts: [],

      saveDraft: (app: GeneratedApp) => {
        // Don't save if app has no code or prompt
        if (!app.code && !app.prompt) return;
        // Avoid duplicates by app id
        const existing = get().drafts.find((d) => d.id === app.id);
        if (existing) {
          // Update existing draft
          set({
            drafts: get().drafts.map((d) =>
              d.id === app.id
                ? { ...d, app, name: app.name, prompt: app.prompt, savedAt: Date.now() }
                : d
            ),
          });
        } else {
          set({
            drafts: [
              {
                id: app.id,
                name: app.name || app.prompt?.substring(0, 30) || 'Untitled',
                prompt: app.prompt,
                savedAt: Date.now(),
                app,
              },
              ...get().drafts,
            ],
          });
        }
      },

      removeDraft: (id: string) => {
        set({ drafts: get().drafts.filter((d) => d.id !== id) });
      },

      clearDrafts: () => {
        set({ drafts: [] });
      },
    }),
    {
      name: 'canvas-studio-drafts',
      storage: createJSONStorage(() => dbStorage),
    }
  )
);
