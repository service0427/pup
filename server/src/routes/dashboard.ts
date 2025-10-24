import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// 대시보드 통계
router.get('/stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // 관리자/개발자용 통계
    if (userRole === 'admin' || userRole === 'developer') {
      // 기간 파라미터 가져오기
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // === 정적 정보 (전체 기간) ===

      // 1. 총 플레이스 수
      const placeCountResult = await pool.query(`
        SELECT COUNT(*) as count FROM places
      `);

      // 2. 총 리뷰 (영수증)
      const totalReviewsResult = await pool.query(`
        SELECT COUNT(*) as count FROM place_receipts
      `);

      // 3. 총 블로그
      const totalBlogsResult = await pool.query(`
        SELECT COUNT(*) as count FROM place_blogs
      `);

      // 4. 총 트래픽
      const totalTrafficResult = await pool.query(`
        SELECT COUNT(*) as count FROM place_traffic
      `);

      // 5. 승인 대기 리뷰
      const pendingReviewsResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM place_receipts
        WHERE point_status = 'pending'
      `);

      // === 동적 정보 (선택한 기간) ===

      // 기간별 영수증 작업 건수
      let periodReceiptsCountResult;
      if (startDate && endDate) {
        periodReceiptsCountResult = await pool.query(`
          SELECT COUNT(*) as count
          FROM place_receipts
          WHERE submitted_at IS NOT NULL
            AND submitted_at::date >= $1::date
            AND submitted_at::date <= $2::date
        `, [startDate, endDate]);
      } else {
        periodReceiptsCountResult = await pool.query(`
          SELECT COUNT(*) as count
          FROM place_receipts
          WHERE submitted_at IS NOT NULL
        `);
      }

      // 기간별 블로그 작업 건수
      let periodBlogsCountResult;
      if (startDate && endDate) {
        periodBlogsCountResult = await pool.query(`
          SELECT COUNT(*) as count
          FROM place_blogs
          WHERE created_at::date >= $1::date
            AND created_at::date <= $2::date
        `, [startDate, endDate]);
      } else {
        periodBlogsCountResult = await pool.query(`
          SELECT COUNT(*) as count FROM place_blogs
        `);
      }

      // 기간별 트래픽 작업 건수
      let periodTrafficCountResult;
      if (startDate && endDate) {
        periodTrafficCountResult = await pool.query(`
          SELECT COUNT(*) as count
          FROM place_traffic
          WHERE created_at::date >= $1::date
            AND created_at::date <= $2::date
        `, [startDate, endDate]);
      } else {
        periodTrafficCountResult = await pool.query(`
          SELECT COUNT(*) as count FROM place_traffic
        `);
      }

      // 기간별 사용 포인트 - 영수증 (승인된 것만, expired 제외)
      let periodReceiptsPointsResult;
      if (startDate && endDate) {
        periodReceiptsPointsResult = await pool.query(`
          SELECT COALESCE(SUM(point_amount), 0) as total
          FROM place_receipts
          WHERE point_status = 'approved'
            AND review_status IN ('awaiting_post', 'posted', 'deleted_by_system', 'deleted_by_request')
            AND approved_at::date >= $1::date
            AND approved_at::date <= $2::date
        `, [startDate, endDate]);
      } else {
        periodReceiptsPointsResult = await pool.query(`
          SELECT COALESCE(SUM(point_amount), 0) as total
          FROM place_receipts
          WHERE point_status = 'approved'
            AND review_status IN ('awaiting_post', 'posted', 'deleted_by_system', 'deleted_by_request')
        `);
      }

      // 기간별 사용 포인트 - 블로그
      let periodBlogsPointsResult;
      if (startDate && endDate) {
        periodBlogsPointsResult = await pool.query(`
          SELECT COALESCE(SUM(ABS(amount)), 0) as total
          FROM point_transactions
          WHERE transaction_type = 'spend'
            AND description LIKE '%블로그%'
            AND created_at::date >= $1::date
            AND created_at::date <= $2::date
        `, [startDate, endDate]);
      } else {
        periodBlogsPointsResult = await pool.query(`
          SELECT COALESCE(SUM(ABS(amount)), 0) as total
          FROM point_transactions
          WHERE transaction_type = 'spend'
            AND description LIKE '%블로그%'
        `);
      }

      // 기간별 사용 포인트 - 트래픽
      let periodTrafficPointsResult;
      if (startDate && endDate) {
        periodTrafficPointsResult = await pool.query(`
          SELECT COALESCE(SUM(ABS(amount)), 0) as total
          FROM point_transactions
          WHERE transaction_type = 'spend'
            AND description LIKE '%트래픽%'
            AND created_at::date >= $1::date
            AND created_at::date <= $2::date
        `, [startDate, endDate]);
      } else {
        periodTrafficPointsResult = await pool.query(`
          SELECT COALESCE(SUM(ABS(amount)), 0) as total
          FROM point_transactions
          WHERE transaction_type = 'spend'
            AND description LIKE '%트래픽%'
        `);
      }

      const stats = {
        role: userRole,
        static: {
          totalPlaces: parseInt(placeCountResult.rows[0].count),
          totalReviews: parseInt(totalReviewsResult.rows[0].count),
          totalBlogs: parseInt(totalBlogsResult.rows[0].count),
          totalTraffic: parseInt(totalTrafficResult.rows[0].count),
          pendingReviews: parseInt(pendingReviewsResult.rows[0].count)
        },
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
          workCount: {
            receipts: parseInt(periodReceiptsCountResult.rows[0].count),
            blogs: parseInt(periodBlogsCountResult.rows[0].count),
            traffic: parseInt(periodTrafficCountResult.rows[0].count)
          },
          spentPoints: {
            receipts: parseInt(periodReceiptsPointsResult.rows[0].total),
            blogs: parseInt(periodBlogsPointsResult.rows[0].total),
            traffic: parseInt(periodTrafficPointsResult.rows[0].total)
          }
        }
      };

      return res.json({
        success: true,
        data: stats
      });
    }

    // 일반 사용자(광고주/총판)용 통계
    // 1. 내 포인트 잔액
    const myPointsResult = await pool.query(`
      SELECT
        COALESCE(available_points, 0) as available,
        COALESCE(pending_points, 0) as pending,
        COALESCE(total_earned, 0) as earned,
        COALESCE(total_spent, 0) as spent
      FROM point_balances
      WHERE user_id = $1
    `, [userId]);

    // 2. 내 리뷰 통계
    const myReviewsResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE pr.point_status = 'pending') as pending_reviews,
        COUNT(*) FILTER (WHERE pr.point_status = 'approved') as approved_reviews,
        COUNT(*) FILTER (WHERE pr.point_status = 'rejected') as rejected_reviews,
        COUNT(*) as total_reviews
      FROM place_receipts pr
      JOIN places p ON pr.place_id = p.id
      WHERE p.user_id = $1
    `, [userId]);

    // 3. 내 플레이스 수
    const myPlacesResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM places
      WHERE user_id = $1
    `, [userId]);

    // 4. 오늘 등록한 리뷰 수
    const todayReviewsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM place_receipts pr
      JOIN places p ON pr.place_id = p.id
      WHERE p.user_id = $1 AND DATE(pr.created_at) = CURRENT_DATE
    `, [userId]);

    // 5. 오늘 획득한 포인트
    const todayPointsResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as amount
      FROM point_transactions
      WHERE user_id = $1
        AND DATE(created_at) = CURRENT_DATE
        AND transaction_type IN ('earn', 'admin_add', 'referral')
        AND amount > 0
    `, [userId]);

    // 총판인 경우 추가 통계
    let subordinateCount = 0;
    if (userRole === 'distributor') {
      const subordinatesResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM users
        WHERE parent_id = $1 AND status != 'deleted'
      `, [userId]);
      subordinateCount = parseInt(subordinatesResult.rows[0].count);
    }

    const myPoints = myPointsResult.rows[0] || { available: 0, pending: 0, earned: 0, spent: 0 };
    const myReviews = myReviewsResult.rows[0];

    const stats = {
      role: userRole,
      myPlaces: parseInt(myPlacesResult.rows[0].count),
      subordinates: subordinateCount,
      reviews: {
        pending: parseInt(myReviews.pending_reviews),
        approved: parseInt(myReviews.approved_reviews),
        rejected: parseInt(myReviews.rejected_reviews),
        total: parseInt(myReviews.total_reviews),
        today: parseInt(todayReviewsResult.rows[0].count)
      },
      points: {
        available: parseInt(myPoints.available),
        pending: parseInt(myPoints.pending),
        earned: parseInt(myPoints.earned),
        spent: parseInt(myPoints.spent),
        today: parseInt(todayPointsResult.rows[0].amount)
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: '통계 데이터 조회 중 오류가 발생했습니다.'
    });
  }
});

