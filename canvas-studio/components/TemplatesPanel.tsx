import React, { useState, useEffect, useCallback } from 'react';
import {
  Template,
  ProgrammingLanguage,
  LanguageOption,
  TemplateCategory,
} from '../types';
import { TEMPLATE_FILES } from '../templateFiles';

// Language definitions with icons and colors
export const LANGUAGES: LanguageOption[] = [
  // ── Frontend / Web ──
  {
    id: 'html',
    name: 'HTML',
    icon: '🌐',
    color: '#e34c26',
    fileExtension: 'html',
    description: 'Web pages & layouts',
  },
  {
    id: 'css',
    name: 'CSS',
    icon: '🎨',
    color: '#264de4',
    fileExtension: 'css',
    description: 'Stylesheets',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    icon: '⚡',
    color: '#f7df1e',
    fileExtension: 'js',
    description: 'Dynamic web apps',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    icon: '🔷',
    color: '#3178c6',
    fileExtension: 'ts',
    description: 'Type-safe JavaScript',
  },
  {
    id: 'react',
    name: 'React',
    icon: '⚛️',
    color: '#61dafb',
    fileExtension: 'tsx',
    description: 'Component-based UI',
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    icon: '▲',
    color: '#000000',
    fileExtension: 'tsx',
    description: 'Full-stack React',
  },
  {
    id: 'vue',
    name: 'Vue',
    icon: '💚',
    color: '#4fc08d',
    fileExtension: 'vue',
    description: 'Progressive framework',
  },
  {
    id: 'svelte',
    name: 'Svelte',
    icon: '🔥',
    color: '#ff3e00',
    fileExtension: 'svelte',
    description: 'Compiler framework',
  },
  {
    id: 'angular',
    name: 'Angular',
    icon: '🅰️',
    color: '#dd0031',
    fileExtension: 'ts',
    description: 'Enterprise framework',
  },
  {
    id: 'tailwind',
    name: 'Tailwind',
    icon: '💨',
    color: '#38bdf8',
    fileExtension: 'html',
    description: 'Utility-first CSS',
  },
  {
    id: 'sass',
    name: 'Sass',
    icon: '💅',
    color: '#cc6699',
    fileExtension: 'scss',
    description: 'CSS preprocessor',
  },
  // ── Backend / Server ──
  {
    id: 'python',
    name: 'Python',
    icon: '🐍',
    color: '#3776ab',
    fileExtension: 'py',
    description: 'AI, Data, Automation',
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    icon: '🟢',
    color: '#339933',
    fileExtension: 'js',
    description: 'Server-side JS',
  },
  {
    id: 'express',
    name: 'Express',
    icon: '🚂',
    color: '#000000',
    fileExtension: 'js',
    description: 'REST APIs',
  },
  {
    id: 'fastapi',
    name: 'FastAPI',
    icon: '⚡',
    color: '#009688',
    fileExtension: 'py',
    description: 'Modern Python API',
  },
  {
    id: 'django',
    name: 'Django',
    icon: '🎸',
    color: '#092e20',
    fileExtension: 'py',
    description: 'Python web framework',
  },
  {
    id: 'flask',
    name: 'Flask',
    icon: '🧪',
    color: '#000000',
    fileExtension: 'py',
    description: 'Lightweight Python web',
  },
  {
    id: 'java',
    name: 'Java',
    icon: '☕',
    color: '#ed8b00',
    fileExtension: 'java',
    description: 'Enterprise & Android',
  },
  {
    id: 'spring',
    name: 'Spring',
    icon: '🌱',
    color: '#6db33f',
    fileExtension: 'java',
    description: 'Java framework',
  },
  {
    id: 'go',
    name: 'Go',
    icon: '🔵',
    color: '#00add8',
    fileExtension: 'go',
    description: 'Fast, concurrent apps',
  },
  {
    id: 'rust',
    name: 'Rust',
    icon: '🦀',
    color: '#dea584',
    fileExtension: 'rs',
    description: 'Memory-safe systems',
  },
  {
    id: 'csharp',
    name: 'C#',
    icon: '🟣',
    color: '#239120',
    fileExtension: 'cs',
    description: '.NET development',
  },
  {
    id: 'dotnet',
    name: '.NET',
    icon: '🔮',
    color: '#512bd4',
    fileExtension: 'cs',
    description: '.NET framework',
  },
  {
    id: 'php',
    name: 'PHP',
    icon: '🐘',
    color: '#777bb4',
    fileExtension: 'php',
    description: 'Web & server-side',
  },
  {
    id: 'laravel',
    name: 'Laravel',
    icon: '🏗️',
    color: '#ff2d20',
    fileExtension: 'php',
    description: 'PHP framework',
  },
  {
    id: 'ruby',
    name: 'Ruby',
    icon: '💎',
    color: '#cc342d',
    fileExtension: 'rb',
    description: 'Elegant scripting',
  },
  {
    id: 'rails',
    name: 'Rails',
    icon: '🛤️',
    color: '#cc0000',
    fileExtension: 'rb',
    description: 'Ruby framework',
  },
  // ── Database ──
  {
    id: 'sql',
    name: 'SQL',
    icon: '🗄️',
    color: '#336791',
    fileExtension: 'sql',
    description: 'Database queries',
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    icon: '🐘',
    color: '#336791',
    fileExtension: 'sql',
    description: 'Advanced SQL database',
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    icon: '🍃',
    color: '#47a248',
    fileExtension: 'json',
    description: 'NoSQL document DB',
  },
  {
    id: 'prisma',
    name: 'Prisma',
    icon: '🔺',
    color: '#2d3748',
    fileExtension: 'prisma',
    description: 'Type-safe ORM',
  },
  {
    id: 'graphql',
    name: 'GraphQL',
    icon: '◈',
    color: '#e10098',
    fileExtension: 'graphql',
    description: 'API query language',
  },
  // ── Mobile ──
  {
    id: 'reactnative',
    name: 'React Native',
    icon: '📱',
    color: '#61dafb',
    fileExtension: 'tsx',
    description: 'Cross-platform mobile',
  },
  {
    id: 'flutter',
    name: 'Flutter',
    icon: '🦋',
    color: '#02569b',
    fileExtension: 'dart',
    description: 'Dart mobile/desktop',
  },
  {
    id: 'swift',
    name: 'Swift',
    icon: '🍎',
    color: '#fa7343',
    fileExtension: 'swift',
    description: 'iOS & macOS apps',
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    icon: '🟠',
    color: '#7f52ff',
    fileExtension: 'kt',
    description: 'Android & JVM',
  },
  // ── Systems ──
  {
    id: 'c',
    name: 'C',
    icon: '⚙️',
    color: '#555555',
    fileExtension: 'c',
    description: 'Systems programming',
  },
  {
    id: 'cpp',
    name: 'C++',
    icon: '🔧',
    color: '#00599c',
    fileExtension: 'cpp',
    description: 'Performance-critical apps',
  },
  // ── DevOps & Tools ──
  {
    id: 'docker',
    name: 'Docker',
    icon: '🐳',
    color: '#2496ed',
    fileExtension: 'dockerfile',
    description: 'Containerization',
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    icon: '☸️',
    color: '#326ce5',
    fileExtension: 'yaml',
    description: 'Container orchestration',
  },
  {
    id: 'terraform',
    name: 'Terraform',
    icon: '🏗️',
    color: '#7b42bc',
    fileExtension: 'tf',
    description: 'Infrastructure as code',
  },
  {
    id: 'bash',
    name: 'Bash',
    icon: '💻',
    color: '#4eaa25',
    fileExtension: 'sh',
    description: 'Shell scripts',
  },
  {
    id: 'powershell',
    name: 'PowerShell',
    icon: '🖥️',
    color: '#012456',
    fileExtension: 'ps1',
    description: 'Windows automation',
  },
  // ── Data & Config ──
  {
    id: 'json',
    name: 'JSON',
    icon: '📋',
    color: '#292929',
    fileExtension: 'json',
    description: 'Data interchange',
  },
  {
    id: 'yaml',
    name: 'YAML',
    icon: '📄',
    color: '#cb171e',
    fileExtension: 'yaml',
    description: 'Config files',
  },
  {
    id: 'markdown',
    name: 'Markdown',
    icon: '📝',
    color: '#000000',
    fileExtension: 'md',
    description: 'Documentation',
  },
  {
    id: 'xml',
    name: 'XML',
    icon: '📦',
    color: '#f16529',
    fileExtension: 'xml',
    description: 'Structured data',
  },
  // ── AI & Data Science ──
  {
    id: 'jupyter',
    name: 'Jupyter',
    icon: '📓',
    color: '#f37726',
    fileExtension: 'ipynb',
    description: 'Notebooks & data',
  },
  {
    id: 'r',
    name: 'R',
    icon: '📊',
    color: '#276dc3',
    fileExtension: 'r',
    description: 'Statistics & analytics',
  },
];

