/**
 * BACKEND ENGINE — Code generation templates for backend scaffolding.
 * Each function returns { success: true, files: [...], message, operation }
 * where files[] = [{ path, content, description }].
 * The LLM then uses write_file to persist them to the project.
 */

// ── 1. API DESIGN & BUILD ───────────────────────────────────────────────────

export async function apiDesign(options = {}) {
  try {
    const {
      action = 'scaffold',
      resourceName = 'items',
      fields = [],
      methods = ['GET', 'POST', 'PUT', 'DELETE'],
      version = 'v1',
      authentication = true,
      pagination = true,
      filtering = true,
      sorting = true,
      validationLibrary = 'zod',
    } = options;

    const resource = resourceName.toLowerCase();
    const Resource = resource.charAt(0).toUpperCase() + resource.slice(1);
    const files = [];

    switch (action) {
      case 'scaffold': {
        // Route file
        const authMiddleware = authentication ? `\nimport { requireAuth } from '../middleware/auth.js';\n` : '';
        const authUse = authentication ? 'requireAuth, ' : '';
        files.push({
          path: `src/routes/${resource}.routes.js`,
          description: `REST routes for ${resource}`,
          content: `import { Router } from 'express';\nimport * as controller from '../controllers/${resource}.controller.js';${authMiddleware}\nconst router = Router();\n\nrouter.get('/${resource}', ${authUse}controller.getAll);\nrouter.get('/${resource}/:id', ${authUse}controller.getById);\nrouter.post('/${resource}', ${authUse}controller.create);\nrouter.put('/${resource}/:id', ${authUse}controller.update);\nrouter.delete('/${resource}/:id', ${authUse}controller.remove);\n\nexport default router;\n`,
        });

        // Controller
        const paginationCode = pagination ? `\n  const page = parseInt(req.query.page) || 1;\n  const limit = parseInt(req.query.limit) || 20;\n  const skip = (page - 1) * limit;` : '';
        const filterCode = filtering ? `\n  const where = {};\n  ${fields.filter(f => f.type === 'string').map(f => `if (req.query.${f.name}) where.${f.name} = { contains: req.query.${f.name} };`).join('\n  ')}` : '';
        const sortCode = sorting ? `\n  const orderBy = req.query.sort ? { [req.query.sort]: req.query.order || 'asc' } : { createdAt: 'desc' };` : '';

        files.push({
          path: `src/controllers/${resource}.controller.js`,
          description: `CRUD controller for ${resource}`,
          content: `import prisma from '../lib/prisma.js';\n\nexport async function getAll(req, res) {\n  try {${paginationCode}${filterCode}${sortCode}\n    const [items, total] = await Promise.all([\n      prisma.${resource}.findMany({ ${pagination ? 'skip, take: limit,' : ''} ${filtering ? 'where,' : ''} ${sorting ? 'orderBy,' : ''} }),\n      prisma.${resource}.count(${filtering ? '{ where }' : ''}),\n    ]);\n    res.json({ success: true, data: items, ${pagination ? 'pagination: { page, limit, total, pages: Math.ceil(total / limit) }' : 'total'} });\n  } catch (err) {\n    res.status(500).json({ success: false, error: err.message });\n  }\n}\n\nexport async function getById(req, res) {\n  try {\n    const item = await prisma.${resource}.findUnique({ where: { id: req.params.id } });\n    if (!item) return res.status(404).json({ success: false, error: '${Resource} not found' });\n    res.json({ success: true, data: item });\n  } catch (err) {\n    res.status(500).json({ success: false, error: err.message });\n  }\n}\n\nexport async function create(req, res) {\n  try {\n    const item = await prisma.${resource}.create({ data: req.body });\n    res.status(201).json({ success: true, data: item });\n  } catch (err) {\n    res.status(400).json({ success: false, error: err.message });\n  }\n}\n\nexport async function update(req, res) {\n  try {\n    const item = await prisma.${resource}.update({ where: { id: req.params.id }, data: req.body });\n    res.json({ success: true, data: item });\n  } catch (err) {\n    res.status(400).json({ success: false, error: err.message });\n  }\n}\n\nexport async function remove(req, res) {\n  try {\n    await prisma.${resource}.delete({ where: { id: req.params.id } });\n    res.json({ success: true, message: '${Resource} deleted' });\n  } catch (err) {\n    res.status(500).json({ success: false, error: err.message });\n  }\n}\n`,
        });

        return { success: true, operation: 'api_scaffold', action, files, message: `Scaffolded ${resource} API with controller + routes` };
      }

      case 'crud': {
        files.push({
          path: `src/controllers/${resource}.controller.js`,
          description: `Full CRUD controller for ${resource} with pagination, filtering, sorting`,
          content: `import prisma from '../lib/prisma.js';\n\nexport async function getAll(req, res) {\n  const page = parseInt(req.query.page) || 1;\n  const limit = Math.min(parseInt(req.query.limit) || 20, 100);\n  const skip = (page - 1) * limit;\n  const sort = req.query.sort || 'createdAt';\n  const order = req.query.order || 'desc';\n  const search = req.query.search || '';\n\n  const where = search ? {\n    OR: [${fields.filter(f => f.type === 'string').map(f => `{ ${f.name}: { contains: search, mode: 'insensitive' } }`).join(', ') || `{ id: { contains: search } }`}]\n  } : {};\n\n  const [data, total] = await Promise.all([\n    prisma.${resource}.findMany({ where, skip, take: limit, orderBy: { [sort]: order } }),\n    prisma.${resource}.count({ where }),\n  ]);\n\n  res.json({\n    success: true,\n    data,\n    pagination: { page, limit, total, pages: Math.ceil(total / limit), hasNext: page * limit < total },\n  });\n}\n\nexport async function getById(req, res) {\n  const item = await prisma.${resource}.findUnique({ where: { id: req.params.id } });\n  if (!item) return res.status(404).json({ success: false, error: 'Not found' });\n  res.json({ success: true, data: item });\n}\n\nexport async function create(req, res) {\n  const item = await prisma.${resource}.create({ data: req.body });\n  res.status(201).json({ success: true, data: item });\n}\n\nexport async function update(req, res) {\n  const item = await prisma.${resource}.update({ where: { id: req.params.id }, data: req.body });\n  res.json({ success: true, data: item });\n}\n\nexport async function remove(req, res) {\n  await prisma.${resource}.delete({ where: { id: req.params.id } });\n  res.status(204).end();\n}\n`,
        });
        return { success: true, operation: 'api_crud', action, files, message: `Generated CRUD controller for ${resource}` };
      }

      case 'version': {
        files.push({
          path: `src/routes/${version}/index.js`,
          description: `API ${version} router`,
          content: `import { Router } from 'express';\n\nconst router = Router();\n\n// Mount resource routers here\n// router.use('/${resource}', ${resource}Router);\n\nexport default router;\n`,
        });
        return { success: true, operation: 'api_version', action, files, message: `Generated versioned router ${version}` };
      }

      case 'openapi': {
        const spec = {
          openapi: '3.0.3',
          info: { title: `${Resource} API`, version: '1.0.0' },
          paths: {
            [`/${resource}`]: {
              get: { summary: `List ${resource}`, responses: { '200': { description: 'Success' } } },
              post: { summary: `Create ${resource.slice(0, -1)}`, responses: { '201': { description: 'Created' } } },
            },
            [`/${resource}/{id}`]: {
              get: { summary: `Get ${resource.slice(0, -1)}`, responses: { '200': { description: 'Success' } } },
              put: { summary: `Update ${resource.slice(0, -1)}`, responses: { '200': { description: 'Success' } } },
              delete: { summary: `Delete ${resource.slice(0, -1)}`, responses: { '204': { description: 'Deleted' } } },
            },
          },
        };
        files.push({
          path: 'docs/openapi.json',
          description: 'OpenAPI 3.0 spec',
          content: JSON.stringify(spec, null, 2),
        });
        files.push({
          path: 'src/middleware/swagger.js',
          description: 'Swagger UI setup',
          content: `import swaggerUi from 'swagger-ui-express';\nimport spec from '../../docs/openapi.json' assert { type: 'json' };\n\nexport function setupSwagger(app) {\n  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));\n}\n`,
        });
        return { success: true, operation: 'api_openapi', action, files, message: 'Generated OpenAPI spec + Swagger UI' };
      }

      case 'validate': {
        const lib = validationLibrary;
        let content;
        if (lib === 'zod') {
          const zodFields = fields.map(f => {
            const zodType = f.type === 'number' || f.type === 'integer' || f.type === 'float' ? 'z.number()' : f.type === 'boolean' ? 'z.boolean()' : f.type === 'date' ? 'z.string().datetime()' : 'z.string()';
            return `  ${f.name}: ${zodType}${f.required ? '' : '.optional()'},`;
          }).join('\n');
          content = `import { z } from 'zod';\n\nexport const create${Resource}Schema = z.object({\n${zodFields || '  // Add fields'}\n});\n\nexport const update${Resource}Schema = create${Resource}Schema.partial();\n\nexport function validate(schema) {\n  return (req, res, next) => {\n    const result = schema.safeParse(req.body);\n    if (!result.success) {\n      return res.status(400).json({ success: false, errors: result.error.flatten().fieldErrors });\n    }\n    req.body = result.data;\n    next();\n  };\n}\n`;
        } else {
          content = `// Validation using ${lib}\n// TODO: Implement validation schemas\nexport function validate(schema) {\n  return (req, res, next) => next();\n}\n`;
        }
        files.push({ path: `src/validation/${resource}.validation.js`, description: `${lib} validation for ${resource}`, content });
        return { success: true, operation: 'api_validate', action, files, message: `Generated ${lib} validation for ${resource}` };
      }

      default:
        return { success: false, error: `Unknown API action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 2. FILE & FORM HANDLING ─────────────────────────────────────────────────

export async function fileHandling(options = {}) {
  try {
    const {
      action = 'upload_route',
      maxFileSize = '50mb',
      allowedTypes = ['image/*', 'application/pdf'],
      maxFiles = 10,
      storageType = 's3',
      signedUrlExpiry = 900,
    } = options;

    const files = [];

    switch (action) {
      case 'upload_route': {
        files.push({
          path: 'src/middleware/upload.js',
          description: 'Multer file upload middleware',
          content: `import multer from 'multer';\nimport path from 'path';\nimport crypto from 'crypto';\n\nconst storage = multer.diskStorage({\n  destination: 'uploads/',\n  filename: (req, file, cb) => {\n    const ext = path.extname(file.originalname);\n    cb(null, crypto.randomBytes(16).toString('hex') + ext);\n  },\n});\n\nconst fileFilter = (req, file, cb) => {\n  const allowed = ${JSON.stringify(allowedTypes)};\n  const isAllowed = allowed.some(t => {\n    if (t.endsWith('/*')) return file.mimetype.startsWith(t.slice(0, -1));\n    return file.mimetype === t;\n  });\n  cb(isAllowed ? null : new Error('File type not allowed'), isAllowed);\n};\n\nexport const upload = multer({\n  storage,\n  fileFilter,\n  limits: {\n    fileSize: ${parseSize(maxFileSize)},\n    files: ${maxFiles},\n  },\n});\n\nexport const uploadSingle = upload.single('file');\nexport const uploadMultiple = upload.array('files', ${maxFiles});\n`,
        });
        files.push({
          path: 'src/routes/upload.routes.js',
          description: 'Upload endpoints',
          content: `import { Router } from 'express';\nimport { uploadSingle, uploadMultiple } from '../middleware/upload.js';\n\nconst router = Router();\n\nrouter.post('/upload', uploadSingle, (req, res) => {\n  if (!req.file) return res.status(400).json({ success: false, error: 'No file' });\n  res.json({ success: true, file: { path: req.file.path, name: req.file.originalname, size: req.file.size } });\n});\n\nrouter.post('/upload/multiple', uploadMultiple, (req, res) => {\n  res.json({ success: true, files: req.files.map(f => ({ path: f.path, name: f.originalname, size: f.size })) });\n});\n\nexport default router;\n`,
        });
        return { success: true, operation: 'file_upload', action, files, message: 'Generated multer upload middleware + routes' };
      }

      case 'streaming': {
        files.push({
          path: 'src/routes/stream-upload.routes.js',
          description: 'Streaming upload (no memory buffering)',
          content: `import { Router } from 'express';\nimport { createWriteStream } from 'fs';\nimport { pipeline } from 'stream/promises';\nimport path from 'path';\nimport crypto from 'crypto';\n\nconst router = Router();\n\nrouter.post('/upload/stream', async (req, res) => {\n  const ext = path.extname(req.headers['x-filename'] || '.bin');\n  const dest = path.join('uploads', crypto.randomBytes(16).toString('hex') + ext);\n  try {\n    await pipeline(req, createWriteStream(dest));\n    res.json({ success: true, path: dest });\n  } catch (err) {\n    res.status(500).json({ success: false, error: err.message });\n  }\n});\n\nexport default router;\n`,
        });
        return { success: true, operation: 'file_streaming', action, files, message: 'Generated streaming upload route' };
      }

      case 'chunked': {
        files.push({
          path: 'src/routes/chunked-upload.routes.js',
          description: 'Chunked upload flow',
          content: `import { Router } from 'express';\nimport fs from 'fs/promises';\nimport { createWriteStream } from 'fs';\nimport path from 'path';\nimport crypto from 'crypto';\n\nconst router = Router();\nconst uploads = new Map();\n\nrouter.post('/upload/init', async (req, res) => {\n  const id = crypto.randomUUID();\n  const dir = path.join('uploads/chunks', id);\n  await fs.mkdir(dir, { recursive: true });\n  uploads.set(id, { filename: req.body.filename, totalChunks: req.body.totalChunks, received: 0 });\n  res.json({ success: true, uploadId: id });\n});\n\nrouter.post('/upload/chunk/:id/:index', async (req, res) => {\n  const { id, index } = req.params;\n  const chunkPath = path.join('uploads/chunks', id, index);\n  await fs.writeFile(chunkPath, req.body);\n  const meta = uploads.get(id);\n  if (meta) meta.received++;\n  res.json({ success: true, chunk: parseInt(index) });\n});\n\nrouter.post('/upload/complete/:id', async (req, res) => {\n  const meta = uploads.get(req.params.id);\n  if (!meta) return res.status(404).json({ success: false, error: 'Upload not found' });\n  const dir = path.join('uploads/chunks', req.params.id);\n  const dest = path.join('uploads', meta.filename);\n  const ws = createWriteStream(dest);\n  for (let i = 0; i < meta.totalChunks; i++) {\n    const chunk = await fs.readFile(path.join(dir, String(i)));\n    ws.write(chunk);\n  }\n  ws.end();\n  await fs.rm(dir, { recursive: true });\n  uploads.delete(req.params.id);\n  res.json({ success: true, path: dest });\n});\n\nexport default router;\n`,
        });
        return { success: true, operation: 'file_chunked', action, files, message: 'Generated chunked upload flow (init → chunk → complete)' };
      }

      case 'signed_url': {
        files.push({
          path: 'src/services/s3.service.js',
          description: 'S3 signed URL service',
          content: `import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';\nimport { getSignedUrl } from '@aws-sdk/s3-request-presigner';\n\nconst s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });\nconst BUCKET = process.env.S3_BUCKET;\n\nexport async function getUploadUrl(key, contentType, expiresIn = ${signedUrlExpiry}) {\n  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });\n  return getSignedUrl(s3, command, { expiresIn });\n}\n\nexport async function getDownloadUrl(key, expiresIn = ${signedUrlExpiry}) {\n  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });\n  return getSignedUrl(s3, command, { expiresIn });\n}\n`,
        });
        return { success: true, operation: 'file_signed_url', action, files, message: 'Generated S3 signed URL service' };
      }

      case 'temp_storage': {
        files.push({
          path: 'src/services/tempStorage.service.js',
          description: 'Temp file storage with auto-cleanup',
          content: `import fs from 'fs/promises';\nimport path from 'path';\nimport crypto from 'crypto';\n\nconst TEMP_DIR = 'uploads/tmp';\nconst MAX_AGE_MS = 3600000; // 1 hour\n\nexport async function saveTempFile(buffer, ext = '.tmp') {\n  await fs.mkdir(TEMP_DIR, { recursive: true });\n  const name = crypto.randomBytes(16).toString('hex') + ext;\n  const filePath = path.join(TEMP_DIR, name);\n  await fs.writeFile(filePath, buffer);\n  return filePath;\n}\n\nexport async function cleanup() {\n  const files = await fs.readdir(TEMP_DIR).catch(() => []);\n  const now = Date.now();\n  for (const file of files) {\n    const full = path.join(TEMP_DIR, file);\n    const stat = await fs.stat(full);\n    if (now - stat.mtimeMs > MAX_AGE_MS) await fs.unlink(full).catch(() => {});\n  }\n}\n\n// Run cleanup every 15 minutes\nsetInterval(cleanup, 900000);\n`,
        });
        return { success: true, operation: 'file_temp', action, files, message: 'Generated temp storage service with auto-cleanup' };
      }

      default:
        return { success: false, error: `Unknown file handling action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 3. AUTH & SECURITY ──────────────────────────────────────────────────────

export async function authSecurity(options = {}) {
  try {
    const {
      action = 'jwt',
      jwtExpiry = '24h',
      refreshExpiry = '7d',
      oauthProvider = 'google',
      roles = ['user', 'admin'],
    } = options;

    const files = [];

    switch (action) {
      case 'jwt': {
        files.push({
          path: 'src/services/auth.service.js',
          description: 'JWT auth service — sign, verify, refresh',
          content: `import jwt from 'jsonwebtoken';\n\nconst SECRET = process.env.JWT_SECRET || 'change-me';\nconst REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-refresh';\n\nexport function signAccessToken(payload) {\n  return jwt.sign(payload, SECRET, { expiresIn: '${jwtExpiry}' });\n}\n\nexport function signRefreshToken(payload) {\n  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '${refreshExpiry}' });\n}\n\nexport function verifyAccessToken(token) {\n  return jwt.verify(token, SECRET);\n}\n\nexport function verifyRefreshToken(token) {\n  return jwt.verify(token, REFRESH_SECRET);\n}\n`,
        });
        files.push({
          path: 'src/middleware/auth.js',
          description: 'JWT auth middleware',
          content: `import { verifyAccessToken } from '../services/auth.service.js';\n\nexport function requireAuth(req, res, next) {\n  const header = req.headers.authorization;\n  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });\n  try {\n    req.user = verifyAccessToken(header.slice(7));\n    next();\n  } catch {\n    res.status(401).json({ error: 'Invalid token' });\n  }\n}\n`,
        });
        return { success: true, operation: 'auth_jwt', action, files, message: 'Generated JWT auth system' };
      }

      case 'oauth': {
        const provider = oauthProvider;
        files.push({
          path: `src/routes/oauth.${provider}.routes.js`,
          description: `${provider} OAuth flow`,
          content: `import { Router } from 'express';\n\nconst router = Router();\nconst CLIENT_ID = process.env.${provider.toUpperCase()}_CLIENT_ID;\nconst CLIENT_SECRET = process.env.${provider.toUpperCase()}_CLIENT_SECRET;\nconst REDIRECT_URI = process.env.${provider.toUpperCase()}_REDIRECT_URI || 'http://localhost:3000/auth/${provider}/callback';\n\nrouter.get('/auth/${provider}', (req, res) => {\n  const url = ${provider === 'google' ? '`https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`' : '`https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user:email`'};\n  res.redirect(url);\n});\n\nrouter.get('/auth/${provider}/callback', async (req, res) => {\n  const { code } = req.query;\n  // Exchange code for token, fetch user profile, create/login user\n  // Implementation depends on your user model\n  res.json({ success: true, message: 'OAuth callback — implement token exchange' });\n});\n\nexport default router;\n`,
        });
        return { success: true, operation: 'auth_oauth', action, files, message: `Generated ${provider} OAuth routes` };
      }

      case 'apikey': {
        files.push({
          path: 'src/services/apikey.service.js',
          description: 'API key generation + verification',
          content: `import crypto from 'crypto';\n\nexport function generateApiKey() {\n  const key = 'sk_' + crypto.randomBytes(32).toString('hex');\n  const hash = crypto.createHash('sha256').update(key).digest('hex');\n  return { key, hash };\n}\n\nexport function hashKey(key) {\n  return crypto.createHash('sha256').update(key).digest('hex');\n}\n\nexport function requireApiKey(findKeyFn) {\n  return async (req, res, next) => {\n    const key = req.headers['x-api-key'];\n    if (!key) return res.status(401).json({ error: 'API key required' });\n    const hash = hashKey(key);\n    const record = await findKeyFn(hash);\n    if (!record) return res.status(401).json({ error: 'Invalid API key' });\n    req.apiKey = record;\n    next();\n  };\n}\n`,
        });
        return { success: true, operation: 'auth_apikey', action, files, message: 'Generated API key service' };
      }

      case 'rbac': {
        files.push({
          path: 'src/middleware/rbac.js',
          description: 'Role-based access control',
          content: `const ROLES = ${JSON.stringify(roles)};\n\nexport function requireRole(...allowed) {\n  return (req, res, next) => {\n    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });\n    if (!allowed.includes(req.user.role)) {\n      return res.status(403).json({ error: 'Insufficient permissions' });\n    }\n    next();\n  };\n}\n\nexport function requirePermission(permission) {\n  return (req, res, next) => {\n    if (!req.user?.permissions?.includes(permission)) {\n      return res.status(403).json({ error: \`Missing permission: \${permission}\` });\n    }\n    next();\n  };\n}\n`,
        });
        return { success: true, operation: 'auth_rbac', action, files, message: `Generated RBAC middleware with roles: ${roles.join(', ')}` };
      }

      case 'session': {
        files.push({
          path: 'src/services/session.service.js',
          description: 'Session management',
          content: `import crypto from 'crypto';\n\nconst sessions = new Map();\nconst SESSION_TTL = 86400000; // 24h\n\nexport function createSession(userId, data = {}) {\n  const id = crypto.randomBytes(32).toString('hex');\n  sessions.set(id, { userId, ...data, createdAt: Date.now() });\n  return id;\n}\n\nexport function getSession(id) {\n  const session = sessions.get(id);\n  if (!session) return null;\n  if (Date.now() - session.createdAt > SESSION_TTL) { sessions.delete(id); return null; }\n  return session;\n}\n\nexport function destroySession(id) { sessions.delete(id); }\n\n// Cleanup expired sessions every 10 min\nsetInterval(() => {\n  const now = Date.now();\n  for (const [id, s] of sessions) if (now - s.createdAt > SESSION_TTL) sessions.delete(id);\n}, 600000);\n`,
        });
        return { success: true, operation: 'auth_session', action, files, message: 'Generated session service' };
      }

      case 'csrf': {
        files.push({
          path: 'src/middleware/csrf.js',
          description: 'CSRF double-submit cookie protection',
          content: `import crypto from 'crypto';\n\nexport function csrfProtection(req, res, next) {\n  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {\n    const token = crypto.randomBytes(32).toString('hex');\n    res.cookie('csrf-token', token, { httpOnly: false, sameSite: 'strict' });\n    return next();\n  }\n  const cookie = req.cookies['csrf-token'];\n  const header = req.headers['x-csrf-token'];\n  if (!cookie || cookie !== header) {\n    return res.status(403).json({ error: 'CSRF token mismatch' });\n  }\n  next();\n}\n`,
        });
        return { success: true, operation: 'auth_csrf', action, files, message: 'Generated CSRF protection middleware' };
      }

      default:
        return { success: false, error: `Unknown auth action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 4. RATE LIMITING ────────────────────────────────────────────────────────

export async function rateLimiting(options = {}) {
  try {
    const {
      action = 'ip_limit',
      windowMs = 60000,
      maxRequests = 100,
      burstLimit = 20,
      banDurationMs = 3600000,
    } = options;

    const files = [];

    switch (action) {
      case 'ip_limit': {
        files.push({
          path: 'src/middleware/rateLimiter.js',
          description: 'IP-based rate limiter (in-memory)',
          content: `const requests = new Map();\n\nexport function ipRateLimit({ windowMs = ${windowMs}, max = ${maxRequests} } = {}) {\n  return (req, res, next) => {\n    const ip = req.ip || req.socket.remoteAddress;\n    const now = Date.now();\n    const record = requests.get(ip) || { count: 0, resetAt: now + windowMs };\n\n    if (now > record.resetAt) {\n      record.count = 0;\n      record.resetAt = now + windowMs;\n    }\n\n    record.count++;\n    requests.set(ip, record);\n\n    res.setHeader('X-RateLimit-Limit', max);\n    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));\n    res.setHeader('X-RateLimit-Reset', new Date(record.resetAt).toISOString());\n\n    if (record.count > max) {\n      return res.status(429).json({ error: 'Too many requests', retryAfter: Math.ceil((record.resetAt - now) / 1000) });\n    }\n    next();\n  };\n}\n\n// Cleanup every 5 min\nsetInterval(() => {\n  const now = Date.now();\n  for (const [ip, r] of requests) if (now > r.resetAt) requests.delete(ip);\n}, 300000);\n`,
        });
        return { success: true, operation: 'ratelimit_ip', action, files, message: 'Generated IP rate limiter' };
      }

      case 'user_limit': {
        files.push({
          path: 'src/middleware/userRateLimit.js',
          description: 'User-based rate limiter',
          content: `const userRequests = new Map();\n\nexport function userRateLimit({ windowMs = ${windowMs}, max = ${maxRequests} } = {}) {\n  return (req, res, next) => {\n    const userId = req.user?.id || req.ip;\n    const now = Date.now();\n    const record = userRequests.get(userId) || { count: 0, resetAt: now + windowMs };\n    if (now > record.resetAt) { record.count = 0; record.resetAt = now + windowMs; }\n    record.count++;\n    userRequests.set(userId, record);\n    res.setHeader('X-RateLimit-Limit', max);\n    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));\n    if (record.count > max) return res.status(429).json({ error: 'Rate limit exceeded' });\n    next();\n  };\n}\n`,
        });
        return { success: true, operation: 'ratelimit_user', action, files, message: 'Generated user rate limiter' };
      }

      case 'token_bucket': {
        files.push({
          path: 'src/middleware/tokenBucket.js',
          description: 'Token bucket rate limiter',
          content: `class TokenBucket {\n  constructor(capacity = ${burstLimit}, refillRate = 1, refillIntervalMs = 1000) {\n    this.capacity = capacity;\n    this.tokens = capacity;\n    this.refillRate = refillRate;\n    this.lastRefill = Date.now();\n    this.refillIntervalMs = refillIntervalMs;\n  }\n\n  consume(n = 1) {\n    this.refill();\n    if (this.tokens >= n) { this.tokens -= n; return true; }\n    return false;\n  }\n\n  refill() {\n    const now = Date.now();\n    const elapsed = now - this.lastRefill;\n    const tokensToAdd = Math.floor(elapsed / this.refillIntervalMs) * this.refillRate;\n    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);\n    this.lastRefill = now;\n  }\n}\n\nconst buckets = new Map();\n\nexport function tokenBucketLimit({ capacity = ${burstLimit}, refillRate = 1 } = {}) {\n  return (req, res, next) => {\n    const key = req.user?.id || req.ip;\n    if (!buckets.has(key)) buckets.set(key, new TokenBucket(capacity, refillRate));\n    const bucket = buckets.get(key);\n    if (!bucket.consume()) return res.status(429).json({ error: 'Rate limit — try again shortly' });\n    next();\n  };\n}\n`,
        });
        return { success: true, operation: 'ratelimit_token_bucket', action, files, message: 'Generated token bucket limiter' };
      }

      case 'ban_list': {
        files.push({
          path: 'src/middleware/banList.js',
          description: 'IP ban/allow list',
          content: `const banned = new Map(); // ip -> expiresAt\nconst allowList = new Set();\n\nexport function banIP(ip, durationMs = ${banDurationMs}) {\n  banned.set(ip, Date.now() + durationMs);\n}\n\nexport function unbanIP(ip) { banned.delete(ip); }\nexport function allowIP(ip) { allowList.add(ip); }\n\nexport function banListMiddleware(req, res, next) {\n  const ip = req.ip || req.socket.remoteAddress;\n  if (allowList.has(ip)) return next();\n  const expiresAt = banned.get(ip);\n  if (expiresAt) {\n    if (Date.now() > expiresAt) { banned.delete(ip); return next(); }\n    return res.status(403).json({ error: 'IP banned', retryAfter: Math.ceil((expiresAt - Date.now()) / 1000) });\n  }\n  next();\n}\n`,
        });
        return { success: true, operation: 'ratelimit_ban', action, files, message: 'Generated IP ban/allow list' };
      }

      default:
        return { success: false, error: `Unknown rate limit action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 5. WEBHOOKS & INTEGRATIONS ──────────────────────────────────────────────

export async function webhooks(options = {}) {
  try {
    const {
      action = 'receiver',
      provider = 'stripe',
      retryAttempts = 3,
      retryDelayMs = 1000,
      events = [],
    } = options;

    const files = [];

    switch (action) {
      case 'receiver': {
        const verifyCode = provider === 'stripe'
          ? `import Stripe from 'stripe';\nconst stripe = new Stripe(process.env.STRIPE_SECRET_KEY);\n\nfunction verifySignature(req) {\n  const sig = req.headers['stripe-signature'];\n  return stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);\n}\n`
          : provider === 'github'
          ? `import crypto from 'crypto';\n\nfunction verifySignature(req) {\n  const sig = req.headers['x-hub-signature-256'];\n  const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET).update(JSON.stringify(req.body)).digest('hex');\n  if (sig !== 'sha256=' + hmac) throw new Error('Invalid signature');\n  return req.body;\n}\n`
          : `function verifySignature(req) { return req.body; }\n`;

        files.push({
          path: `src/routes/webhook.${provider}.routes.js`,
          description: `${provider} webhook receiver`,
          content: `import { Router } from 'express';\n${verifyCode}\nconst router = Router();\n\nrouter.post('/webhooks/${provider}', async (req, res) => {\n  try {\n    const event = verifySignature(req);\n    console.log('[Webhook] ${provider} event:', event.type || 'unknown');\n    // Handle events\n    switch (event.type) {\n${events.map(e => `      case '${e}':\n        // Handle ${e}\n        break;`).join('\n') || '      // Add event handlers'}\n      default:\n        console.log('Unhandled event:', event.type);\n    }\n    res.json({ received: true });\n  } catch (err) {\n    console.error('Webhook error:', err.message);\n    res.status(400).json({ error: err.message });\n  }\n});\n\nexport default router;\n`,
        });
        return { success: true, operation: 'webhook_receiver', action, files, message: `Generated ${provider} webhook receiver` };
      }

      case 'retry': {
        files.push({
          path: 'src/utils/retry.js',
          description: 'Retry with exponential backoff',
          content: `export async function withRetry(fn, { maxAttempts = ${retryAttempts}, baseDelay = ${retryDelayMs}, idempotencyKey = null } = {}) {\n  for (let attempt = 1; attempt <= maxAttempts; attempt++) {\n    try {\n      return await fn(attempt);\n    } catch (err) {\n      if (attempt === maxAttempts) throw err;\n      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;\n      console.log(\`[Retry] Attempt \${attempt} failed, retrying in \${Math.round(delay)}ms...\`);\n      await new Promise(r => setTimeout(r, delay));\n    }\n  }\n}\n`,
        });
        return { success: true, operation: 'webhook_retry', action, files, message: 'Generated retry utility with exponential backoff' };
      }

      case 'consume_api': {
        files.push({
          path: 'src/services/apiClient.js',
          description: 'Third-party API client with retry + logging',
          content: `import { withRetry } from '../utils/retry.js';\n\nexport class ApiClient {\n  constructor(baseUrl, { apiKey, bearerToken, timeout = 10000 } = {}) {\n    this.baseUrl = baseUrl;\n    this.apiKey = apiKey;\n    this.bearerToken = bearerToken;\n    this.timeout = timeout;\n  }\n\n  async request(method, path, { body, headers = {} } = {}) {\n    const url = this.baseUrl + path;\n    const h = { 'Content-Type': 'application/json', ...headers };\n    if (this.apiKey) h['x-api-key'] = this.apiKey;\n    if (this.bearerToken) h['Authorization'] = 'Bearer ' + this.bearerToken;\n\n    return withRetry(async () => {\n      const controller = new AbortController();\n      const timer = setTimeout(() => controller.abort(), this.timeout);\n      const res = await fetch(url, { method, headers: h, body: body ? JSON.stringify(body) : undefined, signal: controller.signal });\n      clearTimeout(timer);\n      if (!res.ok) throw new Error(\`\${method} \${path} -> \${res.status}\`);\n      return res.json();\n    });\n  }\n\n  get(path, opts) { return this.request('GET', path, opts); }\n  post(path, body, opts) { return this.request('POST', path, { body, ...opts }); }\n  put(path, body, opts) { return this.request('PUT', path, { body, ...opts }); }\n  delete(path, opts) { return this.request('DELETE', path, opts); }\n}\n`,
        });
        return { success: true, operation: 'webhook_api_client', action, files, message: 'Generated API client with retry + auth' };
      }

      default:
        return { success: false, error: `Unknown webhook action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 6. BACKGROUND JOBS ──────────────────────────────────────────────────────

export async function backgroundJobs(options = {}) {
  try {
    const {
      action = 'queue',
      queueName = 'default',
      jobType = 'email',
      concurrency = 5,
      retryAttempts = 3,
      useRedis = false,
    } = options;

    const files = [];

    switch (action) {
      case 'queue': {
        if (useRedis) {
          files.push({
            path: `src/queues/${queueName}.queue.js`,
            description: `BullMQ queue: ${queueName}`,
            content: `import { Queue, Worker } from 'bullmq';\n\nconst connection = { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') };\n\nexport const ${queueName}Queue = new Queue('${queueName}', { connection });\n\nconst worker = new Worker('${queueName}', async (job) => {\n  console.log(\`[${queueName}] Processing: \${job.name}\`, job.data);\n  switch (job.name) {\n    case '${jobType}':\n      // Process ${jobType} job\n      break;\n    default:\n      console.warn('Unknown job type:', job.name);\n  }\n}, { connection, concurrency: ${concurrency} });\n\nworker.on('completed', (job) => console.log(\`[${queueName}] Completed: \${job.id}\`));\nworker.on('failed', (job, err) => console.error(\`[${queueName}] Failed: \${job?.id}\`, err.message));\n\nexport async function addJob(name, data, opts = {}) {\n  return ${queueName}Queue.add(name, data, { attempts: ${retryAttempts}, backoff: { type: 'exponential', delay: 1000 }, ...opts });\n}\n`,
          });
        } else {
          files.push({
            path: `src/queues/${queueName}.queue.js`,
            description: `In-memory job queue: ${queueName}`,
            content: `class SimpleQueue {\n  constructor(name, processor, { concurrency = ${concurrency}, retryAttempts = ${retryAttempts} } = {}) {\n    this.name = name;\n    this.processor = processor;\n    this.concurrency = concurrency;\n    this.retryAttempts = retryAttempts;\n    this.queue = [];\n    this.active = 0;\n    this.dead = [];\n  }\n\n  async add(data, opts = {}) {\n    const job = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), data, attempts: 0, maxAttempts: opts.attempts || this.retryAttempts };\n    this.queue.push(job);\n    this.process();\n    return job.id;\n  }\n\n  async process() {\n    while (this.active < this.concurrency && this.queue.length > 0) {\n      const job = this.queue.shift();\n      this.active++;\n      try {\n        await this.processor(job);\n        console.log(\`[\${this.name}] Completed: \${job.id}\`);\n      } catch (err) {\n        job.attempts++;\n        if (job.attempts < job.maxAttempts) {\n          setTimeout(() => { this.queue.push(job); this.process(); }, 1000 * Math.pow(2, job.attempts));\n        } else {\n          this.dead.push({ ...job, error: err.message });\n          console.error(\`[\${this.name}] Dead-lettered: \${job.id}\`);\n        }\n      } finally {\n        this.active--;\n      }\n    }\n  }\n}\n\nexport const ${queueName}Queue = new SimpleQueue('${queueName}', async (job) => {\n  console.log(\`[${queueName}] Processing:\`, job.data);\n  // Handle job\n});\n\nexport async function addJob(data) { return ${queueName}Queue.add(data); }\n`,
          });
        }
        return { success: true, operation: 'jobs_queue', action, files, message: `Generated ${useRedis ? 'BullMQ' : 'in-memory'} queue: ${queueName}` };
      }

      case 'cron': {
        files.push({
          path: 'src/services/scheduler.js',
          description: 'Cron scheduler',
          content: `class Scheduler {\n  constructor() { this.jobs = []; }\n\n  schedule(name, intervalMs, fn) {\n    const id = setInterval(async () => {\n      try {\n        console.log(\`[Cron] Running: \${name}\`);\n        await fn();\n      } catch (err) {\n        console.error(\`[Cron] \${name} failed:\`, err.message);\n      }\n    }, intervalMs);\n    this.jobs.push({ name, id, intervalMs });\n    console.log(\`[Cron] Scheduled: \${name} every \${intervalMs / 1000}s\`);\n  }\n\n  stop(name) {\n    const job = this.jobs.find(j => j.name === name);\n    if (job) { clearInterval(job.id); this.jobs = this.jobs.filter(j => j.name !== name); }\n  }\n\n  list() { return this.jobs.map(j => ({ name: j.name, intervalMs: j.intervalMs })); }\n}\n\nexport const scheduler = new Scheduler();\n\n// Example:\n// scheduler.schedule('cleanup-temp', 3600000, async () => { /* cleanup logic */ });\n`,
        });
        return { success: true, operation: 'jobs_cron', action, files, message: 'Generated cron scheduler' };
      }

      default:
        return { success: false, error: `Unknown jobs action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 7. BUSINESS LOGIC LAYER ─────────────────────────────────────────────────

export async function businessLogic(options = {}) {
  try {
    const {
      action = 'workflow',
      workflowName = 'order_processing',
      states = ['draft', 'pending', 'active', 'completed'],
      transitions = [],
      steps = ['validate', 'process', 'notify'],
      flags = {},
    } = options;

    const files = [];

    switch (action) {
      case 'workflow': {
        files.push({
          path: `src/workflows/${workflowName}.workflow.js`,
          description: `${workflowName} workflow orchestrator`,
          content: `export class Workflow {\n  constructor(name, steps = []) {\n    this.name = name;\n    this.steps = steps;\n    this.history = [];\n  }\n\n  async execute(context = {}) {\n    const results = [];\n    for (const step of this.steps) {\n      try {\n        console.log(\`[Workflow:\${this.name}] Step: \${step.name}\`);\n        const result = await step.handler(context);\n        results.push({ step: step.name, success: true, result });\n        context = { ...context, ...result };\n        this.history.push({ step: step.name, status: 'completed', at: new Date() });\n      } catch (err) {\n        results.push({ step: step.name, success: false, error: err.message });\n        this.history.push({ step: step.name, status: 'failed', error: err.message, at: new Date() });\n        if (step.rollback) {\n          console.log(\`[Workflow:\${this.name}] Rolling back: \${step.name}\`);\n          await step.rollback(context).catch(() => {});\n        }\n        throw new Error(\`Workflow failed at step: \${step.name} — \${err.message}\`);\n      }\n    }\n    return { success: true, results, history: this.history };\n  }\n}\n\nexport const ${workflowName} = new Workflow('${workflowName}', [\n${steps.map(s => `  { name: '${s}', handler: async (ctx) => { /* ${s} logic */ return {}; } },`).join('\n')}\n]);\n`,
        });
        return { success: true, operation: 'logic_workflow', action, files, message: `Generated ${workflowName} workflow` };
      }

      case 'state_machine': {
        const transStr = transitions.length > 0
          ? transitions.map(t => `  { from: '${t.from}', to: '${t.to}', action: '${t.action}' },`).join('\n')
          : states.slice(0, -1).map((s, i) => `  { from: '${s}', to: '${states[i + 1]}', action: '${s}_to_${states[i + 1]}' },`).join('\n');

        files.push({
          path: 'src/services/stateMachine.js',
          description: 'State machine with transitions',
          content: `export class StateMachine {\n  constructor(initialState, transitions) {\n    this.state = initialState;\n    this.transitions = transitions;\n    this.history = [{ state: initialState, at: new Date() }];\n  }\n\n  can(action) {\n    return this.transitions.some(t => t.from === this.state && t.action === action);\n  }\n\n  transition(action) {\n    const t = this.transitions.find(t => t.from === this.state && t.action === action);\n    if (!t) throw new Error(\`Cannot \${action} from state \${this.state}\`);\n    if (t.guard && !t.guard()) throw new Error(\`Guard failed for \${action}\`);\n    this.state = t.to;\n    this.history.push({ state: t.to, action, at: new Date() });\n    return this.state;\n  }\n\n  getState() { return this.state; }\n  getHistory() { return this.history; }\n}\n\nconst transitions = [\n${transStr}\n];\n\n// Usage: const sm = new StateMachine('${states[0]}', transitions);\n`,
        });
        return { success: true, operation: 'logic_state_machine', action, files, message: `Generated state machine: ${states.join(' → ')}` };
      }

      case 'feature_flags': {
        const flagEntries = Object.entries(flags).length > 0
          ? Object.entries(flags).map(([k, v]) => `  '${k}': { enabled: ${v.enabled !== false}, percentage: ${v.percentage || 100} },`).join('\n')
          : `  'dark_mode': { enabled: true, percentage: 100 },\n  'new_dashboard': { enabled: true, percentage: 50 },`;

        files.push({
          path: 'src/services/featureFlags.js',
          description: 'Feature flag system with percentage rollout',
          content: `const flags = {\n${flagEntries}\n};\n\nexport function isEnabled(flag, userId = null) {\n  const f = flags[flag];\n  if (!f || !f.enabled) return false;\n  if (f.percentage >= 100) return true;\n  if (!userId) return Math.random() * 100 < f.percentage;\n  // Deterministic rollout by user ID\n  const hash = [...userId].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);\n  return Math.abs(hash % 100) < f.percentage;\n}\n\nexport function setFlag(name, config) { flags[name] = config; }\nexport function getFlags() { return { ...flags }; }\n\nexport function featureFlagMiddleware(flag) {\n  return (req, res, next) => {\n    if (!isEnabled(flag, req.user?.id)) {\n      return res.status(404).json({ error: 'Not found' });\n    }\n    next();\n  };\n}\n`,
        });
        return { success: true, operation: 'logic_feature_flags', action, files, message: 'Generated feature flags system' };
      }

      default:
        return { success: false, error: `Unknown business logic action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 8. DATA LAYER ───────────────────────────────────────────────────────────

export async function dataLayer(options = {}) {
  try {
    const {
      action = 'model',
      modelName = 'Item',
      fields = [],
      orm = 'prisma',
      pageSize = 20,
    } = options;

    const Model = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    const model = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const files = [];

    switch (action) {
      case 'model': {
        const prismaFields = fields.map(f => {
          const typeMap = { string: 'String', text: 'String', number: 'Int', integer: 'Int', float: 'Float', boolean: 'Boolean', date: 'DateTime', datetime: 'DateTime', json: 'Json', decimal: 'Decimal', bigint: 'BigInt' };
          const pType = typeMap[f.type] || 'String';
          const mods = [];
          if (f.unique) mods.push('@unique');
          if (f.default) mods.push(`@default(${f.default})`);
          return `  ${f.name} ${pType}${f.required ? '' : '?'} ${mods.join(' ')}`;
        }).join('\n');

        files.push({
          path: `prisma/models/${model}.prisma`,
          description: `Prisma model: ${Model}`,
          content: `model ${Model} {\n  id        String   @id @default(cuid())\n${prismaFields}\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n`,
        });
        return { success: true, operation: 'data_model', action, files, message: `Generated Prisma model: ${Model}` };
      }

      case 'pagination': {
        files.push({
          path: 'src/utils/pagination.js',
          description: 'Offset + cursor pagination utilities',
          content: `export function offsetPaginate(query, { page = 1, limit = ${pageSize} } = {}) {\n  const skip = (page - 1) * limit;\n  return { ...query, skip, take: limit };\n}\n\nexport function cursorPaginate(query, { cursor, limit = ${pageSize} } = {}) {\n  const opts = { ...query, take: limit + 1 };\n  if (cursor) { opts.cursor = { id: cursor }; opts.skip = 1; }\n  return opts;\n}\n\nexport function buildPaginationMeta(total, page, limit) {\n  return { page, limit, total, pages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 };\n}\n\nexport function buildCursorMeta(items, limit) {\n  const hasMore = items.length > limit;\n  const data = hasMore ? items.slice(0, -1) : items;\n  return { data, hasMore, nextCursor: hasMore ? data[data.length - 1]?.id : null };\n}\n`,
        });
        return { success: true, operation: 'data_pagination', action, files, message: 'Generated pagination utilities' };
      }

      case 'soft_delete': {
        files.push({
          path: 'src/extensions/softDelete.js',
          description: 'Prisma soft delete extension',
          content: `import { Prisma } from '@prisma/client';\n\nexport const softDeleteExtension = Prisma.defineExtension({\n  name: 'softDelete',\n  query: {\n    $allModels: {\n      async findMany({ args, query }) {\n        args.where = { ...args.where, deletedAt: null };\n        return query(args);\n      },\n      async findFirst({ args, query }) {\n        args.where = { ...args.where, deletedAt: null };\n        return query(args);\n      },\n      async delete({ model, args, query }) {\n        return query({ ...args, data: { deletedAt: new Date() } });\n      },\n    },\n  },\n});\n\n// Usage: const prisma = new PrismaClient().$extends(softDeleteExtension);\n`,
        });
        return { success: true, operation: 'data_soft_delete', action, files, message: 'Generated soft delete Prisma extension' };
      }

      case 'transaction': {
        files.push({
          path: 'src/utils/transaction.js',
          description: 'Transaction helpers + saga pattern',
          content: `import prisma from '../lib/prisma.js';\n\nexport async function withTransaction(operations) {\n  return prisma.$transaction(operations);\n}\n\nexport class Saga {\n  constructor() { this.steps = []; this.completed = []; }\n\n  addStep(name, execute, compensate) {\n    this.steps.push({ name, execute, compensate });\n  }\n\n  async run(context = {}) {\n    for (const step of this.steps) {\n      try {\n        const result = await step.execute(context);\n        context = { ...context, [step.name]: result };\n        this.completed.push(step);\n      } catch (err) {\n        console.error(\`[Saga] Failed at \${step.name}:\`, err.message);\n        // Compensate in reverse order\n        for (const done of this.completed.reverse()) {\n          try { await done.compensate(context); } catch (e) { console.error(\`[Saga] Compensation failed for \${done.name}:\`, e.message); }\n        }\n        throw new Error(\`Saga failed at \${step.name}: \${err.message}\`);\n      }\n    }\n    return context;\n  }\n}\n`,
        });
        return { success: true, operation: 'data_transaction', action, files, message: 'Generated transaction + saga helpers' };
      }

      default:
        return { success: false, error: `Unknown data layer action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 9. TESTING ──────────────────────────────────────────────────────────────

export async function testing(options = {}) {
  try {
    const {
      action = 'unit',
      testTarget = 'auth',
      framework = 'jest',
      seedCount = 50,
      endpoints = [],
    } = options;

    const files = [];

    switch (action) {
      case 'unit': {
        files.push({
          path: `tests/unit/${testTarget}.test.js`,
          description: `Unit tests for ${testTarget}`,
          content: `import { describe, it, expect, beforeEach } from '${framework === 'vitest' ? 'vitest' : '@jest/globals'}';\n\ndescribe('${testTarget}', () => {\n  beforeEach(() => {\n    // Setup\n  });\n\n  it('should exist', () => {\n    expect(true).toBe(true);\n  });\n\n  it('should handle valid input', () => {\n    // TODO: Test with valid input\n  });\n\n  it('should handle invalid input', () => {\n    // TODO: Test with invalid input\n  });\n\n  it('should handle edge cases', () => {\n    // TODO: Test edge cases\n  });\n});\n`,
        });
        return { success: true, operation: 'test_unit', action, files, message: `Generated unit test scaffold for ${testTarget}` };
      }

      case 'api': {
        const endpointTests = endpoints.length > 0
          ? endpoints.map(e => `  it('${e.method} ${e.path} should return ${e.expectedStatus || 200}', async () => {\n    const res = await request(app).${e.method.toLowerCase()}('${e.path}')${e.auth ? ".set('Authorization', 'Bearer ' + token)" : ''}${e.body ? `.send(${JSON.stringify(e.body)})` : ''};\n    expect(res.status).toBe(${e.expectedStatus || 200});\n  });`).join('\n\n')
          : `  it('GET /api/${testTarget} should return 200', async () => {\n    const res = await request(app).get('/api/${testTarget}');\n    expect(res.status).toBe(200);\n  });`;

        files.push({
          path: `tests/api/${testTarget}.api.test.js`,
          description: `API integration tests for ${testTarget}`,
          content: `import request from 'supertest';\nimport app from '../../src/app.js';\n\ndescribe('${testTarget} API', () => {\n  let token;\n\n  beforeAll(async () => {\n    // Setup: create test user, get token\n  });\n\n${endpointTests}\n});\n`,
        });
        return { success: true, operation: 'test_api', action, files, message: `Generated API tests for ${testTarget}` };
      }

      case 'seed': {
        files.push({
          path: 'prisma/seed.js',
          description: `Database seed script (${seedCount} records)`,
          content: `import { PrismaClient } from '@prisma/client';\nimport crypto from 'crypto';\n\nconst prisma = new PrismaClient();\n\nfunction randomString(len = 8) { return crypto.randomBytes(len).toString('hex').slice(0, len); }\nfunction randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }\nfunction randomEmail() { return \`user_\${randomString(6)}@test.com\`; }\n\nasync function main() {\n  console.log('Seeding ${seedCount} records...');\n\n  for (let i = 0; i < ${seedCount}; i++) {\n    // TODO: Replace with your model\n    // await prisma.user.create({\n    //   data: { name: 'User ' + i, email: randomEmail() },\n    // });\n  }\n\n  console.log('Seeding complete');\n}\n\nmain().catch(console.error).finally(() => prisma.$disconnect());\n`,
        });
        return { success: true, operation: 'test_seed', action, files, message: `Generated seed script for ${seedCount} records` };
      }

      case 'load': {
        files.push({
          path: 'tests/load/loadtest.js',
          description: 'Load test script (zero dependencies)',
          content: `const BASE_URL = process.env.TARGET_URL || 'http://localhost:3000';\nconst DURATION_MS = 10000;\nconst CONCURRENCY = 10;\n\nlet total = 0, success = 0, failed = 0;\nconst latencies = [];\n\nasync function makeRequest() {\n  const start = Date.now();\n  try {\n    const res = await fetch(BASE_URL + '/api/health');\n    if (res.ok) success++; else failed++;\n    latencies.push(Date.now() - start);\n  } catch { failed++; latencies.push(Date.now() - start); }\n  total++;\n}\n\nasync function worker() {\n  const end = Date.now() + DURATION_MS;\n  while (Date.now() < end) {\n    await makeRequest();\n  }\n}\n\nasync function run() {\n  console.log(\`Load test: \${CONCURRENCY} workers for \${DURATION_MS / 1000}s against \${BASE_URL}\`);\n  const start = Date.now();\n  await Promise.all(Array.from({ length: CONCURRENCY }, worker));\n  const elapsed = (Date.now() - start) / 1000;\n\n  latencies.sort((a, b) => a - b);\n  const p50 = latencies[Math.floor(latencies.length * 0.5)];\n  const p95 = latencies[Math.floor(latencies.length * 0.95)];\n  const p99 = latencies[Math.floor(latencies.length * 0.99)];\n\n  console.log(\`\\nResults:\`);\n  console.log(\`  Total: \${total} | Success: \${success} | Failed: \${failed}\`);\n  console.log(\`  RPS: \${(total / elapsed).toFixed(1)}\`);\n  console.log(\`  Latency p50=\${p50}ms p95=\${p95}ms p99=\${p99}ms\`);\n}\n\nrun();\n`,
        });
        return { success: true, operation: 'test_load', action, files, message: 'Generated load test script' };
      }

      default:
        return { success: false, error: `Unknown testing action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 10. OBSERVABILITY ───────────────────────────────────────────────────────

export async function observability(options = {}) {
  try {
    const {
      action = 'logger',
      logLevel = 'info',
      serviceName = 'api',
    } = options;

    const files = [];

    switch (action) {
      case 'logger': {
        files.push({
          path: 'src/lib/logger.js',
          description: 'Structured JSON logger + request middleware',
          content: `const LEVELS = { error: 0, warn: 1, info: 2, debug: 3, trace: 4 };\nconst MIN_LEVEL = LEVELS['${logLevel}'] ?? 2;\n\nfunction log(level, message, meta = {}) {\n  if (LEVELS[level] > MIN_LEVEL) return;\n  const entry = { timestamp: new Date().toISOString(), level, service: '${serviceName}', message, ...meta };\n  const out = level === 'error' ? console.error : console.log;\n  out(JSON.stringify(entry));\n}\n\nexport const logger = {\n  error: (msg, meta) => log('error', msg, meta),\n  warn: (msg, meta) => log('warn', msg, meta),\n  info: (msg, meta) => log('info', msg, meta),\n  debug: (msg, meta) => log('debug', msg, meta),\n  trace: (msg, meta) => log('trace', msg, meta),\n};\n\nexport function requestLogger(req, res, next) {\n  const start = Date.now();\n  res.on('finish', () => {\n    logger.info('request', { method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - start, ip: req.ip });\n  });\n  next();\n}\n`,
        });
        return { success: true, operation: 'observe_logger', action, files, message: 'Generated structured logger' };
      }

      case 'error_middleware': {
        files.push({
          path: 'src/middleware/errorHandler.js',
          description: 'Global error handler + AppError class',
          content: `export class AppError extends Error {\n  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {\n    super(message);\n    this.statusCode = statusCode;\n    this.code = code;\n    this.isOperational = true;\n  }\n}\n\nexport function asyncHandler(fn) {\n  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);\n}\n\nexport function notFoundHandler(req, res) {\n  res.status(404).json({ error: 'Not found', path: req.path });\n}\n\nexport function errorHandler(err, req, res, next) {\n  const status = err.statusCode || 500;\n  const response = {\n    error: err.message || 'Internal server error',\n    code: err.code || 'INTERNAL_ERROR',\n    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),\n  };\n  console.error(\`[Error] \${status} \${err.message}\`, err.stack?.split('\\n').slice(0, 3).join(' '));\n  res.status(status).json(response);\n}\n`,
        });
        return { success: true, operation: 'observe_errors', action, files, message: 'Generated error handler middleware' };
      }

      case 'health': {
        files.push({
          path: 'src/routes/health.routes.js',
          description: 'Health/readiness/liveness endpoints',
          content: `import { Router } from 'express';\n\nconst router = Router();\nconst startTime = Date.now();\n\nrouter.get('/health', (req, res) => {\n  res.json({ status: 'ok', uptime: Math.floor((Date.now() - startTime) / 1000), timestamp: new Date().toISOString() });\n});\n\nrouter.get('/ready', async (req, res) => {\n  try {\n    // Check DB connection\n    // await prisma.$queryRaw\`SELECT 1\`;\n    const mem = process.memoryUsage();\n    res.json({ status: 'ready', memory: { rss: Math.round(mem.rss / 1024 / 1024) + 'MB', heap: Math.round(mem.heapUsed / 1024 / 1024) + 'MB' } });\n  } catch (err) {\n    res.status(503).json({ status: 'not_ready', error: err.message });\n  }\n});\n\nrouter.get('/live', (req, res) => res.status(200).send('OK'));\n\nexport default router;\n`,
        });
        return { success: true, operation: 'observe_health', action, files, message: 'Generated health endpoints' };
      }

      case 'metrics': {
        files.push({
          path: 'src/services/metrics.js',
          description: 'In-memory metrics collector',
          content: `class Metrics {\n  constructor() { this.counters = {}; this.histograms = {}; this.gauges = {}; }\n\n  increment(name, value = 1) { this.counters[name] = (this.counters[name] || 0) + value; }\n  histogram(name, value) { (this.histograms[name] = this.histograms[name] || []).push(value); }\n  gauge(name, value) { this.gauges[name] = value; }\n\n  getAll() {\n    const histSummary = {};\n    for (const [k, v] of Object.entries(this.histograms)) {\n      v.sort((a, b) => a - b);\n      histSummary[k] = { count: v.length, p50: v[Math.floor(v.length * 0.5)], p95: v[Math.floor(v.length * 0.95)], p99: v[Math.floor(v.length * 0.99)] };\n    }\n    return { counters: this.counters, histograms: histSummary, gauges: this.gauges };\n  }\n\n  reset() { this.counters = {}; this.histograms = {}; }\n}\n\nexport const metrics = new Metrics();\n\nexport function metricsMiddleware(req, res, next) {\n  const start = Date.now();\n  metrics.increment('http_requests_total');\n  res.on('finish', () => {\n    metrics.histogram('http_response_time_ms', Date.now() - start);\n    metrics.increment(\`http_status_\${res.statusCode}\`);\n  });\n  next();\n}\n`,
        });
        return { success: true, operation: 'observe_metrics', action, files, message: 'Generated metrics collector' };
      }

      case 'audit': {
        files.push({
          path: 'src/middleware/audit.js',
          description: 'Audit trail logger',
          content: `const auditLog = [];\n\nexport function audit(action, details = {}) {\n  auditLog.push({ action, ...details, timestamp: new Date().toISOString() });\n  if (auditLog.length > 10000) auditLog.shift();\n}\n\nexport function auditMiddleware(req, res, next) {\n  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {\n    res.on('finish', () => {\n      audit(req.method + ' ' + req.path, {\n        userId: req.user?.id || 'anonymous',\n        status: res.statusCode,\n        ip: req.ip,\n      });\n    });\n  }\n  next();\n}\n\nexport function getAuditLog({ limit = 100, userId, action } = {}) {\n  let results = auditLog;\n  if (userId) results = results.filter(r => r.userId === userId);\n  if (action) results = results.filter(r => r.action.includes(action));\n  return results.slice(-limit).reverse();\n}\n`,
        });
        return { success: true, operation: 'observe_audit', action, files, message: 'Generated audit trail middleware' };
      }

      default:
        return { success: false, error: `Unknown observability action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 11. DEVOPS ──────────────────────────────────────────────────────────────

export async function devops(options = {}) {
  try {
    const {
      action = 'docker',
      serviceName = 'api',
      port = 3000,
      nodeVersion = '20',
      packageManager = 'npm',
      ciProvider = 'github',
      envVars = {},
    } = options;

    const files = [];

    switch (action) {
      case 'env_config': {
        const envContent = ['NODE_ENV=development', `PORT=${port}`, 'DATABASE_URL=postgresql://user:pass@localhost:5432/db', 'JWT_SECRET=change-me-in-production', 'REDIS_URL=redis://localhost:6379', ...Object.entries(envVars).map(([k, v]) => `${k}=${v}`)].join('\n');
        files.push({ path: '.env.example', description: 'Environment variable template', content: envContent + '\n' });
        files.push({
          path: 'src/config/env.js',
          description: 'Environment validation + getters',
          content: `const required = ['DATABASE_URL'];\nconst optional = { PORT: '${port}', NODE_ENV: 'development', JWT_SECRET: 'dev-secret' };\n\nexport function validateEnv() {\n  const missing = required.filter(k => !process.env[k]);\n  if (missing.length > 0) {\n    console.error('Missing required env vars:', missing.join(', '));\n    process.exit(1);\n  }\n}\n\nexport function env(key, fallback) {\n  return process.env[key] || optional[key] || fallback;\n}\n\nexport const config = {\n  port: parseInt(env('PORT', '${port}')),\n  nodeEnv: env('NODE_ENV', 'development'),\n  isProduction: env('NODE_ENV') === 'production',\n  db: env('DATABASE_URL'),\n};\n`,
        });
        return { success: true, operation: 'devops_env', action, files, message: 'Generated .env.example + env config' };
      }

      case 'docker': {
        files.push({
          path: 'Dockerfile',
          description: 'Multi-stage Dockerfile',
          content: `FROM node:${nodeVersion}-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nRUN npm run build 2>/dev/null || true\n\nFROM node:${nodeVersion}-alpine\nWORKDIR /app\nCOPY --from=builder /app/node_modules ./node_modules\nCOPY --from=builder /app .\nEXPOSE ${port}\nHEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:${port}/health || exit 1\nCMD ["node", "src/index.js"]\n`,
        });
        files.push({
          path: '.dockerignore',
          description: 'Docker ignore file',
          content: 'node_modules\n.git\n.env\n*.log\ndist\ncoverage\n.DS_Store\n',
        });
        files.push({
          path: 'docker-compose.yml',
          description: 'Docker Compose with PostgreSQL',
          content: `version: '3.8'\nservices:\n  ${serviceName}:\n    build: .\n    ports:\n      - "${port}:${port}"\n    environment:\n      - DATABASE_URL=postgresql://postgres:postgres@db:5432/${serviceName}\n      - REDIS_URL=redis://redis:6379\n    depends_on:\n      - db\n      - redis\n\n  db:\n    image: postgres:16-alpine\n    environment:\n      POSTGRES_DB: ${serviceName}\n      POSTGRES_USER: postgres\n      POSTGRES_PASSWORD: postgres\n    ports:\n      - "5432:5432"\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n\n  redis:\n    image: redis:7-alpine\n    ports:\n      - "6379:6379"\n\nvolumes:\n  pgdata:\n`,
        });
        return { success: true, operation: 'devops_docker', action, files, message: 'Generated Dockerfile + docker-compose' };
      }

      case 'ci_scripts': {
        if (ciProvider === 'github') {
          files.push({
            path: '.github/workflows/ci.yml',
            description: 'GitHub Actions CI pipeline',
            content: `name: CI\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    services:\n      postgres:\n        image: postgres:16\n        env:\n          POSTGRES_DB: test\n          POSTGRES_USER: postgres\n          POSTGRES_PASSWORD: postgres\n        ports: ['5432:5432']\n        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5\n\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '${nodeVersion}'\n          cache: '${packageManager}'\n      - run: ${packageManager} ${packageManager === 'npm' ? 'ci' : 'install --frozen-lockfile'}\n      - run: ${packageManager} ${packageManager === 'npm' ? 'run' : ''} lint\n      - run: ${packageManager} test\n        env:\n          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test\n`,
          });
        }
        return { success: true, operation: 'devops_ci', action, files, message: `Generated ${ciProvider} CI pipeline` };
      }

      case 'graceful_shutdown': {
        files.push({
          path: 'src/lib/shutdown.js',
          description: 'Graceful shutdown handler',
          content: `const handlers = [];\nlet shuttingDown = false;\n\nexport function onShutdown(name, fn) { handlers.push({ name, fn }); }\n\nasync function shutdown(signal) {\n  if (shuttingDown) return;\n  shuttingDown = true;\n  console.log(\`\\n[\${signal}] Graceful shutdown starting...\`);\n\n  const timeout = setTimeout(() => {\n    console.error('Shutdown timeout — forcing exit');\n    process.exit(1);\n  }, 10000);\n\n  for (const { name, fn } of handlers) {\n    try {\n      console.log(\`  Closing: \${name}\`);\n      await fn();\n    } catch (err) {\n      console.error(\`  Failed: \${name} — \${err.message}\`);\n    }\n  }\n\n  clearTimeout(timeout);\n  console.log('Shutdown complete');\n  process.exit(0);\n}\n\nprocess.on('SIGTERM', () => shutdown('SIGTERM'));\nprocess.on('SIGINT', () => shutdown('SIGINT'));\n`,
        });
        return { success: true, operation: 'devops_shutdown', action, files, message: 'Generated graceful shutdown handler' };
      }

      default:
        return { success: false, error: `Unknown devops action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── CAPABILITIES ────────────────────────────────────────────────────────────

export function getBackendCapabilities() {
  return {
    supported: true,
    message: 'Backend engine ready — template-based code generation',
    frameworks: ['express', 'prisma', 'jest', 'docker', 'github-actions'],
    operations: ['apiDesign', 'fileHandling', 'authSecurity', 'rateLimiting', 'webhooks', 'backgroundJobs', 'businessLogic', 'dataLayer', 'testing', 'observability', 'devops'],
  };
}

// ── Helper ──────────────────────────────────────────────────────────────────

function parseSize(str) {
  const match = String(str).match(/^(\d+)(mb|gb|kb)?$/i);
  if (!match) return 50 * 1024 * 1024;
  const num = parseInt(match[1]);
  const unit = (match[2] || 'mb').toLowerCase();
  if (unit === 'gb') return num * 1024 * 1024 * 1024;
  if (unit === 'kb') return num * 1024;
  return num * 1024 * 1024;
}
