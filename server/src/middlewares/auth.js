const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// JWT 토큰 검증 미들웨어
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다.'
      });
    }

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'adr-secret-key-2024');

    // 사용자 확인
    const result = await pool.query(
      'SELECT id, username, role, status FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 사용자입니다.'
      });
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '계정이 비활성화되었습니다.'
      });
    }

    // 요청 객체에 사용자 정보 추가
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다.'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: '인증 처리 중 오류가 발생했습니다.'
    });
  }
};

// 관리자 권한 확인 미들웨어
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다.'
    });
  }
  next();
};

// 운영자 이상 권한 확인 미들웨어
const requireOperator = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'operator') {
    return res.status(403).json({
      success: false,
      message: '운영자 이상 권한이 필요합니다.'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOperator
};