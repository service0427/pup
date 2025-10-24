// 운영서버에서 사용자 계정 생성 스크립트
const bcrypt = require('bcryptjs');

const users = [
  {
    username: 'jino',
    password: 'Dev1234!',
    name: '개발자',
    role: 'developer'
  },
  {
    username: 'admin',
    password: '1324!',
    name: '관리자',
    role: 'admin'
  }
];

async function generateInsertStatements() {
  console.log('-- 사용자 계정 생성 SQL');
  console.log('-- 운영서버 PostgreSQL에서 실행하세요\n');

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    console.log(`-- ${user.name} (${user.username})`);
    console.log(`INSERT INTO users (username, password_hash, name, role, status, created_at)`);
    console.log(`VALUES ('${user.username}', '${hashedPassword}', '${user.name}', '${user.role}', 'active', CURRENT_TIMESTAMP);`);
    console.log('');
  }

  console.log('-- 완료!');
}

generateInsertStatements();
