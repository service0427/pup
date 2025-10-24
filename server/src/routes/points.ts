import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// 포인트 잔액 조회
router.get('/balance', authenticateToken, async (req: any, res) => {
  try {
    const { user_id } = req.query;

    // 권한 확인
    let targetUserId = req.user.id;
    if (user_id && req.user.role === 'admin') {
      // 관리자는 다른 사용자의 잔액도 조회 가능
      targetUserId = parseInt(user_id);
    } else if (user_id && user_id !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: '다른 사용자의 포인트 잔액을 조회할 권한이 없습니다.'
      });
    }

    const result = await pool.query(`
      SELECT
        pb.*,
        u.username,
        u.name,
        u.role
      FROM point_balances pb
      JOIN users u ON pb.user_id = u.id
      WHERE pb.user_id = $1
    `, [targetUserId]);

    if (result.rows.length === 0) {
      // 잔액 정보가 없으면 초기화
      await pool.query('SELECT initialize_user_points($1)', [targetUserId]);

      const newResult = await pool.query(`
        SELECT
          pb.*,
          u.username,
          u.name,
          u.role
        FROM point_balances pb
        JOIN users u ON pb.user_id = u.id
        WHERE pb.user_id = $1
      `, [targetUserId]);

      // 실제 사용 포인트 계산 (승인된 리뷰만)
      const actualSpentResult = await pool.query(`
        SELECT COALESCE(SUM(pr.point_amount), 0) as actual_spent
        FROM place_receipts pr
        JOIN places p ON pr.place_id = p.id
        WHERE p.user_id = $1 AND pr.point_status = 'approved'
      `, [targetUserId]);

      return res.json({
        success: true,
        data: {
          ...newResult.rows[0],
          actual_spent: parseInt(actualSpentResult.rows[0].actual_spent)
        }
      });
    }

    // 실제 사용 포인트 계산 (승인된 리뷰만)
    const actualSpentResult = await pool.query(`
      SELECT COALESCE(SUM(pr.point_amount), 0) as actual_spent
      FROM place_receipts pr
      JOIN places p ON pr.place_id = p.id
      WHERE p.user_id = $1 AND pr.point_status = 'approved'
    `, [targetUserId]);

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        actual_spent: parseInt(actualSpentResult.rows[0].actual_spent)
      }
    });

  } catch (error) {
    console.error('Get point balance error:', error);
    res.status(500).json({
      success: false,
      message: '포인트 잔액 조회 중 오류가 발생했습니다.'
    });
  }
});

