module.exports = {
  apps: [{
    name: 'place-up-api',
    script: './dist/app.js',
    instances: 1,
    exec_mode: 'cluster',

    // 환경 변수
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,

      // 데이터베이스
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_NAME: 'place_up',
      DB_USER: 'pup_user',
      DB_PASSWORD: 'Tech1324!pup',

      // JWT 설정
      JWT_SECRET: 'place-up-production-secret-key-2025',
      JWT_EXPIRES_IN: '24h',

      // 파일 업로드
      UPLOAD_DIR: './uploads',
      MAX_FILE_SIZE: '10485760' // 10MB
    },

    // 로그 설정
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // 재시작 정책
    max_memory_restart: '300M',
    restart_delay: 4000,
    autorestart: true,

    // 모니터링
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],

    // 기타 설정
    merge_logs: true,
    time: true
  }]
};
