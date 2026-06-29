/**
 * Sandbox Server — Runs inside each ECS Fargate container
 * Provides: file system, terminal exec, npm install, dev server, live preview
 * Communicates with main backend via REST API on port 3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const PORT = 3000;
const WORKSPACE = '/workspace/project';
const MAX_EXEC_TIMEOUT = 30000; // 30s

// Ensure workspace exists
if (!fs.existsSync(WORKSPACE)) {
  fs.mkdirSync(WORKSPACE, { recursive: true });
}

// Track running processes (dev server, etc.)
const processes = {};
let devServerPort = null;

// ─── HTTP Server ──────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const method = req.method;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // Health check
    if (url.pathname === '/health') {
      return json(res, {
        status: 'ok',
        uptime: process.uptime(),
        workspace: WORKSPACE,
      });
    }

    // Get sandbox status
    if (url.pathname === '/status' && method === 'GET') {
      const files = listFilesRecursive(WORKSPACE);
      return json(res, {
        status: 'running',
        files: files.length,
        devServer: devServerPort
          ? { running: true, port: devServerPort }
          : { running: false },
        processes: Object.keys(processes),
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      });
    }

    // ─── File Operations ────────────────────────────────
    // List files
    if (url.pathname === '/files' && method === 'GET') {
      const files = listFilesRecursive(WORKSPACE);
      return json(res, { files });
    }

    // Read file
    if (url.pathname === '/files/read' && method === 'POST') {
      const body = await readBody(req);
      const filePath = path.join(WORKSPACE, body.path);
      if (!filePath.startsWith(WORKSPACE))
        return error(res, 403, 'Path traversal blocked');
      if (!fs.existsSync(filePath)) return error(res, 404, 'File not found');
      const content = fs.readFileSync(filePath, 'utf-8');
      return json(res, { path: body.path, content });
    }

    // Write file(s)
    if (url.pathname === '/files/write' && method === 'POST') {
      const body = await readBody(req);
      // Support single file or batch
      const files = body.files || [{ path: body.path, content: body.content }];
      for (const f of files) {
        const filePath = path.join(WORKSPACE, f.path);
        if (!filePath.startsWith(WORKSPACE))
          return error(res, 403, 'Path traversal blocked');
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, f.content, 'utf-8');
      }
      return json(res, { written: files.length });
    }

    // Delete file
    if (url.pathname === '/files/delete' && method === 'POST') {
      const body = await readBody(req);
      const filePath = path.join(WORKSPACE, body.path);
      if (!filePath.startsWith(WORKSPACE))
        return error(res, 403, 'Path traversal blocked');
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
      return json(res, { deleted: body.path });
    }

    // ─── Terminal / Exec ──────────────────────────────────
    // Execute command
    if (url.pathname === '/exec' && method === 'POST') {
      const body = await readBody(req);
      const cmd = body.command;
      if (!cmd) return error(res, 400, 'Missing command');

      // Block dangerous commands
      const blocked = [
        'rm -rf /',
        'mkfs',
        'dd if=',
        ':(){',
        'shutdown',
        'reboot',
        'halt',
      ];
      if (blocked.some((b) => cmd.includes(b))) {
        return error(res, 403, 'Command blocked for safety');
      }

      try {
        const output = execSync(cmd, {
          cwd: WORKSPACE,
          timeout: body.timeout || MAX_EXEC_TIMEOUT,
          maxBuffer: 5 * 1024 * 1024, // 5MB
          encoding: 'utf-8',
          env: { ...process.env, HOME: '/workspace', PATH: process.env.PATH },
        });
        return json(res, { exitCode: 0, output: output || '' });
      } catch (err) {
        return json(res, {
          exitCode: err.status || 1,
          output: (err.stdout || '') + (err.stderr || ''),
          error: err.message,
        });
      }
    }

    // ─── NPM Operations ──────────────────────────────────
    // npm install
    if (url.pathname === '/npm/install' && method === 'POST') {
      const body = await readBody(req);
      const packages = body.packages || []; // e.g. ["react", "react-dom"]
      const cmd =
        packages.length > 0
          ? `npm install ${packages.join(' ')} --save 2>&1`
          : 'npm install 2>&1';
      try {
        const output = execSync(cmd, {
          cwd: WORKSPACE,
          timeout: 120000, // 2 min for npm install
          maxBuffer: 10 * 1024 * 1024,
          encoding: 'utf-8',
        });
        return json(res, { exitCode: 0, output });
      } catch (err) {
        return json(res, {
          exitCode: err.status || 1,
          output: (err.stdout || '') + (err.stderr || ''),
        });
      }
    }

    // ─── Dev Server ──────────────────────────────────────
    // Start dev server
    if (url.pathname === '/dev/start' && method === 'POST') {
      if (processes.devServer) {
        return json(res, {
          running: true,
          port: devServerPort,
          message: 'Dev server already running',
        });
      }

      const body = await readBody(req);
      const cmd = body.command || 'npm run dev';
      const port = body.port || 3001;

      const [bin, ...args] = cmd.split(' ');
      const proc = spawn(bin, args, {
        cwd: WORKSPACE,
        env: { ...process.env, PORT: String(port), HOME: '/workspace' },
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let logs = '';
      proc.stdout.on('data', (d) => {
        logs += d.toString();
        if (logs.length > 50000) logs = logs.slice(-30000);
      });
      proc.stderr.on('data', (d) => {
        logs += d.toString();
        if (logs.length > 50000) logs = logs.slice(-30000);
      });
      proc.on('exit', (code) => {
        console.log(`[DevServer] Exited with code ${code}`);
        delete processes.devServer;
        devServerPort = null;
      });

      processes.devServer = { proc, logs: () => logs, port };
      devServerPort = port;

      return json(res, { running: true, port, pid: proc.pid });
    }

    // Stop dev server
    if (url.pathname === '/dev/stop' && method === 'POST') {
      if (processes.devServer) {
        processes.devServer.proc.kill('SIGTERM');
        delete processes.devServer;
        devServerPort = null;
      }
      return json(res, { stopped: true });
    }

    // Get dev server logs
    if (url.pathname === '/dev/logs' && method === 'GET') {
      if (!processes.devServer) return json(res, { running: false, logs: '' });
      return json(res, {
        running: true,
        port: devServerPort,
        logs: processes.devServer.logs(),
      });
    }

    // ─── Preview ──────────────────────────────────────────
    // Serve preview — proxy to dev server or serve static files
    if (url.pathname.startsWith('/preview')) {
      // If dev server is running, tell client to use that port
      if (devServerPort) {
        return json(res, {
          type: 'devServer',
          port: devServerPort,
          url: `http://localhost:${devServerPort}`,
        });
      }
      // Otherwise serve index.html if exists
      const indexPath = path.join(WORKSPACE, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.setHeader('Content-Type', 'text/html');
        return res.end(fs.readFileSync(indexPath, 'utf-8'));
      }
      // Check dist/build folders
      for (const dir of ['dist', 'build', 'out', 'public']) {
        const distIndex = path.join(WORKSPACE, dir, 'index.html');
        if (fs.existsSync(distIndex)) {
          res.setHeader('Content-Type', 'text/html');
          return res.end(fs.readFileSync(distIndex, 'utf-8'));
        }
      }
      return error(
        res,
        404,
        'No preview available. Run build or start dev server.'
      );
    }

    // 404
    error(res, 404, `Not found: ${url.pathname}`);
  } catch (err) {
    console.error('[SandboxServer] Error:', err);
    error(res, 500, err.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SandboxServer] Running on port ${PORT}`);
  console.log(`[SandboxServer] Workspace: ${WORKSPACE}`);
});

// ─── Helpers ──────────────────────────────────────────────────
function json(res, data) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function error(res, code, msg) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: msg }));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function listFilesRecursive(dir, base = '') {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const relPath = base ? `${base}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        results.push({ path: relPath, type: 'directory' });
        results.push(
          ...listFilesRecursive(path.join(dir, entry.name), relPath)
        );
      } else {
        const stat = fs.statSync(path.join(dir, entry.name));
        results.push({ path: relPath, type: 'file', size: stat.size });
      }
    }
  } catch {
    /* skip unreadable dirs */
  }
  return results;
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SandboxServer] SIGTERM received, shutting down...');
  Object.values(processes).forEach((p) => p.proc?.kill('SIGTERM'));
  server.close(() => process.exit(0));
});