// Category metadata
export const CATEGORIES: { id: TemplateCategory; name: string; icon: string }[] = [
  { id: 'landing', name: 'Landing Pages', icon: '🚀' },
  { id: 'dashboard', name: 'Dashboards', icon: '📊' },
  { id: 'ecommerce', name: 'E-commerce', icon: '🛒' },
  { id: 'portfolio', name: 'Portfolios', icon: '💼' },
  { id: 'api', name: 'APIs & Backend', icon: '⚡' },
  { id: 'database', name: 'Database', icon: '🗄️' },
  { id: 'automation', name: 'Automation', icon: '🤖' },
  { id: 'component', name: 'Components', icon: '🧩' },
  { id: 'fullstack', name: 'Full-Stack', icon: '🔥' },
  { id: 'game', name: 'Games', icon: '🎮' },
];

// Templates organized by language and category
export const TEMPLATES: Template[] = [
  // HTML Templates
  {
    id: 'saas-landing',
    name: 'SaaS Landing Page',
    description:
      'Modern landing page with hero, features, pricing, and CTA sections',
    prompt:
      'Build a modern SaaS landing page for a productivity tool with a hero section featuring animated gradients, a features grid with hover effects, pricing cards, testimonials carousel, and a call-to-action section. Use modern CSS with smooth animations.',
    language: 'html',
    category: 'landing',
    tags: ['marketing', 'startup', 'business'],
  },
  {
    id: 'portfolio',
    name: 'Developer Portfolio',
    description: 'Clean portfolio site with projects showcase and contact form',
    prompt:
      'Create a minimal developer portfolio website with a hero section showing name and title, a projects grid with hover effects and project cards, skills section with animated progress bars, and a contact form. Dark theme with accent color.',
    language: 'html',
    category: 'portfolio',
    tags: ['personal', 'developer', 'showcase'],
  },
  {
    id: 'dashboard-html',
    name: 'Analytics Dashboard',
    description: 'Dark-themed dashboard with charts and stats cards',
    prompt:
      'Create a dark-themed analytics dashboard with a sidebar navigation, header with search and notifications, stat cards showing key metrics, placeholder charts area, and a recent activity list. Modern glassmorphism style.',
    language: 'html',
    category: 'dashboard',
    tags: ['admin', 'analytics', 'metrics'],
  },
  {
    id: 'ecommerce-store',
    name: 'E-commerce Store',
    description: 'Product listing page with cart functionality',
    prompt:
      'Build an elegant e-commerce storefront with a product grid showing images, prices, and add-to-cart buttons. Include a sticky header with cart icon and item count, filter sidebar, and responsive product cards with hover effects.',
    language: 'html',
    category: 'ecommerce',
    tags: ['shop', 'products', 'retail'],
  },

  // React Templates
  {
    id: 'react-dashboard',
    name: 'React Dashboard',
    description: 'Full-featured admin dashboard with state management',
    prompt:
      'Create a React admin dashboard component with useState for managing sidebar toggle, dark mode, and notifications. Include a responsive sidebar, header with user menu, stats cards with icons, and a data table component. Use Tailwind classes.',
    language: 'react',
    category: 'dashboard',
    tags: ['admin', 'spa', 'management'],
  },
  {
    id: 'react-todo',
    name: 'Todo App',
    description: 'Complete todo app with CRUD and filters',
    prompt:
      'Build a React todo application with useState and useEffect. Features: add/edit/delete todos, mark complete, filter by status (all/active/completed), local storage persistence, and a clean minimal UI with animations.',
    language: 'react',
    category: 'component',
    tags: ['productivity', 'crud', 'state'],
  },
  {
    id: 'react-auth',
    name: 'Auth Components',
    description: 'Login, signup, and password reset forms',
    prompt:
      'Create a set of React authentication components: Login form, Signup form, and Password Reset form. Include form validation, error states, loading states, and social login buttons. Modern card-based design.',
    language: 'react',
    category: 'component',
    tags: ['auth', 'forms', 'security'],
  },

  // Python Templates
  {
    id: 'python-api',
    name: 'FastAPI Backend',
    description: 'REST API with endpoints and models',
    prompt:
      'Create a FastAPI backend with CRUD endpoints for a user management system. Include Pydantic models for User, async database operations placeholder, authentication middleware, and proper error handling with HTTPException.',
    language: 'python',
    category: 'api',
    tags: ['backend', 'rest', 'async'],
  },
  {
    id: 'python-scraper',
    name: 'Web Scraper',
    description: 'BeautifulSoup scraper with data extraction',
    prompt:
      'Build a Python web scraper using requests and BeautifulSoup. Include functions for fetching pages, parsing HTML, extracting specific data (titles, links, prices), handling pagination, and saving results to CSV.',
    language: 'python',
    category: 'automation',
    tags: ['scraping', 'data', 'automation'],
  },
  {
    id: 'python-ml',
    name: 'ML Pipeline',
    description: 'Machine learning data pipeline with sklearn',
    prompt:
      'Create a Python machine learning pipeline using scikit-learn. Include data loading, preprocessing (scaling, encoding), train-test split, model training (Random Forest), evaluation metrics, and prediction function.',
    language: 'python',
    category: 'automation',
    tags: ['ml', 'ai', 'data-science'],
  },
  {
    id: 'python-discord',
    name: 'Discord Bot',
    description: 'Discord bot with commands and events',
    prompt:
      'Build a Discord bot using discord.py with command handling, event listeners (on_message, on_ready), slash commands, embed messages, and moderation commands (kick, ban, mute). Include proper error handling.',
    language: 'python',
    category: 'automation',
    tags: ['bot', 'discord', 'chat'],
  },

  // Node.js Templates
  {
    id: 'express-api',
    name: 'Express REST API',
    description: 'Full REST API with middleware and routes',
    prompt:
      'Create an Express.js REST API with routes for users CRUD operations, JWT authentication middleware, error handling middleware, request validation, rate limiting, and CORS configuration. Include proper project structure.',
    language: 'express',
    category: 'api',
    tags: ['backend', 'rest', 'node'],
  },
  {
    id: 'node-cli',
    name: 'CLI Tool',
    description: 'Command-line tool with arguments parsing',
    prompt:
      'Build a Node.js CLI tool using commander.js for argument parsing. Include multiple commands, options with defaults, interactive prompts using inquirer, colored output, progress indicators, and help documentation.',
    language: 'nodejs',
    category: 'automation',
    tags: ['cli', 'tool', 'utility'],
  },
  {
    id: 'node-websocket',
    name: 'WebSocket Server',
    description: 'Real-time WebSocket server with rooms',
    prompt:
      'Create a Node.js WebSocket server using ws library. Include connection handling, room/channel management, broadcast messaging, private messages, heartbeat/ping-pong, and connection cleanup.',
    language: 'nodejs',
    category: 'api',
    tags: ['realtime', 'websocket', 'chat'],
  },

  // TypeScript Templates
  {
    id: 'ts-types',
    name: 'Type Definitions',
    description: 'TypeScript interfaces and type utilities',
    prompt:
      'Create a comprehensive TypeScript type definitions file with interfaces for User, Product, Order entities. Include utility types, generic types, discriminated unions, type guards, and mapped types examples.',
    language: 'typescript',
    category: 'component',
    tags: ['types', 'interfaces', 'utility'],
  },

  // SQL Templates
  {
    id: 'sql-schema',
    name: 'Database Schema',
    description: 'Complete database schema with relationships',
    prompt:
      'Create a SQL database schema for an e-commerce system. Include tables for users, products, categories, orders, order_items, reviews, and addresses. Add proper foreign keys, indexes, and constraints.',
    language: 'sql',
    category: 'database',
    tags: ['schema', 'database', 'relations'],
  },
  {
    id: 'sql-queries',
    name: 'Advanced Queries',
    description: 'Complex SQL queries with joins and aggregations',
    prompt:
      'Write advanced SQL queries including: complex JOINs across multiple tables, subqueries, CTEs (Common Table Expressions), window functions, aggregations with GROUP BY and HAVING, and performance-optimized queries.',
    language: 'sql',
    category: 'database',
    tags: ['queries', 'joins', 'analytics'],
  },

  // Next.js Templates
  {
    id: 'nextjs-blog',
    name: 'Blog with MDX',
    description: 'Next.js blog with markdown support',
    prompt:
      'Create a Next.js 14 blog application with App Router. Include a home page listing posts, individual post pages with MDX rendering, categories, search functionality, and SEO metadata. Use Server Components.',
    language: 'nextjs',
    category: 'fullstack',
    tags: ['blog', 'mdx', 'seo'],
  },
  {
    id: 'nextjs-saas',
    name: 'SaaS Starter',
    description: 'Full SaaS boilerplate with auth and billing',
    prompt:
      'Create a Next.js 14 SaaS starter with App Router. Include authentication pages, dashboard layout, subscription/pricing page, settings page, and API route handlers. Use TypeScript and Tailwind.',
    language: 'nextjs',
    category: 'fullstack',
    tags: ['saas', 'auth', 'subscription'],
  },

  // Tailwind Templates
  {
    id: 'tailwind-components',
    name: 'UI Component Library',
    description: 'Reusable Tailwind components collection',
    prompt:
      'Create a collection of reusable Tailwind CSS components: buttons (variants), input fields, cards, modals, dropdowns, navigation bar, footer, alert/toast notifications, badges, and avatar components.',
    language: 'tailwind',
    category: 'component',
    tags: ['ui', 'components', 'library'],
  },

  // Game Templates
  {
    id: 'html-game',
    name: 'Canvas Game',
    description: 'Simple HTML5 canvas game',
    prompt:
      'Create an HTML5 canvas game - a simple space shooter. Include player movement with arrow keys, shooting with spacebar, enemy spawning, collision detection, score tracking, and game over state.',
    language: 'html',
    category: 'game',
    tags: ['game', 'canvas', 'interactive'],
  },

  // Bash Templates
  {
    id: 'bash-deploy',
    name: 'Deploy Script',
    description: 'Automated deployment script with rollback',
    prompt:
      'Create a Bash deployment script with: argument parsing for environment (staging/production), pre-deployment checks (disk space, dependencies), git pull and build steps, service restart with health check, automatic rollback on failure, and colored log output. Use set -euo pipefail.',
    language: 'bash',
    category: 'automation',
    tags: ['deploy', 'devops', 'ci-cd'],
  },
  {
    id: 'bash-setup',
    name: 'Dev Environment Setup',
    description: 'System setup script for new dev machines',
    prompt:
      'Create a Bash script that sets up a development environment: detect OS (macOS/Ubuntu), install Homebrew or apt packages (git, node, python, docker), configure shell (zsh with oh-my-zsh), set up SSH keys, clone project repos, and create aliases. Include --dry-run flag.',
    language: 'bash',
    category: 'automation',
    tags: ['setup', 'environment', 'devops'],
  },

  // PHP Templates
  {
    id: 'php-api',
    name: 'PHP REST API',
    description: 'Clean REST API with routing and middleware',
    prompt:
      'Create a PHP 8.2+ REST API from scratch with: a simple router class, JSON request/response handling, middleware support (CORS, auth), CRUD endpoints for a "products" resource, PDO database abstraction, input validation, and proper error handling with HTTP status codes. No framework required.',
    language: 'php',
    category: 'api',
    tags: ['backend', 'rest', 'api'],
  },
  {
    id: 'php-auth',
    name: 'PHP Authentication System',
    description: 'Secure login/register with sessions and JWT',
    prompt:
      'Build a PHP 8+ authentication system with: user registration with password hashing (password_hash), login with session management, JWT token generation and validation, CSRF protection, rate limiting on login attempts, and a simple HTML login/register form. Use PDO for database.',
    language: 'php',
    category: 'component',
    tags: ['auth', 'security', 'sessions'],
  },

  // Go Templates
  {
    id: 'go-api',
    name: 'Go REST API',
    description: 'HTTP server with routing and middleware',
    prompt:
      'Create a Go REST API using the standard net/http package with: a custom router with path parameters, middleware chain (logging, CORS, auth), JSON encode/decode helpers, CRUD handlers for a "tasks" resource, graceful shutdown, and structured error responses. Use Go modules (go.mod).',
    language: 'go',
    category: 'api',
    tags: ['backend', 'rest', 'http'],
  },
  {
    id: 'go-cli',
    name: 'Go CLI Tool',
    description: 'Command-line tool with subcommands',
    prompt:
      'Build a Go CLI application with: subcommands (init, run, status), flag parsing for each subcommand, colored terminal output, a config file reader (JSON/YAML), progress spinner for long operations, and proper error handling with exit codes. Use only the standard library.',
    language: 'go',
    category: 'automation',
    tags: ['cli', 'tool', 'utility'],
  },
  {
    id: 'go-concurrent',
    name: 'Concurrent Worker Pool',
    description: 'Goroutine worker pool with channels',
    prompt:
      'Create a Go program demonstrating concurrent programming: a worker pool pattern with configurable workers, job queue using channels, context-based cancellation, WaitGroup synchronization, rate limiting, error collection from workers, and a progress reporter. Include main() with example usage.',
    language: 'go',
    category: 'automation',
    tags: ['concurrency', 'goroutines', 'channels'],
  },

  // Java Templates
  {
    id: 'java-api',
    name: 'Java REST API',
    description: 'Spring Boot REST API with JPA',
    prompt:
      'Create a Java Spring Boot REST API with: a main Application class, a User entity with JPA annotations, a UserRepository interface extending JpaRepository, a UserService with business logic, a UserController with CRUD endpoints (@GetMapping, @PostMapping, etc.), proper DTOs, exception handling with @ControllerAdvice, and application.properties config.',
    language: 'java',
    category: 'api',
    tags: ['spring', 'backend', 'rest'],
  },
  {
    id: 'java-patterns',
    name: 'Design Patterns',
    description: 'Common OOP design patterns in Java',
    prompt:
      'Implement common Java design patterns in a single file: Singleton (thread-safe), Factory Method, Observer, Strategy, Builder, and Decorator patterns. Each pattern should have a clear interface/abstract class, concrete implementations, and a demo in main() showing usage. Include Javadoc comments.',
    language: 'java',
    category: 'component',
    tags: ['oop', 'patterns', 'architecture'],
  },

  // C Templates
  {
    id: 'c-data-structures',
    name: 'Data Structures',
    description: 'Linked list, stack, queue in C',
    prompt:
      'Create a C program implementing core data structures: a singly linked list with insert/delete/search/print, a stack using arrays with push/pop/peek, and a queue using arrays with enqueue/dequeue. Include proper memory management (malloc/free), header guards, error handling for overflow/underflow, and a main() function demonstrating all operations.',
    language: 'c',
    category: 'component',
    tags: ['algorithms', 'data-structures', 'memory'],
  },
  {
    id: 'c-file-io',
    name: 'File I/O Utility',
    description: 'File reading, writing, and parsing in C',
    prompt:
      'Create a C program for file operations: read a CSV file line by line, parse fields into a struct array, sort records by a field, write results to a new file, and print a formatted table to stdout. Include proper fopen/fclose error handling, dynamic memory allocation, and command-line argument parsing for input/output filenames.',
    language: 'c',
    category: 'automation',
    tags: ['file-io', 'parsing', 'utility'],
  },

  // C++ Templates
  {
    id: 'cpp-modern',
    name: 'Modern C++ Showcase',
    description: 'C++17/20 features demo',
    prompt:
      'Create a modern C++ program showcasing C++17/20 features: std::optional, std::variant, structured bindings, if-constexpr, fold expressions, std::filesystem for directory listing, range-based algorithms, smart pointers (unique_ptr, shared_ptr), lambda expressions, and a simple template class. Include a main() demonstrating each feature with comments.',
    language: 'cpp',
    category: 'component',
    tags: ['modern', 'c++17', 'features'],
  },
  {
    id: 'cpp-oop',
    name: 'OOP Class Hierarchy',
    description: 'Inheritance, polymorphism, RAII in C++',
    prompt:
      'Create a C++ program demonstrating OOP: a Shape base class with pure virtual area()/perimeter(), derived Circle/Rectangle/Triangle classes, operator overloading (<<, ==), copy/move constructors, RAII resource management, a ShapeCollection using std::vector<std::unique_ptr<Shape>>, and factory method pattern. Include main() with polymorphic usage.',
    language: 'cpp',
    category: 'component',
    tags: ['oop', 'raii', 'polymorphism'],
  },

  // Rust Templates
  {
    id: 'rust-cli',
    name: 'Rust CLI App',
    description: 'Command-line tool with clap and error handling',
    prompt:
      'Create a Rust CLI application with: argument parsing with clap derive macros, file reading and processing, custom error types with thiserror, Result-based error handling, colored terminal output, and a main function demonstrating usage. Include Cargo.toml with dependencies.',
    language: 'rust',
    category: 'automation',
    tags: ['cli', 'systems', 'tool'],
  },
  {
    id: 'rust-web',
    name: 'Rust Web Server',
    description: 'Actix-web REST API with handlers',
    prompt:
      'Build a Rust REST API with actix-web: define routes for CRUD operations on a "tasks" resource, use serde for JSON serialization, implement middleware for logging, structured error responses, an in-memory store using Arc<Mutex<Vec<Task>>>, and health check endpoint. Include Cargo.toml.',
    language: 'rust',
    category: 'api',
    tags: ['web', 'actix', 'rest'],
  },

  // Swift Templates
  {
    id: 'swift-ios',
    name: 'Swift iOS View',
    description: 'SwiftUI view with state management',
    prompt:
      'Create a SwiftUI iOS app with: a main ContentView using NavigationStack, a list view with search, a detail view, @State and @ObservedObject for state management, a ViewModel class with async data fetching, custom modifiers, and dark mode support. Include model structs with Codable.',
    language: 'swift',
    category: 'component',
    tags: ['ios', 'swiftui', 'mobile'],
  },

  // Kotlin Templates
  {
    id: 'kotlin-android',
    name: 'Kotlin Android Activity',
    description: 'Android Compose UI with ViewModel',
    prompt:
      'Create a Kotlin Android app with Jetpack Compose: a main screen composable with top bar and FAB, a list/detail navigation pattern, a ViewModel with StateFlow, data class models, a repository pattern for data access, and Material3 theming. Include preview composables.',
    language: 'kotlin',
    category: 'component',
    tags: ['android', 'compose', 'mobile'],
  },

  // C# Templates
  {
    id: 'csharp-api',
    name: 'C# Web API',
    description: 'ASP.NET Core minimal API',
    prompt:
      'Create a C# ASP.NET Core minimal API with: builder.Services and app.Map* pattern, CRUD endpoints for a "Products" resource, Entity Framework Core model and DbContext, DTOs with record types, input validation, error handling middleware, and Swagger/OpenAPI configuration. Include Program.cs with dependency injection setup.',
    language: 'csharp',
    category: 'api',
    tags: ['dotnet', 'backend', 'rest'],
  },
  {
    id: 'csharp-patterns',
    name: 'C# Design Patterns',
    description: 'SOLID patterns with modern C#',
    prompt:
      'Implement design patterns in modern C# 12: Repository pattern with generics, Mediator pattern, Options pattern for configuration, Result<T> pattern for error handling, extension methods, async/await best practices, nullable reference types, and primary constructors. Include a Program.cs with demo usage.',
    language: 'csharp',
    category: 'component',
    tags: ['patterns', 'solid', 'architecture'],
  },

  // Ruby Templates
  {
    id: 'ruby-script',
    name: 'Ruby Automation Script',
    description: 'Task automation with file processing',
    prompt:
      'Create a Ruby script for file automation: parse command-line arguments with OptionParser, read and process CSV/JSON files, transform data with map/select/reduce, generate reports, write output files, colorized logging with proper error handling, and a class-based architecture. Include Gemfile.',
    language: 'ruby',
    category: 'automation',
    tags: ['scripting', 'automation', 'utility'],
  },

  // Docker Templates
  {
    id: 'docker-node',
    name: 'Node.js Dockerfile',
    description: 'Production-ready multi-stage Docker build',
    prompt:
      'Create a production-ready Dockerfile for a Node.js application: multi-stage build (deps, builder, runner stages), node:20-alpine base, non-root user, health check, .dockerignore file, docker-compose.yml with the app service plus PostgreSQL and Redis, environment variables, volume mounts, and network configuration.',
    language: 'docker',
    category: 'automation',
    tags: ['container', 'deployment', 'devops'],
  },

  // Terraform Templates
  {
    id: 'terraform-aws',
    name: 'AWS Infrastructure',
    description: 'Terraform AWS VPC, EC2, RDS setup',
    prompt:
      'Create a Terraform configuration for AWS: VPC with public/private subnets, security groups, an EC2 instance with user data, an RDS PostgreSQL instance, S3 bucket with policy, IAM roles, variables.tf for configuration, outputs.tf for exported values, and terraform.tfvars example. Use terraform block with required_providers.',
    language: 'terraform',
    category: 'automation',
    tags: ['aws', 'iac', 'cloud'],
  },

  // GraphQL Templates
  {
    id: 'graphql-schema',
    name: 'GraphQL API Schema',
    description: 'Complete schema with resolvers',
    prompt:
      'Create a GraphQL API with Apollo Server: type definitions for User, Post, Comment with relationships, queries (getUser, listPosts, searchPosts), mutations (createUser, createPost, addComment), input types, enums, custom scalars (DateTime), and resolvers for each operation. Include server setup with playground enabled.',
    language: 'graphql',
    category: 'api',
    tags: ['api', 'schema', 'apollo'],
  },

  // Vue Templates
  {
    id: 'vue-dashboard',
    name: 'Vue Dashboard',
    description: 'Vue 3 Composition API dashboard',
    prompt:
      'Create a Vue 3 dashboard using Composition API (script setup): a responsive layout with sidebar navigation, stat cards with reactive data, a filterable data table component, dark/light theme toggle with provide/inject, Pinia store for state, and chart placeholder components. Use Tailwind for styling.',
    language: 'vue',
    category: 'dashboard',
    tags: ['vue3', 'composition', 'admin'],
  },

  // React Native Templates
  {
    id: 'reactnative-app',
    name: 'React Native App',
    description: 'Mobile app with navigation and screens',
    prompt:
      'Create a React Native app with: React Navigation stack and tab navigators, a home screen with FlatList, a detail screen with ScrollView, a settings screen with switches, custom theme context, AsyncStorage for persistence, and reusable components (Button, Card, Avatar). Include TypeScript types.',
    language: 'reactnative',
    category: 'component',
    tags: ['mobile', 'navigation', 'cross-platform'],
  },

  // R Templates
  {
    id: 'r-analysis',
    name: 'R Data Analysis',
    description: 'Statistical analysis with ggplot2 visualization',
    prompt:
      'Create an R script for data analysis: load a dataset (mtcars or iris), clean and transform data with dplyr (filter, mutate, group_by, summarize), compute descriptive statistics, perform a linear regression, create ggplot2 visualizations (scatter, box, histogram, faceted plots), and output a summary report. Include library() calls.',
    language: 'r',
    category: 'automation',
    tags: ['statistics', 'visualization', 'data-science'],
  },

  // FastAPI Templates
  {
    id: 'fastapi-crud',
    name: 'FastAPI CRUD',
    description: 'Full CRUD API with Pydantic models',
    prompt:
      'Create a FastAPI application with: Pydantic models for request/response schemas, CRUD endpoints for a "products" resource, async SQLAlchemy database operations, dependency injection for DB sessions, built-in validation with error details, OAuth2 password bearer auth, and auto-generated OpenAPI docs. Include requirements.txt.',
    language: 'fastapi',
    category: 'api',
    tags: ['python', 'async', 'rest'],
  },

  // Django Templates
  {
    id: 'django-app',
    name: 'Django Web App',
    description: 'Django project with models and views',
    prompt:
      'Create a Django application with: models.py with Blog and Comment models, views.py with class-based views (ListView, DetailView, CreateView), urls.py with path routing, serializers.py for DRF API, admin.py with model registration, settings.py essentials, and templates/ with a base layout. Include requirements.txt.',
    language: 'django',
    category: 'fullstack',
    tags: ['python', 'web', 'orm'],
  },

  // Laravel Templates
  {
    id: 'laravel-crud',
    name: 'Laravel CRUD',
    description: 'Eloquent models with controllers and routes',
    prompt:
      'Create a Laravel application structure: an Article model with migration, a ResourceController with index/show/store/update/destroy, Form Request validation classes, API resource transformers, web.php and api.php routes, Blade view for the index page, and Factory/Seeder for test data. Include artisan command examples.',
    language: 'laravel',
    category: 'fullstack',
    tags: ['php', 'eloquent', 'mvc'],
  },

  // Spring Boot Templates
  {
    id: 'spring-microservice',
    name: 'Spring Microservice',
    description: 'Spring Boot microservice with REST and JPA',
    prompt:
      'Create a Spring Boot microservice with: @SpringBootApplication main class, @Entity Order model with JPA annotations, @Repository interface, @Service with business logic, @RestController with CRUD endpoints, global @ExceptionHandler, application.yml configuration, and Dockerfile. Include pom.xml dependencies.',
    language: 'spring',
    category: 'api',
    tags: ['java', 'microservice', 'enterprise'],
  },

  // Rails Templates
  {
    id: 'rails-api',
    name: 'Rails API',
    description: 'Rails API-only with serializers',
    prompt:
      'Create a Rails API-only application with: a User model with validations and has_many associations, a controller with jbuilder responses, routes with namespace and versioning, ActiveModel::Serializer, JWT authentication concern, rate limiting with Rack::Attack, and database migration. Include Gemfile.',
    language: 'rails',
    category: 'api',
    tags: ['ruby', 'rest', 'backend'],
  },

  // Svelte Templates
  {
    id: 'svelte-app',
    name: 'Svelte Dashboard',
    description: 'Reactive dashboard with stores',
    prompt:
      'Create a Svelte application with: a main App.svelte with routing, a Dashboard component with reactive stores, a DataTable component with sorting and filtering, a ThemeStore for dark/light mode, fetch-based API integration, transitions and animations, and CSS scoped styles. Include package.json scripts.',
    language: 'svelte',
    category: 'dashboard',
    tags: ['reactive', 'compile', 'fast'],
  },

  // Angular Templates
  {
    id: 'angular-app',
    name: 'Angular App',
    description: 'Angular component with services and routing',
    prompt:
      'Create an Angular application with: AppComponent with router-outlet, a ProductListComponent with input/output, a ProductService with HttpClient and Observable, a routing module with lazy loading, a shared module with pipes and directives, reactive forms with validation, and Angular Material integration. Include app.module.ts.',
    language: 'angular',
    category: 'fullstack',
    tags: ['enterprise', 'typescript', 'rxjs'],
  },

  // Flutter Templates
  {
    id: 'flutter-app',
    name: 'Flutter App',
    description: 'Dart mobile app with state management',
    prompt:
      'Create a Flutter application with: main.dart with MaterialApp and theme, a HomeScreen with BottomNavigationBar, a ListView with pull-to-refresh, a DetailScreen with Hero animation, a Provider-based state management, a model class with JSON serialization, and an API service with http package. Include pubspec.yaml.',
    language: 'flutter',
    category: 'component',
    tags: ['dart', 'mobile', 'cross-platform'],
  },
];

