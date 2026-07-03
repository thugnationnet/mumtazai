/**
 * useDeployment Hook
 * 
 * Manages deployment credentials and deploy operations.
 * - CRUD for platform credentials (Vercel, Railway, Netlify, Cloudflare)
 * - Deploy project to selected provider
 * - Track deployment status with streaming logs
 * - Credentials stored encrypted on backend per-user
 */
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  DeployProvider,
  DeploymentCredential,
  DeploymentInfo,
  DeployConfig,
  ProjectFile,
} from '../types/canvas-types';

interface UseDeploymentResult {
  // Credentials
  credentials: DeploymentCredential[];
  isLoadingCredentials: boolean;
  saveCredential: (provider: DeployProvider, token: string, name?: string, teamId?: string) => Promise<boolean>;
  deleteCredential: (id: string) => Promise<boolean>;
  validateCredential: (id: string) => Promise<boolean>;
  
  // Deployment
  deployments: DeploymentInfo[];
  activeDeployment: DeploymentInfo | null;
  deploy: (config: DeployConfig, files: ProjectFile[]) => Promise<DeploymentInfo>;
  undeploy: (deploymentId: string) => Promise<boolean>;
  getDeploymentStatus: (deploymentId: string) => Promise<DeploymentInfo | null>;
  
  // Utils
  isDeploying: boolean;
  deployError: string | null;
  clearError: () => void;
}

