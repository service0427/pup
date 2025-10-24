const bcrypt = require('bcrypt');

const testPassword = 'admin123';
const hash = '$2b$10$Yn7fvlF73pUkqPeTA8Gs4Oh.orN6K2rU67c.gu57X/ChP08WeJxEy';

bcrypt.compare(testPassword, hash, (err, result) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Password match:', result);
  }
});

// 새로운 해시 생성
bcrypt.hash(testPassword, 10, (err, newHash) => {
  if (err) {
    console.error('Hash error:', err);
  } else {
    console.log('New hash:', newHash);
  }
});