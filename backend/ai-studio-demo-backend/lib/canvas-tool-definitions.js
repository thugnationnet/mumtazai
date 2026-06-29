/**
 * CANVAS TOOL DEFINITIONS
 *
 * Backend defines tools → LLM decides which to use → Backend executes
 *
 * These are the tools available to the canvas IDE agent.
 * They use Anthropic's tool_use format (with input_schema).
 * OpenAI-compatible format is derived via getCanvasToolsForOpenAI().
 */

// =============================================================================
// TOOL DEFINITIONS (Anthropic format — the source of truth)
// =============================================================================

export const CANVAS_TOOLS = [
  // ─── FILE SYSTEM ───
  {
    name: 'canvas_file_create',
    description:
      'Create a new file in the canvas project. If the file already exists, it overwrites it. Use this to generate new code files (HTML, CSS, JS, TSX, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'File path relative to project root, e.g. "/index.html", "/src/App.tsx", "/styles.css"',
        },
        content: { type: 'string', description: 'Complete file content' },
        language: {
          type: 'string',
          description:
            'File language (html, css, javascript, typescript, tsx, jsx, json, python, go, java, php, c, cpp, bash, sql, ruby, rust, yaml, markdown)',
          default: 'plaintext',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'canvas_file_edit',
    description:
      'Edit an existing file in the canvas project. Replace the full content or apply a targeted diff. Prefer this over file_create when modifying existing files.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path of the file to edit' },
        content: {
          type: 'string',
          description: 'Complete new file content (full replacement)',
        },
        diff: {
          type: 'array',
          description:
            'Targeted diff hunks (preferred over full replacement for small changes)',
          items: {
            type: 'object',
            properties: {
              startLine: {
                type: 'number',
                description: 'Start line (1-based) in the original file',
              },
              deleteCount: {
                type: 'number',
                description: 'Number of lines to delete from startLine',
              },
              insert: {
                type: 'array',
                items: { type: 'string' },
                description: 'Lines to insert at startLine',
              },
            },
            required: ['startLine', 'deleteCount', 'insert'],
          },
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'canvas_file_delete',
    description: 'Delete a file from the canvas project.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path of the file to delete' },
      },
      required: ['path'],
    },
  },
  {
    name: 'canvas_file_rename',
    description: 'Rename or move a file within the canvas project.',
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Current file path' },
        to: { type: 'string', description: 'New file path' },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'canvas_file_read',
    description:
      'Read the contents of a file in the canvas project. Use this to understand existing code before making changes.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path of the file to read' },
      },
      required: ['path'],
    },
  },
  {
    name: 'canvas_file_copy',
    description:
      'Copy a file to a new path within the canvas project. The original file is preserved.',
    input_schema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Path of the file to copy' },
        destination: { type: 'string', description: 'New path for the copy' },
      },
      required: ['source', 'destination'],
    },
  },
  {
    name: 'canvas_list_directory',
    description:
      'List all files and folders at a specific path in the canvas project. Returns file names, sizes, and types. Use to understand the project structure.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path to list (defaults to root "/")',
          default: '/',
        },
        recursive: {
          type: 'boolean',
          description: 'If true, list all files recursively under the path',
          default: false,
        },
      },
    },
  },

  // ─── FILE SYSTEM (Extended — direct-import from agent-tools-service) ───
  {
    name: 'canvas_write_file',
    description:
      'Write/overwrite a file (upsert). Creates the file if it does not exist, overwrites if it does. Unlike canvas_file_create which errors on existing files, this always succeeds.',
    input_schema: {
      type: 'object',
      properties: {
        filename: { type: 'string', description: 'File name or path' },
        content: { type: 'string', description: 'File content to write' },
        folder: { type: 'string', description: 'Optional folder path', default: '' },
      },
      required: ['filename', 'content'],
    },
  },
  {
    name: 'canvas_create_folder',
    description:
      'Create a new directory/folder in the project. Creates parent directories as needed.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Folder path to create (e.g. "src/components")' },
      },
      required: ['path'],
    },
  },
  {
    name: 'canvas_list_folders',
    description:
      'List only folders/directories (no files) under a given parent path. Useful for understanding project structure.',
    input_schema: {
      type: 'object',
      properties: {
        folder: { type: 'string', description: 'Parent folder to list (defaults to root)', default: '' },
      },
    },
  },
  {
    name: 'canvas_file_exists',
    description:
      'Check if a file or directory exists at the given path. Returns existence status, type, and basic metadata.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to check for existence' },
      },
      required: ['path'],
    },
  },
  {
    name: 'canvas_get_project_tree',
    description:
      'Get a full directory tree of the project. Returns hierarchical view of all files and folders with sizes. Useful for understanding overall project structure.',
    input_schema: {
      type: 'object',
      properties: {
        folder: { type: 'string', description: 'Root folder to start from (defaults to root)', default: '' },
        max_depth: { type: 'number', description: 'Maximum depth to traverse (default 10)', default: 10 },
      },
    },
  },
  {
    name: 'canvas_move_file',
    description:
      'Move a file from one location to another within the project. The source file is removed after successful move.',
    input_schema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Current file path' },
        destination: { type: 'string', description: 'New file path' },
      },
      required: ['source', 'destination'],
    },
  },
  {
    name: 'canvas_zip_files',
    description:
      'Compress one or more files into a ZIP archive. Simple standalone zip tool — for advanced archive operations use canvas_archive_core.',
    input_schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string' }, description: 'Array of file paths to include in the ZIP' },
        output: { type: 'string', description: 'Output ZIP filename', default: 'archive.zip' },
      },
      required: ['files'],
    },
  },
  {
    name: 'canvas_unzip_files',
    description:
      'Extract a ZIP archive to a destination folder. Simple standalone unzip tool — for advanced archive operations use canvas_archive_core.',
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Path to the ZIP file to extract' },
        destination: { type: 'string', description: 'Destination folder for extracted files', default: '.' },
      },
      required: ['file'],
    },
  },
  {
    name: 'canvas_file_watch',
    description:
      'Watch files for changes and events. Register watchers, check file state, list active watches. Useful for monitoring build outputs or config files.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['watch', 'check', 'list'], description: 'Watch action to perform' },
        path: { type: 'string', description: 'File path to watch or check' },
        events: { type: 'array', items: { type: 'string' }, description: 'Events to watch for (change, rename, etc.)' },
        recursive: { type: 'boolean', description: 'Watch subdirectories recursively', default: false },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_sync_files',
    description:
      'Bidirectional file synchronization between directories. Compare differences, sync files, or check status between source and destination folders.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['compare', 'sync'], description: 'Sync action: compare (diff only) or sync (copy changed files)' },
        source: { type: 'string', description: 'Source directory path' },
        destination: { type: 'string', description: 'Destination directory path' },
        recursive: { type: 'boolean', description: 'Process subdirectories', default: true },
      },
      required: ['action', 'source', 'destination'],
    },
  },

  // ─── CONTENT & MARKDOWN (direct-import from agent-tools-service) ───
  {
    name: 'canvas_markdown_convert',
    description:
      'Convert Markdown to another format: HTML, LaTeX, plain text. Useful for generating documentation or exporting content.',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Markdown content to convert' },
        format: { type: 'string', enum: ['html', 'latex', 'text'], description: 'Target output format' },
      },
      required: ['content', 'format'],
    },
  },
  {
    name: 'canvas_markdown_validate',
    description:
      'Validate Markdown for issues: heading hierarchy, broken links, unclosed code blocks, malformed frontmatter. Returns issues list and document stats.',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Markdown content to validate' },
      },
      required: ['content'],
    },
  },
  {
    name: 'canvas_markdown_generate',
    description:
      'Generate Markdown from templates: README, changelog, API docs, or contributing guidelines. Fills in project data automatically.',
    input_schema: {
      type: 'object',
      properties: {
        template: { type: 'string', enum: ['readme', 'changelog', 'api', 'contributing'], description: 'Template type to generate' },
        data: { type: 'object', description: 'Template data (title, description, features, endpoints, etc.)' },
      },
      required: ['template'],
    },
  },
  {
    name: 'canvas_markdown_toc',
    description:
      'Auto-generate a table of contents from Markdown headings. Returns nested TOC with anchor links.',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Markdown content to generate TOC from' },
        max_depth: { type: 'number', description: 'Maximum heading depth to include (default 4)', default: 4 },
      },
      required: ['content'],
    },
  },
  {
    name: 'canvas_markdown_format',
    description:
      'Format and lint Markdown: normalize whitespace, fix heading spacing, fix list markers, trim trailing spaces, ensure consistent structure.',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Markdown content to format' },
      },
      required: ['content'],
    },
  },
  {
    name: 'canvas_markdown_merge',
    description:
      'Merge multiple Markdown documents into one. Supports custom separators and automatic title injection.',
    input_schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'object', properties: { content: { type: 'string' }, title: { type: 'string' } } }, description: 'Array of markdown documents to merge' },
        separator: { type: 'string', description: 'Separator between merged documents', default: '\n\n---\n\n' },
        addTitles: { type: 'boolean', description: 'Add titles as headings', default: true },
      },
      required: ['files'],
    },
  },
  {
    name: 'canvas_markdown_extract',
    description:
      'Extract structured data from Markdown: headings, links, images, code blocks, frontmatter, tables, or todo/checkbox items.',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Markdown content to extract from' },
        action: { type: 'string', enum: ['headings', 'links', 'images', 'code_blocks', 'frontmatter', 'tables', 'todos'], description: 'What to extract' },
      },
      required: ['content', 'action'],
    },
  },
  {
    name: 'canvas_markdown_slides',
    description:
      'Convert Markdown to presentation slides (Reveal.js HTML). Splits content by --- separators or headings into individual slides.',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Markdown content to convert to slides' },
        format: { type: 'string', enum: ['reveal', 'text'], description: 'Output format', default: 'reveal' },
        separator: { type: 'string', enum: ['hr', 'headings'], description: 'How to split slides', default: 'hr' },
      },
      required: ['content'],
    },
  },

  // ─── ANALYTICS & MONITORING ───
  {
    name: 'canvas_analytics_track',
    description:
      'Track a custom analytics event. Stores event name and data in the PostgreSQL database for later analysis.',
    input_schema: {
      type: 'object',
      properties: {
        eventName: { type: 'string', description: 'Name of the event to track (e.g., "page_view", "button_click")' },
        eventData: { type: 'object', description: 'Additional data/context for the event' },
        visitorId: { type: 'string', description: 'Optional visitor identifier' },
        sessionId: { type: 'string', description: 'Optional session identifier' },
      },
      required: ['eventName'],
    },
  },
  {
    name: 'canvas_analytics_dashboard',
    description:
      'View analytics dashboard with summary stats, top events, user activity, and tool usage over a configurable time range.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['summary', 'tools', 'users'], description: 'Dashboard view', default: 'summary' },
        hours: { type: 'number', description: 'Time range in hours (default 24)', default: 24 },
      },
      required: [],
    },
  },
  {
    name: 'canvas_log_parse',
    description:
      'Parse raw log content to extract errors, warnings, timeline events, and patterns. Returns structured analysis of log data.',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Raw log content to parse' },
      },
      required: ['content'],
    },
  },
  {
    name: 'canvas_monitor_health',
    description:
      'Check system health (database, memory, uptime) or probe an external URL for availability and latency.',
    input_schema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'URL to check (leave empty for internal self-health)' },
      },
      required: [],
    },
  },
  {
    name: 'canvas_telemetry_send',
    description:
      'Send telemetry data to the internal database and optionally to an external endpoint. Tracks service metrics, traces, and spans.',
    input_schema: {
      type: 'object',
      properties: {
        service: { type: 'string', description: 'Service/component name' },
        data: { type: 'object', description: 'Telemetry payload data' },
        environment: { type: 'string', description: 'Environment label (e.g., "production", "staging")' },
        endpoint: { type: 'string', description: 'Optional external endpoint URL to also POST data to' },
      },
      required: ['service'],
    },
  },
  {
    name: 'canvas_analytics_export',
    description:
      'Export analytics events as CSV or JSON. Filter by time range and event name. Useful for external reporting and data analysis.',
    input_schema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['csv', 'json'], description: 'Export format', default: 'json' },
        hours: { type: 'number', description: 'Time range in hours (default 24)', default: 24 },
        eventFilter: { type: 'string', description: 'Filter by event name (substring match)' },
        limit: { type: 'number', description: 'Max rows to export (default 500)', default: 500 },
      },
      required: [],
    },
  },
  {
    name: 'canvas_log_aggregate',
    description:
      'Aggregate log entries by severity, hour, pattern, or source. Returns counts, percentages, and top offenders for monitoring dashboards.',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Raw log content to aggregate' },
        groupBy: { type: 'string', enum: ['severity', 'hour', 'pattern', 'source'], description: 'Aggregation dimension', default: 'severity' },
        topN: { type: 'number', description: 'Number of top entries to return', default: 10 },
      },
      required: ['content'],
    },
  },
  {
    name: 'canvas_metrics_collect',
    description:
      'Collect system performance metrics (CPU, memory, uptime, Node.js info) or store custom named metrics in the database.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['system', 'custom', 'snapshot'], description: 'Metrics type', default: 'system' },
        name: { type: 'string', description: 'Custom metric name (required for action=custom)' },
        value: { type: 'number', description: 'Custom metric value' },
        tags: { type: 'object', description: 'Optional tags/labels' },
      },
      required: ['action'],
    },
  },

  // ─── WORKFLOW & AUTOMATION ───
  {
    name: 'canvas_workflow_create',
    description:
      'Create a multi-step workflow pipeline with conditional branches, parallel execution groups, and step dependencies. Stored in Redis.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Workflow name' },
        steps: { type: 'array', items: { type: 'object' }, description: 'Step definitions [{name, tool, params, onError, condition, parallel_group, dependsOn}]' },
        description: { type: 'string', description: 'Workflow description' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
      },
      required: ['name'],
    },
  },
  {
    name: 'canvas_workflow_execute',
    description:
      'Execute a saved workflow by ID with state tracking. Supports dry-run, start from specific step, and runtime variable injection.',
    input_schema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string', description: 'Workflow ID to execute' },
        dryRun: { type: 'boolean', description: 'Validate steps without executing', default: false },
        startStep: { type: 'number', description: 'Step index to start from', default: 0 },
        variables: { type: 'object', description: 'Runtime variables to inject into step params' },
      },
      required: ['workflowId'],
    },
  },
  {
    name: 'canvas_workflow_schedule',
    description:
      'Schedule workflow execution — cron-based recurring, event-triggered, or one-time at a specific date. Manage active schedules.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'list', 'delete', 'pause', 'resume'], description: 'Schedule management action' },
        workflowId: { type: 'string', description: 'Workflow ID to schedule' },
        cron: { type: 'string', description: 'Cron expression (e.g., "0 */6 * * *")' },
        event: { type: 'string', description: 'Event trigger name' },
        runAt: { type: 'string', description: 'ISO date for one-time execution' },
        scheduleId: { type: 'string', description: 'Schedule ID (for delete/pause/resume)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_workflow_visualize',
    description:
      'Generate DAG visualization of a workflow showing steps, dependencies, parallel groups, and status. Outputs Mermaid, ASCII, or JSON graph.',
    input_schema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string', description: 'Workflow ID to visualize' },
        format: { type: 'string', enum: ['mermaid', 'ascii', 'json'], description: 'Output format', default: 'mermaid' },
      },
      required: ['workflowId'],
    },
  },
  {
    name: 'canvas_workflow_optimize',
    description:
      'Analyze a workflow and suggest optimizations — parallelization, redundancy removal, batching, error handling improvements.',
    input_schema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string', description: 'Workflow ID to analyze' },
        focus: { type: 'string', enum: ['speed', 'cost', 'reliability', 'all'], description: 'Optimization focus', default: 'all' },
      },
      required: ['workflowId'],
    },
  },
  {
    name: 'canvas_workflow_template',
    description:
      'Browse and apply pre-built workflow templates (CI/CD, data pipeline, security audit, monitoring, code review) or create custom templates.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'get', 'create', 'apply'], description: 'Template action' },
        templateId: { type: 'string', description: 'Template ID to get/apply' },
        name: { type: 'string', description: 'Custom template name' },
        steps: { type: 'array', items: { type: 'object' }, description: 'Steps for custom template' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_workflow_history',
    description:
      'View workflow execution history — past runs with timing, status, step results. Supports replay of previous executions.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'get', 'replay', 'clear'], description: 'History action' },
        workflowId: { type: 'string', description: 'Filter by workflow ID' },
        executionId: { type: 'string', description: 'Specific execution ID' },
        limit: { type: 'number', description: 'Max entries to return', default: 20 },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_workflow_validate',
    description:
      'Validate a workflow definition — check for missing tools, circular/forward dependencies, unreachable steps, and configuration issues.',
    input_schema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string', description: 'Workflow ID to validate' },
        steps: { type: 'array', items: { type: 'object' }, description: 'Inline steps to validate (alternative to workflowId)' },
        strict: { type: 'boolean', description: 'Strict mode — also warn on best practice violations', default: false },
      },
      required: [],
    },
  },

  // ─── KNOWLEDGE GRAPH ───
  {
    name: 'canvas_kg_create',
    description: 'Create entities and relationships in a knowledge graph. Supports typed nodes (person, concept, document) and weighted directed edges.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['entity', 'relationship', 'batch'], description: 'Create entity, relationship, or batch import' },
        entity: { type: 'object', description: 'Entity: {id, type, name, properties}' },
        relationship: { type: 'object', description: 'Relationship: {from, to, type, weight, properties}' },
        batch: { type: 'array', items: { type: 'object' }, description: 'Array of entities/relationships for batch creation' },
        graphId: { type: 'string', description: 'Graph ID (auto-created if omitted)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_kg_query',
    description: 'Query the knowledge graph — traverse relationships, find paths, semantic search, neighborhood exploration, and pattern matching.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['get', 'neighbors', 'path', 'search', 'pattern', 'subgraph'], description: 'Query type' },
        entityId: { type: 'string', description: 'Entity ID (for get/neighbors)' },
        from: { type: 'string', description: 'Start entity (for path)' },
        to: { type: 'string', description: 'End entity (for path)' },
        query: { type: 'string', description: 'Search term (for search)' },
        depth: { type: 'number', description: 'Traversal depth (default 2)', default: 2 },
        entityType: { type: 'string', description: 'Filter by entity type' },
        relationshipType: { type: 'string', description: 'Filter by relationship type' },
        graphId: { type: 'string', description: 'Graph ID' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_kg_visualize',
    description: 'Generate a visual rendering of the knowledge graph — Mermaid diagram, ASCII art, or JSON graph for D3/Cytoscape.',
    input_schema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['mermaid', 'ascii', 'json', 'dot'], description: 'Output format', default: 'mermaid' },
        graphId: { type: 'string', description: 'Graph ID' },
        entityType: { type: 'string', description: 'Filter nodes by type' },
        relationshipType: { type: 'string', description: 'Filter edges by type' },
        maxNodes: { type: 'number', description: 'Max nodes to render', default: 50 },
        centerEntity: { type: 'string', description: 'Center graph around this entity' },
      },
      required: [],
    },
  },
  {
    name: 'canvas_kg_merge',
    description: 'Deduplicate entities by merging similar nodes — fuzzy name matching, property consolidation, and relationship reassignment.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['detect', 'merge', 'auto'], description: 'Detect duplicates, merge pair, or auto-merge all' },
        entityId1: { type: 'string', description: 'First entity ID (for merge)' },
        entityId2: { type: 'string', description: 'Second entity ID (for merge)' },
        threshold: { type: 'number', description: 'Similarity threshold 0-1 (default 0.8)', default: 0.8 },
        graphId: { type: 'string', description: 'Graph ID' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_kg_reason',
    description: 'Run inference over the knowledge graph — transitive closure, contradiction detection, classification, and relationship completion.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['infer', 'transitive', 'contradict', 'classify', 'complete'], description: 'Reasoning type' },
        entityId: { type: 'string', description: 'Entity to reason about' },
        relationshipType: { type: 'string', description: 'Relationship type for transitivity' },
        graphId: { type: 'string', description: 'Graph ID' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_kg_import',
    description: 'Bulk import entities and relationships from structured data — JSON, CSV, or RDF/Turtle triples format.',
    input_schema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['json', 'csv', 'triples'], description: 'Input data format' },
        data: { type: 'string', description: 'Raw data to import' },
        graphId: { type: 'string', description: 'Target graph ID' },
        merge: { type: 'boolean', description: 'Merge into existing graph', default: false },
      },
      required: ['format', 'data'],
    },
  },
  {
    name: 'canvas_kg_export',
    description: 'Export the knowledge graph in standard formats — JSON-LD, RDF/Turtle, CSV, or raw JSON.',
    input_schema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['json', 'json-ld', 'turtle', 'csv'], description: 'Export format', default: 'json' },
        graphId: { type: 'string', description: 'Graph ID to export' },
        entityType: { type: 'string', description: 'Filter exported entities by type' },
      },
      required: ['graphId'],
    },
  },
  {
    name: 'canvas_kg_stats',
    description: 'Get knowledge graph statistics — counts, type distributions, density, clustering, connected components, and degree analysis.',
    input_schema: {
      type: 'object',
      properties: {
        graphId: { type: 'string', description: 'Graph ID' },
        detailed: { type: 'boolean', description: 'Include detailed per-type breakdown', default: false },
      },
      required: ['graphId'],
    },
  },

  // ─── GROWTH & MARKETING ───
  {
    name: 'canvas_growth_analyze',
    description: 'Analyze growth metrics — funnel conversion, churn detection, retention curves, engagement scoring, and conversion optimization.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['funnel', 'churn', 'retention', 'engagement', 'conversion'], description: 'Analysis type' },
        data: { type: 'object', description: 'Input data (stages for funnel, users for churn, cohort for retention)' },
        options: { type: 'object', description: 'Additional options (timeframe, segments, etc.)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_pricing_simulate',
    description: 'Simulate pricing strategies — model tiers, forecast revenue, compare plans, analyze price elasticity, and optimize pricing.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['model', 'forecast', 'compare', 'elasticity', 'optimize'], description: 'Simulation type' },
        plans: { type: 'array', description: 'Pricing plan definitions', items: { type: 'object' } },
        params: { type: 'object', description: 'Simulation parameters (months, growth rate, churn, etc.)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_ab_test_run',
    description: 'Manage A/B test experiments — create, start, pause, stop, check status, and list experiments.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'start', 'pause', 'stop', 'status', 'list'], description: 'Experiment action' },
        experimentId: { type: 'string', description: 'Experiment ID (auto-generated for create)' },
        name: { type: 'string', description: 'Experiment name (for create)' },
        variants: { type: 'array', description: 'Variant definitions', items: { type: 'object' } },
        trafficSplit: { type: 'object', description: 'Traffic allocation per variant' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_ab_test_analyze',
    description: 'Analyze A/B test results — frequentist significance, Bayesian analysis, summary, timeline, and segment breakdown.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['significance', 'bayesian', 'summary', 'timeline', 'segment'], description: 'Analysis type' },
        experimentId: { type: 'string', description: 'Experiment ID to analyze' },
        data: { type: 'object', description: 'Result data (visitors, conversions per variant)' },
        confidenceLevel: { type: 'number', description: 'Confidence threshold (default 0.95)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_lead_enrich',
    description: 'Enrich and score leads — add company/social/firmographic data, score leads, segment, deduplicate, and validate emails.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['enrich', 'score', 'segment', 'dedupe', 'validate'], description: 'Enrichment action' },
        leads: { type: 'array', description: 'Lead records to process', items: { type: 'object' } },
        rules: { type: 'object', description: 'Scoring/segmentation rules' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_campaign_generate',
    description: 'Generate marketing campaigns — email copy, ad creatives, social posts, landing pages, multi-channel plans, and drip sequences.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['email', 'ad', 'social', 'landing_page', 'multi_channel', 'sequence'], description: 'Campaign type' },
        product: { type: 'string', description: 'Product/service name' },
        audience: { type: 'string', description: 'Target audience description' },
        tone: { type: 'string', description: 'Brand tone (professional, casual, urgent, etc.)' },
        goal: { type: 'string', description: 'Campaign goal (awareness, conversion, retention, etc.)' },
      },
      required: ['action', 'product'],
    },
  },
  {
    name: 'canvas_cohort_analyze',
    description: 'Analyze user cohorts — retention tables, LTV calculation, behavior segmentation, and source comparison.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['retention', 'ltv', 'behavior', 'compare'], description: 'Analysis type' },
        cohorts: { type: 'array', description: 'Cohort data (users grouped by signup period)', items: { type: 'object' } },
        periods: { type: 'number', description: 'Number of periods to analyze (default 12)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_funnel_optimize',
    description: 'Optimize conversion funnels — analyze drop-offs, generate recommendations, simulate improvements, and benchmark against industry.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['analyze', 'recommend', 'simulate', 'benchmark'], description: 'Optimization action' },
        funnel: { type: 'object', description: 'Funnel data (stages with visitor counts)' },
        industry: { type: 'string', description: 'Industry for benchmarks (saas, ecommerce, fintech, marketplace)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_attribution_model',
    description: 'Model marketing attribution — first/last touch, linear, time-decay, U-shaped, compare models, calculate ROI, and analyze paths.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['attribute', 'compare', 'roi', 'path_analysis'], description: 'Attribution action' },
        journeys: { type: 'array', description: 'Customer journey data (touchpoints with channels)', items: { type: 'object' } },
        model: { type: 'string', enum: ['first_touch', 'last_touch', 'linear', 'time_decay', 'u_shaped'], description: 'Attribution model' },
        spend: { type: 'object', description: 'Channel spend data for ROI calculation' },
      },
      required: ['action'],
    },
  },

  // ─── COLLABORATION & TEAM ───
  {
    name: 'canvas_team_invite',
    description: 'Manage team invitations — send invites, list pending, accept, reject, revoke, and set roles on invite.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['send', 'list', 'accept', 'reject', 'revoke', 'resend'], description: 'Invitation action' },
        email: { type: 'string', description: 'Email to invite' },
        role: { type: 'string', enum: ['owner', 'admin', 'editor', 'viewer', 'guest'], description: 'Role to assign', default: 'editor' },
        teamId: { type: 'string', description: 'Team/workspace ID' },
        inviteId: { type: 'string', description: 'Invitation ID (for accept/reject/revoke)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_role_assign',
    description: 'RBAC permission management — assign roles, check permissions, list members, create/delete custom roles.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['assign', 'revoke', 'check', 'list_members', 'list_roles', 'create_role', 'delete_role'], description: 'RBAC action' },
        userId: { type: 'string', description: 'User ID' },
        role: { type: 'string', description: 'Role name' },
        resource: { type: 'string', description: 'Resource identifier' },
        permissions: { type: 'array', items: { type: 'string' }, description: 'Permission list for custom roles' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_comment_thread',
    description: 'Contextual discussions on files/code — create threads, reply, resolve, reopen, list, and manage annotations.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'reply', 'resolve', 'reopen', 'list', 'delete', 'edit'], description: 'Thread action' },
        threadId: { type: 'string', description: 'Thread ID' },
        file: { type: 'string', description: 'File path' },
        line: { type: 'number', description: 'Line number' },
        body: { type: 'string', description: 'Comment body (Markdown)' },
        mentions: { type: 'array', items: { type: 'string' }, description: '@mentions' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_task_assign',
    description: 'Lightweight task management — create, assign, update status, complete, list, and track workload.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'assign', 'update', 'complete', 'list', 'delete', 'workload'], description: 'Task action' },
        taskId: { type: 'string', description: 'Task ID' },
        title: { type: 'string', description: 'Task title' },
        assignee: { type: 'string', description: 'Assignee' },
        priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'], description: 'Priority' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done', 'blocked'], description: 'Status' },
        deadline: { type: 'string', description: 'Deadline (ISO date)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_approval_flow',
    description: 'Multi-step approval workflows — create chains, submit, approve/reject steps, escalate, and track progress.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'submit', 'approve', 'reject', 'escalate', 'status', 'list', 'cancel'], description: 'Approval action' },
        flowId: { type: 'string', description: 'Flow ID' },
        name: { type: 'string', description: 'Flow name' },
        steps: { type: 'array', items: { type: 'object' }, description: 'Approval steps' },
        reason: { type: 'string', description: 'Approval/rejection reason' },
        resource: { type: 'string', description: 'Resource being approved' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_activity_log',
    description: 'Team activity feed — log actions, query history, generate reports, and export audit trail.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['log', 'query', 'report', 'export', 'clear'], description: 'Log action' },
        event: { type: 'string', description: 'Event type' },
        actor: { type: 'string', description: 'Actor user ID' },
        target: { type: 'string', description: 'Target resource' },
        timeRange: { type: 'string', enum: ['1h', '24h', '7d', '30d', '90d'], description: 'Time range' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_access_audit',
    description: 'Access review and compliance — audit access, detect anomalies, check policy compliance, and generate reports.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['audit', 'review', 'anomaly', 'compliance', 'enforce', 'report'], description: 'Audit action' },
        scope: { type: 'string', enum: ['team', 'project', 'resource', 'user'], description: 'Audit scope' },
        targetId: { type: 'string', description: 'Scope target ID' },
        policy: { type: 'string', enum: ['least_privilege', 'separation_of_duties', 'mfa_required', 'session_timeout'], description: 'Policy' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_notify_team',
    description: 'Team notifications — send alerts, broadcast announcements, schedule reminders, and manage notification queue.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['send', 'broadcast', 'remind', 'schedule', 'list', 'cancel'], description: 'Notification action' },
        channel: { type: 'string', enum: ['email', 'in_app', 'slack', 'webhook', 'all'], description: 'Channel', default: 'in_app' },
        recipients: { type: 'array', items: { type: 'string' }, description: 'Recipient IDs' },
        title: { type: 'string', description: 'Title' },
        body: { type: 'string', description: 'Body' },
        priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], description: 'Priority' },
      },
      required: ['action'],
    },
  },

  // ─── AI ORCHESTRATION ───
  {
    name: 'canvas_llm_router',
    description: 'LLM routing — intelligently select models based on task type, priority (quality/speed/cost), compare models, and run benchmarks.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['route', 'recommend', 'compare', 'benchmark', 'list_models'], description: 'Router action' },
        taskType: { type: 'string', enum: ['code', 'creative', 'analysis', 'chat', 'translation', 'summarization', 'reasoning', 'math', 'general'], description: 'Task type for routing' },
        priority: { type: 'string', enum: ['quality', 'speed', 'cost', 'balanced'], description: 'Routing priority' },
        models: { type: 'array', items: { type: 'string' }, description: 'Models to compare' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_llm_cost_optimize',
    description: 'LLM cost optimization — estimate token costs, find cheapest models, track spend, set budgets, and get cost-saving suggestions.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['estimate', 'cheapest', 'track', 'budget', 'report', 'suggest'], description: 'Cost action' },
        prompt: { type: 'string', description: 'Prompt for cost estimation' },
        model: { type: 'string', description: 'Model ID' },
        budget: { type: 'number', description: 'Budget limit' },
        taskType: { type: 'string', description: 'Task type for cheapest model lookup' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_llm_guardrail',
    description: 'LLM guardrails — detect prompt injections, validate inputs, enforce policies, sanitize outputs, and log violations.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['detect_injection', 'validate_input', 'enforce_policy', 'sanitize_output', 'log_violation', 'scan'], description: 'Guardrail action' },
        text: { type: 'string', description: 'Text to analyze/sanitize' },
        policy: { type: 'string', enum: ['strict', 'moderate', 'permissive'], description: 'Policy level' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_llm_evaluate',
    description: 'LLM evaluation — grade responses on criteria, compare model outputs, run test suites, benchmark models, and generate feedback.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['grade', 'compare', 'suite', 'benchmark', 'rubric', 'feedback'], description: 'Evaluation action' },
        response: { type: 'string', description: 'Response to evaluate' },
        prompt: { type: 'string', description: 'Original prompt for relevance check' },
        criteria: { type: 'array', items: { type: 'string' }, description: 'Criteria to evaluate' },
        responses: { type: 'array', items: { type: 'object' }, description: 'Multiple responses to compare' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_agent_spawn',
    description: 'Agent spawning — create goal-based sub-agents, check status, collect results, terminate, and list all spawned agents.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['spawn', 'status', 'collect', 'terminate', 'list'], description: 'Spawn action' },
        goal: { type: 'string', description: 'Goal for the sub-agent' },
        model: { type: 'string', description: 'Model for the sub-agent' },
        agentId: { type: 'string', description: 'Agent ID for status/collect/terminate' },
        tools: { type: 'array', items: { type: 'string' }, description: 'Tools available to sub-agent' },
        maxSteps: { type: 'number', description: 'Max execution steps' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_agent_reflect',
    description: 'Agent self-reflection — assess output quality, critique responses, suggest improvements, score dimensions, and review history.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['reflect', 'critique', 'improve', 'score', 'history'], description: 'Reflection action' },
        output: { type: 'string', description: 'Output to reflect on' },
        task: { type: 'string', description: 'Original task description' },
        criteria: { type: 'array', items: { type: 'string' }, description: 'Criteria for reflection' },
        depth: { type: 'number', description: 'Reflection depth 1-3' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_llm_fallback',
    description: 'LLM fallback chains — create ordered model sequences for reliability, execute with automatic failover, and track stats.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create_chain', 'execute', 'status', 'update', 'list', 'stats'], description: 'Fallback action' },
        chainId: { type: 'string', description: 'Chain ID' },
        models: { type: 'array', items: { type: 'string' }, description: 'Ordered fallback models' },
        retryCount: { type: 'number', description: 'Retries per model' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_llm_cache',
    description: 'LLM response caching — cache prompt/response pairs with TTL, check cache hits, manage policies, and track savings.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['get', 'set', 'invalidate', 'stats', 'policy', 'clear'], description: 'Cache action' },
        key: { type: 'string', description: 'Cache key' },
        prompt: { type: 'string', description: 'Prompt to derive key from' },
        response: { type: 'string', description: 'Response to cache' },
        ttl: { type: 'number', description: 'TTL in seconds' },
        model: { type: 'string', description: 'Model ID for filtering' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_agent_handoff',
    description: 'Agent handoff — transfer context between agents, accept/reject handoffs, track history, and rollback transfers.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['handoff', 'accept', 'reject', 'status', 'history', 'rollback'], description: 'Handoff action' },
        toAgent: { type: 'string', description: 'Target agent ID' },
        handoffId: { type: 'string', description: 'Handoff ID' },
        reason: { type: 'string', description: 'Reason for handoff/rejection' },
        context: { type: 'object', description: 'Context to transfer' },
        preserveHistory: { type: 'boolean', description: 'Preserve conversation history' },
      },
      required: ['action'],
    },
  },

  // ─── DATA SCIENCE & ML ───
  {
    name: 'canvas_data_profile',
    description: 'Data quality profiling — analyze schema, detect types, compute stats, find nulls/duplicates/outliers, correlations, and quality reports.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['profile', 'schema', 'statistics', 'quality', 'correlations', 'report'], description: 'Profiling action' },
        data: { type: 'array', items: { type: 'object' }, description: 'Dataset rows [{col1: val1, ...}]' },
        columns: { type: 'array', items: { type: 'string' }, description: 'Columns to profile' },
        thresholds: { type: 'object', description: 'Quality thresholds' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_data_clean',
    description: 'Data cleaning — handle nulls, remove duplicates, fix outliers, normalize/standardize, type coercion, auto-clean pipelines.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['drop_nulls', 'fill_nulls', 'remove_duplicates', 'fix_outliers', 'normalize', 'standardize', 'coerce_types', 'auto_clean'], description: 'Cleaning action' },
        data: { type: 'array', items: { type: 'object' }, description: 'Dataset rows' },
        columns: { type: 'array', items: { type: 'string' }, description: 'Target columns' },
        strategy: { type: 'string', enum: ['mean', 'median', 'mode', 'zero', 'forward_fill', 'interpolate', 'drop'], description: 'Fill strategy' },
        method: { type: 'string', enum: ['minmax', 'zscore', 'robust', 'log', 'cap', 'remove', 'winsorize'], description: 'Method' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_data_visualize',
    description: 'Data visualization — generate bar, line, pie, scatter, heatmap, treemap, funnel, gauge charts with auto insights.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['bar', 'line', 'pie', 'scatter', 'heatmap', 'treemap', 'funnel', 'gauge', 'table'], description: 'Chart type' },
        data: { type: 'object', description: 'Chart data {labels, values, datasets}' },
        title: { type: 'string', description: 'Chart title' },
        format: { type: 'string', enum: ['json', 'svg', 'mermaid', 'ascii', 'markdown'], description: 'Output format' },
      },
      required: ['type'],
    },
  },
  {
    name: 'canvas_feature_engineer',
    description: 'Feature engineering — derived features, binning, encoding (one-hot/label/frequency), date features, polynomials, interaction terms, importance ranking.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['derive', 'bin', 'encode', 'date_features', 'polynomial', 'interaction', 'importance', 'auto_features', 'select'], description: 'Feature action' },
        data: { type: 'array', items: { type: 'object' }, description: 'Dataset rows' },
        columns: { type: 'array', items: { type: 'string' }, description: 'Source columns' },
        expression: { type: 'string', description: 'Derivation expression' },
        encoding: { type: 'string', enum: ['one_hot', 'label', 'target', 'frequency', 'binary'], description: 'Encoding strategy' },
        target: { type: 'string', description: 'Target column' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_model_compare',
    description: 'Compare ML models — train, cross-validate, compare accuracy/F1/AUC/RMSE, rank by metric, generate reports.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['compare', 'train', 'evaluate', 'rank', 'report', 'cross_validate'], description: 'Comparison action' },
        models: { type: 'array', items: { type: 'string' }, description: 'Model types to compare' },
        data: { type: 'array', items: { type: 'object' }, description: 'Training data' },
        target: { type: 'string', description: 'Target column' },
        metrics: { type: 'array', items: { type: 'string' }, description: 'Metrics: accuracy, f1, auc, rmse, mae, r2' },
        folds: { type: 'number', description: 'Cross-validation folds' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_data_transform',
    description: 'Data transformations — pivot/unpivot, group-by aggregations, join/merge, sort, filter, sample, reshape wide/long.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['pivot', 'unpivot', 'group_by', 'join', 'sort', 'filter', 'sample', 'reshape', 'rename', 'cast'], description: 'Transform action' },
        data: { type: 'array', items: { type: 'object' }, description: 'Dataset rows' },
        columns: { type: 'array', items: { type: 'string' }, description: 'Columns' },
        groupBy: { type: 'array', items: { type: 'string' }, description: 'Group-by columns' },
        aggregations: { type: 'object', description: 'Aggregation map {col: "sum"|"mean"|"count"|"min"|"max"}' },
        joinData: { type: 'array', items: { type: 'object' }, description: 'Join data' },
        joinOn: { type: 'string', description: 'Join key' },
        condition: { type: 'string', description: 'Filter condition' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_data_pipeline',
    description: 'Data pipeline management — define multi-step ETL pipelines, execute steps, validate, schedule, track data lineage.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'add_step', 'execute', 'validate', 'status', 'list', 'schedule', 'lineage'], description: 'Pipeline action' },
        pipelineId: { type: 'string', description: 'Pipeline ID' },
        name: { type: 'string', description: 'Pipeline name' },
        step: { type: 'object', description: 'Step definition {tool, action, params}' },
        data: { type: 'array', items: { type: 'object' }, description: 'Input data' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_model_explain',
    description: 'Model explainability — SHAP-style feature importance, partial dependence, decision paths, what-if analysis, bias detection, fairness audit.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['feature_importance', 'partial_dependence', 'decision_path', 'what_if', 'bias_detect', 'fairness_audit', 'summary'], description: 'Explainability action' },
        modelId: { type: 'string', description: 'Model ID' },
        data: { type: 'array', items: { type: 'object' }, description: 'Dataset' },
        features: { type: 'array', items: { type: 'string' }, description: 'Features to analyze' },
        protectedAttribute: { type: 'string', description: 'Protected attribute for bias/fairness' },
      },
      required: ['action'],
    },
  },

  // ─── GEOSPATIAL ───
  {
    name: 'canvas_geo_geocode',
    description: 'Forward & reverse geocode addresses and coordinates. Convert addresses to lat/lng, coordinates to addresses, batch geocode, validate, autocomplete.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['forward', 'reverse', 'batch', 'validate', 'autocomplete'], description: 'Geocoding action' },
        address: { type: 'string', description: 'Address string' },
        lat: { type: 'number', description: 'Latitude' },
        lng: { type: 'number', description: 'Longitude' },
        addresses: { type: 'array', items: { type: 'string' }, description: 'Addresses for batch' },
        country: { type: 'string', description: 'Country code filter' },
        language: { type: 'string', description: 'Result language' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_geo_route',
    description: 'Route planning: directions, optimize stop order, alternatives, ETA, distance matrix, isochrones.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['directions', 'optimize', 'alternatives', 'eta', 'matrix', 'isochrone'], description: 'Routing action' },
        origin: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' }, address: { type: 'string' } }, description: 'Start point' },
        destination: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' }, address: { type: 'string' } }, description: 'End point' },
        waypoints: { type: 'array', items: { type: 'object' }, description: 'Intermediate stops' },
        mode: { type: 'string', enum: ['driving', 'walking', 'cycling', 'transit'], description: 'Travel mode' },
        minutes: { type: 'number', description: 'Minutes for isochrone' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_geo_distance',
    description: 'Distance/geometry: haversine/vincenty between points, distance matrix, polygon area, point-in-polygon, nearest neighbor, bearing.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['between', 'matrix', 'area', 'contains', 'nearest', 'bearing'], description: 'Distance action' },
        point1: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } }, description: 'First point' },
        point2: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } }, description: 'Second point' },
        points: { type: 'array', items: { type: 'object' }, description: 'Array of points' },
        polygon: { type: 'array', items: { type: 'object' }, description: 'Polygon vertices' },
        point: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } }, description: 'Query point' },
        unit: { type: 'string', enum: ['km', 'mi', 'nm', 'm'], description: 'Unit' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_geo_fence',
    description: 'Geofencing: create circle/polygon/rect fences, check membership, nearby fences, enter/exit triggers, batch check.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'check', 'nearby', 'list', 'delete', 'trigger', 'batch_check'], description: 'Geofence action' },
        fenceId: { type: 'string', description: 'Fence ID' },
        name: { type: 'string', description: 'Fence name' },
        type: { type: 'string', enum: ['circle', 'polygon', 'rectangle'], description: 'Geometry type' },
        center: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } }, description: 'Circle center' },
        radius: { type: 'number', description: 'Radius in meters' },
        vertices: { type: 'array', items: { type: 'object' }, description: 'Polygon vertices' },
        point: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } }, description: 'Check point' },
        points: { type: 'array', items: { type: 'object' }, description: 'Batch check points' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_geo_search',
    description: 'Place/POI search: nearby places, text search, place details, autocomplete, categories, trending venues.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['nearby', 'search', 'details', 'autocomplete', 'categories', 'trending'], description: 'Search action' },
        query: { type: 'string', description: 'Search query' },
        location: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } }, description: 'Search center' },
        radius: { type: 'number', description: 'Radius in meters' },
        category: { type: 'string', enum: ['restaurant', 'hotel', 'gas_station', 'hospital', 'pharmacy', 'school', 'park', 'museum', 'airport', 'bank', 'shopping', 'gym'], description: 'Category' },
        placeId: { type: 'string', description: 'Place ID' },
        limit: { type: 'number', description: 'Max results' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_geo_timezone',
    description: 'Timezone ops: lookup by coords, convert between zones, UTC offset, DST status, list/info.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['lookup', 'convert', 'offset', 'dst', 'list', 'info'], description: 'Timezone action' },
        lat: { type: 'number', description: 'Latitude' },
        lng: { type: 'number', description: 'Longitude' },
        timezone: { type: 'string', description: 'Timezone name' },
        fromTimezone: { type: 'string', description: 'Source timezone' },
        toTimezone: { type: 'string', description: 'Target timezone' },
        datetime: { type: 'string', description: 'ISO datetime' },
        region: { type: 'string', description: 'Region filter' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_geo_elevation',
    description: 'Elevation data: point, path profiles, area min/max, slope/grade, terrain classification, batch.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['point', 'path', 'area', 'slope', 'terrain', 'batch'], description: 'Elevation action' },
        lat: { type: 'number', description: 'Latitude' },
        lng: { type: 'number', description: 'Longitude' },
        points: { type: 'array', items: { type: 'object' }, description: 'Points for path/batch' },
        bounds: { type: 'object', description: 'Bounding box for area' },
        samples: { type: 'number', description: 'Path interpolation samples' },
        unit: { type: 'string', enum: ['m', 'ft'], description: 'Unit' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_geo_ip',
    description: 'IP geolocation: resolve IP to location, ISP/org info, VPN/proxy detection, batch, current client.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['lookup', 'batch', 'current', 'validate', 'info'], description: 'IP geo action' },
        ip: { type: 'string', description: 'IP address' },
        ips: { type: 'array', items: { type: 'string' }, description: 'IPs for batch' },
        fields: { type: 'array', items: { type: 'string' }, description: 'Data fields' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_geo_cluster',
    description: 'Spatial clustering: k-means, DBSCAN, hierarchical, heatmap grid, convex hull, cluster stats.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['kmeans', 'dbscan', 'hierarchical', 'heatmap', 'hull', 'stats'], description: 'Clustering action' },
        points: { type: 'array', items: { type: 'object' }, description: 'Points to cluster' },
        k: { type: 'number', description: 'Number of clusters' },
        epsilon: { type: 'number', description: 'DBSCAN epsilon (km)' },
        minPoints: { type: 'number', description: 'DBSCAN min points' },
        gridSize: { type: 'number', description: 'Heatmap grid size (km)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_geo_transform',
    description: 'Coordinate transforms: CRS conversion (WGS84/UTM/Mercator), DMS↔decimal, GeoJSON, WKT, buffer generation.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['convert', 'project', 'dms_to_decimal', 'decimal_to_dms', 'geojson', 'wkt', 'buffer'], description: 'Transform action' },
        lat: { type: 'number', description: 'Latitude' },
        lng: { type: 'number', description: 'Longitude' },
        fromCrs: { type: 'string', description: 'Source CRS' },
        toCrs: { type: 'string', description: 'Target CRS' },
        dms: { type: 'string', description: 'DMS string' },
        geometry: { type: 'object', description: 'GeoJSON geometry' },
        wkt: { type: 'string', description: 'WKT string' },
        distance: { type: 'number', description: 'Buffer distance (m)' },
      },
      required: ['action'],
    },
  },

  // ─── CLOUD & INFRASTRUCTURE ───
  {
    name: 'canvas_cloud_deploy',
    description: 'Cloud deployment: deploy services, rollback versions, check status, promote between environments, view deploy history, destroy resources.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['deploy', 'rollback', 'status', 'history', 'promote', 'destroy', 'config'], description: 'Deployment action' },
        provider: { type: 'string', enum: ['aws', 'gcp', 'azure', 'digitalocean', 'heroku'], description: 'Cloud provider' },
        service: { type: 'string', description: 'Service name' },
        environment: { type: 'string', enum: ['development', 'staging', 'production'], description: 'Target environment' },
        region: { type: 'string', description: 'Cloud region' },
        image: { type: 'string', description: 'Container image' },
        version: { type: 'string', description: 'Version tag' },
        strategy: { type: 'string', enum: ['rolling', 'blue_green', 'canary', 'recreate'], description: 'Deploy strategy' },
        replicas: { type: 'number', description: 'Instance count' },
        envVars: { type: 'object', description: 'Environment variables' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_cloud_scale',
    description: 'Auto-scaling: set instance count, configure auto-scaling policies, schedule scaling, scale-to-zero, view scaling history.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['set', 'auto', 'schedule', 'status', 'history', 'policy', 'scale_to_zero'], description: 'Scale action' },
        service: { type: 'string', description: 'Service name' },
        provider: { type: 'string', description: 'Cloud provider' },
        desiredCount: { type: 'number', description: 'Desired instance count' },
        minInstances: { type: 'number', description: 'Minimum instances' },
        maxInstances: { type: 'number', description: 'Maximum instances' },
        metric: { type: 'string', enum: ['cpu', 'memory', 'requests', 'custom'], description: 'Scale metric' },
        targetValue: { type: 'number', description: 'Target metric value' },
        schedule: { type: 'string', description: 'Cron schedule' },
        cooldown: { type: 'number', description: 'Cooldown seconds' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_cloud_logs',
    description: 'Cloud logging: fetch, search, tail, export, and analyze logs from cloud services and log groups.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['fetch', 'search', 'tail', 'export', 'analyze', 'stats', 'streams'], description: 'Log action' },
        service: { type: 'string', description: 'Service name' },
        provider: { type: 'string', description: 'Cloud provider' },
        logGroup: { type: 'string', description: 'Log group name' },
        query: { type: 'string', description: 'Search query' },
        level: { type: 'string', enum: ['info', 'warn', 'error', 'debug'], description: 'Filter by log level' },
        startTime: { type: 'string', description: 'Start time (e.g. -1h, -24h)' },
        limit: { type: 'number', description: 'Max log entries' },
        format: { type: 'string', enum: ['json', 'csv', 'text'], description: 'Export format' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_cloud_secrets',
    description: 'Secret/vault management: get, set, rotate, audit, version, list and share secrets across environments.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['get', 'set', 'delete', 'list', 'rotate', 'audit', 'version', 'share'], description: 'Secret action' },
        provider: { type: 'string', description: 'Cloud provider' },
        name: { type: 'string', description: 'Secret name' },
        value: { type: 'string', description: 'Secret value' },
        environment: { type: 'string', description: 'Environment' },
        rotationDays: { type: 'number', description: 'Rotation interval in days' },
        tags: { type: 'object', description: 'Secret tags' },
        version: { type: 'string', description: 'Secret version' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_cloud_cost',
    description: 'Cloud cost analysis: spending summaries, breakdowns by service, forecasts, optimization recommendations, budget alerts, provider comparison.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['summary', 'breakdown', 'forecast', 'optimize', 'compare', 'alert', 'history', 'budget'], description: 'Cost action' },
        provider: { type: 'string', description: 'Cloud provider' },
        period: { type: 'string', enum: ['day', 'week', 'month', 'quarter', 'year'], description: 'Time period' },
        groupBy: { type: 'string', enum: ['service', 'region', 'tag', 'account'], description: 'Group breakdown by' },
        currency: { type: 'string', description: 'Currency code' },
        budgetAmount: { type: 'number', description: 'Budget amount' },
        threshold: { type: 'number', description: 'Alert threshold %' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_cloud_storage',
    description: 'Cloud object storage (S3/GCS/Blob): upload, download, list, delete, copy, move files; manage presigned URLs, lifecycles, ACLs, stats.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['upload', 'download', 'list', 'delete', 'copy', 'move', 'presign', 'lifecycle', 'acl', 'stats'], description: 'Storage action' },
        provider: { type: 'string', description: 'Cloud provider' },
        bucket: { type: 'string', description: 'Bucket name' },
        key: { type: 'string', description: 'Object key/path' },
        content: { type: 'string', description: 'File content' },
        contentType: { type: 'string', description: 'MIME type' },
        prefix: { type: 'string', description: 'List prefix' },
        destination: { type: 'string', description: 'Copy/move destination' },
        expiration: { type: 'number', description: 'Presigned URL expiration (seconds)' },
        acl: { type: 'string', enum: ['private', 'public-read', 'authenticated-read'], description: 'ACL setting' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_cloud_dns',
    description: 'Cloud DNS management: create/update/delete records, manage zones, health checks, propagation status.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'update', 'delete', 'list', 'zone_create', 'zone_list', 'health_check', 'propagation'], description: 'DNS action' },
        provider: { type: 'string', description: 'Cloud provider' },
        zone: { type: 'string', description: 'DNS zone (domain)' },
        name: { type: 'string', description: 'Record name' },
        type: { type: 'string', enum: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA'], description: 'Record type' },
        value: { type: 'string', description: 'Record value' },
        ttl: { type: 'number', description: 'TTL in seconds' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_cloud_monitor',
    description: 'Cloud monitoring: health checks, alarms, dashboards, metrics, SLOs, incident tracking, uptime reports.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['health', 'alarm_create', 'alarm_list', 'dashboard', 'metrics', 'slo', 'incident', 'uptime'], description: 'Monitor action' },
        service: { type: 'string', description: 'Service name' },
        provider: { type: 'string', description: 'Cloud provider' },
        metric: { type: 'string', description: 'Metric name' },
        threshold: { type: 'number', description: 'Alarm threshold' },
        comparison: { type: 'string', enum: ['gt', 'lt', 'gte', 'lte', 'eq'], description: 'Comparison operator' },
        period: { type: 'number', description: 'Period in seconds' },
        sloTarget: { type: 'number', description: 'SLO target percentage' },
        notifyChannels: { type: 'array', items: { type: 'string' }, description: 'Notification channels' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_cloud_network',
    description: 'Cloud networking: VPCs, subnets, firewall rules, load balancers, VPC peering, route tables, NAT gateways.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['vpc_create', 'vpc_list', 'subnet_create', 'firewall_rule', 'lb_create', 'lb_list', 'peering', 'route_table', 'nat_gateway'], description: 'Network action' },
        provider: { type: 'string', description: 'Cloud provider' },
        region: { type: 'string', description: 'Cloud region' },
        vpcId: { type: 'string', description: 'VPC ID' },
        cidr: { type: 'string', description: 'CIDR block' },
        name: { type: 'string', description: 'Resource name' },
        port: { type: 'number', description: 'Port number' },
        protocol: { type: 'string', description: 'Network protocol' },
        subnetId: { type: 'string', description: 'Subnet ID' },
        sourceIp: { type: 'string', description: 'Source IP/CIDR' },
        peerVpcId: { type: 'string', description: 'Peer VPC ID' },
        targetInstances: { type: 'array', items: { type: 'string' }, description: 'LB target instances' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_cloud_container',
    description: 'Container orchestration (ECS/GKE/AKS): cluster management, service deployment, pod status, container logs, scaling, rollouts, registry operations.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['cluster_create', 'cluster_list', 'service_deploy', 'service_list', 'pods', 'logs', 'scale', 'rollout', 'registry_push', 'registry_list'], description: 'Container action' },
        provider: { type: 'string', enum: ['aws_ecs', 'gke', 'aks', 'docker_swarm'], description: 'Container platform' },
        cluster: { type: 'string', description: 'Cluster name' },
        service: { type: 'string', description: 'Service name' },
        image: { type: 'string', description: 'Container image' },
        replicas: { type: 'number', description: 'Replica count' },
        cpu: { type: 'string', description: 'CPU allocation' },
        memory: { type: 'string', description: 'Memory allocation' },
        port: { type: 'number', description: 'Container port' },
        namespace: { type: 'string', description: 'Kubernetes namespace' },
        registry: { type: 'string', description: 'Container registry URL' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_cloud_iam',
    description: 'Cloud IAM: user/role/policy management, service accounts, MFA status, access reviews, audit logs.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['user_create', 'user_list', 'role_create', 'role_assign', 'policy_create', 'policy_attach', 'service_account', 'mfa_status', 'access_review', 'audit'], description: 'IAM action' },
        provider: { type: 'string', description: 'Cloud provider' },
        username: { type: 'string', description: 'Username' },
        role: { type: 'string', description: 'Role name' },
        policy: { type: 'string', description: 'Policy name or document' },
        permissions: { type: 'array', items: { type: 'string' }, description: 'Permission list' },
        resource: { type: 'string', description: 'Resource ARN/path' },
        effect: { type: 'string', enum: ['allow', 'deny'], description: 'Policy effect' },
      },
      required: ['action'],
    },
  },

  // ─── ADVANCED SECURITY ───
  {
    name: 'canvas_scan_vulnerabilities',
    description: 'Comprehensive vulnerability scanning: SAST (static analysis), DAST (dynamic), SCA (software composition), container image scanning, IaC security, scheduled scans, aggregate reports.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['sast', 'dast', 'sca', 'container', 'iac', 'report', 'schedule'], description: 'Scan type' },
        target: { type: 'string', description: 'Target file/repo/directory' },
        url: { type: 'string', description: 'URL for DAST scanning' },
        image: { type: 'string', description: 'Container image for scanning' },
        severity: { type: 'string', enum: ['all', 'critical', 'high', 'medium', 'low'], description: 'Filter by severity' },
        scanTypes: { type: 'array', items: { type: 'string' }, description: 'Scan types for scheduling' },
        cron: { type: 'string', description: 'Schedule cron expression' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_policy_enforce',
    description: 'Security policy enforcement: compliance checks (SOC2/ISO27001/GDPR/HIPAA/PCI-DSS), policy creation, audit, remediation, drift detection, reporting.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['check', 'compliance', 'create', 'audit', 'remediate', 'report', 'drift'], description: 'Policy action' },
        framework: { type: 'string', description: 'Compliance framework' },
        resource: { type: 'string', description: 'Resource to check' },
        policy: { type: 'string', description: 'Policy name' },
        standard: { type: 'string', enum: ['SOC2', 'ISO27001', 'GDPR', 'HIPAA', 'PCI_DSS'], description: 'Compliance standard' },
        name: { type: 'string', description: 'Policy name for creation' },
        rules: { type: 'array', items: { type: 'object' }, description: 'Policy rules' },
        violationId: { type: 'string', description: 'Violation to remediate' },
        period: { type: 'string', description: 'Report period' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_threat_model',
    description: 'Threat modelling: STRIDE analysis, DREAD scoring, attack tree generation, risk matrix, data flow diagrams, mitigation recommendations.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['stride', 'dread', 'attack_tree', 'risk_matrix', 'data_flow', 'mitigate'], description: 'Threat model action' },
        component: { type: 'string', description: 'System/service to model' },
        threat: { type: 'string', description: 'Threat description' },
        goal: { type: 'string', description: 'Attack goal for attack tree' },
        severity: { type: 'string', description: 'Threat severity' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_incident_response',
    description: 'Incident response: create/triage/contain/forensics/resolve incidents, run playbooks (ransomware/data-breach), track metrics.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'triage', 'contain', 'forensics', 'playbook', 'resolve', 'list', 'metrics'], description: 'IR action' },
        incidentId: { type: 'string', description: 'Incident identifier' },
        title: { type: 'string', description: 'Incident title' },
        severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'], description: 'Incident severity' },
        type: { type: 'string', enum: ['security', 'ransomware', 'data_breach', 'ddos', 'insider'], description: 'Incident type' },
        indicators: { type: 'array', items: { type: 'object' }, description: 'Threat indicators' },
        resolution: { type: 'string', description: 'Resolution description' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_pentest_recon',
    description: 'Penetration testing reconnaissance: port scanning, OS/service fingerprinting, subdomain/directory enumeration, DNS recon, SSL audit, security header audit.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['port_scan', 'fingerprint', 'enumerate', 'dns_recon', 'ssl_audit', 'header_audit'], description: 'Recon action' },
        host: { type: 'string', description: 'Target host' },
        domain: { type: 'string', description: 'Domain for DNS recon' },
        url: { type: 'string', description: 'URL for header audit' },
        ports: { type: 'string', description: 'Port range (e.g. 1-1024)' },
        type: { type: 'string', enum: ['subdomains', 'directories'], description: 'Enumeration type' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_waf_manage',
    description: 'WAF management: create/list rules, IP block/allow, rate limiting, geo-blocking, managed rulesets (OWASP CRS), traffic statistics.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['rule_create', 'rule_list', 'ip_block', 'ip_allow', 'rate_limit', 'geo_block', 'stats', 'managed_rules'], description: 'WAF action' },
        provider: { type: 'string', description: 'WAF provider' },
        name: { type: 'string', description: 'Rule name' },
        condition: { type: 'string', description: 'Rule condition' },
        ip: { type: 'string', description: 'IP address' },
        path: { type: 'string', description: 'URL path pattern' },
        limit: { type: 'number', description: 'Rate limit count' },
        window: { type: 'number', description: 'Rate limit window (seconds)' },
        countries: { type: 'array', items: { type: 'string' }, description: 'Country codes to block' },
        reason: { type: 'string', description: 'Block reason' },
        duration: { type: 'string', description: 'Block duration' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_siem_query',
    description: 'SIEM operations: search security events, correlate logs, triage alerts, query threat intelligence, view dashboards, create detection rules.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['search', 'correlate', 'alert_triage', 'threat_intel', 'dashboard', 'rule_create'], description: 'SIEM action' },
        query: { type: 'string', description: 'Search query' },
        timeRange: { type: 'string', description: 'Time range (e.g. -24h)' },
        alertId: { type: 'string', description: 'Alert ID for triage' },
        indicator: { type: 'string', description: 'Threat indicator (IP/domain/hash)' },
        type: { type: 'string', enum: ['ip', 'domain', 'hash', 'email'], description: 'Indicator type' },
        name: { type: 'string', description: 'Detection rule name' },
        condition: { type: 'string', description: 'Detection rule condition' },
        severity: { type: 'string', description: 'Rule severity' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_zero_trust',
    description: 'Zero-trust security: identity verification with trust scoring, device posture checks, micro-segmentation, access policies, access audit, network policies.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['verify_identity', 'device_posture', 'micro_segment', 'access_policy', 'audit_access', 'network_policy'], description: 'Zero-trust action' },
        user: { type: 'string', description: 'User to verify' },
        deviceId: { type: 'string', description: 'Device identifier' },
        service: { type: 'string', description: 'Service for micro-segmentation' },
        resource: { type: 'string', description: 'Resource for access policy' },
        allowedServices: { type: 'array', items: { type: 'string' }, description: 'Allowed service connections' },
        conditions: { type: 'object', description: 'Access policy conditions' },
        context: { type: 'object', description: 'Identity verification context' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_container_security',
    description: 'Container security: image vulnerability scanning, runtime protection, admission control, secrets scanning, network policies, CIS benchmark compliance.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['image_scan', 'runtime_protect', 'admission', 'secrets_scan', 'network_policy', 'compliance'], description: 'Container security action' },
        image: { type: 'string', description: 'Container image' },
        container: { type: 'string', description: 'Container name/ID' },
        namespace: { type: 'string', description: 'Kubernetes namespace' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_api_security',
    description: 'API security testing: authentication audit, OWASP API Top-10 scan, schema fuzzing, rate-limit testing, endpoint discovery, JWT audit.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['auth_audit', 'owasp_scan', 'schema_fuzz', 'rate_limit_test', 'endpoint_discover', 'jwt_audit'], description: 'API security action' },
        endpoint: { type: 'string', description: 'API endpoint URL' },
        baseUrl: { type: 'string', description: 'API base URL' },
        schema: { type: 'object', description: 'API schema for fuzzing' },
        rps: { type: 'number', description: 'Requests per second for load test' },
        token: { type: 'string', description: 'JWT token for audit' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_supply_chain',
    description: 'Supply chain security: SBOM generation/analysis (SPDX), provenance verification (SLSA), artifact signing (cosign), dependency trust scoring, license audit, lockfile audit.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['sbom_generate', 'sbom_analyze', 'provenance_verify', 'sign_artifact', 'dependency_trust', 'license_audit', 'lockfile_audit'], description: 'Supply chain action' },
        target: { type: 'string', description: 'Target directory or file' },
        format: { type: 'string', enum: ['spdx', 'cyclonedx'], description: 'SBOM format' },
        artifact: { type: 'string', description: 'Artifact to verify/sign' },
        package: { type: 'string', description: 'Package name for trust check' },
        keyId: { type: 'string', description: 'Signing key ID' },
        lockfile: { type: 'string', description: 'Lockfile path' },
      },
      required: ['action'],
    },
  },

  // ─── TERMINAL / EXECUTION ───
  {
    name: 'canvas_terminal_run',
    description:
      'Execute a shell command in the project terminal. Use for npm install, running scripts, git commands, build commands, etc.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute' },
        cwd: {
          type: 'string',
          description: 'Working directory (relative to project root)',
          default: '/',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default 30000)',
          default: 30000,
        },
      },
      required: ['command'],
    },
  },

  // ─── BUILD & VALIDATION ───
  {
    name: 'canvas_build_validate',
    description:
      'Validate the project build. Checks for syntax errors, missing dependencies, broken imports, and common issues. Returns errors and warnings.',
    input_schema: {
      type: 'object',
      properties: {
        framework: {
          type: 'string',
          description:
            'Project framework (html, vite_react, nextjs, express, vue, svelte, astro)',
          default: 'html',
        },
      },
    },
  },

  // ─── PROJECT MANAGEMENT ───
  {
    name: 'canvas_project_set_framework',
    description:
      'Set the project framework. This affects scaffolding, build, and deploy behavior.',
    input_schema: {
      type: 'object',
      properties: {
        framework: {
          type: 'string',
          enum: [
            'html',
            'vite_react',
            'nextjs',
            'express',
            'fastapi',
            'vue',
            'svelte',
            'astro',
          ],
          description: 'Target framework',
        },
      },
      required: ['framework'],
    },
  },
  {
    name: 'canvas_project_add_dependency',
    description: 'Add npm packages to the project dependencies.',
    input_schema: {
      type: 'object',
      properties: {
        packages: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Package names to install, e.g. ["react", "tailwindcss"]',
        },
        dev: {
          type: 'boolean',
          description: 'Install as devDependency',
          default: false,
        },
      },
      required: ['packages'],
    },
  },
  {
    name: 'canvas_project_set_env',
    description: 'Set environment variables for the project.',
    input_schema: {
      type: 'object',
      properties: {
        vars: {
          type: 'object',
          description: 'Key-value pairs of env vars to set',
        },
      },
      required: ['vars'],
    },
  },

  // ─── SEARCH ───
  {
    name: 'canvas_search_files',
    description:
      'Full-text search across all project files. Returns matching lines with file paths and line numbers.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (plain text or regex)',
        },
        regex: {
          type: 'boolean',
          description: 'Treat query as regex',
          default: false,
        },
        includePattern: {
          type: 'string',
          description:
            'Only search files matching this glob pattern (e.g. "*.tsx")',
        },
      },
      required: ['query'],
    },
  },

  // ─── DEPLOY ───
  {
    name: 'canvas_deploy',
    description:
      "Deploy the project to a hosting provider. Requires valid credentials saved in the user's account.",
    input_schema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          enum: ['vercel', 'railway', 'netlify', 'cloudflare', 'mumtazai'],
          description: 'Deployment provider',
        },
        projectName: {
          type: 'string',
          description: 'Project name for deployment',
        },
      },
      required: ['provider'],
    },
  },

  // ─── ARCHIVE / ZIP ───
  {
    name: 'canvas_archive_core',
    description:
      'Core archive operations: create ZIP/TAR/TAR.GZ from files, extract archives, repack, rename files inside archive, change compression, split into parts, or merge multiple archives.',
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Archive path, filename, or URL' },
        action: {
          type: 'string',
          description: 'Operation to perform',
          enum: [
            'create',
            'extract',
            'repack',
            'rename',
            'compress',
            'split',
            'merge',
          ],
        },
        options: {
          type: 'object',
          description:
            'Action-specific options. create: {files, format (zip/tar/tar.gz), name, compressionLevel, baseDir}. extract: {filter, flat, maxSize}. repack: {format, compressionLevel}. rename: {renames}. compress: {level}. split: {partSize}. merge: {archives}.',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_archive_edit',
    description:
      'Smart ZIP editing without full extract. Add files, remove files, replace a file, edit text inside ZIP, patch configs (.env/.json/.yaml), or fix path separators (Windows↔Linux).',
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Archive path, filename, or URL' },
        action: {
          type: 'string',
          description: 'Edit operation',
          enum: [
            'add_files',
            'remove_files',
            'replace_file',
            'edit_text',
            'patch_config',
            'fix_paths',
          ],
        },
        options: {
          type: 'object',
          description:
            'Action-specific options. add_files: {files, basePath}. remove_files: {names, patterns}. replace_file: {target, content/sourceFile}. edit_text: {target, find, replace}. patch_config: {target, patches}. fix_paths: {targetOS}.',
        },
      },
      required: ['file', 'action'],
    },
  },
  {
    name: 'canvas_archive_structure',
    description:
      'Inspect and transform archive structure. View tree, detect missing files, validate layout, normalize paths, flatten/nest folders, enforce naming conventions.',
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Archive path, filename, or URL' },
        action: {
          type: 'string',
          description: 'Structure operation',
          enum: [
            'inspect',
            'detect_missing',
            'validate_layout',
            'normalize',
            'flatten',
            'nest',
            'naming',
          ],
        },
        options: {
          type: 'object',
          description:
            'Action-specific options. inspect: {showContent, maxPreview}. detect_missing: {expected}. validate_layout: {rules}. normalize: {stripPrefix}. nest: {folder}. naming: {convention}.',
        },
      },
      required: ['file', 'action'],
    },
  },
  {
    name: 'canvas_archive_security',
    description:
      'Security checks on archives: zip bomb detection, size limits, symlink/path traversal detection, password-protected ZIP detection, encryption, comprehensive security scan.',
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Archive path, filename, or URL' },
        action: {
          type: 'string',
          description: 'Security check',
          enum: [
            'zip_bomb_check',
            'size_limit',
            'symlink_check',
            'password_detect',
            'encrypt',
            'scan',
          ],
        },
        options: {
          type: 'object',
          description:
            'Action-specific options. size_limit: {maxSize, maxFiles}. encrypt: {password}.',
        },
      },
      required: ['file', 'action'],
    },
  },
  {
    name: 'canvas_archive_bulk',
    description:
      'Bulk archive operations: extract multiple archives, re-zip with filter rules, auto-rename files, deduplicate by hash/name/size, chunk large files.',
    input_schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'Primary archive path, filename, or URL',
        },
        action: {
          type: 'string',
          description: 'Bulk operation',
          enum: [
            'bulk_extract',
            'bulk_rezip',
            'auto_rename',
            'deduplicate',
            'chunk',
          ],
        },
        options: {
          type: 'object',
          description:
            'Action-specific options. bulk_extract: {archives}. bulk_rezip: {archives, excludePatterns, includePatterns}. auto_rename: {pattern, startIndex}. deduplicate: {strategy}. chunk: {chunkSize}.',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_archive_convert',
    description:
      'Convert between archive formats: ZIP↔TAR, ZIP↔TAR.GZ, ZIP→7Z, RAR→ZIP (read-only), normalize line endings in text files inside ZIP.',
    input_schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'Archive path, filename, or URL to convert',
        },
        action: {
          type: 'string',
          description: 'Conversion type',
          enum: [
            'zip_to_tar',
            'tar_to_zip',
            'zip_to_targz',
            'targz_to_zip',
            'zip_to_7z',
            'rar_extract',
            'fix_line_endings',
          ],
        },
        options: {
          type: 'object',
          description:
            'Action-specific options. zip_to_targz: {level}. fix_line_endings: {target (lf/crlf), fileTypes}.',
        },
      },
      required: ['file', 'action'],
    },
  },
  {
    name: 'canvas_archive_intelligence',
    description:
      'AI-powered archive analysis: summarize contents, find files by pattern, search text across all files, auto-generate README, detect project type (Node/Python/etc.), flag secrets (API keys, tokens, credentials).',
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Archive path, filename, or URL' },
        action: {
          type: 'string',
          description: 'Intelligence operation',
          enum: [
            'summarize',
            'find_files',
            'search_text',
            'auto_readme',
            'detect_project',
            'flag_secrets',
          ],
        },
        options: {
          type: 'object',
          description:
            'Action-specific options. find_files: {pattern, extensions, minSize, maxSize}. search_text: {query, caseSensitive, maxResults}. flag_secrets: {scanAllFiles}.',
        },
      },
      required: ['file', 'action'],
    },
  },
  {
    name: 'canvas_archive_deploy',
    description:
      'Dev/deployment packaging: package build artifacts, prepare deployment ZIP (strip dev files, add platform configs), inject env variables, strip dev files, optimize size, add version tags.',
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Archive or directory path' },
        action: {
          type: 'string',
          description: 'Deploy operation',
          enum: [
            'package_build',
            'prepare_deploy',
            'inject_env',
            'strip_dev',
            'size_optimize',
            'version_tag',
          ],
        },
        options: {
          type: 'object',
          description:
            'Action-specific options. package_build: {buildDir, outputName, include, exclude}. prepare_deploy: {platform, stripDev, injectFiles}. inject_env: {envVars, targetFile, mode}. strip_dev: {extraPatterns}. size_optimize: {removeEmpty, dedup, maxFileSize}. version_tag: {version, buildNumber}.',
        },
      },
      required: ['action'],
    },
  },

  // ─── DEVELOPER TOOLS ────────────────────────────────────────────
  {
    name: 'canvas_dev_filesystem',
    description:
      'Project filesystem intelligence — tree views, file stats, diffs, duplicates, disk usage.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'project_tree',
            'file_exists',
            'file_stats',
            'diff_files',
            'find_duplicates',
            'disk_usage',
          ],
        },
        path: { type: 'string', description: 'File or directory path' },
        target: { type: 'string', description: 'Second file for diff' },
        options: { type: 'object' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_dev_search',
    description:
      'Advanced search — grep, find by name/content, regex search, find-and-replace.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'grep',
            'find_by_name',
            'find_by_content',
            'regex_search',
            'replace_in_files',
            'find_and_replace',
          ],
        },
        pattern: { type: 'string' },
        directory: { type: 'string' },
        replacement: { type: 'string' },
        options: { type: 'object' },
      },
      required: ['action', 'pattern'],
    },
  },
  {
    name: 'canvas_dev_intelligence',
    description:
      'Code intelligence — symbols, references, definitions, language detection, imports, framework detection, outline.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'get_symbols',
            'find_references',
            'go_to_definition',
            'detect_language',
            'analyze_imports',
            'detect_framework',
            'get_outline',
          ],
        },
        file: { type: 'string' },
        symbol: { type: 'string' },
        directory: { type: 'string' },
        options: { type: 'object' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_dev_debug',
    description:
      'Debugging — error parsing, stack traces, lint, dependency audit, dead code, TODOs, env checking.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'parse_error',
            'analyze_stacktrace',
            'lint_check',
            'dependency_audit',
            'dead_code',
            'todos_scan',
            'env_check',
          ],
        },
        file: { type: 'string' },
        error: { type: 'string' },
        directory: { type: 'string' },
        options: { type: 'object' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_dev_test',
    description:
      'Run tests, generate mocks, measure coverage, and produce reports. Supports Jest, Vitest, Pytest, Mocha.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['run', 'mock', 'coverage', 'report', 'watch', 'snapshot', 'list'],
          description: 'Test action',
        },
        path: { type: 'string', description: 'Test file or directory' },
        framework: {
          type: 'string',
          enum: ['jest', 'vitest', 'pytest', 'mocha', 'auto'],
          description: 'Test framework (auto-detects if omitted)',
        },
        pattern: { type: 'string', description: 'Test name pattern to filter' },
        options: { type: 'object', description: 'Additional options (verbose, bail, timeout)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_dev_git',
    description:
      'Git operations — clone, commit, push, pull, branch, merge, log, diff, blame, stash, cherry-pick, status, tag.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['clone', 'commit', 'push', 'pull', 'branch', 'merge', 'log', 'diff', 'blame', 'stash', 'cherry_pick', 'status', 'reset', 'tag', 'remote', 'history'],
          description: 'Git operation',
        },
        repo: { type: 'string', description: 'Repository URL (for clone)' },
        message: { type: 'string', description: 'Commit message' },
        branch: { type: 'string', description: 'Branch name' },
        file: { type: 'string', description: 'File path (for blame/diff)' },
        options: { type: 'object', description: 'Additional options' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_dev_npm',
    description:
      'NPM/Yarn/PNPM package management — install, update, audit, publish, run scripts, manage versions, analyze deps.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['install', 'update', 'audit', 'publish', 'version', 'script', 'list', 'outdated', 'init', 'link', 'uninstall', 'info', 'search', 'run'],
          description: 'NPM action',
        },
        package: { type: 'string', description: 'Package name (for install/update)' },
        script: { type: 'string', description: 'Script name (for script action)' },
        path: { type: 'string', description: 'Project directory' },
        options: { type: 'object', description: 'Additional flags (save-dev, global, etc.)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_dev_docker',
    description:
      'Docker operations — build images, run containers, compose up/down, push to registry, inspect, logs, health checks.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['build', 'run', 'stop', 'compose_up', 'compose_down', 'push', 'pull', 'logs', 'inspect', 'exec', 'ps', 'images', 'prune', 'stats', 'rm'],
          description: 'Docker action',
        },
        image: { type: 'string', description: 'Image name:tag' },
        container: { type: 'string', description: 'Container name or ID' },
        file: { type: 'string', description: 'Dockerfile or compose file path' },
        options: { type: 'object', description: 'Additional options (ports, volumes, env)' },
      },
      required: ['action'],
    },
  },

  // ─── WEB & FRONTEND TOOLS ──────────────────────────────────────
  {
    name: 'canvas_web_analyze',
    description:
      'Web analysis — HTML validation, CSS analysis, accessibility (WCAG), responsive, SEO, performance, bundle.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'html_validate',
            'css_analyze',
            'accessibility_audit',
            'responsive_audit',
            'seo_audit',
            'performance_audit',
            'bundle_analyze',
          ],
        },
        file: { type: 'string' },
        content: { type: 'string' },
        directory: { type: 'string' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_web_scaffold',
    description:
      'Generate scaffolding — components, routes, forms, auth flows, state stores, API clients, hooks.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'component',
            'route',
            'form',
            'auth_flow',
            'state_store',
            'api_client',
            'hook',
            'context',
          ],
        },
        name: { type: 'string' },
        template: { type: 'string' },
        props: { type: 'array', items: { type: 'string' } },
        fields: { type: 'array', items: { type: 'object' } },
        options: { type: 'object' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_web_optimize',
    description:
      'Web optimization — meta tags, sitemaps, robots.txt, manifest, service workers, caching strategies.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'meta_tags',
            'sitemap',
            'robots_txt',
            'manifest',
            'service_worker',
            'caching_strategy',
          ],
        },
        title: { type: 'string' },
        description: { type: 'string' },
        url: { type: 'string' },
        baseUrl: { type: 'string' },
        pages: { type: 'array', items: { type: 'object' } },
        options: { type: 'object' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_web_transform',
    description:
      'Web transforms — Tailwind config, dark mode, PWA, responsive wrapper, animations.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'tailwind_config',
            'dark_mode',
            'pwa_setup',
            'responsive_wrapper',
            'animation',
          ],
        },
        name: { type: 'string' },
        type: { type: 'string' },
        options: { type: 'object' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_web_screenshot',
    description:
      'Capture webpage screenshots — full page, viewport, specific element, responsive breakpoints, or export to PDF.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to capture' },
        mode: {
          type: 'string',
          enum: ['full_page', 'viewport', 'element', 'responsive', 'pdf'],
          description: 'Capture mode',
        },
        selector: { type: 'string', description: 'CSS selector for element capture' },
        width: { type: 'number', description: 'Viewport width' },
        height: { type: 'number', description: 'Viewport height' },
        format: {
          type: 'string',
          enum: ['png', 'jpeg', 'webp', 'pdf'],
          description: 'Output format',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'canvas_web_lighthouse',
    description:
      'Run Lighthouse performance audit on a URL — scores for performance, accessibility, SEO, best practices, PWA.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to audit' },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Categories to audit (performance, accessibility, seo, best-practices, pwa)',
        },
        device: {
          type: 'string',
          enum: ['mobile', 'desktop'],
          description: 'Device emulation',
        },
        format: {
          type: 'string',
          enum: ['json', 'html', 'summary'],
          description: 'Report format',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'canvas_web_scrape',
    description:
      'Extract structured data from webpages — tables, links, text, JSON-LD, product info, article content, custom selectors.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to scrape' },
        action: {
          type: 'string',
          enum: ['text', 'links', 'images', 'tables', 'json_ld', 'article', 'product', 'custom'],
          description: 'What to extract',
        },
        selector: { type: 'string', description: 'CSS selector for custom extraction' },
        pagination: { type: 'boolean', description: 'Follow pagination links' },
        maxPages: { type: 'number', description: 'Max pages to follow' },
      },
      required: ['url', 'action'],
    },
  },

  // ─── DATABASE TOOLS ──────────────────────────────────────────────
  {
    name: 'canvas_db_query',
    description:
      'Execute SQL queries — SELECT, INSERT, UPDATE, DELETE with parameterized inputs. Uses PostgreSQL via Prisma. All queries logged for audit.',
    input_schema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'SQL query (parameterized with $1, $2...)' },
        params: { type: 'array', description: 'Query parameters array' },
        action: {
          type: 'string',
          enum: ['select', 'insert', 'update', 'delete', 'raw'],
          description: 'Query type (for safety validation)',
        },
        limit: { type: 'number', description: 'Max rows to return (default 100)' },
      },
      required: ['sql', 'action'],
    },
  },
  {
    name: 'canvas_db_schema',
    description:
      'Inspect or modify database schema — list tables, describe columns/indexes/constraints, create/alter tables, enums.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list_tables', 'describe', 'indexes', 'constraints', 'create_table', 'alter_table', 'drop_table', 'enums', 'inspect', 'tables'],
          description: 'Schema action',
        },
        table: { type: 'string', description: 'Table name' },
        definition: { type: 'object', description: 'Table/column definition for create/alter' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_db_backup',
    description:
      'Database backup and restore — export tables to JSON/SQL/CSV, import data, create snapshots, restore from backups.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['export', 'import', 'snapshot', 'restore', 'list_backups'],
          description: 'Backup action',
        },
        table: { type: 'string', description: 'Table to backup (or "all")' },
        format: {
          type: 'string',
          enum: ['json', 'sql', 'csv'],
          description: 'Export format',
        },
        backupId: { type: 'string', description: 'Backup ID for restore' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_db_migrate',
    description:
      'Run database migrations — check status, create new migration, apply pending, rollback, reset, seed. Uses Prisma migrations.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['status', 'create', 'apply', 'rollback', 'reset', 'seed'],
          description: 'Migration action',
        },
        name: { type: 'string', description: 'Migration name (for create)' },
        steps: { type: 'number', description: 'Number of migrations to rollback' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_db_analyze',
    description:
      'Database performance analysis — EXPLAIN query plans, table statistics, slow query detection, index recommendations, pool stats.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['explain', 'statistics', 'slow_queries', 'index_recommend', 'pool_status', 'table_stats'],
          description: 'Analysis type',
        },
        sql: { type: 'string', description: 'SQL query for EXPLAIN' },
        table: { type: 'string', description: 'Table name for stats' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_db_connect',
    description:
      'Database connection management — test connection, get connection info, pool stats, version.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['test', 'info', 'pool_stats', 'version'],
          description: 'Connection action',
        },
      },
      required: ['action'],
    },
  },

  // ─── API & INTEGRATIONS TOOLS ─────────────────────────────────────
  {
    name: 'canvas_api_request',
    description:
      'Make HTTP requests — GET/POST/PUT/DELETE/PATCH with custom headers, auth tokens, body, query params, and timeout.',
    input_schema: {
      type: 'object',
      properties: {
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'], description: 'HTTP method' },
        url: { type: 'string', description: 'Request URL' },
        headers: { type: 'object', description: 'Request headers' },
        body: { type: 'object', description: 'Request body (JSON)' },
        auth: { type: 'object', description: 'Auth config {type: "bearer"|"basic"|"apikey", token/username/password/key}' },
        timeout: { type: 'number', description: 'Timeout in ms (default 30000)' },
      },
      required: ['method', 'url'],
    },
  },
  {
    name: 'canvas_api_mock',
    description:
      'Create mock API endpoints for testing — define routes, response bodies, status codes, and delays.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'list', 'delete', 'clear'], description: 'Mock action' },
        endpoint: { type: 'string', description: 'Mock endpoint path' },
        method: { type: 'string', description: 'HTTP method for mock' },
        response: { type: 'object', description: 'Mock response {status, body, headers, delay}' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_api_document',
    description:
      'Generate API documentation — OpenAPI/Swagger spec from code, route analysis, parameter extraction.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['generate', 'validate', 'preview', 'export'], description: 'Documentation action' },
        source: { type: 'string', description: 'Source code to analyze' },
        format: { type: 'string', enum: ['openapi3', 'swagger2', 'markdown', 'html'], description: 'Output format' },
        title: { type: 'string', description: 'API title' },
        version: { type: 'string', description: 'API version' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_api_test',
    description:
      'Automated API testing — run assertions, load tests, sequence tests, validate schemas, and generate reports.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['run', 'assert', 'load_test', 'sequence', 'validate_schema', 'report'], description: 'Test action' },
        url: { type: 'string', description: 'API endpoint URL' },
        method: { type: 'string', description: 'HTTP method' },
        assertions: { type: 'array', description: 'Assertions [{field, operator, expected}]' },
        loadConfig: { type: 'object', description: 'Load test config {concurrency, duration, rps}' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_api_transform',
    description:
      'API format transformation — convert between GraphQL and REST schemas, validate specs, generate types.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['graphql_to_rest', 'rest_to_graphql', 'validate_schema', 'generate_types', 'convert_spec'], description: 'Transform action' },
        source: { type: 'string', description: 'Source schema/spec content' },
        sourceFormat: { type: 'string', description: 'Input format' },
        targetFormat: { type: 'string', description: 'Output format' },
      },
      required: ['action', 'source'],
    },
  },
  {
    name: 'canvas_webhook_listen',
    description:
      'Webhook management — register endpoints, log incoming events, list traffic, inspect payloads, replay events.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['register', 'list', 'events', 'inspect', 'delete', 'replay'], description: 'Webhook action' },
        name: { type: 'string', description: 'Webhook name/identifier' },
        url: { type: 'string', description: 'Target URL (for replay)' },
        webhookId: { type: 'string', description: 'Webhook ID' },
        eventId: { type: 'string', description: 'Event ID for inspect/replay' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_sdk_generate',
    description:
      'Auto-generate SDK client code from OpenAPI specs — TypeScript, Python, Go, Java, Ruby, PHP.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['generate', 'preview', 'validate'], description: 'SDK action' },
        spec: { type: 'string', description: 'OpenAPI spec content (JSON)' },
        language: { type: 'string', enum: ['typescript', 'python', 'go', 'java', 'ruby', 'php'], description: 'Target language' },
        name: { type: 'string', description: 'SDK/package name' },
      },
      required: ['action', 'spec', 'language'],
    },
  },
  {
    name: 'canvas_api_validate',
    description:
      'Validate API specs (OpenAPI/Swagger), request/response schemas, JSON Schema compliance, and endpoint contracts.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['spec', 'schema', 'request', 'response', 'contract'], description: 'Validation type' },
        input: { type: 'string', description: 'Spec/schema/payload to validate (JSON)' },
        schema: { type: 'string', description: 'JSON Schema to validate against' },
      },
      required: ['action', 'input'],
    },
  },
  {
    name: 'canvas_api_proxy',
    description:
      'Proxy/relay API requests with header rewriting, caching, rate-limit simulation, and latency injection.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['forward', 'cache', 'throttle', 'delay', 'mirror'], description: 'Proxy action' },
        url: { type: 'string', description: 'Target URL to proxy' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], description: 'HTTP method' },
        headers: { type: 'object', description: 'Headers to forward/override' },
        body: { type: 'object', description: 'Request body' },
        proxyConfig: { type: 'object', description: 'Config {rewriteHeaders, addLatencyMs, rateLimitRps, mirrorUrl}' },
      },
      required: ['action', 'url'],
    },
  },
  {
    name: 'canvas_api_diff',
    description:
      'Compare two API specs or responses to detect breaking changes, new endpoints, removed fields, and schema drift.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['spec', 'response', 'schema', 'endpoints'], description: 'Diff type' },
        before: { type: 'string', description: 'Original spec/response (JSON)' },
        after: { type: 'string', description: 'Updated spec/response (JSON)' },
      },
      required: ['action', 'before', 'after'],
    },
  },

  // ─── AI & ML TOOLS ────────────────────────────────────────────
  {
    name: 'canvas_llm_chat',
    description:
      'Multi-turn LLM conversations — route to GPT-4, Claude, Mistral, or other providers with temperature control and history.',
    input_schema: {
      type: 'object',
      properties: {
        messages: { type: 'array', description: 'Chat messages [{role, content}]' },
        model: { type: 'string', description: 'Model name (gpt-4, claude-3, mistral-large, auto)' },
        systemPrompt: { type: 'string', description: 'System prompt override' },
        temperature: { type: 'number', description: 'Temperature (0-2)' },
        maxTokens: { type: 'number', description: 'Max tokens in response' },
      },
      required: ['messages'],
    },
  },
  {
    name: 'canvas_llm_embed',
    description:
      'Generate text embeddings for semantic search, similarity comparison, clustering, and document indexing.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['embed', 'search', 'similarity', 'cluster', 'index'], description: 'Embedding action' },
        text: { type: 'string', description: 'Text to embed' },
        texts: { type: 'array', items: { type: 'string' }, description: 'Multiple texts (batch/cluster)' },
        model: { type: 'string', description: 'Embedding model' },
        namespace: { type: 'string', description: 'Namespace for indexing/search' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_llm_finetune',
    description:
      'Fine-tune language models on custom data — upload training data, start jobs, check status, manage models.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['upload_data', 'start', 'status', 'list', 'cancel', 'delete'], description: 'Fine-tune action' },
        data: { type: 'array', description: 'Training data [{prompt, completion}]' },
        baseModel: { type: 'string', description: 'Base model to fine-tune' },
        jobId: { type: 'string', description: 'Fine-tune job ID' },
        hyperparams: { type: 'object', description: 'Hyperparams {epochs, learning_rate, batch_size}' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_ml_train',
    description:
      'Train and evaluate ML models — classification, regression, clustering. Supports sklearn-style API.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['train', 'evaluate', 'predict', 'cross_validate', 'hyperparameter_search'], description: 'ML action' },
        algorithm: { type: 'string', description: 'Algorithm (linear_regression, random_forest, kmeans, etc.)' },
        data: { type: 'object', description: 'Training data {features, labels}' },
        modelId: { type: 'string', description: 'Model ID for evaluate/predict' },
        params: { type: 'object', description: 'Model hyperparameters' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_ml_predict',
    description:
      'Run inference with pre-trained or custom models — load models, batch predictions, and pipeline processing.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['predict', 'batch', 'pipeline', 'list_models', 'load'], description: 'Prediction action' },
        modelId: { type: 'string', description: 'Model ID to use' },
        input: { type: 'object', description: 'Input data for prediction' },
        inputs: { type: 'array', description: 'Batch input data' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_llm_analyze',
    description:
      'Text analysis — summarize, extract entities/keywords, classify sentiment, detect language, extract structured data.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['summarize', 'entities', 'sentiment', 'keywords', 'language', 'classify', 'extract'], description: 'Analysis type' },
        text: { type: 'string', description: 'Text to analyze' },
        options: { type: 'object', description: 'Options {maxLength, categories, schema, count}' },
      },
      required: ['action', 'text'],
    },
  },
  {
    name: 'canvas_llm_moderate',
    description:
      'Content moderation — safety scoring, toxicity detection, PII detection, category flagging via OpenAI moderation.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['moderate', 'pii_detect', 'toxicity', 'compliance', 'batch'], description: 'Moderation action' },
        text: { type: 'string', description: 'Text to moderate' },
        texts: { type: 'array', items: { type: 'string' }, description: 'Multiple texts (batch)' },
        options: { type: 'object', description: 'Options {threshold, redact}' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_ml_pipeline',
    description:
      'ML pipeline management — data preprocessing chains, feature engineering, model ensembles, A/B test tracking.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'add_step', 'run', 'list', 'delete', 'status'], description: 'Pipeline action' },
        pipelineId: { type: 'string', description: 'Pipeline ID' },
        step: { type: 'object', description: 'Pipeline step {type, config, name}' },
        data: { type: 'object', description: 'Input data for pipeline run' },
      },
      required: ['action'],
    },
  },

  // ─── SECURITY TOOLS ────────────────────────────────────────────
  {
    name: 'canvas_crypto_hash',
    description:
      'Cryptographic hashing — SHA-256, SHA-512, MD5, bcrypt. Hash strings, files, or verify hashes.',
    input_schema: {
      type: 'object',
      properties: {
        input: { type: 'string', description: 'String or file path to hash' },
        algorithm: { type: 'string', enum: ['sha256', 'sha512', 'md5', 'bcrypt', 'sha1', 'sha384'], description: 'Hash algorithm (default sha256)' },
        encoding: { type: 'string', enum: ['hex', 'base64', 'binary'], description: 'Output encoding (default hex)' },
        compare: { type: 'string', description: 'Hash to compare against for verification' },
      },
      required: ['input'],
    },
  },
  {
    name: 'canvas_crypto_encrypt',
    description:
      'Encrypt and decrypt data — AES-256-GCM, AES-256-CBC, RSA. Supports string and file encryption with key management.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['encrypt', 'decrypt'], description: 'Encrypt or decrypt' },
        data: { type: 'string', description: 'Data to encrypt/decrypt' },
        key: { type: 'string', description: 'Encryption key (hex). Auto-generated if not provided for encrypt.' },
        algorithm: { type: 'string', enum: ['aes-256-gcm', 'aes-256-cbc'], description: 'Encryption algorithm (default aes-256-gcm)' },
        iv: { type: 'string', description: 'Initialization vector (hex, required for decrypt)' },
        authTag: { type: 'string', description: 'Auth tag (hex, required for GCM decrypt)' },
      },
      required: ['action', 'data'],
    },
  },
  {
    name: 'canvas_crypto_sign',
    description:
      'Digital signatures — sign and verify data with HMAC or RSA/ECDSA keys. Generate key pairs.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['sign', 'verify', 'generate_keypair'], description: 'Signing action' },
        data: { type: 'string', description: 'Data to sign/verify' },
        key: { type: 'string', description: 'Signing key (HMAC secret or PEM private/public key)' },
        algorithm: { type: 'string', enum: ['sha256', 'sha512', 'sha384'], description: 'Hash algorithm (default sha256)' },
        signature: { type: 'string', description: 'Signature to verify (hex)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_scan_secrets',
    description:
      'Scan code for exposed secrets — API keys, passwords, tokens, private keys, database URLs. 14+ detection patterns.',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Code or text to scan for secrets' },
      },
      required: ['content'],
    },
  },
  {
    name: 'canvas_scan_malware',
    description:
      'Scan code for malware patterns — eval injection, shell exec, crypto mining, data exfiltration, obfuscation. Severity scoring.',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Code or file content to scan for malware patterns' },
      },
      required: ['content'],
    },
  },
  {
    name: 'canvas_auth_generate',
    description:
      'Generate auth tokens — JWT, API keys, OAuth tokens, UUIDs, random secrets. All with configurable expiration.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['jwt', 'api_key', 'oauth_token', 'uuid', 'random'], description: 'Token type' },
        subject: { type: 'string', description: 'JWT subject claim' },
        issuer: { type: 'string', description: 'JWT issuer claim' },
        expiresIn: { type: 'number', description: 'Expiration in seconds (default 3600)' },
        claims: { type: 'object', description: 'Additional JWT claims' },
        prefix: { type: 'string', description: 'API key prefix (default "sk")' },
        length: { type: 'number', description: 'Random token length (default 32)' },
      },
      required: ['type'],
    },
  },
  {
    name: 'canvas_scan_dependency',
    description:
      'Dependency vulnerability scanning — audit npm/pip packages for CVEs, check outdated versions, license risks.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['audit', 'outdated', 'licenses'], description: 'Scan action' },
        manifest: { type: 'string', description: 'Package manifest content (package.json, requirements.txt)' },
        ecosystem: { type: 'string', enum: ['npm', 'pip', 'gem', 'cargo', 'go', 'maven'], description: 'Package ecosystem (default npm)' },
        severity: { type: 'string', enum: ['critical', 'high', 'moderate', 'low', 'all'], description: 'Min severity to report' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_password_audit',
    description:
      'Password strength analysis — entropy calculation, crack time estimation, common-word detection. Generate secure passwords and passphrases.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['check', 'generate', 'passphrase', 'policy'], description: 'Audit action' },
        password: { type: 'string', description: 'Password to check' },
        length: { type: 'number', description: 'Generated password length (default 16)' },
        words: { type: 'number', description: 'Passphrase word count (default 4)' },
        policy: { type: 'object', description: 'Custom policy {minLength, uppercase, lowercase, numbers, symbols}' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_ssl_inspect',
    description:
      'SSL/TLS certificate inspection — check validity, expiry, cipher suites, certificate chain. Generate self-signed certs for dev.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['inspect', 'check_expiry', 'generate_self_signed', 'ciphers'], description: 'SSL action' },
        hostname: { type: 'string', description: 'Domain to inspect (e.g. example.com)' },
        port: { type: 'number', description: 'Port (default 443)' },
        commonName: { type: 'string', description: 'Common name for self-signed cert' },
        days: { type: 'number', description: 'Validity days for self-signed cert (default 365)' },
      },
      required: ['action'],
    },
  },

  // ─── AGENT INTELLIGENCE ───
  {
    name: 'canvas_agent_memory',
    description:
      'Persistent agent memory — save, retrieve, clear, search, and get stats on stored knowledge.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['save', 'get', 'clear', 'stats', 'search'],
        },
        key: { type: 'string' },
        value: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        importance: { type: 'number' },
        query: { type: 'string' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_agent_safety',
    description:
      'Permission and safety checks — request approval, check permissions, validate actions, audit log.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'request_approval',
            'check_permission',
            'validate_action',
            'audit_log',
          ],
        },
        target_action: { type: 'string' },
        target_params: { type: 'object' },
        reason: { type: 'string' },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
        },
        limit: { type: 'number' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_agent_ui',
    description:
      'UI notifications — show messages/warnings/errors, ask user questions, display toasts, progress.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'show_message',
            'show_warning',
            'show_error',
            'ask_user',
            'show_toast',
            'show_progress',
          ],
        },
        text: { type: 'string' },
        title: { type: 'string' },
        question: { type: 'string' },
        options: { type: 'array', items: { type: 'string' } },
        input_type: {
          type: 'string',
          enum: ['text', 'choice', 'confirm', 'number'],
        },
        duration: { type: 'number' },
        percent: { type: 'number' },
        label: { type: 'string' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_agent_control',
    description:
      'Agent mode and task control — switch modes, get state, cancel tasks, set context.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'set_mode',
            'get_state',
            'cancel_task',
            'set_context',
          ],
        },
        mode: {
          type: 'string',
          enum: ['chat', 'dev', 'review', 'plan', 'safe'],
        },
        task_id: { type: 'string' },
        key: { type: 'string' },
        value: { type: 'string' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_editor_select',
    description:
      'Editor selection and cursor — get selection, insert at cursor, replace selection, get cursor position.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'get_selection',
            'insert_at_cursor',
            'replace_selection',
            'get_cursor_position',
          ],
        },
        text: { type: 'string' },
        file: { type: 'string' },
        line: { type: 'number' },
        column: { type: 'number' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_save_context',
    description:
      'Save a key-value pair to persistent database storage. Use for storing context, notes, or data across sessions.',
    input_schema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Storage key' },
        value: { type: 'string', description: 'Value to store' },
      },
      required: ['key', 'value'],
    },
  },
  {
    name: 'canvas_recall_context',
    description:
      'Retrieve a previously saved value from persistent storage by key, or list all saved keys.',
    input_schema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Storage key to retrieve (omit to list all keys)' },
      },
      required: [],
    },
  },
  {
    name: 'canvas_agent_workflow',
    description:
      'Multi-step workflow management — create, run, pause/resume, cancel workflows with named checkpoints and step tracking.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'add_step', 'run', 'pause', 'resume', 'cancel', 'status', 'list'], description: 'Workflow action' },
        workflowId: { type: 'string', description: 'Workflow ID' },
        name: { type: 'string', description: 'Workflow name' },
        step: { type: 'object', description: 'Step definition {name, tool, params, onError}' },
        checkpoint: { type: 'string', description: 'Checkpoint name for pause/resume' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_agent_delegate',
    description:
      'Delegate sub-tasks to specialized agent modes — run tools in review/plan/safe mode, validate batch tasks, track delegations.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['delegate', 'batch', 'status'], description: 'Delegation action' },
        mode: { type: 'string', enum: ['chat', 'dev', 'review', 'plan', 'safe'], description: 'Target mode' },
        tool: { type: 'string', description: 'Tool to run in delegated mode' },
        params: { type: 'object', description: 'Tool parameters' },
        tasks: { type: 'array', items: { type: 'object' }, description: 'Batch tasks [{mode, tool, params}]' },
        reason: { type: 'string', description: 'Delegation reason' },
      },
      required: ['action'],
    },
  },
  {
    name: 'canvas_agent_metrics',
    description:
      'Agent performance metrics — tool usage frequency, success/failure rates, latency stats, session analytics, CSV/JSON export.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['summary', 'tool_usage', 'session_stats', 'reset', 'export'], description: 'Metrics action' },
        period: { type: 'string', enum: ['1h', '24h', '7d', '30d', 'all'], description: 'Time period' },
        toolName: { type: 'string', description: 'Filter by tool name' },
        format: { type: 'string', enum: ['json', 'text', 'csv'], description: 'Export format' },
      },
      required: ['action'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // IMAGE PROCESSING TOOLS (delegated to agent-tools-service)
  // ═══════════════════════════════════════════════════════════════════
  {
    name: 'image_create',
    description:
      'Create images from scratch (no source file needed). Actions: blank (solid color/transparent), gradient (linear gradient), pattern (grid/dots/stripes/checkerboard), placeholder (rectangle with text), svg_render (SVG→PNG), text_image (render text as image), sprite_sheet (compose multiple images into grid/strip sprite sheet).',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'What to create', enum: ['blank', 'gradient', 'pattern', 'placeholder', 'svg_render', 'text_image', 'sprite_sheet'] },
        width: { type: 'number', description: 'Image width in pixels (default 800)' },
        height: { type: 'number', description: 'Image height in pixels (default 600)' },
        options: { type: 'object', description: 'Action-specific options. blank: {color}. gradient: {from_color, to_color, direction}. pattern: {type, spacing, color, background}. placeholder: {text, background, text_color}. svg_render: {svg}. text_image: {text, color, background, font_size}.' },
      },
      required: ['action'],
    },
  },
  {
    name: 'image_transform',
    description:
      'Geometry & spatial transformations. Actions: resize, crop, rotate, flip, extend, trim.',
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Image path, filename, or URL' },
        action: { type: 'string', description: 'Transformation to apply', enum: ['resize', 'crop', 'rotate', 'flip', 'extend', 'trim'] },
        options: { type: 'object', description: 'resize: {width, height, fit, percentage}. crop: {left, top, width, height}. rotate: {angle, background}. flip: {direction}. extend: {top, bottom, left, right, background}. trim: {threshold}.' },
      },
      required: ['file', 'action'],
    },
  },
  {
    name: 'image_convert',
    description:
      'Format conversion, compression, optimization. Actions: format, compress, responsive, thumbnail, auto_orient.',
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Image path, filename, or URL' },
        action: { type: 'string', description: 'Conversion type', enum: ['format', 'compress', 'responsive', 'thumbnail', 'auto_orient'] },
        options: { type: 'object', description: 'format: {format, quality}. compress: {quality, max_size}. responsive: {sizes, format}. thumbnail: {width, height}.' },
      },
      required: ['file', 'action'],
    },
  },
  {
    name: 'image_compose',
    description:
      'Text overlays, watermarks, compositing, merging, collages, drop shadow. Actions: text_overlay, watermark, composite, merge, collage, shadow.',
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Base image path, filename, or URL' },
        action: { type: 'string', description: 'Composition type', enum: ['text_overlay', 'watermark', 'composite', 'merge', 'collage', 'shadow'] },
        options: { type: 'object', description: 'text_overlay: {text, x, y, font_size}. watermark: {text OR image, position, opacity}. composite: {overlay, blend}. merge: {files, direction}. collage: {files, columns}.' },
      },
      required: ['action'],
    },
  },
  {
    name: 'image_filter',
    description:
      'Apply visual filters and effects: blur, sharpen, grayscale, sepia, invert, brightness, contrast, saturation, hue, gamma, normalize, threshold, tint, posterize, pixelate, median, vintage, warm, cool, emboss, edge_detect.',
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Image path, filename, or URL' },
        filters: { type: 'array', description: 'Filters: [{name: "blur", value: 5}, {name: "grayscale"}]', items: { type: 'object', properties: { name: { type: 'string' }, value: { type: 'number' } }, required: ['name'] } },
      },
      required: ['file', 'filters'],
    },
  },
  {
    name: 'image_analyze',
    description:
      'Image analysis, metadata, validation, hashing, EXIF. Actions: metadata, stats, validate, hash, dominant_colors, histogram, exif, corruption, perceptual_hash, similarity.',
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Image path, filename, or URL' },
        action: { type: 'string', description: 'Analysis type', enum: ['metadata', 'stats', 'validate', 'hash', 'dominant_colors', 'histogram', 'exif', 'corruption', 'perceptual_hash', 'similarity'] },
        options: { type: 'object', description: 'validate: {max_width, max_height}. hash: {algorithm}. similarity: {compare_file}.' },
      },
      required: ['file', 'action'],
    },
  },
  {
    name: 'image_batch',
    description:
      'Bulk image processing pipeline. Apply chained operations to multiple images.',
    input_schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string' }, description: 'Image paths to process' },
        operations: { type: 'array', description: 'Pipeline: [{tool, action, options}]', items: { type: 'object', properties: { tool: { type: 'string' }, action: { type: 'string' }, options: { type: 'object' } }, required: ['tool', 'action'] } },
        options: { type: 'object', description: 'Batch options: {fail_mode: "continue"|"stop"}' },
      },
      required: ['files', 'operations'],
    },
  },
  {
    name: 'image_background',
    description:
      'Background removal, replacement, and blur. Actions: remove, replace, blur.',
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Image path, filename, or URL' },
        action: { type: 'string', description: 'Background operation', enum: ['remove', 'replace', 'blur'] },
        options: { type: 'object', description: 'remove: {target_color, tolerance}. replace: {color OR background_image}. blur: {sigma}.' },
      },
      required: ['file', 'action'],
    },
  },
  {
    name: 'image_face',
    description:
      'Face detection, blurring, cropping, and landmark detection. Actions: detect, blur_faces, crop_face, landmarks, count.',
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Image path, filename, or URL' },
        action: { type: 'string', description: 'Face operation', enum: ['detect', 'blur_faces', 'crop_face', 'landmarks', 'count'] },
        options: { type: 'object', description: 'blur_faces: {sigma}. crop_face: {padding}.' },
      },
      required: ['file', 'action'],
    },
  },
  {
    name: 'image_ai',
    description:
      'AI-powered image understanding via vision models (GPT-4o, Claude, Gemini). Actions: describe, analyze, extract_text, compare, classify, qa.',
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Image path, filename, or URL' },
        action: { type: 'string', description: 'AI analysis type', enum: ['describe', 'analyze', 'extract_text', 'compare', 'classify', 'qa'] },
        options: { type: 'object', description: 'describe: {detail}. compare: {file_b}. qa: {question}. Any: {provider: "openai"|"anthropic"|"gemini"}.' },
      },
      required: ['file', 'action'],
    },
  },
  {
    name: 'image_export',
    description:
      'Export images to non-image formats. Actions: ascii, base64, data_url, raw_pixels.',
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Image path, filename, or URL' },
        action: { type: 'string', description: 'Export format', enum: ['ascii', 'base64', 'data_url', 'raw_pixels'] },
        options: { type: 'object', description: 'ascii: {width, charset}. base64: {format}. data_url: {format}.' },
      },
      required: ['file', 'action'],
    },
  },
  {
    name: 'image_ocr',
    description:
      'Optical character recognition — extract text from images. Supports full page OCR, region-specific, multi-language, and structured output.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['full', 'region', 'table', 'receipt', 'handwriting', 'document'], description: 'OCR mode' },
        file: { type: 'string', description: 'Image file path or URL' },
        language: { type: 'string', description: 'Language hint (e.g. en, ar, zh)' },
        region: { type: 'object', description: 'Region {x, y, width, height} for partial OCR' },
      },
      required: ['file'],
    },
  },
  {
    name: 'generate_image',
    description:
      'Generate an AI image from a text description using DALL-E 3. Use when the user asks to create, generate, draw, or make an image, picture, artwork, illustration, or photo.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Detailed description of the image to generate' },
        style: { type: 'string', description: 'Art style', enum: ['realistic', 'artistic', 'anime', 'oil-painting', 'watercolor', 'digital-art', '3d-render', 'pixel-art'] },
        width: { type: 'number', description: 'Image width (1024 for square/portrait, 1792 for landscape)' },
        height: { type: 'number', description: 'Image height (1024 for square/landscape, 1792 for portrait)' },
      },
      required: ['prompt'],
    },
  },
];