export function useDeployment(userId?: string | null): UseDeploymentResult {
  const [credentials, setCredentials] = useState<DeploymentCredential[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);
  const [deployments, setDeployments] = useState<DeploymentInfo[]>([]);
  const [activeDeployment, setActiveDeployment] = useState<DeploymentInfo | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load credentials on mount
  useEffect(() => {
    if (!userId) {
      setIsLoadingCredentials(false);
      return;
    }
    loadCredentials();
  }, [userId]);

  const loadCredentials = useCallback(async () => {
    setIsLoadingCredentials(true);
    try {
      const response = await fetch('/api/canvas/credentials', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.credentials) {
          setCredentials(data.credentials);
        }
      }
    } catch (err) {
      console.error('[Deploy] Failed to load credentials:', err);
    } finally {
      setIsLoadingCredentials(false);
    }
  }, []);

  // Save a new credential
  const saveCredential = useCallback(async (
    provider: DeployProvider,
    token: string,
    name?: string,
    teamId?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/canvas/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider,
          token,
          name: name || `${provider} Account`,
          teamId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.credential) {
          setCredentials(prev => {
            // Replace if same provider exists, otherwise add
            const existingIdx = prev.findIndex(c => c.provider === provider);
            if (existingIdx >= 0) {
              const updated = [...prev];
              updated[existingIdx] = data.credential;
              return updated;
            }
            return [...prev, data.credential];
          });
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('[Deploy] Failed to save credential:', err);
      return false;
    }
  }, []);

  // Delete a credential
  const deleteCredential = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/canvas/credentials/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setCredentials(prev => prev.filter(c => c.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error('[Deploy] Failed to delete credential:', err);
      return false;
    }
  }, []);

  // Validate a credential
  const validateCredential = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/canvas/credentials/${id}/validate`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCredentials(prev =>
          prev.map(c => c.id === id ? { ...c, isValid: data.valid, lastValidated: Date.now() } : c)
        );
        return data.valid;
      }
      return false;
    } catch (err) {
      console.error('[Deploy] Failed to validate credential:', err);
      return false;
    }
  }, []);

  // Deploy project
  const deploy = useCallback(async (
    config: DeployConfig,
    files: ProjectFile[]
  ): Promise<DeploymentInfo> => {
    setIsDeploying(true);
    setDeployError(null);

    const deployment: DeploymentInfo = {
      id: `deploy-${Date.now()}`,
      provider: config.provider,
      status: 'preparing',
      buildLogs: [],
      deployLogs: ['🚀 Starting deployment...'],
      errors: [],
      envVars: config.envVars || {},
      startedAt: Date.now(),
    };
    setActiveDeployment(deployment);

    try {
      abortRef.current = new AbortController();

      const response = await fetch('/api/canvas/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: abortRef.current.signal,
        body: JSON.stringify({
          provider: config.provider,
          credentialId: config.credentialId,
          projectName: config.projectName,
          subdomain: config.subdomain,
          framework: config.framework,
          buildCommand: config.buildCommand,
          outputDir: config.outputDir,
          installCommand: config.installCommand,
          envVars: config.envVars,
          region: config.region,
          source: 'universal-canvas',
          files: files.map(f => ({
            path: f.path,
            content: f.content,
            language: f.language,
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: 'Deployment request failed' }));
        throw new Error(errData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // If SSE stream, handle streaming updates
      if (response.headers.get('content-type')?.includes('text/event-stream')) {
        // Stream handling
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = decoder.decode(value, { stream: true }).split('\n');
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const event = JSON.parse(line.slice(6));
                if (event.status) deployment.status = event.status;
                if (event.log) deployment.deployLogs.push(event.log);
                if (event.buildLog) deployment.buildLogs.push(event.buildLog);
                if (event.url) deployment.url = event.url;
                if (event.previewUrl) deployment.previewUrl = event.previewUrl;
                if (event.error) {
                  deployment.errors.push({
                    id: `err-${Date.now()}`,
                    file: event.file || '',
                    message: event.error,
                    severity: 'error',
                  });
                }
                setActiveDeployment({ ...deployment });
              } catch { /* skip */ }
            }
          }
        }
      } else {
        // JSON response
        deployment.status = data.success ? 'live' : 'failed';
        deployment.url = data.url || data.deploymentUrl;
        deployment.previewUrl = data.previewUrl;
        deployment.subdomain = data.subdomain;
        deployment.providerProjectId = data.projectId;
        deployment.providerDeployId = data.deploymentId;
        if (data.buildLogs) deployment.buildLogs = data.buildLogs;
        if (data.deployLogs) deployment.deployLogs.push(...(data.deployLogs || []));
        if (data.errors) {
          deployment.errors = data.errors.map((e: { file?: string; message?: string }) => ({
            id: `err-${Date.now()}-${Math.random()}`,
            file: e.file || '',
            message: e.message || String(e),
            severity: 'error' as const,
          }));
          if (deployment.errors.length > 0) deployment.status = 'failed';
        }
      }

      deployment.completedAt = Date.now();
      if (deployment.status !== 'failed' && deployment.status !== 'stopped') {
        deployment.status = 'live';
      }
      setActiveDeployment({ ...deployment });
      setDeployments(prev => [deployment, ...prev]);
      return deployment;

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Deployment failed';
      if ((error as Error & { name?: string })?.name === 'AbortError') {
        deployment.status = 'stopped';
        deployment.deployLogs.push('⏹️ Deployment cancelled by user');
      } else {
        deployment.status = 'failed';
        deployment.errors.push({
          id: `err-${Date.now()}`,
          file: '',
          message: msg,
          severity: 'error',
        });
        setDeployError(msg);
      }
      deployment.completedAt = Date.now();
      setActiveDeployment({ ...deployment });
      return deployment;
    } finally {
      setIsDeploying(false);
      abortRef.current = null;
    }
  }, []);

  // Undeploy
  const undeploy = useCallback(async (deploymentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/canvas/deploy/${deploymentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setDeployments(prev =>
          prev.map(d => d.id === deploymentId ? { ...d, status: 'stopped' as const } : d)
        );
        if (activeDeployment?.id === deploymentId) {
          setActiveDeployment(prev => prev ? { ...prev, status: 'stopped' } : null);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [activeDeployment]);

  // Get deployment status
  const getDeploymentStatus = useCallback(async (deploymentId: string): Promise<DeploymentInfo | null> => {
    try {
      const response = await fetch(`/api/canvas/deploy/${deploymentId}/status`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        return data.deployment || null;
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  const clearError = useCallback(() => setDeployError(null), []);

  return {
    credentials,
    isLoadingCredentials,
    saveCredential,
    deleteCredential,
    validateCredential,
    deployments,
    activeDeployment,
    deploy,
    undeploy,
    getDeploymentStatus,
    isDeploying,
    deployError,
    clearError,
  };
}
