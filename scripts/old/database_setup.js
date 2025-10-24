#!/usr/bin/env node

/**
 * PostgreSQL 데이터베이스 셋업 스크립트
 * PostgreSQL 데이터베이스에 테이블을 생성하고 샘플 데이터를 추가합니다.
 * 
 * 사용법:
 * node scripts/database_setup.js
 */

import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Client } = pkg;
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 데이터베이스 설정 (환경변수 또는 기본값)
const adminConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_ADMIN_USER || 'choijinho',
  password: process.env.DB_ADMIN_PASSWORD || '',
  database: 'postgres' // 기본 데이터베이스
};

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'adr',
  password: process.env.DB_PASSWORD || 'adr_password_2024!',
  database: process.env.DB_NAME || 'adr_db'
};

// SQL 파일 순서
const sqlFiles = [
  '01_create_users_table.sql',
  '02_create_points_table.sql', 
  '03_create_advertisements_table.sql',
  '04_create_transactions_table.sql',
  '05_insert_sample_data.sql'
];

async function setupDatabaseAndUser() {
  console.log('🚀 데이터베이스 및 사용자 생성을 시작합니다...');
  
  const adminClient = new Client(adminConfig);
  
  try {
    await adminClient.connect();
    console.log('✅ PostgreSQL 관리자로 연결 성공');
    
    // 사용자 존재 여부 확인
    const userExists = await adminClient.query(
      "SELECT 1 FROM pg_roles WHERE rolname = $1",
      [dbConfig.user]
    );
    
    if (userExists.rows.length === 0) {
      // 사용자 생성
      await adminClient.query(`CREATE USER ${dbConfig.user} WITH PASSWORD '${dbConfig.password}'`);
      console.log(`✅ 사용자 '${dbConfig.user}' 생성 완료`);
    } else {
      console.log(`ℹ️  사용자 '${dbConfig.user}' 이미 존재`);
    }
    
    // 데이터베이스 존재 여부 확인
    const dbExists = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbConfig.database]
    );
    
    if (dbExists.rows.length === 0) {
      // 데이터베이스 생성
      await adminClient.query(`
        CREATE DATABASE ${dbConfig.database} 
        WITH 
        OWNER = ${dbConfig.user}
        ENCODING = 'UTF8'
        LC_COLLATE = 'C'
        LC_CTYPE = 'C'
        TEMPLATE = template0
      `);
      console.log(`✅ 데이터베이스 '${dbConfig.database}' 생성 완료`);
    } else {
      console.log(`ℹ️  데이터베이스 '${dbConfig.database}' 이미 존재`);
    }
    
    // 권한 부여
    await adminClient.query(`GRANT ALL PRIVILEGES ON DATABASE ${dbConfig.database} TO ${dbConfig.user}`);
    console.log('✅ 데이터베이스 권한 부여 완료');
    
  } catch (error) {
    console.error('❌ 데이터베이스/사용자 생성 실패:', error.message);
    throw error;
  } finally {
    await adminClient.end();
  }
}

async function setupSchema() {
  console.log('🔧 스키마 권한 설정 중...');
  
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    // public 스키마 권한 설정
    await client.query(`GRANT ALL ON SCHEMA public TO ${dbConfig.user}`);
    await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${dbConfig.user}`);
    await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${dbConfig.user}`);
    
    console.log('✅ 스키마 권한 설정 완료');
    
  } catch (error) {
    console.error('❌ 스키마 권한 설정 실패:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

async function executeSQLFile(client, filename) {
  console.log(`📄 ${filename} 실행 중...`);
  
  const filepath = path.join(__dirname, filename);
  
  if (!fs.existsSync(filepath)) {
    console.warn(`⚠️  파일을 찾을 수 없습니다: ${filepath}`);
    return;
  }
  
  const sql = fs.readFileSync(filepath, 'utf8');
  
  try {
    await client.query(sql);
    console.log(`✅ ${filename} 실행 완료`);
  } catch (error) {
    console.error(`❌ SQL 실행 실패 (${filename}):`, error.message);
    throw error;
  }
}

async function setupDatabase() {
  let client;
  
  try {
    // 1. 데이터베이스 및 사용자 생성
    await setupDatabaseAndUser();
    
    // 2. 스키마 권한 설정
    await setupSchema();
    
    // 3. 데이터베이스에 연결
    console.log('🔌 ADR 데이터베이스에 연결 중...');
    client = new Client(dbConfig);
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');
    
    // 4. 각 SQL 파일 실행
    for (const sqlFile of sqlFiles) {
      await executeSQLFile(client, sqlFile);
    }
    
    console.log('🎉 모든 데이터베이스 설정이 완료되었습니다!');
    console.log('');
    console.log('📊 생성된 테이블:');
    console.log('  - users (사용자)');
    console.log('  - user_activity_logs (사용자 활동 로그)');
    console.log('  - user_sessions (사용자 세션)');
    console.log('  - points (포인트 거래)');
    console.log('  - user_point_balances (포인트 잔액)');
    console.log('  - point_statistics (포인트 통계)');
    console.log('  - advertisements (광고)');
    console.log('  - ad_interactions (광고 상호작용)');
    console.log('  - ad_daily_stats (광고 일별 통계)');
    console.log('  - ad_categories (광고 카테고리)');
    console.log('  - transactions (거래)');
    console.log('  - transaction_status_history (거래 상태 히스토리)');
    console.log('  - withdrawal_requests (출금 신청)');
    console.log('  - system_settings (시스템 설정)');
    console.log('');
    console.log('🔗 데이터베이스 연결 정보:');
    console.log(`  - Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`  - Database: ${dbConfig.database}`);
    console.log(`  - User: ${dbConfig.user}`);
    console.log('');
    console.log('👤 기본 계정:');
    console.log('  - admin / admin123 (관리자)');
    console.log('  - manager / manager123 (매니저)');
    console.log('  - user1 / user123 (일반 사용자)');
    
  } catch (error) {
    console.error('💥 데이터베이스 설정 중 오류 발생:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('🔌 데이터베이스 연결 종료');
    }
  }
}

// 메인 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then(() => {
      console.log('✨ 데이터베이스 설정 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 설정 실패:', error);
      process.exit(1);
    });
}