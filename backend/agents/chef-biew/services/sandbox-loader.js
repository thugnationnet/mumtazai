/**
 * Sandbox Loader — E2B Code Interpreter
 * Executes marketplace plugin code in isolated cloud sandboxes via E2B.
 * Falls back gracefully when E2B_API_KEY is not configured.
 */

import e2bPkg from '@e2b/code-interpreter';
const { CodeInterpreter } = e2bPkg;

const E2B_API_KEY = process.env.E2B_API_KEY;
const activeSandboxes = new Map(); // pluginId -> { sandbox, executionCount, loadedAt }

const sandboxLoader = {
  getStatus() {
    if (!E2B_API_KEY) {
      return { status: 'unavailable', message: 'E2B_API_KEY not configured' };
    }
    return {
      status: 'operational',
      provider: 'e2b',
      activeSandboxes: activeSandboxes.size,
    };
  },

  getStats(pluginId) {
    if (pluginId) {
      const entry = activeSandboxes.get(pluginId);
      if (!entry) return { loaded: false, executionCount: 0 };
      return {
        loaded: true,
        executionCount: entry.executionCount,
        loadedAt: entry.loadedAt,
      };
    }
    return {
      loaded: activeSandboxes.size,
      plugins: Array.from(activeSandboxes.entries()).map(([id, e]) => ({
        pluginId: id,
        executionCount: e.executionCount,
        loadedAt: e.loadedAt,
      })),
    };
  },

  async loadPlugin(pluginId, code, permissions = [], config = {}) {
    if (!E2B_API_KEY) {
      return { success: false, error: 'E2B_API_KEY not configured' };
    }

    try {
      // Close existing sandbox for this plugin if any
      if (activeSandboxes.has(pluginId)) {
        const old = activeSandboxes.get(pluginId);
        try { await old.sandbox.close(); } catch (_) { /* ignore */ }
      }

      const sandbox = await CodeInterpreter.create({ apiKey: E2B_API_KEY });

      // Write the plugin code into the sandbox
      await sandbox.notebook.execCell(`
plugin_code = """
${code.replace(/"""/g, '\\"\\"\\"')}
"""
exec(plugin_code)
`);

      activeSandboxes.set(pluginId, {
        sandbox,
        code,
        permissions,
        config,
        executionCount: 0,
        loadedAt: new Date().toISOString(),
      });

      return { success: true, pluginId, sandboxType: 'e2b' };
    } catch (error) {
      console.error('Sandbox loadPlugin error:', error);
      return { success: false, error: error.message };
    }
  },

  async executePlugin(pluginId, functionName, input = {}) {
    if (!E2B_API_KEY) {
      return { success: false, error: 'E2B_API_KEY not configured' };
    }

    const entry = activeSandboxes.get(pluginId);
    if (!entry) {
      return { success: false, error: 'Plugin not loaded in sandbox' };
    }

    const start = Date.now();
    try {
      const inputJson = JSON.stringify(input);
      const execution = await entry.sandbox.notebook.execCell(`
import json
_input = json.loads('${inputJson.replace(/'/g, "\\'")}')
_result = ${functionName}(_input) if callable(${functionName}) else {"error": "${functionName} is not callable"}
json.dumps(_result) if isinstance(_result, (dict, list)) else str(_result)
`);

      entry.executionCount++;
      const duration = Date.now() - start;

      if (execution.error) {
        return {
          success: false,
          error: execution.error.value || execution.error.name,
          duration,
          executionCount: entry.executionCount,
        };
      }

      let result = null;
      if (execution.results && execution.results.length > 0) {
        const text = execution.results[0].text;
        try { result = JSON.parse(text); } catch { result = text; }
      }

      return {
        success: true,
        result,
        duration,
        executionCount: entry.executionCount,
      };
    } catch (error) {
      const duration = Date.now() - start;
      console.error('Sandbox executePlugin error:', error);
      return {
        success: false,
        error: error.message,
        duration,
        executionCount: entry.executionCount,
      };
    }
  },

  unloadPlugin(pluginId) {
    const entry = activeSandboxes.get(pluginId);
    if (!entry) {
      return { success: false, error: 'Plugin not loaded' };
    }

    try { entry.sandbox.close(); } catch (_) { /* ignore */ }
    activeSandboxes.delete(pluginId);
    return { success: true };
  },
};

export default sandboxLoader;
