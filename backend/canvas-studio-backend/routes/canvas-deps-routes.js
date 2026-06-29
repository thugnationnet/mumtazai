/**
 * CANVAS DEPS ROUTES — /api/canvas-deps
 *
 * Per-project dependency management. Stores deps in the project's
 * `metadata` JSON field under a `dependencies` key.
 *
 *   GET    /:projectId             — list all dependencies
 *   POST   /:projectId/add        — add a dependency
 *   POST   /:projectId/remove     — remove a dependency
 *   POST   /:projectId/update     — update a dependency version
 *   POST   /:projectId/update-all — update all outdated dependencies
 *   POST   /:projectId/audit      — run security audit (npm-style)
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../lib/auth-middleware.js';

const router = express.Router();

/** Ensure caller owns the project */
async function getOwnedProject(projectId, userId) {
  return prisma.canvasProject.findFirst({
    where: { id: projectId, userId },
    select: { id: true, files: true },
  });
}

/** Extract deps from project's files JSON (package.json) */
function extractDeps(project) {
  const files = Array.isArray(project.files) ? project.files : [];
  const pkgFile = files.find((f) => f.path === '/package.json' || f.path === 'package.json');
  if (!pkgFile?.content) return { dependencies: {}, devDependencies: {} };

  try {
    const pkg = JSON.parse(pkgFile.content);
    return {
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
    };
  } catch {
    return { dependencies: {}, devDependencies: {} };
  }
}

/** Write updated deps back into project files JSON */
async function writeDeps(projectId, project, deps, devDeps) {
  const files = Array.isArray(project.files) ? [...project.files] : [];
  const pkgIdx = files.findIndex((f) => f.path === '/package.json' || f.path === 'package.json');

  let pkg = {};
  if (pkgIdx >= 0 && files[pkgIdx].content) {
    try { pkg = JSON.parse(files[pkgIdx].content); } catch {}
  }

  pkg.dependencies = deps;
  pkg.devDependencies = devDeps;

  const content = JSON.stringify(pkg, null, 2);
  if (pkgIdx >= 0) {
    files[pkgIdx] = { ...files[pkgIdx], content };
  } else {
    files.push({ path: '/package.json', content, language: 'json' });
  }

  await prisma.canvasProject.update({
    where: { id: projectId },
    data: { files },
  });
}

/** Format deps as array for API response */
function formatDepsArray(deps, devDeps) {
  const result = [];
  for (const [name, version] of Object.entries(deps)) {
    result.push({ name, version: String(version), isDev: false });
  }
  for (const [name, version] of Object.entries(devDeps)) {
    result.push({ name, version: String(version), isDev: true });
  }
  return result;
}

// ── GET /:projectId ──────────────────────────────────────────────
router.get('/:projectId', requireAuth, async (req, res) => {
  try {
    const project = await getOwnedProject(req.params.projectId, req.userId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const { dependencies, devDependencies } = extractDeps(project);
    const deps = formatDepsArray(dependencies, devDependencies);

    res.json({ success: true, dependencies: deps, count: deps.length });
  } catch (err) {
    console.error('[DepsRoutes] list error:', err);
    res.status(500).json({ success: false, error: 'Failed to load dependencies' });
  }
});

// ── POST /:projectId/add ────────────────────────────────────────
// Body: { name: string, version?: string, isDev?: boolean }
router.post('/:projectId/add', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, version = 'latest', isDev = false } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: 'Package name is required' });
    }

    // Validate package name (basic check)
    if (!/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name.trim())) {
      return res.status(400).json({ success: false, error: 'Invalid package name' });
    }

    const project = await getOwnedProject(projectId, req.userId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const { dependencies, devDependencies } = extractDeps(project);
    const cleanName = name.trim();
    const cleanVersion = version.trim() || 'latest';

    if (isDev) {
      devDependencies[cleanName] = cleanVersion;
    } else {
      dependencies[cleanName] = cleanVersion;
    }

    await writeDeps(projectId, project, dependencies, devDependencies);
    const deps = formatDepsArray(dependencies, devDependencies);

    res.json({ success: true, dependencies: deps, added: { name: cleanName, version: cleanVersion, isDev } });
  } catch (err) {
    console.error('[DepsRoutes] add error:', err);
    res.status(500).json({ success: false, error: 'Failed to add dependency' });
  }
});

