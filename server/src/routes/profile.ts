import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// 이름 변경
router.put('/update-name', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const userId = (req as any).user.id;

    // 입력 검증
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: '이름을 입력해주세요.'
      });
    }

    // 이름 업데이트
    const result = await pool.query(
      `UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, name, role`,
      [name.trim(), userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '이름이 성공적으로 변경되었습니다.',
      data: {
        user: result.rows[0]
      }
    });

  } catch (error) {
    console.error('이름 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '이름 변경 중 오류가 발생했습니다.'
    });
  }
});

// 비밀번호 변경
router.put('/update-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user.id;

    // 입력 검증
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호와 새 비밀번호를 입력해주세요.'
      });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: '비밀번호는 최소 4자 이상이어야 합니다.'
      });
    }

    // 현재 사용자 정보 조회
    const userResult = await pool.query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    const user = userResult.rows[0];

    // 현재 비밀번호 확인
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '현재 비밀번호가 올바르지 않습니다.'
      });
    }

    // 새 비밀번호 해시화
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // 비밀번호 업데이트
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    });

  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '비밀번호 변경 중 오류가 발생했습니다.'
    });
  }
});

export default router;
