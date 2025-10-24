import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export interface AuthRequest extends Request {
  user?: any;
}

// JWT 토큰 검증 미들웨어
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'adr-secret-key-2024') as any;

    // 사용자 확인 (계층 정보 포함)
    const result = await pool.query(
      `SELECT
        id, username, role, status,
        tier_level, parent_id, path, permissions
      FROM users WHERE id = $1`,
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
    req.user = {
      ...user,
      switched_from: decoded.switched_from // 개발자 전환 정보 포함
    };
    next();

  } catch (error: any) {
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

// 개발자 권한 확인 미들웨어
export const requireDeveloper = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 개발자이거나 개발자로 전환된 상태가 아니면 거부
  if (req.user.role !== 'developer' && !req.user.switched_from) {
    return res.status(403).json({
      success: false,
      message: '개발자 권한이 필요합니다.'
    });
  }
  next();
};

// 관리자 권한 확인 미들웨어
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 개발자는 모든 권한을 가짐
  if (req.user.role === 'developer') {
    next();
    return;
  }

  // 개발자로 전환된 상태인 경우 원래 권한 체크
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다.'
    });
  }
  next();
};

// 운영자 이상 권한 확인 미들웨어
export const requireOperator = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 개발자는 모든 권한을 가짐
  if (req.user.role === 'developer') {
    next();
    return;
  }

  if (req.user.role !== 'admin' && req.user.role !== 'operator' && req.user.role !== 'distributor') {
    return res.status(403).json({
      success: false,
      message: '운영자 이상 권한이 필요합니다.'
    });
  }
  next();
};

// 총판 이상 권한 확인 미들웨어
export const requireDistributor = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 개발자는 모든 권한을 가짐
  if (req.user.role === 'developer') {
    next();
    return;
  }

  if (req.user.role !== 'admin' && req.user.role !== 'distributor') {
    return res.status(403).json({
      success: false,
      message: '총판 이상 권한이 필요합니다.'
    });
  }
  next();
};

// 사용자 관리 권한 확인 미들웨어
export const canManageUsers = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 개발자는 모든 권한을 가짐
  if (req.user.role === 'developer') {
    next();
    return;
  }

  const permissions = req.user.permissions || {};

  if (req.user.role === 'admin' || permissions.can_manage_users === true) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: '사용자 관리 권한이 없습니다.'
    });
  }
};