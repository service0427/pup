import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// 네이버 플레이스 URL에서 ID 추출
function extractPlaceId(url: string): string | null {
  if (!url) return null;

  // 네이버 플레이스 패턴: /restaurant/12345678 또는 /place/12345678
  const match = url.match(/\/(\d+)(?:[?#]|$)/);
  return match ? match[1] : null;
}

// 플레이스 목록 조회
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const {
      search,
      status,
      page = 1,
      limit = 20
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT
        p.*,
        u.name as created_by
      FROM places p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // 권한별 필터링
    if (req.user.role === 'advertiser') {
      query += ` AND p.user_id = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    } else if (req.user.role === 'distributor') {
      query += ` AND p.user_id IN (
        SELECT id FROM users WHERE id = $${paramIndex} OR path LIKE $${paramIndex + 1}
      )`;
      params.push(req.user.id, `${req.user.path}/%`);
      paramIndex += 2;
    }

    // 검색 조건
    if (search) {
      query += ` AND (p.business_name ILIKE $${paramIndex} OR p.place_id ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // 정렬
    query += ` ORDER BY p.created_at DESC`;

    // 페이징
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // 전체 개수 조회
    let countQuery = `SELECT COUNT(*) as total FROM places p WHERE 1=1`;
    const countParams: any[] = [];

    if (req.user.role === 'advertiser') {
      countQuery += ` AND p.user_id = $1`;
      countParams.push(req.user.id);
    } else if (req.user.role === 'distributor') {
      countQuery += ` AND p.user_id IN (SELECT id FROM users WHERE id = $1 OR path LIKE $2)`;
      countParams.push(req.user.id, `${req.user.path}/%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        places: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total)
        }
      }
    });

  } catch (error) {
    console.error('Get places error:', error);
    res.status(500).json({
      success: false,
      message: '플레이스 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 플레이스 상세 조회
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        p.*,
        u.name as created_by
       FROM places p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '플레이스를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get place error:', error);
    res.status(500).json({
      success: false,
      message: '플레이스 조회 중 오류가 발생했습니다.'
    });
  }
});

// 플레이스 생성
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const {
      business_name,
      place_url,
      place_type,
      phone,
      address,
      remark
    } = req.body;

    // URL에서 place_id 자동 추출
    const place_id = extractPlaceId(place_url);

    if (!place_id) {
      return res.status(400).json({
        success: false,
        message: '올바른 네이버 플레이스 URL을 입력해주세요.'
      });
    }

    const result = await pool.query(
      `INSERT INTO places (
        user_id, business_name, place_url, place_id, place_type,
        phone, address, remark, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        req.user.id, business_name, place_url, place_id, place_type,
        phone, address, remark, 'active'
      ]
    );

    res.status(201).json({
      success: true,
      message: '플레이스가 생성되었습니다.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create place error:', error);
    res.status(500).json({
      success: false,
      message: '플레이스 생성 중 오류가 발생했습니다.'
    });
  }
});

// 플레이스 수정
router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const {
      business_name,
      place_url,
      place_type,
      phone,
      address,
      status,
      remark
    } = req.body;

    // URL이 변경된 경우 place_id 재추출
    let place_id = null;
    if (place_url) {
      place_id = extractPlaceId(place_url);
      if (!place_id) {
        return res.status(400).json({
          success: false,
          message: '올바른 네이버 플레이스 URL을 입력해주세요.'
        });
      }
    }

    const updateQuery = place_url
      ? `UPDATE places SET
          business_name = COALESCE($1, business_name),
          place_url = COALESCE($2, place_url),
          place_id = COALESCE($3, place_id),
          place_type = COALESCE($4, place_type),
          phone = $5,
          address = $6,
          status = COALESCE($7, status),
          remark = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *`
      : `UPDATE places SET
          business_name = COALESCE($1, business_name),
          place_type = COALESCE($2, place_type),
          phone = $3,
          address = $4,
          status = COALESCE($5, status),
          remark = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *`;

    const params = place_url
      ? [business_name, place_url, place_id, place_type, phone, address, status, remark, id]
      : [business_name, place_type, phone, address, status, remark, id];

    const result = await pool.query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '플레이스를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '플레이스가 수정되었습니다.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update place error:', error);
    res.status(500).json({
      success: false,
      message: '플레이스 수정 중 오류가 발생했습니다.'
    });
  }
});

// 플레이스 삭제
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM places WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '플레이스를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '플레이스가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('Delete place error:', error);
    res.status(500).json({
      success: false,
      message: '플레이스 삭제 중 오류가 발생했습니다.'
    });
  }
});

export default router;
