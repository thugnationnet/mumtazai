/**
 * BACKEND TOOLS  —  scaffold, generate, and analyze backend code
 */

export const BACKEND_TOOL_DEFINITIONS = [
  {
    name: 'backend_scaffold',
    description: 'Scaffold a backend project: Express API, REST endpoints, middleware, auth boilerplate.',
    input_schema: {
      type: 'object',
      properties: {
        type:     { type: 'string', enum: ['express','fastify','nestjs','hono'], description: 'Backend framework' },
        features: { type: 'array', items: { type: 'string' },
                    description: 'Features: ["auth","cors","rate-limit","swagger","prisma","postgres","redis","jwt","logging"]' },
        name:     { type: 'string', description: 'Project name' },
        language: { type: 'string', enum: ['javascript','typescript'], description: 'Language (default: typescript)' },
      },
      required: ['type'],
    },
  },
  {
    name: 'backend_route',
    description: 'Generate a REST API route with CRUD operations, auth middleware, and validation.',
    input_schema: {
      type: 'object',
      properties: {
        resource:   { type: 'string', description: 'Resource name e.g. "users", "products"' },
        operations: { type: 'array', items: { type: 'string', enum: ['list','get','create','update','delete','search'] },
                      description: 'CRUD operations to generate (default: all)' },
        auth:       { type: 'boolean', description: 'Add authentication middleware (default: true)' },
        validate:   { type: 'boolean', description: 'Add request validation (default: true)' },
        framework:  { type: 'string', enum: ['express','fastify','hono'], description: 'Target framework (default: express)' },
      },
      required: ['resource'],
    },
  },
  {
    name: 'backend_middleware',
    description: 'Generate middleware: auth (JWT/OAuth), rate limiting, logging, CORS, error handler.',
    input_schema: {
      type: 'object',
      properties: {
        type:     { type: 'string', enum: ['auth','rate_limit','logging','cors','error_handler','cache','compression'],
                    description: 'Middleware type' },
        options:  { type: 'object', description: 'Middleware configuration options' },
        language: { type: 'string', enum: ['javascript','typescript'], description: 'Language (default: typescript)' },
      },
      required: ['type'],
    },
  },
  {
    name: 'backend_schema',
    description: 'Generate database schema or Prisma model from a description or existing data.',
    input_schema: {
      type: 'object',
      properties: {
        model:       { type: 'string', description: 'Model name e.g. "User", "Product"' },
        fields:      { type: 'object', description: 'Field definitions { fieldName: { type, required, unique } }' },
        orm:         { type: 'string', enum: ['prisma','typeorm','mongoose','drizzle'], description: 'ORM (default: prisma)' },
        relations:   { type: 'array', items: { type: 'string' }, description: 'Related models e.g. ["Post", "Comment"]' },
      },
      required: ['model'],
    },
  },
];

// ─────────────────────────────────────────────────── code generators ──

function generateExpressRoute(resource, ops, auth, validate) {
  const R   = resource.charAt(0).toUpperCase() + resource.slice(1);
  const ops_ = ops || ['list','get','create','update','delete'];
  const authM = auth !== false ? `requireAuth, ` : '';
  let code = `import express from 'express';\nimport { prisma } from '../lib/prisma.js';\n`;
  if (auth !== false) code += `import { requireAuth } from '../middleware/auth.js';\n`;
  code += `\nconst router = express.Router();\n\n`;
  if (ops_.includes('list'))   code += `router.get('/', ${authM}async (req, res) => {\n  const items = await prisma.${resource}.findMany();\n  res.json({ success: true, data: items });\n});\n\n`;
  if (ops_.includes('get'))    code += `router.get('/:id', ${authM}async (req, res) => {\n  const item = await prisma.${resource}.findUnique({ where: { id: req.params.id } });\n  if (!item) return res.status(404).json({ success: false, error: 'Not found' });\n  res.json({ success: true, data: item });\n});\n\n`;
  if (ops_.includes('create')) code += `router.post('/', ${authM}async (req, res) => {\n  const item = await prisma.${resource}.create({ data: req.body });\n  res.status(201).json({ success: true, data: item });\n});\n\n`;
  if (ops_.includes('update')) code += `router.put('/:id', ${authM}async (req, res) => {\n  const item = await prisma.${resource}.update({ where: { id: req.params.id }, data: req.body });\n  res.json({ success: true, data: item });\n});\n\n`;
  if (ops_.includes('delete')) code += `router.delete('/:id', ${authM}async (req, res) => {\n  await prisma.${resource}.delete({ where: { id: req.params.id } });\n  res.json({ success: true, message: '${R} deleted' });\n});\n\n`;
  code += `export default router;\n`;
  return code;
}

