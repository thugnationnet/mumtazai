/**
 * DEPLOYMENT & DOCKER TOOLS
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const DEPLOYMENT_DOCKER_TOOL_DEFINITIONS = [
  {
    name: 'docker_build',
    description: 'Build a Docker image from a Dockerfile.',
    input_schema: {
      type: 'object',
      properties: {
        path:    { type: 'string', description: 'Directory containing Dockerfile (default: current dir)' },
        tag:     { type: 'string', description: 'Image tag e.g. "myapp:latest"' },
        build_args: { type: 'object', description: 'Build arguments { KEY: value }' },
        no_cache: { type: 'boolean', description: 'Build without cache (default: false)' },
      },
      required: ['tag'],
    },
  },
  {
    name: 'docker_run',
    description: 'Run a Docker container from an image.',
    input_schema: {
      type: 'object',
      properties: {
        image:   { type: 'string', description: 'Image name:tag to run' },
        name:    { type: 'string', description: 'Container name' },
        ports:   { type: 'array', items: { type: 'string' }, description: 'Port mappings e.g. ["8080:80"]' },
        env:     { type: 'object', description: 'Environment variables' },
        volumes: { type: 'array', items: { type: 'string' }, description: 'Volume mounts e.g. ["/host:/container"]' },
        detach:  { type: 'boolean', description: 'Run in background (default: true)' },
      },
      required: ['image'],
    },
  },
  {
    name: 'docker_compose',
    description: 'Run docker compose up, down, restart, or show logs.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['up','down','restart','logs','ps','pull'], description: 'Compose operation' },
        path:      { type: 'string', description: 'Directory with docker-compose.yml (default: current dir)' },
        service:   { type: 'string', description: 'Specific service name (optional)' },
        build:     { type: 'boolean', description: 'Rebuild images on up (default: false)' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'deploy_generate',
    description: 'Generate deployment configs: Dockerfile, docker-compose.yml, GitHub Actions CI, or Nginx config.',
    input_schema: {
      type: 'object',
      properties: {
        type:      { type: 'string', enum: ['dockerfile','docker-compose','github-actions','nginx','pm2','systemd'],
                     description: 'Config type to generate' },
        app_type:  { type: 'string', enum: ['node','nextjs','react','python','static'], description: 'Application type' },
        port:      { type: 'number', description: 'Application port (default: 3000)' },
        name:      { type: 'string', description: 'Application/service name' },
        domain:    { type: 'string', description: 'Domain name (for nginx)' },
      },
      required: ['type'],
    },
  },
  {
    name: 'docker_manage',
    description: 'Manage Docker: list containers/images, stop, remove, view logs, inspect.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['ps','images','stop','rm','logs','inspect','prune'],
                     description: 'Management operation' },
        target:    { type: 'string', description: 'Container or image name/ID' },
        all:       { type: 'boolean', description: 'Include stopped containers (for ps)' },
      },
      required: ['operation'],
    },
  },
];

// ─────────────────────────────────────────────────── helpers ──

function run(args, cwd = process.cwd(), timeout = 120000) {
  const r = spawnSync(args[0], args.slice(1), { encoding: 'utf8', cwd, timeout });
  return { stdout: r.stdout || '', stderr: r.stderr || '', code: r.status };
}

function hasDocker() {
  return spawnSync('which', ['docker'], { encoding: 'utf8' }).status === 0;
}

// ─────────────────────────────────────────────────── generators ──

function genDockerfile(appType, port) {
  const p = port || 3000;
  const templates = {
    node:    `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nEXPOSE ${p}\nCMD ["node", "index.js"]\n`,
    nextjs:  `FROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:20-alpine\nWORKDIR /app\nCOPY --from=builder /app/.next/standalone ./\nCOPY --from=builder /app/.next/static ./.next/static\nCOPY --from=builder /app/public ./public\nEXPOSE ${p}\nCMD ["node", "server.js"]\n`,
    react:   `FROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM nginx:alpine\nCOPY --from=builder /app/dist /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]\n`,
    python:  `FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nEXPOSE ${p}\nCMD ["python", "app.py"]\n`,
    static:  `FROM nginx:alpine\nCOPY . /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]\n`,
  };
  return templates[appType || 'node'] || templates.node;
}

function genDockerCompose(name, port, appType) {
  const p = port || 3000;
  const n = name || 'app';
  return `version: '3.8'\nservices:\n  ${n}:\n    build: .\n    ports:\n      - "${p}:${p}"\n    environment:\n      - NODE_ENV=production\n    restart: unless-stopped\n  # Uncomment for database:\n  # db:\n  #   image: postgres:15-alpine\n  #   environment:\n  #     POSTGRES_PASSWORD: password\n  #   volumes:\n  #     - postgres_data:/var/lib/postgresql/data\n\n# volumes:\n#   postgres_data:\n`;
}

function genGithubActions(name, port) {
  return `name: CI/CD\n\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '20'\n      - run: npm ci\n      - run: npm run build\n      - run: npm test --if-present\n\n  deploy:\n    needs: build\n    runs-on: ubuntu-latest\n    if: github.ref == 'refs/heads/main'\n    steps:\n      - uses: actions/checkout@v4\n      - name: Deploy\n        run: echo "Add your deploy step here"\n`;
}

function genNginx(domain, port) {
  const p = port || 3000;
  const d = domain || 'example.com';
  return `server {\n    listen 80;\n    server_name ${d} www.${d};\n\n    location / {\n        proxy_pass http://localhost:${p};\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection 'upgrade';\n        proxy_set_header Host $host;\n        proxy_cache_bypass $http_upgrade;\n    }\n}\n`;
}

// ─────────────────────────────────────────────────── executor ──

export async function executeDeploymentDockerTool(toolName, input, ctx = {}) {
  const root = ctx.workspaceRoot || process.cwd();

  try {
    switch (toolName) {
      case 'docker_build': {
        if (!hasDocker()) return { result: JSON.stringify({ status: 'error', error: 'Docker not found. Install Docker Desktop.' }) };
        const dir  = path.resolve(root, input.path || '.');
        const args = ['docker', 'build', '-t', input.tag];
        if (input.no_cache) args.push('--no-cache');
        for (const [k, v] of Object.entries(input.build_args || {})) args.push('--build-arg', `${k}=${v}`);
        args.push(dir);
        const r = run(args, dir, 300000);
        return { result: JSON.stringify({ status: r.code === 0 ? 'success' : 'error', tag: input.tag, output: (r.stdout + r.stderr).slice(0, 2000) }) };
      }

      case 'docker_run': {
        if (!hasDocker()) return { result: JSON.stringify({ status: 'error', error: 'Docker not found.' }) };
        const args = ['docker', 'run'];
        if (input.detach !== false) args.push('-d');
        if (input.name) args.push('--name', input.name);
        for (const p of (input.ports || [])) args.push('-p', p);
        for (const [k, v] of Object.entries(input.env || {})) args.push('-e', `${k}=${v}`);
        for (const v of (input.volumes || [])) args.push('-v', v);
        args.push(input.image);
        const r = run(args, root);
        return { result: JSON.stringify({ status: r.code === 0 ? 'success' : 'error', container_id: r.stdout.trim(), output: r.stderr.slice(0, 500) }) };
      }

      case 'docker_compose': {
        if (!hasDocker()) return { result: JSON.stringify({ status: 'error', error: 'Docker not found.' }) };
        const dir  = path.resolve(root, input.path || '.');
        const base = ['docker', 'compose'];
        const opMap = {
          up:      [...base, 'up', '-d', ...(input.build ? ['--build'] : [])],
          down:    [...base, 'down'],
          restart: [...base, 'restart', ...(input.service ? [input.service] : [])],
          logs:    [...base, 'logs', '--tail', '50', ...(input.service ? [input.service] : [])],
          ps:      [...base, 'ps'],
          pull:    [...base, 'pull'],
        };
        const args = opMap[input.operation] || base;
        const r    = run(args, dir, 120000);
        return { result: JSON.stringify({ status: r.code === 0 ? 'success' : 'error', output: (r.stdout + r.stderr).slice(0, 2000) }) };
      }

      case 'deploy_generate': {
        let content = '';
        let filename = '';
        switch (input.type) {
          case 'dockerfile':      content = genDockerfile(input.app_type, input.port); filename = 'Dockerfile'; break;
          case 'docker-compose':  content = genDockerCompose(input.name, input.port, input.app_type); filename = 'docker-compose.yml'; break;
          case 'github-actions':  content = genGithubActions(input.name, input.port); filename = '.github/workflows/ci.yml'; break;
          case 'nginx':           content = genNginx(input.domain, input.port); filename = `nginx/${input.domain || 'app'}.conf`; break;
          case 'pm2':             content = `module.exports = {\n  apps: [{ name: '${input.name||'app'}', script: './index.js', instances: 'max', exec_mode: 'cluster', env: { NODE_ENV: 'production' } }]\n};\n`; filename = 'ecosystem.config.cjs'; break;
          default: content = '# Config'; filename = 'config.txt';
        }
        return { result: JSON.stringify({ status: 'success', type: input.type, content, filename }) };
      }

      case 'docker_manage': {
        if (!hasDocker()) return { result: JSON.stringify({ status: 'error', error: 'Docker not found.' }) };
        const cmdMap = {
          ps:      ['docker', 'ps', '--format', 'table {{.Names}}\t{{.Image}}\t{{.Status}}', ...(input.all ? ['-a'] : [])],
          images:  ['docker', 'images', '--format', 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}'],
          stop:    ['docker', 'stop', input.target || ''],
          rm:      ['docker', 'rm', input.target || ''],
          logs:    ['docker', 'logs', '--tail', '50', input.target || ''],
          inspect: ['docker', 'inspect', input.target || ''],
          prune:   ['docker', 'system', 'prune', '-f'],
        };
        const args = cmdMap[input.operation];
        if (!args) return { result: JSON.stringify({ status: 'error', error: `Unknown operation: ${input.operation}` }) };
        const r = run(args, root, 30000);
        return { result: JSON.stringify({ status: r.code === 0 ? 'success' : 'error', output: (r.stdout + r.stderr).slice(0, 3000) }) };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isDeploymentDockerTool = (name) => DEPLOYMENT_DOCKER_TOOL_DEFINITIONS.some(t => t.name === name);
