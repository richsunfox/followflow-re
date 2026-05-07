module.exports = {
  apps: [{
    name: 'always-on-worker',
    script: 'apps/worker/scheduler.ts',
    interpreter: 'npx',
    interpreterArgs: 'ts-node',
    watch: false,
    autorestart: true,
    max_memory_restart: '500M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/worker-error.log',
    out_file: './logs/worker-out.log',
  }]
};