// (CATEGORIES already exported above)

interface TemplatesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: Template) => void;
  selectedLanguage: ProgrammingLanguage | 'all';
  onLanguageChange: (language: ProgrammingLanguage | 'all') => void;
  openOnTemplate?: Template | null;
}

// Get template files — use real built-in code if available, else fallback
function getTemplateFiles(template: Template): { name: string; content: string }[] {
  const builtIn = TEMPLATE_FILES[template.id];
  if (builtIn) {
    return Object.entries(builtIn).map(([path, content]) => ({
      name: path.startsWith('/') ? path.slice(1) : path,
      content,
    }));
  }

  // Fallback for templates without built-in code
  const ext = LANGUAGES.find((l) => l.id === template.language)?.fileExtension || 'txt';
  const base: { name: string; content: string }[] = [];
  if (['html', 'tailwind'].includes(template.language)) {
    base.push({ name: `index.${ext}`, content: `<!-- ${template.name} -->\n<!-- Use the AI agent to generate this template -->` });
    base.push({ name: 'styles.css', content: `/* Styles for ${template.name} */` });
  } else if (['react', 'nextjs'].includes(template.language)) {
    base.push({ name: `App.${ext}`, content: `// ${template.name}\n// Use the AI agent to generate this template` });
    base.push({ name: `index.${ext}`, content: `// Entry point` });
  } else if (template.language === 'python') {
    base.push({ name: `main.${ext}`, content: `# ${template.name}\n# Use the AI agent to generate this template` });
    base.push({ name: 'requirements.txt', content: `# Dependencies` });
  } else if (['nodejs', 'express'].includes(template.language)) {
    base.push({ name: `index.${ext}`, content: `// ${template.name}\n// Use the AI agent to generate this template` });
    base.push({ name: 'package.json', content: `{ "name": "${template.id}", "version": "1.0.0" }` });
  } else {
    base.push({ name: `${template.id}.${ext}`, content: `// ${template.name}\n// Use the AI agent to generate this template` });
  }
  base.push({ name: 'README.md', content: `# ${template.name}\n\n${template.description}` });
  return base;
}

