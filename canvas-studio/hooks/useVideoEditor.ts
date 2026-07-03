/**
 * useVideoEditor — React hook for AI Video Editor
 *
 * Orchestrates: upload → plan → execute → export
 * Calls backend /api/video-editor/* endpoints via fetch
 */
import { useCallback } from 'react';
import { useVideoEditorStore } from '../stores/videoEditorStore';
import type { VideoProject, VideoPlan, VideoPreset, VideoToolName } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

export function useVideoEditor(userId: string = 'default') {
  const store = useVideoEditorStore();

  // ── Upload video ─────────────────────────────────────────────
  const uploadVideo = useCallback(
    async (file: File) => {
      store.setUploading(true, 0);

      // POST /api/video-editor/upload (multipart)
      const formData = new FormData();
      formData.append('file', file);

      let result: any = null;
      try {
        const response = await fetch(`${API_BASE}/api/video-editor/upload`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        const json = await response.json();
        result = json.success ? json.data : null;
      } catch {
        result = null;
      }

      if (!result) {
        store.setUploading(false);
        return null;
      }

      // Create project
      const project: VideoProject = {
        id: `vp-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, ''),
        sourceFile: result.url,
        outputFiles: [],
        plans: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      store.setProject(project);
      store.setUploading(false);

      // Fetch metadata in background
      try {
        const metaRes = await fetch(`${API_BASE}/api/video-editor/metadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ file: result.url }),
        });
        const metaJson = await metaRes.json();
        if (metaJson.success && metaJson.data) {
          store.updateProjectMetadata(metaJson.data);
        }
      } catch { /* ignore metadata failures */ }

      return project;
    },
    [userId, store]
  );

  // ── Load existing video by URL ───────────────────────────────
  const loadVideo = useCallback(
    async (url: string, name?: string) => {
      const project: VideoProject = {
        id: `vp-${Date.now()}`,
        name: name || 'Imported Video',
        sourceFile: url,
        outputFiles: [],
        plans: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      store.setProject(project);

      try {
        const metaRes = await fetch(`${API_BASE}/api/video-editor/metadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ file: url }),
        });
        const metaJson = await metaRes.json();
        if (metaJson.success && metaJson.data) {
          store.updateProjectMetadata(metaJson.data);
        }
      } catch { /* ignore */ }

      return project;
    },
    [store]
  );

  // ── AI Plan from natural language ────────────────────────────
  const planEdit = useCallback(
    async (prompt: string) => {
      if (!store.project) return null;

      store.setPlanning(true);

      let planResult: any = { interpretation: '', steps: [] };
      try {
        const response = await fetch(`${API_BASE}/api/video-editor/plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            prompt,
            videoFile: store.project.sourceFile,
            metadata: (store.project as any).sourceMetadata,
          }),
        });
        const json = await response.json();
        planResult = json.success ? json.data : planResult;
      } catch { /* fallback to empty plan */ }

      const plan: VideoPlan = {
        id: `plan-${Date.now()}`,
        userPrompt: prompt,
        interpretation: planResult.interpretation,
        steps: planResult.steps.map((s: any, i: number) => ({
          id: `step-${Date.now()}-${i}`,
          tool: s.tool,
          action: s.action,
          params: {
            file: store.project!.sourceFile,
            action: s.action,
            options: s.options,
          },
          status: 'pending' as const,
        })),
        status: 'planning',
        createdAt: Date.now(),
      };

      store.setActivePlan(plan);
      store.setPlanning(false);
      store.setActiveTab('timeline');

      return plan;
    },
    [store]
  );

  // ── Apply a preset pipeline ──────────────────────────────────
  const applyPreset = useCallback(
    (preset: VideoPreset) => {
      if (!store.project) return null;

      const plan: VideoPlan = {
        id: `plan-${Date.now()}`,
        userPrompt: `Preset: ${preset.name}`,
        interpretation: preset.description,
        steps: preset.steps.map((s: any, i: number) => ({
          id: `step-${Date.now()}-${i}`,
          tool: s.tool,
          action: s.action,
          params: {
            file: store.project!.sourceFile,
            action: s.action,
            options: s.options,
          },
          status: 'pending' as const,
        })),
        status: 'planning',
        createdAt: Date.now(),
      };

      store.setActivePlan(plan);
      store.setActiveTab('timeline');

      return plan;
    },
    [store]
  );

  // ── Execute the active plan ──────────────────────────────────
  const executePlan = useCallback(async () => {
    if (!store.activePlan) return;

    store.updatePlanStatus('executing');
    store.setExecuting(true, 0);

    // Execute plan steps one by one via backend
    for (let stepIndex = 0; stepIndex < store.activePlan.steps.length; stepIndex++) {
      const step = store.activePlan.steps[stepIndex];
      store.updatePlanStep(stepIndex, { status: 'running' });

      try {
        // POST /api/video-editor/execute-tool
        const response = await fetch(`${API_BASE}/api/video-editor/execute-tool`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            tool: step.tool,
            action: step.action,
            params: step.params,
          }),
        });

        const json = await response.json();
        const result = json.success ? json.data : null;

        store.updatePlanStep(stepIndex, { status: 'completed', result });
        store.setExecuting(true, stepIndex);

        // If step completed with output, add to project outputs
        if (result) {
          const outputUrl = result.url || result.s3Url || result.outputUrl;
          if (outputUrl) {
            store.addOutputFile({
              url: outputUrl,
              filename: result.filename || `output-${stepIndex}`,
              label: `${step.tool}:${step.action}`,
              format: result.format || 'mp4',
              size: result.size,
            });
            // Update preview to latest output
            store.setPreviewUrl(outputUrl);
          }
        }
      } catch (error) {
        store.updatePlanStep(stepIndex, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Execution error',
        });
      }
    }

    // Determine final status
    const steps = useVideoEditorStore.getState().activePlan?.steps || [];
    const anyFailed = steps.some((s) => s.status === 'failed');
    const allDone = steps.every(
      (s) => s.status === 'completed' || s.status === 'skipped'
    );

    store.updatePlanStatus(
      anyFailed ? 'failed' : allDone ? 'completed' : 'failed'
    );
    store.setExecuting(false);

    // Save to history
    const finalPlan = useVideoEditorStore.getState().activePlan;
    if (finalPlan) {
      store.addToPlanHistory(finalPlan);
    }

    store.setActiveTab('export');
  }, [store]);

  // ── Cancel execution ─────────────────────────────────────────
  const cancelExecution = useCallback(() => {
    store.updatePlanStatus('cancelled');
    store.setExecuting(false);
  }, [store]);

  // ── Run a single tool directly ───────────────────────────────
  const runSingleTool = useCallback(
    async (
      tool: VideoToolName,
      action: string,
      options: Record<string, any> = {}
    ) => {
      if (!store.project) return null;

      try {
        const response = await fetch(`${API_BASE}/api/video-editor/execute-tool`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            tool,
            action,
            params: { file: store.project.sourceFile, action, options },
          }),
        });

        const json = await response.json();

        if (json.success && json.data) {
          const r = json.data;
          const outputUrl = r.url || r.s3Url || r.outputUrl;
          if (outputUrl) {
            store.addOutputFile({
              url: outputUrl,
              filename: r.filename || `${tool}-${action}`,
              label: `${tool}:${action}`,
              format: r.format || 'mp4',
              size: r.size,
            });
            store.setPreviewUrl(outputUrl);
          }
        }

        return json;
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    },
    [userId, store]
  );

  return {
    // State (from store)
    project: store.project,
    activePlan: store.activePlan,
    planHistory: store.planHistory,
    isUploading: store.isUploading,
    uploadProgress: store.uploadProgress,
    isPlanning: store.isPlanning,
    isExecuting: store.isExecuting,
    currentStepIndex: store.currentStepIndex,
    activeTab: store.activeTab,
    isOpen: store.isOpen,
    previewUrl: store.previewUrl,

    // Actions
    uploadVideo,
    loadVideo,
    planEdit,
    applyPreset,
    executePlan,
    cancelExecution,
    runSingleTool,

    // Store direct setters
    setActiveTab: store.setActiveTab,
    setOpen: store.setOpen,
    setPreviewUrl: store.setPreviewUrl,
    reset: store.reset,
  };
}
