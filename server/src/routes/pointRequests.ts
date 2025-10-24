import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// 포인트 요청 목록 조회
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT
        pr.id,
        pr.requested_amount,
        pr.purpose,
        pr.status,
        pr.created_at,
        pr.reviewed_at,
        pr.review_notes,
        u.username as requester_username,
        u.name as requester_name,
        u.role as requester_role,
        r.username as reviewer_username,
        r.name as reviewer_name
      FROM point_requests pr
      JOIN users u ON pr.requester_id = u.id
      LEFT JOIN users r ON pr.reviewed_by = r.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // 권한에 따른 필터링
    if (req.user.role === 'distributor') {
      // 총판은 자신의 요청만 조회
      query += ` AND pr.requester_id = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    }
    // admin은 모든 요청 조회 가능

    // 상태 필터
    if (status) {
      query += ` AND pr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // 정렬 및 페이징
    query += ` ORDER BY pr.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // 전체 개수 조회
    let countQuery = `
      SELECT COUNT(*) as total
      FROM point_requests pr
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (req.user.role === 'distributor') {
      countQuery += ` AND pr.requester_id = $${countParamIndex}`;
      countParams.push(req.user.id);
      countParamIndex++;
    }

    if (status) {
      countQuery += ` AND pr.status = $${countParamIndex}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        requests: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total)
        }
      }
    });

  } catch (error) {
    console.error('Get point requests error:', error);
    res.status(500).json({
      success: false,
      message: '포인트 요청 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 포인트 요청 생성 (총판 또는 개발자만)
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { requested_amount, purpose } = req.body;

    // 총판 또는 개발자만 포인트 요청 가능
    if (req.user.role !== 'distributor' && req.user.role !== 'developer') {
      return res.status(403).json({
        success: false,
        message: '포인트 요청 권한이 없습니다.'
      });
    }

    // 입력값 검증
    if (!requested_amount || requested_amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '올바른 포인트 금액을 입력해주세요.'
      });
    }

    if (!purpose || purpose.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: '요청 목적을 10자 이상 입력해주세요.'
      });
    }

    const result = await pool.query(`
      INSERT INTO point_requests (requester_id, requested_amount, purpose)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [req.user.id, requested_amount, purpose.trim()]);

    res.status(201).json({
      success: true,
      message: '포인트 요청이 생성되었습니다.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create point request error:', error);
    res.status(500).json({
      success: false,
      message: '포인트 요청 생성 중 오류가 발생했습니다.'
    });
  }
});

// 포인트 요청 승인/반려 (관리자 또는 개발자만)
router.patch('/:id/review', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status, review_notes } = req.body;

    // 관리자 또는 개발자만 검토 가능
    if (req.user.role !== 'admin' && req.user.role !== 'developer') {
      return res.status(403).json({
        success: false,
        message: '포인트 요청 검토 권한이 없습니다.'
      });
    }

    // 상태값 검증
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '올바른 상태값을 선택해주세요.'
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 요청 정보 조회
      const requestResult = await client.query(
        'SELECT * FROM point_requests WHERE id = $1 AND status = $2',
        [id, 'pending']
      );

      if (requestResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: '처리 가능한 포인트 요청을 찾을 수 없습니다.'
        });
      }

      const request = requestResult.rows[0];

      // 요청 상태 업데이트
      await client.query(`
        UPDATE point_requests
        SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, review_notes = $3
        WHERE id = $4
      `, [status, req.user.id, review_notes || null, id]);

      // 승인된 경우 포인트 지급
      if (status === 'approved') {
        await client.query(
          'SELECT create_point_transaction($1, $2, $3, $4, $5, $6, $7)',
          [
            request.requester_id,
            'admin_add',
            request.requested_amount,
            `관리자 승인 - ${request.purpose}`,
            null, // related_work_id
            request.id, // related_request_id
            req.user.id // processed_by
          ]
        );
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `포인트 요청이 ${status === 'approved' ? '승인' : '반려'}되었습니다.`,
        data: {
          id: parseInt(id),
          status,
          reviewed_at: new Date(),
          review_notes
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Review point request error:', error);
    res.status(500).json({
      success: false,
      message: '포인트 요청 검토 중 오류가 발생했습니다.'
    });
  }
});

// 특정 포인트 요청 조회
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    let query = `
      SELECT
        pr.*,
        u.username as requester_username,
        u.name as requester_name,
        u.role as requester_role,
        r.username as reviewer_username,
        r.name as reviewer_name
      FROM point_requests pr
      JOIN users u ON pr.requester_id = u.id
      LEFT JOIN users r ON pr.reviewed_by = r.id
      WHERE pr.id = $1
    `;

    const params = [id];

    // 권한 확인
    if (req.user.role === 'distributor') {
      query += ` AND pr.requester_id = $2`;
      params.push(req.user.id);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '포인트 요청을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get point request error:', error);
    res.status(500).json({
      success: false,
      message: '포인트 요청 조회 중 오류가 발생했습니다.'
    });
  }
});

export default router;