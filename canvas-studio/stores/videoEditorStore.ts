/**
 * videoEditorStore — Zustand store for AI Video Editor state
 *
 * Manages: active project, plans, execution state, UI mode
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { dbStorage } from '../services/dbStorage';
import type {
  VideoProject,
  VideoPlan,
  VideoToolCall,
} from '../types';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type VideoEditorTab =
  | 'generate'
  | 'upload'
  | 'edit'
  | 'presets'
  | 'timeline'
  | 'export';

export interface VideoEditorState {
  // Active project
  project: VideoProject | null;

  // Current plan (being planned or executed)
  activePlan: VideoPlan | null;

  // Plan history
  planHistory: VideoPlan[];

  // Upload state
  isUploading: boolean;
  uploadProgress: number;

  // Planning state
  isPlanning: boolean;

  // Execution state
  isExecuting: boolean;
  currentStepIndex: number;

  // UI state
  activeTab: VideoEditorTab;
  isOpen: boolean;
  previewUrl: string | null;

  // Actions
  setProject: (project: VideoProject | null) => void;
  updateProjectMetadata: (metadata: VideoProject['sourceMetadata']) => void;
  addOutputFile: (file: VideoProject['outputFiles'][0]) => void;

  setActivePlan: (plan: VideoPlan | null) => void;
  updatePlanStep: (stepIndex: number, update: Partial<VideoToolCall>) => void;
  updatePlanStatus: (status: VideoPlan['status']) => void;
  addToPlanHistory: (plan: VideoPlan) => void;

  setUploading: (uploading: boolean, progress?: number) => void;
  setPlanning: (planning: boolean) => void;
  setExecuting: (executing: boolean, stepIndex?: number) => void;

  setActiveTab: (tab: VideoEditorTab) => void;
  setOpen: (open: boolean) => void;
  setPreviewUrl: (url: string | null) => void;

  reset: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════

const initialState = {
  project: null,
  activePlan: null,
  planHistory: [],
  isUploading: false,
  uploadProgress: 0,
  isPlanning: false,
  isExecuting: false,
  currentStepIndex: -1,
  activeTab: 'upload' as VideoEditorTab,
  isOpen: false,
  previewUrl: null,
};

// ═══════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════

export const useVideoEditorStore = create<VideoEditorState>()(persist((set, get) => ({
  ...initialState,

  // ── Project ──────────────────────────────────────────────────
  setProject: (project) =>
    set({
      project,
      activeTab: project ? 'edit' : 'upload',
      previewUrl: project?.sourceFile || null,
    }),

  updateProjectMetadata: (metadata) =>
    set((state) => ({
      project: state.project
        ? { ...state.project, sourceMetadata: metadata, updatedAt: Date.now() }
        : null,
    })),

  addOutputFile: (file) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            outputFiles: [...state.project.outputFiles, file],
            updatedAt: Date.now(),
          }
        : null,
    })),

  // ── Plan ─────────────────────────────────────────────────────
  setActivePlan: (plan) => set({ activePlan: plan }),

  updatePlanStep: (stepIndex, update) =>
    set((state) => {
      if (!state.activePlan) return {};
      const steps = [...state.activePlan.steps];
      steps[stepIndex] = { ...steps[stepIndex], ...update };
      return { activePlan: { ...state.activePlan, steps } };
    }),

  updatePlanStatus: (status) =>
    set((state) => {
      if (!state.activePlan) return {};
      return {
        activePlan: {
          ...state.activePlan,
          status,
          completedAt: ['completed', 'failed', 'cancelled'].includes(status)
            ? Date.now()
            : undefined,
        },
      };
    }),

  addToPlanHistory: (plan) =>
    set((state) => ({
      planHistory: [plan, ...state.planHistory].slice(0, 50),
    })),

  // ── Upload ──────────────────────────────────────────────────
  setUploading: (uploading, progress = 0) =>
    set({ isUploading: uploading, uploadProgress: progress }),

  // ── Planning ─────────────────────────────────────────────────
  setPlanning: (planning) => set({ isPlanning: planning }),

  // ── Execution ────────────────────────────────────────────────
  setExecuting: (executing, stepIndex = -1) =>
    set({ isExecuting: executing, currentStepIndex: stepIndex }),

  // ── UI ───────────────────────────────────────────────────────
  setActiveTab: (tab) => set({ activeTab: tab }),
  setOpen: (open) => set({ isOpen: open }),
  setPreviewUrl: (url) => set({ previewUrl: url }),

  // ── Reset ────────────────────────────────────────────────────
  reset: () => set(initialState),
}), {
  name: 'canvas-video-editor',
  version: 1,
  storage: createJSONStorage(() => dbStorage),
  partialize: (state) => ({
    activeTab: state.activeTab,
  }),
}));