// =============================================================================
// SYSTEM PROMPT (injected into every canvas agent conversation)
// =============================================================================

export const CANVAS_SYSTEM_PROMPT = `You are Nova, an expert full-stack developer at Mumtaz AI Canvas IDE.
You are proficient in ALL major programming languages and paradigms.

## Your Capabilities
You have access to tools that let you directly modify the user's project:
- Create, edit, delete, rename, copy, and read files
- List and browse project directories
- Run terminal commands (npm install, pip install, go build, make, etc.)
- Validate builds and check for errors
- Search across the project codebase
- Deploy to Vercel, Railway, Netlify, Cloudflare, or Mumtaz AI Apps
- Manage project framework, dependencies, and environment variables
- Create, extract, repack, split, and merge ZIP/TAR/TAR.GZ archives
- Smart-edit archives: add/remove/replace files, patch configs inside ZIPs
- Inspect archive structure, validate layout, detect missing files
- Security scan archives: zip bomb detection, secret flagging, path traversal checks
- Convert between archive formats (ZIP↔TAR↔TAR.GZ↔7Z, RAR read)
- AI-powered archive analysis: summarize, search, detect project type, flag secrets
- Package builds for deployment with dev file stripping and env injection
- Developer tools: filesystem intelligence, advanced search, code intelligence, debugging
- Testing: run tests, mock generation, coverage reports (Jest/Vitest/Pytest/Mocha)
- Git operations: clone, commit, push, pull, branch, merge, log, diff, blame, stash, tags
- NPM/package management: install, update, audit, publish, version, run scripts, outdated
- Docker: build images, run containers, compose up/down, push to registry, logs, health checks
- Database queries: execute SQL (SELECT/INSERT/UPDATE/DELETE) with parameterized inputs, audit logging
- Database schema: inspect tables/columns/indexes/constraints, create/alter tables
- Database backup: export/import/snapshot/restore in JSON/SQL/CSV formats
- Database migrations: check status, create, apply, rollback, seed via Prisma
- Database analysis: EXPLAIN plans, table statistics, slow query detection, index recommendations
- Database connections: test connectivity, pool stats, version info
- HTTP requests: full GET/POST/PUT/DELETE/PATCH with auth (bearer/basic/apikey), headers, body, timeout
- API mocking: create mock endpoints with custom responses, status codes, delays for testing
- API documentation: generate OpenAPI 3.0 specs from code, validate existing specs
- API testing: automated assertions (status, body, content-type, latency), load testing, schema validation
- API transformation: convert between GraphQL and REST schemas, validate specs, generate type definitions
- Webhook management: register endpoints, log events, inspect payloads, replay events
- SDK generation: auto-generate client code (TypeScript, Python, Go, Java, Ruby, PHP) from OpenAPI specs
- API validation: validate OpenAPI specs, JSON schemas, request/response payloads against contracts
- API proxying: forward with header rewriting, inject latency, simulate rate limits, mirror to compare
- API diffing: compare specs/responses for breaking changes, new/removed endpoints, schema drift
- LLM chat: multi-turn conversations with GPT-4, Claude, Mistral, or auto-selected provider
- LLM embeddings: text embeddings for semantic search, similarity comparison, clustering, indexing
- LLM fine-tuning: upload training data, start/monitor/cancel fine-tune jobs, manage custom models
- ML training: train/evaluate models (classification, regression, clustering) with sklearn-style API
- ML prediction: run inference with pre-trained models, batch predictions, pipeline processing
- Text analysis: AI-powered summarize, entity extraction, sentiment, keywords, language detection, classification
- Content moderation: safety scoring, toxicity detection, PII detection, batch moderation via OpenAI
- ML pipelines: build preprocessing chains, feature engineering steps, model ensembles, A/B tracking
- Geospatial: geocoding (forward/reverse/batch), routing (directions/optimize/ETA/isochrone), distance (haversine/matrix/area), geofencing (create/check/trigger), place search, timezones, elevation, IP geolocation, spatial clustering (k-means/DBSCAN/heatmap), coordinate transforms (UTM/Mercator/DMS/GeoJSON/WKT)
- Cloud & Infrastructure: deployment (deploy/rollback/promote/canary/blue-green), auto-scaling (policies/schedule/scale-to-zero), cloud logging (fetch/search/tail/export/analyze), secrets vault (get/set/rotate/audit/version), cost analysis (summary/breakdown/forecast/optimize/compare/budget), object storage (S3/GCS upload/download/lifecycle/presign), DNS management (records/zones/health/propagation), monitoring (health/alarms/dashboards/SLOs/incidents/uptime), networking (VPC/subnets/firewalls/load-balancers/peering/NAT), container orchestration (ECS/GKE/AKS clusters/services/pods/rollouts/registry), IAM (users/roles/policies/service-accounts/MFA/access-review)
- Advanced Security: vulnerability scanning (SAST/DAST/SCA/container/IaC), policy enforcement (SOC2/ISO27001/GDPR/HIPAA/PCI-DSS compliance/drift), threat modelling (STRIDE/DREAD/attack-trees/risk-matrix/data-flow), incident response (triage/contain/forensics/playbooks/resolve), pentest recon (port-scan/fingerprint/enumerate/DNS/SSL/headers), WAF management (rules/IP-block/rate-limit/geo-block/OWASP-CRS), SIEM (search/correlate/triage/threat-intel/detection-rules), zero-trust (identity-verify/device-posture/micro-segment/access-policy), container security (image-scan/runtime-protect/admission/secrets/CIS-benchmark), API security (auth-audit/OWASP-top10/schema-fuzz/JWT-audit), supply chain (SBOM/provenance/artifact-signing/dependency-trust/license-audit)
- Crypto hashing: SHA-256, SHA-512, MD5, bcrypt with verify and compare support
- Crypto encryption: AES-256-GCM/CBC encrypt/decrypt with automatic key generation
- Digital signatures: HMAC, RSA, ECDSA signing, verification, and key pair generation
- Secret scanning: 14+ patterns detecting API keys, tokens, private keys, database URLs
- Malware scanning: code pattern detection for eval injection, crypto mining, data exfiltration, severity scoring
- Auth token generation: JWT, API keys, OAuth tokens, UUIDs, random secrets with expiration
- Dependency audit: CVE vulnerability scanning, outdated version detection, license risk analysis
- Password audit: entropy calculation, crack time estimation, secure password/passphrase generation
- SSL inspection: certificate validity, expiry checking, cipher suite listing, self-signed cert generation
- Web analysis: HTML validation, CSS analysis, accessibility (WCAG), SEO, performance, bundle
- Web screenshots: capture full page, viewport, element, responsive breakpoints, export PDF
- Web auditing: Lighthouse performance/accessibility/SEO scoring with issue reporting
- Web scraping: extract tables, links, text, JSON-LD, articles, products, custom selectors
- Scaffolding: components, routes, forms, auth flows, state stores, API clients, hooks
- Web optimization: meta tags, sitemaps, robots.txt, PWA manifest, service workers, caching
- Web transforms: Tailwind config, dark mode, PWA setup, responsive wrappers, animations
- Persistent memory: save, retrieve, search, clear agent knowledge across sessions
- Context persistence: save/recall key-value data to database across sessions
- Safety checks: request approval for destructive actions, validate commands, audit trail
- UI interaction: show messages/warnings/errors, ask user questions, progress indicators
- Agent control: switch modes (chat/dev/review/plan/safe), plan and delegate tasks
- Editor selection: get current selection, insert at cursor, replace selection, cursor position
- File write/upsert: create or overwrite files in one step, directory creation, folder listing
- File existence checks, full project tree views, move/relocate files between paths
- Standalone zip/unzip for quick file compression and extraction
- File watching: monitor files for changes, check current state, list active watches
- File sync: compare and synchronize directories bidirectionally
- Markdown conversion: convert Markdown to HTML, LaTeX, or plain text
- Markdown validation: check heading hierarchy, link integrity, code block pairing, frontmatter
- Markdown generation: auto-generate README, changelog, API docs, contributing guides from templates
- Markdown TOC: auto-generate table of contents from document headings
- Markdown formatting: normalize whitespace, fix spacing, lint and auto-fix Markdown structure
- Markdown merge: combine multiple documents with separators and title injection
- Markdown extraction: pull out headings, links, images, code blocks, frontmatter, tables, todos
- Markdown slides: convert Markdown to Reveal.js presentation slides
- Analytics tracking: store custom events with metadata in PostgreSQL for analysis
- Analytics dashboard: view summary stats, top events, user activity, and tool usage over time
- Log parsing: extract errors, warnings, timeline events, and patterns from raw logs
- Health monitoring: check internal system health (DB, memory, uptime) or probe external URLs
- Telemetry: send metrics and traces to the database or external endpoints
- Analytics export: export event data as CSV or JSON with filtering and date ranges
- Log aggregation: aggregate log entries by severity, hour, pattern, or source with counts
- Metrics collection: collect system performance metrics (CPU, memory, uptime) or store custom counters
- Workflow pipelines: create multi-step workflows with conditional branches, parallel groups, and dependencies
- Workflow execution: run workflows with dry-run, step tracking, variable injection, and error policies
- Workflow scheduling: cron-based recurring, event-triggered, or one-time scheduled execution
- Workflow visualization: Mermaid/ASCII/JSON DAG diagrams of workflow step dependencies
- Workflow optimization: parallelization, redundancy, batching, and error handling suggestions
- Workflow templates: pre-built CI/CD, ETL, security audit, monitoring, code review pipelines
- Workflow history: execution logs with timing, replay past runs, clear old records
- Workflow validation: detect missing tools, circular deps, forward refs, best practice checks
- Knowledge graph: create entities/relationships, typed nodes, weighted directed edges, batch creation
- KG queries: get entities, neighbor traversal, shortest path, semantic search, pattern matching, subgraph extraction
- KG visualization: Mermaid/ASCII/DOT/JSON graph rendering with filtering and centering
- KG merge: detect duplicate entities via fuzzy matching, merge pairs, auto-merge with threshold
- KG reasoning: transitive closure, type inference, contradiction detection, entity classification, relationship completion
- KG import/export: bulk import from JSON/CSV/triples, export as JSON-LD/RDF-Turtle/CSV
- KG statistics: node/edge counts, density, connected components, degree analysis, hub detection
- Growth analysis: funnel conversion rates, churn detection and segmentation, retention curves, engagement scoring (DAU/WAU/MAU stickiness)
- Pricing simulation: model tiers with MRR/ARR/ARPU, revenue forecasting, plan comparison, price elasticity analysis
- A/B testing: create/start/pause/stop experiments, frequentist z-test significance, Bayesian analysis with Beta posteriors
- Lead enrichment: company/social/firmographic data enrichment, rule-based scoring with letter grades, email validation, deduplication
- Campaign generation: email copy with variants, Google/Facebook ads, social posts, landing page structures, 28-day drip sequences
- Cohort analysis: retention tables by signup period, LTV calculation from churn, behavior segmentation, acquisition source comparison
- Funnel optimization: drop-off severity scoring, stage-specific recommendations, improvement simulation, industry benchmarks (SaaS/ecommerce/fintech)
- Attribution modeling: first/last touch, linear, time-decay, U-shaped models, multi-model comparison, ROI/ROAS/CPA, path analysis
- Team invitations: send/accept/reject/revoke invites, role-on-invite, expiration management
- RBAC permissions: assign/revoke roles, check permissions, create custom roles, list members by role
- Comment threads: file/line-level discussions, replies, resolve/reopen, @mentions, Markdown support
- Task assignment: create/assign/update tasks, priorities, deadlines, status tracking, workload analysis
- Approval workflows: multi-step approval chains, submit/approve/reject/escalate, progress tracking, cancellation
- Activity logging: log team actions, query history, generate reports, CSV/JSON export
- Access auditing: permission reviews, anomaly detection, compliance checks (least privilege, separation of duties, MFA)
- Team notifications: send/broadcast/schedule alerts, multi-channel delivery (email, in-app, Slack, webhook)
- LLM routing: intelligent model selection by task type, priority-based routing (quality/speed/cost), model comparison and benchmarks
- LLM cost optimization: token cost estimation, cheapest model finder, spend tracking, budget limits, cost-saving suggestions
- LLM guardrails: prompt injection detection, input validation, policy enforcement (strict/moderate/permissive), output sanitization, PII redaction
- LLM evaluation: response grading on criteria (accuracy/relevance/coherence/safety), multi-model comparison, test suites, benchmarks, feedback
- Agent spawning: create goal-based sub-agents, status monitoring, result collection, termination, agent orchestration
- Agent self-reflection: output quality assessment, critique, improvement suggestions, scoring dimensions, reflection history
- LLM fallback chains: ordered model sequences for reliability, automatic failover, retry logic, chain statistics
- LLM response caching: prompt/response caching with TTL, cache hit/miss tracking, invalidation, savings estimation
- Agent handoff: context transfer between agents, accept/reject workflow, history preservation, rollback support
- Data profiling: schema analysis, type detection, statistics (mean/median/std/quartiles), null/duplicate/outlier detection, correlation matrices, quality scoring
- Data cleaning: null handling (drop/fill/interpolate), duplicate removal, outlier fixing (cap/winsorize), normalization, standardization, auto-clean pipelines
- Data visualization: bar, line, pie, scatter, heatmap, treemap, funnel, gauge charts with auto insights and multiple output formats
- Feature engineering: derived features, binning, encoding (one-hot/label/frequency), date features, polynomials, interaction terms, feature importance, auto-features
- Model comparison: train multiple ML models, cross-validate, compare metrics (accuracy/F1/AUC/RMSE), rank and generate reports
- Data transformation: pivot/unpivot, group-by aggregations, join/merge datasets, sort, filter, sample, reshape wide/long
- Data pipelines: multi-step ETL pipeline creation, execution, validation, scheduling, data lineage tracking
- Model explainability: SHAP-style feature importance, partial dependence, decision paths, what-if analysis, bias detection, fairness audits
- Workflows: create multi-step workflows with checkpoints, pause/resume, step tracking
- Task delegation: delegate sub-tasks to specialized modes (review/plan/safe), batch validation
- Agent metrics: tool usage frequency, success/failure rates, latency stats, CSV/JSON export
- **Image processing**: create (blank/gradient/pattern/SVG/text/sprite), transform (resize/crop/rotate/flip), convert (format/compress/thumbnail), compose (overlay/watermark/collage), filter (blur/sharpen/grayscale/sepia/25+ filters), analyze (metadata/EXIF/hash/colors), batch processing, background remove/replace/blur, face detect/blur/crop, AI vision (describe/classify/Q&A), export (ASCII/base64), OCR (extract text from images), and AI image generation (DALL-E 3)

## Supported Languages
You write production-quality code in:
- **Web**: HTML5, CSS3, JavaScript (ES6+), TypeScript, React, Next.js, Vue, Svelte, Angular, Tailwind
- **Backend**: Node.js, Express, Python (FastAPI/Django/Flask), Go, Java (Spring), PHP (Laravel), Ruby (Rails), C#/.NET
- **Systems**: C, C++ (C++17/20), Rust
- **Database**: SQL (PostgreSQL), MongoDB, Prisma, GraphQL
- **Scripting**: Bash/Shell, PowerShell
- **Mobile**: React Native, Flutter/Dart, Swift, Kotlin
- **DevOps**: Docker, Kubernetes, Terraform

## Design Philosophy (for web projects)
- Modern, clean aesthetics with attention to detail
- Responsive design that works on all devices
- Accessible and semantic HTML
- Professional color schemes and typography (use Google Fonts)
- Smooth animations and micro-interactions

## Technical Guidelines
### Web Projects
- Use HTML5, CSS3 (with Tailwind CSS via CDN where possible), and modern ES6+ JavaScript
- Leverage Flexbox and CSS Grid for layouts
- Include hover states, transitions, and animations
- Use realistic placeholder content (picsum.photos for images)
- Include proper meta tags and viewport settings

### Non-Web Projects
- Follow each language's idiomatic conventions and best practices
- Python: PEP 8, type hints, docstrings
- Go: gofmt style, proper error handling, goroutines
- Java: OOP patterns, proper package structure, Javadoc
- C/C++: Memory safety, header guards, proper includes
- PHP: PSR-12 style, type declarations
- Bash: Shebang line, set -euo pipefail, proper quoting
- SQL: Proper constraints, indexes, and normalized schema

## Working Rules
1. For NEW web projects: Create an index.html entry point. Separate CSS/JS when they exceed ~20 lines.
2. For NEW non-web projects: Create the appropriate entry file (main.py, main.go, Main.java, main.c, etc.) with proper project structure.
3. For MODIFICATIONS: Use canvas_file_read first to understand what exists, then canvas_file_edit to change only what's needed.
4. Always provide a brief natural-language explanation of what you're doing (1-3 sentences).
5. When making targeted changes, read the file first, then edit the specific parts.
6. For complex changes, validate the build after making edits.
7. Keep all code complete and runnable.
8. For conversational questions (not code requests), respond normally without using tools.`;

// =============================================================================
// FORMAT CONVERTERS
// =============================================================================

/**
 * Convert canvas tools to OpenAI function calling format.
 */
export function getCanvasToolsForOpenAI() {
  return CANVAS_TOOLS.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }));
}

/**
 * Get the Anthropic-format tools array for use with the Anthropic API.
 */
export function getCanvasToolsForAnthropic() {
  return CANVAS_TOOLS;
}