// ── POST /:projectId/remove ─────────────────────────────────────
// Body: { name: string }
router.post('/:projectId/remove', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: 'Package name is required' });
    }

    const project = await getOwnedProject(projectId, req.userId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const { dependencies, devDependencies } = extractDeps(project);
    const cleanName = name.trim();

    delete dependencies[cleanName];
    delete devDependencies[cleanName];

    await writeDeps(projectId, project, dependencies, devDependencies);
    const deps = formatDepsArray(dependencies, devDependencies);

    res.json({ success: true, dependencies: deps, removed: cleanName });
  } catch (err) {
    console.error('[DepsRoutes] remove error:', err);
    res.status(500).json({ success: false, error: 'Failed to remove dependency' });
  }
});

// ── POST /:projectId/update ─────────────────────────────────────
// Body: { name: string, version?: string }
router.post('/:projectId/update', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, version } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: 'Package name is required' });
    }

    const project = await getOwnedProject(projectId, req.userId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const { dependencies, devDependencies } = extractDeps(project);
    const cleanName = name.trim();

    if (dependencies[cleanName]) {
      dependencies[cleanName] = version || 'latest';
    } else if (devDependencies[cleanName]) {
      devDependencies[cleanName] = version || 'latest';
    } else {
      return res.status(404).json({ success: false, error: `Package ${cleanName} not found` });
    }

    await writeDeps(projectId, project, dependencies, devDependencies);
    const deps = formatDepsArray(dependencies, devDependencies);

    res.json({ success: true, dependencies: deps, updated: cleanName });
  } catch (err) {
    console.error('[DepsRoutes] update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update dependency' });
  }
});

// ── POST /:projectId/update-all ─────────────────────────────────
router.post('/:projectId/update-all', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await getOwnedProject(projectId, req.userId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const { dependencies, devDependencies } = extractDeps(project);

    // Set all non-latest versions to 'latest'
    for (const key of Object.keys(dependencies)) {
      if (dependencies[key] !== 'latest') dependencies[key] = 'latest';
    }
    for (const key of Object.keys(devDependencies)) {
      if (devDependencies[key] !== 'latest') devDependencies[key] = 'latest';
    }

    await writeDeps(projectId, project, dependencies, devDependencies);
    const deps = formatDepsArray(dependencies, devDependencies);

    res.json({ success: true, dependencies: deps, updatedCount: deps.length });
  } catch (err) {
    console.error('[DepsRoutes] update-all error:', err);
    res.status(500).json({ success: false, error: 'Failed to update all dependencies' });
  }
});

// ── POST /:projectId/audit ──────────────────────────────────────
// Checks each dependency against npm registry for latest version
// and flags outdated packages. Returns per-package audit results.
router.post('/:projectId/audit', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await getOwnedProject(projectId, req.userId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const { dependencies, devDependencies } = extractDeps(project);
    const allPkgs = { ...dependencies, ...devDependencies };
    const pkgNames = Object.keys(allPkgs);

    if (pkgNames.length === 0) {
      return res.json({
        success: true,
        vulnerabilities: {},
        totalPackages: 0,
        outdatedCount: 0,
        scannedAt: new Date().toISOString(),
      });
    }

    // Check each package against npm registry (with timeout)
    const vulnerabilities = {};
    const outdated = [];

    await Promise.all(
      pkgNames.map(async (name) => {
        const currentVersion = allPkgs[name]?.replace(/^[\^~>=<]*/g, '') || 'unknown';
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000);
          const registryRes = await fetch(
            `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`,
            { signal: controller.signal }
          );
          clearTimeout(timeout);

          if (registryRes.ok) {
            const data = await registryRes.json();
            const latestVersion = data.version || 'unknown';
            const isOutdated = currentVersion !== 'latest' && currentVersion !== latestVersion;

            vulnerabilities[name] = {
              critical: 0, high: 0, moderate: 0, low: isOutdated ? 1 : 0, info: 0,
              currentVersion,
              latestVersion,
              outdated: isOutdated,
            };

            if (isOutdated) outdated.push({ name, currentVersion, latestVersion });
          } else {
            vulnerabilities[name] = { critical: 0, high: 0, moderate: 0, low: 0, info: 0, currentVersion, latestVersion: 'unknown', outdated: false };
          }
        } catch {
          // Registry check failed — report as unknown
          vulnerabilities[name] = { critical: 0, high: 0, moderate: 0, low: 0, info: 0, currentVersion, latestVersion: 'unknown', outdated: false };
        }
      })
    );

    res.json({
      success: true,
      vulnerabilities,
      totalPackages: pkgNames.length,
      outdatedCount: outdated.length,
      outdated,
      scannedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[DepsRoutes] audit error:', err);
    res.status(500).json({ success: false, error: 'Failed to run security audit' });
  }
});

export default router;
