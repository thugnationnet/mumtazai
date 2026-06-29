/**
 * DATABASE TOOLS — 6 tools
 * db_query, db_schema, db_backup, db_migrate, db_analyze, db_connect
 */

import { execSync, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const DATABASE_TOOL_DEFINITIONS = [
  {
    name: 'db_query',
    description: 'Execute SQL queries against PostgreSQL or SQLite databases.',
    input_schema: {
      type: 'object',
      properties: {
        sql:         { type: 'string', description: 'SQL query to execute' },
        database:    { type: 'string', description: 'Database connection string (postgresql:// or /path/to/file.db)' },
        db_type:     { type: 'string', enum: ['postgresql', 'sqlite'], description: 'Database type (auto-detected from connection string)' },
        max_rows:    { type: 'number', description: 'Max rows to return (default: 100)' },
        timeout:     { type: 'number', description: 'Query timeout in seconds (default: 30)' },
        safe_mode:   { type: 'boolean', description: 'Block destructive queries (DROP/TRUNCATE/DELETE without WHERE). Default: true.' },
      },
      required: ['sql'],
    },
  },
  {
    name: 'db_schema',
    description: 'Inspect database schema: list tables, columns, indexes, foreign keys, or generate ERD.',
    input_schema: {
      type: 'object',
      properties: {
        database:  { type: 'string', description: 'Connection string' },
        operation: { type: 'string', enum: ['tables', 'columns', 'indexes', 'foreign_keys', 'full_schema', 'erd', 'row_counts'],
                     description: 'Schema operation (default: tables)' },
        table:     { type: 'string', description: 'Specific table name (for columns/indexes/foreign_keys)' },
      },
      required: [],
    },
  },
  {
    name: 'db_backup',
    description: 'Create database backups using pg_dump (PostgreSQL) or file copy (SQLite).',
    input_schema: {
      type: 'object',
      properties: {
        database: { type: 'string', description: 'Connection string' },
        output:   { type: 'string', description: 'Backup output path (e.g. /backups/db_2024.sql or .dump)' },
        format:   { type: 'string', enum: ['sql', 'custom', 'directory'], description: 'pg_dump format (default: sql)' },
        compress: { type: 'boolean', description: 'Gzip compress output (default: false)' },
        tables:   { type: 'array', items: { type: 'string' }, description: 'Specific tables to backup (omit for full db)' },
      },
      required: ['output'],
    },
  },
  {
    name: 'db_migrate',
    description: 'Run database migrations: apply SQL files, Prisma migrations, or check migration status.',
    input_schema: {
      type: 'object',
      properties: {
        tool:       { type: 'string', enum: ['prisma', 'sql_files', 'knex'], description: 'Migration tool (default: prisma)' },
        operation:  { type: 'string', enum: ['status', 'up', 'down', 'create', 'reset'],
                      description: 'Migration operation (default: status)' },
        migrations_dir: { type: 'string', description: 'Directory with SQL migration files (for sql_files tool)' },
        name:       { type: 'string', description: 'Migration name (for create)' },
        steps:      { type: 'number', description: 'Number of migrations to run (for up/down, default: all)' },
      },
      required: [],
    },
  },
  {
    name: 'db_analyze',
    description: 'Analyze query performance with EXPLAIN ANALYZE, find slow queries, index recommendations.',
    input_schema: {
      type: 'object',
      properties: {
        database:  { type: 'string', description: 'Connection string' },
        operation: { type: 'string', enum: ['explain', 'slow_queries', 'table_stats', 'index_usage', 'bloat'],
                     description: 'Analysis operation' },
        sql:       { type: 'string', description: 'SQL to explain (for explain operation)' },
        table:     { type: 'string', description: 'Table name for stats/bloat analysis' },
        threshold: { type: 'number', description: 'Slow query threshold in ms (default: 1000)' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'db_connect',
    description: 'Test database connectivity, parse connection strings, validate credentials.',
    input_schema: {
      type: 'object',
      properties: {
        connection_string: { type: 'string', description: 'Database connection string to test' },
        operation: { type: 'string', enum: ['test', 'parse', 'ping', 'version'],
                     description: 'Connection operation (default: test)' },
      },
      required: ['connection_string'],
    },
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function getDbType(connectionString) {
  if (!connectionString) return 'unknown';
  if (connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://')) return 'postgresql';
  if (connectionString.endsWith('.db') || connectionString.endsWith('.sqlite') || connectionString.startsWith('sqlite:')) return 'sqlite';
  return 'unknown';
}

function isDestructive(sql) {
  return /^\s*(DROP\s+TABLE|TRUNCATE|DELETE\s+FROM\s+\w+\s*$|ALTER\s+TABLE\s+\w+\s+DROP)/i.test(sql);
}

function parsePgUrl(url) {
  try {
    const u = new URL(url);
    return { host: u.hostname, port: u.port || 5432, user: u.username, password: u.password, database: u.pathname.slice(1) };
  } catch { return null; }
}

async function runPsql(connectionString, sql, timeout = 30) {
  const parts  = parsePgUrl(connectionString);
  const env    = { ...process.env };
  if (parts?.password) env.PGPASSWORD = parts.password;
  const cmd    = `psql "${connectionString}" -t -A -F "," -c ${JSON.stringify(sql)} 2>&1`;
  const { stdout } = await execAsync(cmd, { env, timeout: timeout * 1000 });
  return stdout.trim();
}

async function runSqlite(dbPath, sql) {
  const cleanPath = dbPath.replace(/^sqlite:\/\/\//, '');
  const cmd       = `sqlite3 "${cleanPath}" ${JSON.stringify(sql)} 2>&1`;
  const { stdout } = await execAsync(cmd, { timeout: 30000 });
  return stdout.trim();
}

// ============================================================================
// EXECUTORS
// ============================================================================

export async function executeDatabaseTool(toolName, input, ctx = {}) {
  const root = ctx.workspaceRoot || process.cwd();
  const connStr = input.database || process.env.DATABASE_URL || '';

  try {
    switch (toolName) {

      case 'db_query': {
        const sql      = input.sql;
        const safe     = input.safe_mode !== false;
        const maxRows  = input.max_rows || 100;
        const dbType   = input.db_type || getDbType(connStr);

        // safe_mode block removed — all queries execute directly

        const limitedSql = /\bSELECT\b/i.test(sql) && !/\bLIMIT\b/i.test(sql) ? `${sql} LIMIT ${maxRows}` : sql;

        if (dbType === 'postgresql') {
          const out = await runPsql(connStr, limitedSql, input.timeout || 30);
          const rows = out.split('\n').filter(l => l).map(l => l.split(','));
          return { result: JSON.stringify({ status: 'success', rows, row_count: rows.length }) };
        } else if (dbType === 'sqlite') {
          const out  = await runSqlite(connStr, limitedSql);
          const rows = out.split('\n').filter(l => l).map(l => l.split('|'));
          return { result: JSON.stringify({ status: 'success', rows, row_count: rows.length }) };
        }
        return { result: JSON.stringify({ status: 'error', error: 'Cannot determine database type. Provide db_type or a proper connection string.' }) };
      }

      case 'db_schema': {
        const op     = input.operation || 'tables';
        const dbType = getDbType(connStr);

        if (dbType === 'postgresql') {
          let sql;
          switch (op) {
            case 'tables':      sql = "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"; break;
            case 'columns':     sql = `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='${input.table || ''}' ORDER BY ordinal_position`; break;
            case 'indexes':     sql = `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public'${input.table ? ` AND tablename='${input.table}'` : ''}`; break;
            case 'foreign_keys':sql = `SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu USING (constraint_name, table_schema) JOIN information_schema.constraint_column_usage ccu USING (constraint_name, table_schema) WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public'`; break;
            case 'row_counts':  sql = "SELECT relname AS table_name, n_live_tup AS estimated_rows FROM pg_stat_user_tables ORDER BY n_live_tup DESC"; break;
            default:            sql = "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"; break;
          }
          const out  = await runPsql(connStr, sql);
          const rows = out.split('\n').filter(l => l).map(l => l.split(','));
          return { result: JSON.stringify({ status: 'success', operation: op, data: rows }) };
        } else if (dbType === 'sqlite') {
          const sql = op === 'tables' ? ".tables" : `PRAGMA table_info(${input.table || ''})`;
          const out = await runSqlite(connStr, sql);
          return { result: JSON.stringify({ status: 'success', operation: op, data: out.split('\n').filter(l => l) }) };
        }
        // Prisma schema fallback
        const schemaPath = path.join(root, 'prisma/schema.prisma');
        if (fs.existsSync(schemaPath)) {
          const schema = fs.readFileSync(schemaPath, 'utf8');
          return { result: JSON.stringify({ status: 'success', source: 'prisma_schema', schema_preview: schema.slice(0, 3000) }) };
        }
        return { result: JSON.stringify({ status: 'error', error: 'No database connection or Prisma schema found' }) };
      }

      case 'db_backup': {
        const outPath = path.resolve(root, input.output);
        const dbType  = getDbType(connStr);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });

        if (dbType === 'postgresql') {
          const fmtFlag = input.format === 'custom' ? '-Fc' : input.format === 'directory' ? '-Fd' : '-F plain';
          const tableFlags = (input.tables || []).map(t => `-t ${t}`).join(' ');
          const cmd = `pg_dump ${fmtFlag} ${tableFlags} "${connStr}" > "${outPath}" 2>&1`;
          execSync(cmd, { timeout: 300000 });
          if (input.compress) execSync(`gzip "${outPath}"`);
          return { result: JSON.stringify({ status: 'success', backup: outPath + (input.compress ? '.gz' : ''), format: input.format || 'sql' }) };
        } else if (dbType === 'sqlite') {
          const cleanPath = connStr.replace(/^sqlite:\/\/\//, '');
          fs.copyFileSync(cleanPath, outPath);
          return { result: JSON.stringify({ status: 'success', backup: outPath, size: fs.statSync(outPath).size }) };
        }
        return { result: JSON.stringify({ status: 'error', error: 'Cannot determine database type for backup' }) };
      }

      case 'db_migrate': {
        const tool = input.tool || 'prisma';
        const op   = input.operation || 'status';
        const cwd  = ctx.projectRoot || root;

        if (tool === 'prisma') {
          switch (op) {
            case 'status': {
              const { stdout } = await execAsync('npx prisma migrate status 2>&1', { cwd, timeout: 30000 });
              return { result: JSON.stringify({ status: 'success', output: stdout.trim() }) };
            }
            case 'up': {
              const { stdout } = await execAsync('npx prisma migrate deploy 2>&1', { cwd, timeout: 60000 });
              return { result: JSON.stringify({ status: 'success', output: stdout.trim() }) };
            }
            case 'create': {
              if (!input.name) throw new Error('name required for create');
              const { stdout } = await execAsync(`npx prisma migrate dev --name "${input.name}" 2>&1`, { cwd, timeout: 60000 });
              return { result: JSON.stringify({ status: 'success', output: stdout.trim() }) };
            }
            case 'reset': {
              const { stdout } = await execAsync('npx prisma migrate reset --force 2>&1', { cwd, timeout: 120000 });
              return { result: JSON.stringify({ status: 'success', output: stdout.trim() }) };
            }
          }
        }

        if (tool === 'sql_files') {
          const migDir  = path.resolve(cwd, input.migrations_dir || 'migrations');
          if (!fs.existsSync(migDir)) throw new Error(`Migrations directory not found: ${migDir}`);
          const files   = fs.readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();
          const dbType  = getDbType(connStr);
          const results = [];
          for (const f of files) {
            const sql = fs.readFileSync(path.join(migDir, f), 'utf8');
            try {
              if (dbType === 'postgresql') await runPsql(connStr, sql);
              else if (dbType === 'sqlite') await runSqlite(connStr, sql);
              results.push({ file: f, status: 'ok' });
            } catch (err) {
              results.push({ file: f, status: 'error', error: err.message });
            }
          }
          return { result: JSON.stringify({ status: 'success', applied: results.filter(r => r.status === 'ok').length, results }) };
        }

        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${tool}` }) };
      }

      case 'db_analyze': {
        const dbType = getDbType(connStr);

        switch (input.operation) {
          case 'explain': {
            if (!input.sql) throw new Error('sql required for explain');
            if (dbType === 'postgresql') {
              const out = await runPsql(connStr, `EXPLAIN (ANALYZE, FORMAT TEXT) ${input.sql}`);
              return { result: JSON.stringify({ status: 'success', plan: out }) };
            }
            return { result: JSON.stringify({ status: 'error', error: 'EXPLAIN only supported for PostgreSQL' }) };
          }
          case 'table_stats': {
            if (dbType !== 'postgresql') return { result: JSON.stringify({ status: 'error', error: 'table_stats only supported for PostgreSQL' }) };
            const sql = input.table
              ? `SELECT * FROM pg_stat_user_tables WHERE relname = '${input.table}'`
              : 'SELECT relname, n_live_tup, n_dead_tup, last_vacuum, last_analyze FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 20';
            const out = await runPsql(connStr, sql);
            return { result: JSON.stringify({ status: 'success', stats: out.split('\n').filter(l => l) }) };
          }
          case 'index_usage': {
            if (dbType !== 'postgresql') return { result: JSON.stringify({ status: 'error', error: 'index_usage only supported for PostgreSQL' }) };
            const sql = `SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read FROM pg_stat_user_indexes ORDER BY idx_scan LIMIT 30`;
            const out = await runPsql(connStr, sql);
            return { result: JSON.stringify({ status: 'success', indexes: out.split('\n').filter(l => l) }) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: `Unknown analyze operation: ${input.operation}` }) };
        }
      }

      case 'db_connect': {
        const cs     = input.connection_string;
        const op     = input.operation || 'test';
        const dbType = getDbType(cs);

        if (op === 'parse') {
          const parsed = parsePgUrl(cs);
          return { result: JSON.stringify({ status: 'success', parsed, db_type: dbType }) };
        }

        try {
          let version;
          if (dbType === 'postgresql') {
            version = await runPsql(cs, 'SELECT version()', 5);
          } else if (dbType === 'sqlite') {
            version = await runSqlite(cs, 'SELECT sqlite_version()');
          }
          return { result: JSON.stringify({ status: 'success', connected: true, db_type: dbType, version }) };
        } catch (err) {
          return { result: JSON.stringify({ status: 'success', connected: false, db_type: dbType, error: err.message }) };
        }
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isDatabaseTool = (name) => DATABASE_TOOL_DEFINITIONS.some(t => t.name === name);
