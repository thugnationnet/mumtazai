/**
 * PM2 Ecosystem Config for AI Studio Demo Backend
 * This file can be used with: pm2 start ecosystem.ai-demo.config.cjs
 */

module.exports = {
  apps: [
    {
      name: 'ai-studio-demo-backend',
      script: 'server.js',
      cwd: '/home/ubuntu/shiny-friend-disco/backend/ai-studio-demo-backend',
      interpreter: '/usr/bin/node',
      node_args: '-r dotenv/config',
      env: {
        NODE_ENV: 'production',
        PORT: 3009,
        DOTENV_CONFIG_PATH: '/home/ubuntu/shiny-friend-disco/backend/ai-studio-demo-backend/.env',
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
