import React from 'react';
import ToolExecutionPanel, { ToolDefinition } from './ToolExecutionPanel';
import { PreviewContent } from './PanelPreview';

const TOOLS: ToolDefinition[] = [
  {
    id: 'backend_scaffold',
    icon: '🏗️',
    label: 'Scaffold Backend',
    desc: 'Generate a complete backend project with Express, Fastify, NestJS, or Hono, including routes, middleware, and config.',
    color: 'indigo',
    fields: [
      { key: 'type', type: 'select', label: 'Framework', options: ['express','fastify','nestjs','hono','koa','flask','django','fastapi'], default: 'express' },
      { key: 'name', type: 'text', label: 'Project Name', placeholder: 'my-api', required: true },
      { key: 'language', type: 'select', label: 'Language', options: ['typescript','javascript','python'], default: 'typescript' },
      { key: 'features', type: 'text', label: 'Features (comma-separated)', placeholder: 'auth, cors, rate-limiting, swagger, prisma, websocket' },
    ],
    buildInput: (v) => ({ type: v.type, name: v.name, language: v.language, features: v.features?.split(',').map((f: string) => f.trim()) }),
  },
  {
    id: 'backend_route',
    icon: '🔀',
    label: 'Generate Route',
    desc: 'Generate REST API routes with CRUD operations, validation, error handling, and middleware.',
    color: 'cyan',
    fields: [
      { key: 'resource', type: 'text', label: 'Resource Name', placeholder: 'users, products, orders', required: true },
      { key: 'framework', type: 'select', label: 'Framework', options: ['express','fastify','nestjs','hono','flask','fastapi'], default: 'express' },
      { key: 'operations', type: 'text', label: 'Operations (comma-separated)', placeholder: 'list, get, create, update, delete', default: 'list,get,create,update,delete' },
      { key: 'auth', type: 'checkbox', label: 'Include Auth', placeholder: 'Add authentication middleware' },
      { key: 'validation', type: 'checkbox', label: 'Include Validation', placeholder: 'Add request validation (Zod/Joi)' },
    ],
    buildInput: (v) => ({ resource: v.resource, framework: v.framework, operations: v.operations?.split(',').map((o: string) => o.trim()), auth: !!v.auth, validation: !!v.validation }),
  },
  {
    id: 'backend_middleware',
    icon: '🛡️',
    label: 'Generate Middleware',
    desc: 'Generate production middleware: auth, rate limiting, logging, CORS, error handling, caching.',
    color: 'violet',
    fields: [
      { key: 'type', type: 'select', label: 'Middleware Type', options: ['auth','rate-limit','logging','cors','error-handler','cache','validation','compression','security-headers'], default: 'auth' },
      { key: 'language', type: 'select', label: 'Language', options: ['typescript','javascript','python'], default: 'typescript' },
      { key: 'framework', type: 'select', label: 'Framework', options: ['express','fastify','nestjs','hono','flask','fastapi'], default: 'express' },
    ],
    buildInput: (v) => ({ type: v.type, language: v.language, framework: v.framework }),
  },
  {
    id: 'backend_schema',
    icon: '📐',
    label: 'Generate Schema',
    desc: 'Generate database schemas, Prisma models, TypeORM entities, or SQLAlchemy models from descriptions.',
    color: 'teal',
    fields: [
      { key: 'model', type: 'text', label: 'Model Name', placeholder: 'User, Product, Order', required: true },
      { key: 'orm', type: 'select', label: 'ORM / Schema Type', options: ['prisma','typeorm','sequelize','mongoose','sqlalchemy','drizzle','raw_sql'], default: 'prisma' },
      { key: 'fields', type: 'json', label: 'Fields Definition (JSON)', rows: 6, placeholder: '[{"name":"email","type":"string","unique":true},{"name":"role","type":"enum","values":["admin","user"]}]' },
      { key: 'relations', type: 'text', label: 'Relations (optional)', placeholder: 'hasMany:Post, belongsTo:Organization' },
    ],
    buildInput: (v) => {
      let fields;
      try { fields = v.fields ? JSON.parse(v.fields) : undefined; } catch { fields = undefined; }
      return { model: v.model, orm: v.orm, fields, relations: v.relations };
    },
  },
];

interface Props {
  onClose?: () => void;
  onRunTool: (message: string) => void;
  onPreviewContent?: (c: PreviewContent) => void;
}

const BackendToolsPanel: React.FC<Props> = ({ onClose, onRunTool, onPreviewContent }) => (
  <ToolExecutionPanel
    categoryTitle="Backend Tools"
    categorySubtitle="Scaffold, Routes, Middleware & Schemas"
    categoryColor="indigo"
    tools={TOOLS}
    onClose={onClose}
    onRunTool={onRunTool}
    onPreviewContent={onPreviewContent}
  />
);

export default BackendToolsPanel;
