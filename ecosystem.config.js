    module.exports = {
    apps: [
        {
        name: 'creepy-backend',
        script: 'dist/server.js',

        // Cluster Configuration
        instances: 'max',
        exec_mode: 'cluster',

        // Restart Policy
        autorestart: true,
        max_restarts: 10,
        min_uptime: '10s',
        restart_delay: 4000,

        // Resource Limits
        max_memory_restart: '1G', 

        // Graceful Shutdown
        kill_timeout: 5000,
        wait_ready: false, 
        listen_timeout: 10000,

        // File Watching
        watch: false, // Production এ never true করবে না
        ignore_watch: ['node_modules', 'logs', '.git'],

        // Logging
        error_file: 'logs/pm2-err.log',
        out_file: 'logs/pm2-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true, 
        log_type: 'json', 

        // Environment Variables
 env_production: {
  SERVER_NAME: 'creepy-backend',
  NODE_ENV: 'production',
  IP_ADDRESS: '72.62.164.122',
  PORT: 5000,
  DATABASE_URL: 'mongodb://localhost:27017/creepy',
  JWT_SECRET: '12c1c1ed10454ca3b64ae21b783cd96418583ffc83b1015199b18986b57a689b',
  BCRYPT_SALT_ROUNDS: 12,
  JWT_EXPIRE_IN: '30d',
  SUPER_ADMIN_EMAIL: 'yaz.vega@raconligroup.com',
  SUPER_ADMIN_PASSWORD: 'admin@123',
  EMAIL_FROM: 'moshfiqurrahman37@gmail.com',
  EMAIL_USER: 'moshfiqurrahman37@gmail.com',
  EMAIL_PASS: 'mmys xoef mwuu osxk',
  EMAIL_HOST: 'smtp.gmail.com',
  EMAIL_PORT: 587,
ALLOWED_ORIGINS: '',
STRIPE_SECRET_KEY: 'sk_test_51OHIrVB5u2A30G2Q9lxqhjtmnbhi8Zvw76mm0ck9xWvEzd8SiVK7oT0XtKM8m0G7Uwvwh51piI9FjW4lNTfDVnNO00spGYZeLP',
STRIPE_PAYMENT_SUCCESS_URL: 'http://localhost:5173',
STRIPE_PAYMENT_CANCEL_URL: 'http://localhost:5173',
// SOCIAL MEDIA AUTHENTICATION TOKEN
//  EXPRESS SESSION
EXPRESS_SESSION_SECRET_KEY: '1f0daf15f0eb36b336e7cbc742c0165b4c30b59efb63367348d90bd10f9f3c24498ec1c64ea83ae998809d23f114f9af400e9fc44f28403a7771c564dd134f5b',
// GOOGLE 
// OAuth Configuration
GOOGLE_CLIENT_ID: 'your_google_client_id_here',
GOOGLE_CLIENT_SECRET: 'your_google_client_secret_here',
GOOGLE_CALLBACK_URL: 'http://localhost:5000/api/v1/auth/google/callback',

FACEBOOK_CLIENT_ID: 'your_facebook_client_id_here',
FACEBOOK_CLIENT_SECRET: 'your_facebook_client_secret_here',
// # BUNNY CDN
BUNNY_CDN_API_KEY: '8fdbd7f1-0aaf-4186-aae3ae7153fe-428a-4d45',
BUNNY_CDN_STORAGE_ZONE: 'creepyshorts',
BUNNY_PULL_ZONE_URL: 'CreepyShorts.b-cdn.net',
BUNNY_TOKEN_AUTHENTICATION: 'aece4b8a-06a3-46be-ad7f-add1ed22d789',

// # BUNNY STREAM CDN
BUNNY_CDN_ACCOUNT_API_KEY: '43f0a9dd-644a-4da6-b71f-37d8930aab6e08799adf-edf1-4364-8a80-30abc36620b9',
BUNNY_STREAM_API_KEY: '187f6ab8-09b4-46ea-b0d573a707a0-dbc4-429f',
BUNNY_STREAM_LIBRARY_ID: 551807,
BUNNY_STREAM_CDN_HOSTNAME: 'vz-4bdf02a2-a32.b-cdn.net',
BUNNY_TOKEN_AUTH_KEY: 'f9338637-c386-4ca7-bab6-64e7f11b9c73',
BUNNY_STREAM_PULL_ZONE_HOST: 'vz-4bdf02a2-a32.b-cdn.net',

// #TWILIO
TWILIO_ACCOUNT_SID: 'ACba9c731d669162b3cd7a72f7c8ceb6a0',
TWILIO_AUTH_TOKEN: 'c4a0c0cd7f8ce82a5cb12b4a033465d0',
TWILIO_PHONE_NUMBER: ' +18048861624',

REDIS_PASSWORD: 'redis',
REDIS_URL: 'redis://localhost:6379',
REDIS_HOST: 'localhost',
REDIS_PORT: 6379,
REDIS_DB: 0,
},


        // Advanced Options
        source_map_support: true, 
        instance_var: 'INSTANCE_ID',

        // Monitoring
        vizion: false,
        post_update: ['npm install'],

        // Graceful reload
        shutdown_with_message: false,

        // Cron restart (optional - রাতে 2am এ restart)
        // cron_restart: '0 2 * * *',

        // Performance
        node_args: '--max-old-space-size=2048', // 2GB heap size
        },
    ]
    }