function generatePrismaModel(model, fields, relations) {
  let schema = `model ${model} {\n  id        String   @id @default(cuid())\n`;
  for (const [name, def] of Object.entries(fields || {})) {
    const t = def.type || 'String';
    const req = def.required !== false ? '' : '?';
    const uniq = def.unique ? ' @unique' : '';
    schema += `  ${name.padEnd(14)}${t}${req}${uniq}\n`;
  }
  schema += `  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n`;
  for (const rel of (relations || [])) {
    schema += `  ${rel.toLowerCase()}s ${rel}[]\n`;
  }
  schema += `}\n`;
  return schema;
}

export async function executeBackendTool(toolName, input, ctx = {}) {
  try {
    switch (toolName) {
      case 'backend_scaffold': {
        const lang = input.language || 'typescript';
        const ext  = lang === 'typescript' ? 'ts' : 'js';
        const deps = ['express', 'dotenv', 'cors', 'helmet'];
        const devDeps = ['nodemon'];
        if (input.features?.includes('prisma'))     deps.push('@prisma/client');
        if (input.features?.includes('jwt'))        deps.push('jsonwebtoken');
        if (input.features?.includes('rate-limit')) deps.push('express-rate-limit');
        if (lang === 'typescript')                  devDeps.push('typescript', '@types/express', '@types/node', 'ts-node');

        const serverCode = `import express from 'express';\nimport cors from 'cors';\nimport helmet from 'helmet';\nimport 'dotenv/config';\n\nconst app = express();\napp.use(helmet());\napp.use(cors());\napp.use(express.json());\n\napp.get('/health', (req, res) => res.json({ status: 'ok' }));\n\nconst PORT = process.env.PORT || 3000;\napp.listen(PORT, () => console.log(\`Server on :\${PORT}\`));\n\nexport default app;\n`;
        const pkg = `{\n  "name": "${input.name || 'backend'}",\n  "type": "module",\n  "scripts": { "start": "node src/server.${ext}", "dev": "nodemon src/server.${ext}" },\n  "dependencies": { ${deps.map(d=>`"${d}": "latest"`).join(', ')} }\n}\n`;

        return { result: JSON.stringify({
          status: 'success',
          framework: input.type,
          files: {
            [`src/server.${ext}`]: serverCode,
            'package.json': pkg,
            '.env': 'PORT=3000\nDATABASE_URL=\nJWT_SECRET=\n',
          },
        }) };
      }

      case 'backend_route': {
        const code = generateExpressRoute(input.resource, input.operations, input.auth, input.validate);
        return { result: JSON.stringify({ status: 'success', resource: input.resource, code, file: `src/routes/${input.resource}.js` }) };
      }

      case 'backend_middleware': {
        const codeMap = {
          auth: `import jwt from 'jsonwebtoken';\nexport function requireAuth(req, res, next) {\n  const token = req.headers.authorization?.split(' ')[1];\n  if (!token) return res.status(401).json({ error: 'Unauthorized' });\n  try {\n    req.user = jwt.verify(token, process.env.JWT_SECRET);\n    next();\n  } catch {\n    res.status(401).json({ error: 'Invalid token' });\n  }\n}`,
          cors: `import cors from 'cors';\nexport const corsMiddleware = cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', credentials: true });`,
          rate_limit: `import rateLimit from 'express-rate-limit';\nexport const rateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests' });`,
          logging:    `export function logger(req, res, next) {\n  console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);\n  next();\n}`,
          error_handler: `export function errorHandler(err, req, res, next) {\n  console.error(err);\n  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });\n}`,
        };
        const code = codeMap[input.type] || `// ${input.type} middleware\nexport function ${input.type}(req, res, next) { next(); }`;
        return { result: JSON.stringify({ status: 'success', type: input.type, code, file: `src/middleware/${input.type}.js` }) };
      }

      case 'backend_schema': {
        const orm = input.orm || 'prisma';
        if (orm === 'prisma') {
          const schema = generatePrismaModel(input.model, input.fields, input.relations);
          return { result: JSON.stringify({ status: 'success', orm, schema, file: 'prisma/schema.prisma (append)' }) };
        }
        // Mongoose model
        const fields = Object.entries(input.fields || {}).map(([k, v]) => `  ${k}: { type: ${v.type||'String'}, required: ${v.required!==false} }`).join(',\n');
        const code = `import mongoose from 'mongoose';\nconst schema = new mongoose.Schema({\n${fields}\n}, { timestamps: true });\nexport const ${input.model} = mongoose.model('${input.model}', schema);\n`;
        return { result: JSON.stringify({ status: 'success', orm, code, file: `src/models/${input.model}.js` }) };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isBackendTool = (name) => BACKEND_TOOL_DEFINITIONS.some(t => t.name === name);
