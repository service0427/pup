import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// 컨텐츠 가격 목록 조회 (모든 사용자)
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, content_type, price, description, is_active, created_at, updated_at
      FROM content_pricing
      WHERE is_active = true
      ORDER BY id
    `);

    res.json({
      success: true,
      data: {
        pricing: result.rows
      }
    });

  } catch (error) {
    console.error('Get content pricing error:', error);
    res.status(500).json({
      success: false,
      message: '컨텐츠 가격 조회 중 오류가 발생했습니다.'
    });
  }
});

// 컨텐츠 가격 수정 (관리자/개발자만)
router.patch('/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { price, description } = req.body;

    // 관리자 또는 개발자만 수정 가능
    if (req.user.role !== 'admin' && req.user.role !== 'developer') {
      return res.status(403).json({
        success: false,
        message: '컨텐츠 가격 수정 권한이 없습니다.'
      });
    }

    // 입력값 검증
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return res.status(400).json({
        success: false,
        message: '가격은 0 이상의 숫자여야 합니다.'
      });
    }

    // 업데이트할 필드들 준비
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (price !== undefined) {
      updateFields.push(`price = $${paramCount}`);
      updateValues.push(price);
      paramCount++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      updateValues.push(description);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '수정할 데이터가 없습니다.'
      });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const updateQuery = `
      UPDATE content_pricing
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '해당 가격 정보를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '컨텐츠 가격이 수정되었습니다.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update content pricing error:', error);
    res.status(500).json({
      success: false,
      message: '컨텐츠 가격 수정 중 오류가 발생했습니다.'
    });
  }
});

// 컨텐츠 유형별 가격 조회 (단일)
router.get('/type/:content_type', async (req: Request, res: Response) => {
  try {
    const { content_type } = req.params;

    const result = await pool.query(`
      SELECT id, content_type, price, description, is_active
      FROM content_pricing
      WHERE content_type = $1 AND is_active = true
    `, [content_type]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '해당 컨텐츠 유형의 가격 정보를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get content price by type error:', error);
    res.status(500).json({
      success: false,
      message: '컨텐츠 가격 조회 중 오류가 발생했습니다.'
    });
  }
});

export default router;