// 포인트 거래 내역 조회
router.get('/transactions', authenticateToken, async (req: any, res) => {
  try {
    const {
      user_id,
      transaction_type,
      start_date,
      end_date,
      page = 1,
      limit = 20
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 권한 확인
    let targetUserId = null;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'developer';

    if (user_id) {
      if (isAdmin) {
        // 관리자는 다른 사용자의 거래 내역도 조회 가능
        targetUserId = parseInt(user_id);
      } else if (user_id !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          message: '다른 사용자의 포인트 거래 내역을 조회할 권한이 없습니다.'
        });
      } else {
        targetUserId = req.user.id;
      }
    } else {
      // user_id 파라미터 없음
      if (isAdmin) {
        // 관리자는 전체 조회 가능
        targetUserId = null;
      } else {
        // 일반 사용자는 자기 것만
        targetUserId = req.user.id;
      }
    }

    let query = `
      SELECT
        pt.*,
        u.username,
        u.name,
        processor.name as processor_name
      FROM point_transactions pt
      JOIN users u ON pt.user_id = u.id
      LEFT JOIN users processor ON pt.processed_by = processor.id
    `;

    const params = [];
    let paramIndex = 1;

    // user_id 필터 (관리자가 전체 조회하지 않는 경우만)
    if (targetUserId !== null) {
      query += ` WHERE pt.user_id = $${paramIndex}`;
      params.push(targetUserId);
      paramIndex++;
    }

    // 거래 유형 필터
    if (transaction_type) {
      query += ` ${targetUserId !== null || params.length > 0 ? 'AND' : 'WHERE'} pt.transaction_type = $${paramIndex}`;
      params.push(transaction_type);
      paramIndex++;
    }

    // 날짜 범위 필터
    if (start_date) {
      query += ` ${params.length > 0 ? 'AND' : 'WHERE'} pt.created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` ${params.length > 0 ? 'AND' : 'WHERE'} pt.created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    // 정렬 및 페이징
    query += ` ORDER BY pt.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // 전체 개수 조회
    let countQuery = `
      SELECT COUNT(*) as total
      FROM point_transactions pt
    `;
    const countParams = [];
    let countParamIndex = 1;

    if (targetUserId !== null) {
      countQuery += ` WHERE pt.user_id = $${countParamIndex}`;
      countParams.push(targetUserId);
      countParamIndex++;
    }

    if (transaction_type) {
      countQuery += ` ${countParams.length > 0 ? 'AND' : 'WHERE'} pt.transaction_type = $${countParamIndex}`;
      countParams.push(transaction_type);
      countParamIndex++;
    }

    if (start_date) {
      countQuery += ` ${countParams.length > 0 ? 'AND' : 'WHERE'} pt.created_at >= $${countParamIndex}`;
      countParams.push(start_date);
      countParamIndex++;
    }

    if (end_date) {
      countQuery += ` ${countParams.length > 0 ? 'AND' : 'WHERE'} pt.created_at <= $${countParamIndex}`;
      countParams.push(end_date);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        transactions: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total)
        }
      }
    });

  } catch (error) {
    console.error('Get point transactions error:', error);
    res.status(500).json({
      success: false,
      message: '포인트 거래 내역 조회 중 오류가 발생했습니다.'
    });
  }
});

// 포인트 수동 조정 (관리자만)
router.post('/adjust', authenticateToken, async (req: any, res) => {
  try {
    const { user_id, amount, description } = req.body;

    // 관리자 권한 확인
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '포인트 조정 권한이 없습니다.'
      });
    }

    // 입력값 검증
    if (!user_id || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: '필수 정보를 모두 입력해주세요.'
      });
    }

    if (amount === 0) {
      return res.status(400).json({
        success: false,
        message: '조정 포인트는 0이 될 수 없습니다.'
      });
    }

    // 대상 사용자 확인
    const userResult = await pool.query(
      'SELECT id, username, name FROM users WHERE id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    const targetUser = userResult.rows[0];

    // 포인트 트랜잭션 생성
    const transactionType = amount > 0 ? 'admin_add' : 'admin_subtract';
    const transactionResult = await pool.query(
      'SELECT create_point_transaction($1, $2, $3, $4, $5, $6, $7)',
      [
        user_id,
        transactionType,
        amount,
        description,
        null, // related_work_id
        null, // related_request_id
        req.user.id // processed_by
      ]
    );

    const transactionId = transactionResult.rows[0].create_point_transaction;

    // 업데이트된 잔액 조회
    const balanceResult = await pool.query(
      'SELECT * FROM point_balances WHERE user_id = $1',
      [user_id]
    );

    res.json({
      success: true,
      message: `${targetUser.name}님의 포인트가 ${amount > 0 ? '추가' : '차감'}되었습니다.`,
      data: {
        transaction_id: transactionId,
        user: targetUser,
        amount,
        new_balance: balanceResult.rows[0].available_points
      }
    });

  } catch (error) {
    console.error('Adjust points error:', error);
    res.status(500).json({
      success: false,
      message: '포인트 조정 중 오류가 발생했습니다.'
    });
  }
});

// 포인트 통계 조회 (관리자만)
router.get('/statistics', authenticateToken, async (req: any, res) => {
  try {
    // 관리자 권한 확인
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '포인트 통계 조회 권한이 없습니다.'
      });
    }

    const { period = 'month' } = req.query; // day, week, month, year

    let dateFilter = '';
    switch (period) {
      case 'day':
        dateFilter = "DATE_TRUNC('day', pt.created_at) >= DATE_TRUNC('day', CURRENT_DATE)";
        break;
      case 'week':
        dateFilter = "DATE_TRUNC('week', pt.created_at) >= DATE_TRUNC('week', CURRENT_DATE)";
        break;
      case 'month':
        dateFilter = "DATE_TRUNC('month', pt.created_at) >= DATE_TRUNC('month', CURRENT_DATE)";
        break;
      case 'year':
        dateFilter = "DATE_TRUNC('year', pt.created_at) >= DATE_TRUNC('year', CURRENT_DATE)";
        break;
      default:
        dateFilter = "DATE_TRUNC('month', pt.created_at) >= DATE_TRUNC('month', CURRENT_DATE)";
    }

    // 전체 포인트 통계
    const totalStatsResult = await pool.query(`
      SELECT
        SUM(available_points) as total_available,
        SUM(pending_points) as total_pending,
        SUM(total_earned) as total_earned,
        SUM(total_spent) as total_spent,
        COUNT(*) as total_users
      FROM point_balances pb
      JOIN users u ON pb.user_id = u.id
      WHERE u.role != 'developer'
    `);

    // 기간별 거래 통계
    const periodStatsResult = await pool.query(`
      SELECT
        transaction_type,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_added,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_removed
      FROM point_transactions pt
      WHERE ${dateFilter}
      GROUP BY transaction_type
      ORDER BY transaction_type
    `);

    // 사용자별 포인트 순위 (상위 10명)
    const topUsersResult = await pool.query(`
      SELECT
        u.name,
        u.username,
        u.role,
        pb.available_points,
        pb.total_earned
      FROM point_balances pb
      JOIN users u ON pb.user_id = u.id
      WHERE u.role != 'developer'
      ORDER BY pb.available_points DESC
      LIMIT 10
    `);

    // 일별 포인트 이동량 (최근 7일)
    const dailyTrendsResult = await pool.query(`
      SELECT
        DATE(pt.created_at) as date,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as points_added,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as points_removed,
        COUNT(*) as transaction_count
      FROM point_transactions pt
      WHERE pt.created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(pt.created_at)
      ORDER BY date DESC
    `);

    res.json({
      success: true,
      data: {
        total_stats: totalStatsResult.rows[0],
        period_stats: periodStatsResult.rows,
        top_users: topUsersResult.rows,
        daily_trends: dailyTrendsResult.rows,
        period
      }
    });

  } catch (error) {
    console.error('Get point statistics error:', error);
    res.status(500).json({
      success: false,
      message: '포인트 통계 조회 중 오류가 발생했습니다.'
    });
  }
});

// 사용자별 포인트 잔액 목록 (관리자만)
router.get('/balances', authenticateToken, async (req: any, res) => {
  try {
    // 관리자 권한 확인
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '포인트 잔액 목록 조회 권한이 없습니다.'
      });
    }

    const {
      role,
      search,
      sort_by = 'available_points',
      sort_order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT
        pb.*,
        u.username,
        u.name,
        u.role,
        u.status,
        COALESCE(
          (SELECT SUM(pr.point_amount)
           FROM place_receipts pr
           JOIN places p ON pr.place_id = p.id
           WHERE p.user_id = pb.user_id AND pr.point_status = 'approved'),
          0
        ) as actual_spent,
        COALESCE(
          (SELECT SUM(ABS(pt.amount))
           FROM point_transactions pt
           WHERE pt.user_id = pb.user_id AND pt.transaction_type = 'admin_subtract'),
          0
        ) as total_subtracted
      FROM point_balances pb
      JOIN users u ON pb.user_id = u.id
      WHERE u.role != 'developer'
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // 역할 필터
    if (role) {
      query += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    // 검색 필터
    if (search) {
      query += ` AND (u.username ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // 정렬
    const allowedSortFields = ['available_points', 'total_earned', 'total_spent', 'username', 'name'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'available_points';
    const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

    if (sortField.startsWith('u.')) {
      query += ` ORDER BY ${sortField} ${sortDirection}`;
    } else {
      query += ` ORDER BY pb.${sortField} ${sortDirection}`;
    }

    // 페이징
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // 전체 개수 조회
    let countQuery = `
      SELECT COUNT(*) as total
      FROM point_balances pb
      JOIN users u ON pb.user_id = u.id
      WHERE u.role != 'developer'
    `;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (role) {
      countQuery += ` AND u.role = $${countParamIndex}`;
      countParams.push(role);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (u.username ILIKE $${countParamIndex} OR u.name ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        balances: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total)
        }
      }
    });

  } catch (error) {
    console.error('Get point balances error:', error);
    res.status(500).json({
      success: false,
      message: '포인트 잔액 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

export default router;