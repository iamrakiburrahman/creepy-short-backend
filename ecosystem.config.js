module.exports = {
  apps: [
    {
      name: 'templete-backend',
      script: 'dist/server.js',

      // Cluster Configuration
      instances: 'max', // সব CPU core use করবে (production এ best)
      exec_mode: 'cluster',

      // Restart Policy
      autorestart: true,
      max_restarts: 10, // 5 থেকে 10 করলাম (বেশি flexible)
      min_uptime: '10s', // 10 second uptime থাকতে হবে restart count করার আগে
      restart_delay: 4000, // Restart এর আগে 4 second wait

      // Resource Limits
      max_memory_restart: '1G', // 1GB exceed করলে restart

      // Graceful Shutdown
      kill_timeout: 5000, // 5 second এর মধ্যে graceful shutdown না হলে force kill
      wait_ready: false, // এটা false করলাম (তোমার code এ ready signal নাই)
      listen_timeout: 10000, // Server listen করতে 10 second পর্যন্ত wait করবে

      // File Watching
      watch: false, // Production এ never true করবে না
      ignore_watch: ['node_modules', 'logs', '.git'],

      // Logging
      error_file: 'logs/pm2-err.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true, // সব instance এর logs একসাথে
      log_type: 'json', // JSON format এ logs (parsing এ সহজ)

      // Environment Variables
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },

      // Advanced Options
      source_map_support: true, // Source maps support (debugging এ helpful)
      instance_var: 'INSTANCE_ID', // প্রতি instance এ unique ID

      // Monitoring
      vizion: false, // Git metadata tracking (optional)
      post_update: ['npm install'], // Update এর পর automatically npm install

      // Graceful reload
      shutdown_with_message: false,

      // Cron restart (optional - রাতে 2am এ restart)
      // cron_restart: '0 2 * * *',

      // Performance
      node_args: '--max-old-space-size=2048', // 2GB heap size
    },
  ]
}