// Generate a live preview HTML for any template
function generatePreviewHtml(template: Template): string {
  const lang = LANGUAGES.find((l) => l.id === template.language);
  const langName = lang?.name || template.language;
  const langColor = lang?.color || '#6366f1';
  const langIcon = lang?.icon || '📄';
  const features = (template.prompt || '')
    .split(/[,.]/)
    .filter((s) => s.trim().length > 10)
    .slice(0, 8)
    .map((s) => s.trim().replace(/^(with|include|includes|and|a|an|the|Build|Create|Implement)\s+/i, ''));

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;color:#e5e7eb;min-height:100vh;display:flex;flex-direction:column}
.header{background:linear-gradient(135deg,${langColor}22,${langColor}08);border-bottom:1px solid ${langColor}33;padding:24px 32px;display:flex;align-items:center;gap:16px}
.icon{width:48px;height:48px;border-radius:12px;background:${langColor};display:flex;align-items:center;justify-content:center;font-size:24px;color:white;flex-shrink:0}
.title{font-size:22px;font-weight:700;color:#f3f4f6}
.subtitle{font-size:13px;color:#9ca3af;margin-top:2px}
.badge{display:inline-block;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;background:${langColor}33;color:${langColor};margin-top:6px}
.content{flex:1;padding:32px;display:flex;flex-direction:column;gap:20px}
.section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${langColor};margin-bottom:8px}
.desc{font-size:14px;color:#d1d5db;line-height:1.6}
.features{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.feature{display:flex;align-items:start;gap:10px;padding:12px 16px;background:#111;border:1px solid #1f2937;border-radius:10px}
.check{color:${langColor};font-size:16px;margin-top:1px;flex-shrink:0}
.feature-text{font-size:13px;color:#d1d5db}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.tag{padding:4px 12px;border-radius:20px;font-size:11px;font-weight:500;background:${langColor}15;color:${langColor};border:1px solid ${langColor}33}
.meta{display:flex;gap:24px;margin-top:auto;padding-top:20px;border-top:1px solid #1f2937}
.meta-item{font-size:12px;color:#6b7280}
.meta-item strong{color:#d1d5db}
</style></head><body>
<div class="header">
<div class="icon">${langIcon}</div>
<div>
<div class="title">${template.name}</div>
<div class="subtitle">${template.description}</div>
<span class="badge">${langName}</span>
</div>
</div>
<div class="content">
<div>
<div class="section-title">What will be generated</div>
<div class="features">
${features.map((f) => `<div class="feature"><span class="check">✓</span><span class="feature-text">${f}</span></div>`).join('\n')}
</div>
</div>
${template.tags && template.tags.length > 0 ? `<div>
<div class="section-title">Tags</div>
<div class="tags">${template.tags.map((t) => `<span class="tag">#${t}</span>`).join('')}</div>
</div>` : ''}
<div class="meta">
<div class="meta-item">Language: <strong>${langName}</strong></div>
<div class="meta-item">Category: <strong>${CATEGORIES.find((c) => c.id === template.category)?.name || template.category}</strong></div>
<div class="meta-item">Type: <strong>AI Generated</strong></div>
</div>
</div>
</body></html>`;
}

const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  isOpen,
  onClose,
  onUseTemplate,
  selectedLanguage,
  onLanguageChange,
  openOnTemplate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const [viewTab, setViewTab] = useState<'preview' | 'code'>('preview');
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: string } | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (openOnTemplate) {
      openView(openOnTemplate);
    } else {
      setViewingTemplate(null);
    }
  }, [openOnTemplate]);

  // Generate preview from real template code (no API calls)
  const generatePreview = useCallback((template: Template) => {
    setPreviewLoading(true);
    try {
      const builtIn = TEMPLATE_FILES[template.id];
      const webLanguages = ['html', 'tailwind', 'css', 'javascript'];

      if (builtIn && webLanguages.includes(template.language)) {
        // Build a combined HTML preview from all template files
        const htmlFile = builtIn['/index.html'] || '';
        const cssFile = builtIn['/styles.css'] || '';
        const jsFile = builtIn['/script.js'] || builtIn['/game.js'] || '';

        if (htmlFile) {
          // Inline CSS and JS into the HTML for iframe preview
          let preview = htmlFile;
          if (cssFile && !preview.includes(cssFile.slice(0, 40))) {
            preview = preview.replace('</head>', `<style>${cssFile}</style>\n</head>`);
          }
          if (jsFile && !preview.includes(jsFile.slice(0, 40))) {
            preview = preview.replace('</body>', `<script>${jsFile}<\/script>\n</body>`);
          }
          // Remove external link/script refs
          preview = preview.replace(/<link\s+rel="stylesheet"\s+href="[^"]+"\s*\/?>/g, '');
          preview = preview.replace(/<script\s+src="[^"]+"\s*><\/script>/g, '');
          setPreviewHtml(preview);
          setPreviewLoading(false);
          return;
        }
      }

      if (builtIn && ['react', 'nextjs'].includes(template.language)) {
        // For React templates, show a styled code preview page
        const mainFile = builtIn['/App.tsx'] || builtIn['/App.jsx'] || '';
        const preview = `<!DOCTYPE html><html><head><style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, sans-serif; background: #0a0a0a; color: #e5e7eb; padding: 24px; }
          .banner { background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1)); border: 1px solid rgba(99,102,241,0.2); border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; }
          .banner h2 { font-size: 18px; margin-bottom: 4px; }
          .banner p { font-size: 13px; color: #9ca3af; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; background: rgba(99,102,241,0.2); color: #a5b4fc; margin-top: 8px; }
          pre { background: #111; border: 1px solid #1f2937; border-radius: 10px; padding: 16px; overflow-x: auto; font-size: 12px; line-height: 1.6; color: #d1d5db; }
          .info { font-size: 12px; color: #6b7280; margin-top: 12px; padding: 8px 12px; background: #111; border-radius: 8px; border-left: 3px solid #6366f1; }
        </style></head><body>
        <div class="banner"><h2>${template.name}</h2><p>${template.description}</p><span class="badge">⚛️ React Component</span></div>
        <pre>${mainFile.replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 2000)}</pre>
        <div class="info">💡 Click "Use Template" to load this into the editor. The AI agent can then modify it per your instructions.</div>
        </body></html>`;
        setPreviewHtml(preview);
        setPreviewLoading(false);
        return;
      }

      // Fallback: styled static preview for non-web templates
      setPreviewHtml(generatePreviewHtml(template));
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesLanguage =
      selectedLanguage === 'all' || template.language === selectedLanguage;
    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesLanguage && matchesCategory && matchesSearch;
  });

  const getLanguageColor = (langId: ProgrammingLanguage) => {
    return LANGUAGES.find((l) => l.id === langId)?.color || '#6366f1';
  };

  const getLanguageIcon = (langId: ProgrammingLanguage) => {
    return LANGUAGES.find((l) => l.id === langId)?.icon || '📄';
  };

  const openView = (template: Template) => {
    setViewingTemplate(template);
    setViewTab('preview');
    setSelectedFile(null);
    setPreviewHtml('');
    generatePreview(template);
  };

  const closeView = () => {
    setViewingTemplate(null);
    setSelectedFile(null);
    setPreviewHtml('');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Fullscreen backdrop */}
      <div className="fixed inset-0 bg-slate-400 dark:bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Fullscreen panel */}
      <div className="fixed inset-4 bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-violet-900/20">

        {/* ─────────────────────────────────────────────
            DETAIL VIEW — with live preview
        ───────────────────────────────────────────── */}
        {viewingTemplate ? (
          <div className="flex flex-col h-full">
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-violet-900/30 bg-gradient-to-r from-[#0d0d0d] to-[#0a0a0a] shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-sm">🔲</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Browse</span>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sub-bar with Back + Preview/Code toggle */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-violet-900/20 shrink-0">
              <button
                onClick={closeView}
                className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-violet-400 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="flex bg-white dark:bg-[#111] rounded-lg border border-violet-900/30 overflow-hidden">
                <button
                  onClick={() => setViewTab('preview')}
                  className={`px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    viewTab === 'preview'
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </button>
                <button
                  onClick={() => { setViewTab('code'); setSelectedFile(null); }}
                  className={`px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    viewTab === 'code'
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Code
                </button>
              </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 overflow-hidden">
              {viewTab === 'preview' ? (
                /* Live Preview iframe */
                <div className="h-full w-full bg-white dark:bg-[#111] relative">
                  {previewLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-slate-500">Generating preview...</p>
                    </div>
                  ) : previewHtml ? (
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts"
                      title={`Preview: ${viewingTemplate.name}`}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-600 text-sm">
                      No preview available
                    </div>
                  )}
                </div>
              ) : (
                /* Code view */
                <div className="flex flex-col h-full">
                  {/* File tabs */}
                  <div className="flex border-b border-violet-900/30 shrink-0 overflow-x-auto bg-slate-50 dark:bg-[#0d0d0d]">
                    {getTemplateFiles(viewingTemplate).map((file, idx) => (
                      <button
                        key={file.name}
                        onClick={() => setSelectedFile(file)}
                        className={`px-4 py-2.5 text-xs font-mono whitespace-nowrap transition-colors border-b-2 ${
                          (selectedFile?.name === file.name || (!selectedFile && idx === 0))
                            ? 'text-violet-400 border-violet-500 bg-violet-500/5'
                            : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/[0.02]'
                        }`}
                      >
                        {file.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-[#0d0d0d]">
                    <pre className="p-6 text-sm text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                      {(selectedFile || getTemplateFiles(viewingTemplate)[0])?.content || ''}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom bar with template info + Use button */}
            <div className="px-5 py-3 border-t border-violet-900/30 bg-slate-50 dark:bg-[#0d0d0d] flex items-center gap-4 shrink-0">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-900 dark:text-white text-sm shrink-0"
                style={{ backgroundColor: getLanguageColor(viewingTemplate.language) }}
              >
                {getLanguageIcon(viewingTemplate.language)}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{viewingTemplate.name}</h3>
                <p className="text-xs text-slate-500 truncate">{viewingTemplate.description}</p>
              </div>
              <button
                onClick={() => { onUseTemplate(viewingTemplate); onClose(); }}
                className="shrink-0 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-violet-500 hover:from-violet-600 hover:to-violet-600 text-slate-900 dark:text-white text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
                Use Template
              </button>
            </div>
          </div>
        ) : (
          /* ─────────────────────────────────────────────
              BROWSE VIEW — fullscreen grid
          ───────────────────────────────────────────── */
          <div className="flex flex-col h-full">
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-violet-900/30 bg-gradient-to-r from-[#0d0d0d] to-[#0a0a0a] shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-sm">🔲</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Browse</span>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Stats + Search */}
            <div className="px-5 pt-4 pb-3 shrink-0">
              <p className="text-xs text-slate-500 mb-3">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
              </p>
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#111] border border-violet-900/30 rounded-xl text-sm text-slate-700 dark:text-slate-300 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="px-5 pb-2 shrink-0">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-violet-500 text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 border border-violet-900/30'
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      selectedCategory === cat.id
                        ? 'bg-violet-500 text-slate-900 dark:text-white'
                        : 'text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 border border-violet-900/30'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Filter */}
            <div className="px-5 pb-3 shrink-0 overflow-x-auto">
              <div className="flex gap-2 pb-1">
                <button
                  onClick={() => onLanguageChange('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedLanguage === 'all'
                      ? 'bg-violet-500 text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 border border-violet-900/30'
                  }`}
                >
                  All
                </button>
                {LANGUAGES.filter((lang) =>
                  TEMPLATES.some((t) => t.language === lang.id)
                ).map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => onLanguageChange(lang.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedLanguage === lang.id
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 border border-violet-900/30'
                    }`}
                    style={selectedLanguage === lang.id ? { backgroundColor: lang.color } : {}}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 custom-scrollbar">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <p className="text-sm">No templates found</p>
                  <p className="text-xs mt-1">Try a different filter or search</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-white dark:bg-[#111] border border-violet-900/30 rounded-xl overflow-hidden hover:border-violet-500/30 hover:shadow-lg transition-all duration-200 flex flex-col"
                    >
                      {/* Card header */}
                      <div className="p-4 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-900 dark:text-white text-xs shrink-0"
                            style={{ backgroundColor: getLanguageColor(template.language) }}
                          >
                            {getLanguageIcon(template.language)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{template.name}</h3>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-violet-400 bg-violet-500/15 shrink-0">
                            {TEMPLATE_FILES[template.id] ? 'Built-in' : 'AI Gen'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2 line-clamp-2">{template.description}</p>
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold"
                          style={{
                            backgroundColor: `${getLanguageColor(template.language)}20`,
                            color: getLanguageColor(template.language),
                          }}
                        >
                          {LANGUAGES.find((l) => l.id === template.language)?.name}
                        </span>
                      </div>

                      {/* Card buttons */}
                      <div className="flex border-t border-violet-900/20">
                        <button
                          onClick={() => openView(template)}
                          className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-violet-400 hover:bg-violet-500/5 transition-colors flex items-center justify-center gap-1.5 border-r border-violet-900/20"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                        <button
                          onClick={() => { onUseTemplate(template); onClose(); }}
                          className="flex-1 py-2.5 text-xs font-bold bg-gradient-to-r from-violet-500 to-violet-500 hover:from-violet-600 hover:to-violet-600 text-slate-900 dark:text-white transition-all flex items-center justify-center gap-1.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                          Use
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TemplatesPanel;