// 최근 활동 내역
router.get('/recent-activities', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const limit = parseInt(req.query.limit as string) || 15;

    // 관리자/개발자용 - 전체 활동
    if (userRole === 'admin' || userRole === 'developer') {
      // 최근 리뷰 활동
      const recentReviews = await pool.query(`
        SELECT
          pr.id,
          pr.point_status as status,
          pr.created_at,
          u.name as user_name,
          u.username,
          p.business_name as place_name,
          pr.point_amount
        FROM place_receipts pr
        JOIN places p ON pr.place_id = p.id
        JOIN users u ON p.user_id = u.id
        ORDER BY pr.created_at DESC
        LIMIT $1
      `, [limit]);

      // 최근 포인트 거래
      const recentPoints = await pool.query(`
        SELECT
          pt.id,
          pt.transaction_type,
          pt.amount,
          pt.description,
          pt.created_at,
          u.name as user_name,
          u.username
        FROM point_transactions pt
        JOIN users u ON pt.user_id = u.id
        ORDER BY pt.created_at DESC
        LIMIT $1
      `, [limit]);

      // 최근 사용자 가입
      const recentUsers = await pool.query(`
        SELECT
          id,
          username,
          name,
          role,
          created_at
        FROM users
        WHERE role IN ('advertiser', 'distributor')
        ORDER BY created_at DESC
        LIMIT $1
      `, [limit]);

      // 활동을 하나의 배열로 합치고 시간순 정렬
      const activities = [
        ...recentReviews.rows.map(r => ({
          type: 'review',
          status: r.status,
          user: { name: r.user_name, username: r.username },
          place: r.place_name,
          amount: r.point_amount,
          created_at: r.created_at,
          id: r.id
        })),
        ...recentPoints.rows.map(p => ({
          type: 'point',
          transaction_type: p.transaction_type,
          user: { name: p.user_name, username: p.username },
          amount: p.amount,
          description: p.description,
          created_at: p.created_at,
          id: p.id
        })),
        ...recentUsers.rows.map(u => ({
          type: 'user',
          user: { name: u.name, username: u.username },
          role: u.role,
          created_at: u.created_at,
          id: u.id
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      return res.json({
        success: true,
        data: activities
      });
    }

    // 일반 사용자용 - 본인 활동만
    // 내 최근 리뷰
    const myRecentReviews = await pool.query(`
      SELECT
        pr.id,
        pr.point_status as status,
        pr.created_at,
        p.business_name as place_name,
        pr.point_amount
      FROM place_receipts pr
      JOIN places p ON pr.place_id = p.id
      WHERE p.user_id = $1
      ORDER BY pr.created_at DESC
      LIMIT $2
    `, [userId, limit]);

    // 내 최근 포인트 거래
    const myRecentPoints = await pool.query(`
      SELECT
        id,
        transaction_type,
        amount,
        description,
        created_at
      FROM point_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [userId, limit]);

    // 활동을 하나의 배열로 합치고 시간순 정렬
    const activities = [
      ...myRecentReviews.rows.map(r => ({
        type: 'review',
        status: r.status,
        place: r.place_name,
        amount: r.point_amount,
        created_at: r.created_at,
        id: r.id
      })),
      ...myRecentPoints.rows.map(p => ({
        type: 'point',
        transaction_type: p.transaction_type,
        amount: p.amount,
        description: p.description,
        created_at: p.created_at,
        id: p.id
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    res.json({
      success: true,
      data: activities
    });

  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({
      success: false,
      message: '최근 활동 조회 중 오류가 발생했습니다.'
    });
  }
});

export default router;