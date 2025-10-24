const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middlewares/auth');

// 모든 사용자 조회 (관리자만)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // 권한 확인
    if (req.user.role !== 'admin' && req.user.role !== 'operator') {
      return res.status(403).json({
        success: false,
        message: '권한이 없습니다.'
      });
    }

    const result = await pool.query(`
      SELECT
        id, username, name, role, status,
        created_at, last_login_at, metadata
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 특정 사용자 조회
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 본인이거나 관리자만 조회 가능
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '권한이 없습니다.'
      });
    }

    const result = await pool.query(`
      SELECT
        id, username, name, role, status,
        created_at, last_login_at, metadata
      FROM users
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 조회 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 상태 변경 (관리자만)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 관리자 권한 확인
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '권한이 없습니다.'
      });
    }

    // 유효한 상태값 확인
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상태값입니다.'
      });
    }

    const result = await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '사용자 상태가 변경되었습니다.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 상태 변경 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;