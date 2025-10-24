const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 입력 검증
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '아이디와 비밀번호를 입력해주세요.'
      });
    }

    // 사용자 조회
    const userQuery = `
      SELECT id, username, password_hash, name, role, status
      FROM users
      WHERE username = $1
    `;

    const result = await pool.query(userQuery, [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: '아이디 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    const user = result.rows[0];

    // 계정 상태 확인
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '비활성화된 계정입니다. 관리자에게 문의하세요.'
      });
    }

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // 로그인 실패 기록
      await pool.query(
        `INSERT INTO login_logs (user_id, username, ip_address, user_agent, success, failure_reason)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, username, req.ip, req.get('user-agent'), false, '비밀번호 불일치']
      );

      return res.status(401).json({
        success: false,
        message: '아이디 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 로그인 성공: 토큰 생성
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'adr-secret-key-2024',
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    );

    // 세션 생성
    const sessionQuery = `
      INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const sessionId = require('crypto').randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 후

    await pool.query(sessionQuery, [
      sessionId,
      user.id,
      req.ip,
      req.get('user-agent'),
      expiresAt
    ]);

    // 마지막 로그인 시간 업데이트
    await pool.query(
      `UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [user.id]
    );

    // 로그인 성공 기록
    await pool.query(
      `INSERT INTO login_logs (user_id, username, ip_address, user_agent, success)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, username, req.ip, req.get('user-agent'), true]
    );

    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        },
        token,
        sessionId
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '로그인 처리 중 오류가 발생했습니다.'
    });
  }
});

// 로그아웃
router.post('/logout', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (sessionId) {
      // 세션 삭제
      await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
    }

    res.json({
      success: true,
      message: '로그아웃되었습니다.'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: '로그아웃 처리 중 오류가 발생했습니다.'
    });
  }
});

// 토큰 검증
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 없습니다.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'adr-secret-key-2024');

    // 사용자 정보 조회
    const result = await pool.query(
      'SELECT id, username, name, role, status FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0 || result.rows[0].status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 사용자입니다.'
      });
    }

    res.json({
      success: true,
      data: {
        user: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: '인증 토큰이 유효하지 않습니다.'
    });
  }
});

module.exports = router;