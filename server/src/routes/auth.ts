import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { authenticateToken } from '../middlewares/auth';
import { JWT_CONFIG } from '../config/jwt';

const router = Router();

// 회원가입
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { username, password, referrer } = req.body;

    // 입력 검증
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '아이디와 비밀번호를 입력해주세요.'
      });
    }

    // 아이디 중복 확인
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '이미 사용 중인 아이디입니다.'
      });
    }

    // 추천인 확인 (선택사항)
    let referrerId = null;
    if (referrer) {
      const referrerUser = await pool.query(
        'SELECT id FROM users WHERE username = $1',
        [referrer]
      );

      if (referrerUser.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: '존재하지 않는 추천인입니다.'
        });
      }

      referrerId = referrerUser.rows[0].id;
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const insertQuery = `
      INSERT INTO users (username, password_hash, name, role, status, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING id, username, name, role
    `;

    const newUser = await pool.query(insertQuery, [
      username,
      hashedPassword,
      username, // name을 username과 동일하게 설정 (나중에 변경 가능)
      'writer',  // 랜딩 페이지 가입자는 writer 권한
      'active'
    ]);

    // 추천인 기록 (있을 경우)
    if (referrerId) {
      await pool.query(
        `INSERT INTO user_referrals (user_id, referrer_id, created_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [newUser.rows[0].id, referrerId]
      );
    }

    res.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: {
        user: newUser.rows[0]
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: '회원가입 처리 중 오류가 발생했습니다.'
    });
  }
});

// 로그인
router.post('/login', async (req: Request, res: Response) => {
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
      JWT_CONFIG.secret,
      {
        expiresIn: JWT_CONFIG.expiresIn
      }
    );

    // 세션 생성
    const sessionQuery = `
      INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const crypto = require('crypto');
    const sessionId = crypto.randomUUID();
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
router.post('/logout', async (req: Request, res: Response) => {
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

// 사용자 전환 (개발자 전용)
router.post('/switch-user', authenticateToken, async (req: any, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;
    const { targetUserId } = req.body;

    // 개발자 권한 체크
    if (currentUserRole !== 'developer') {
      return res.status(403).json({
        success: false,
        message: '개발자 계정만 사용자 전환이 가능합니다.'
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: '전환할 사용자 ID를 입력해주세요.'
      });
    }

    // 대상 사용자 조회
    const userQuery = `
      SELECT id, username, name, role, status
      FROM users
      WHERE id = $1
    `;

    const result = await pool.query(userQuery, [targetUserId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '대상 사용자를 찾을 수 없습니다.'
      });
    }

    const targetUser = result.rows[0];

    // 계정 활성화 상태 확인
    if (targetUser.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: '비활성화된 계정으로는 전환할 수 없습니다.'
      });
    }

    // 대상 사용자의 JWT 토큰 생성 (switched_from 정보 포함)
    const token = jwt.sign(
      {
        id: targetUser.id,
        username: targetUser.username,
        role: targetUser.role,
        switched_from: currentUserId // 개발자 ID 저장
      },
      JWT_CONFIG.secret,
      {
        expiresIn: JWT_CONFIG.expiresIn
      }
    );

    // 세션 생성
    const crypto = require('crypto');
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        sessionId,
        targetUser.id,
        req.ip,
        req.get('user-agent'),
        expiresAt,
        { switched_from: currentUserId }
      ]
    );

    // 로그 기록
    await pool.query(
      `INSERT INTO login_logs (user_id, username, ip_address, user_agent, success, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        targetUser.id,
        targetUser.username,
        req.ip,
        req.get('user-agent'),
        true,
        { action: 'switch_user', switched_from: currentUserId }
      ]
    );

    res.json({
      success: true,
      message: `${targetUser.name}(${targetUser.username}) 계정으로 전환되었습니다.`,
      data: {
        user: {
          id: targetUser.id,
          username: targetUser.username,
          name: targetUser.name,
          role: targetUser.role
        },
        token,
        sessionId,
        switched_from: currentUserId
      }
    });

  } catch (error) {
    console.error('Switch user error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 전환 중 오류가 발생했습니다.'
    });
  }
});

// 원래 계정으로 복귀 (개발자 전환 해제)
router.post('/switch-back', authenticateToken, async (req: any, res: Response) => {
  try {
    const switchedFromId = req.user?.switched_from;

    if (!switchedFromId) {
      return res.status(400).json({
        success: false,
        message: '전환된 세션이 아닙니다.'
      });
    }

    // 원래 개발자 계정 조회
    const userQuery = `
      SELECT id, username, name, role, status
      FROM users
      WHERE id = $1 AND role = 'developer'
    `;

    const result = await pool.query(userQuery, [switchedFromId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '원래 개발자 계정을 찾을 수 없습니다.'
      });
    }

    const developerUser = result.rows[0];

    // 개발자 계정의 JWT 토큰 생성
    const token = jwt.sign(
      {
        id: developerUser.id,
        username: developerUser.username,
        role: developerUser.role
      },
      JWT_CONFIG.secret,
      {
        expiresIn: JWT_CONFIG.expiresIn
      }
    );

    // 새 세션 생성
    const crypto = require('crypto');
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        sessionId,
        developerUser.id,
        req.ip,
        req.get('user-agent'),
        expiresAt
      ]
    );

    res.json({
      success: true,
      message: '개발자 계정으로 복귀했습니다.',
      data: {
        user: {
          id: developerUser.id,
          username: developerUser.username,
          name: developerUser.name,
          role: developerUser.role
        },
        token,
        sessionId
      }
    });

  } catch (error) {
    console.error('Switch back error:', error);
    res.status(500).json({
      success: false,
      message: '계정 복귀 중 오류가 발생했습니다.'
    });
  }
});

// 토큰 검증
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 없습니다.'
      });
    }

    const decoded = jwt.verify(token, JWT_CONFIG.secret) as any;

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

export default router;