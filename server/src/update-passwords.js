const bcrypt = require('bcryptjs');
const pool = require('./config/database');

async function updatePasswords() {
  try {
    // admin 계정의 비밀번호를 admin123으로 업데이트
    const adminHash = await bcrypt.hash('admin123', 10);
    console.log('Admin hash:', adminHash);

    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE username = 'admin'",
      [adminHash]
    );
    console.log('✅ Admin password updated');

    // operator1 계정의 비밀번호를 admin123으로 업데이트
    const operatorHash = await bcrypt.hash('admin123', 10);
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE username = 'operator1'",
      [operatorHash]
    );
    console.log('✅ Operator1 password updated');

    // test 사용자들의 비밀번호를 test123으로 업데이트
    const testHash = await bcrypt.hash('test123', 10);
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE username LIKE 'user%'",
      [testHash]
    );
    console.log('✅ Test users passwords updated');

    console.log('\n=================================');
    console.log('All passwords have been updated!');
    console.log('=================================');
    console.log('Login credentials:');
    console.log('  admin / admin123');
    console.log('  operator1 / admin123');
    console.log('  user001-005 / test123');
    console.log('=================================');

    process.exit(0);
  } catch (error) {
    console.error('Error updating passwords:', error);
    process.exit(1);
  }
}

updatePasswords();