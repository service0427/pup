const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middlewares/auth');

// 대시보드 통계
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // 전체 사용자 수
    const userCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE status = $1',
      ['active']
    );

    // 활성 광고 수
    const adsCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM advertisements WHERE status = $1',
      ['active']
    );

    // 오늘의 통계
    const todayStatsResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE) as new_users_today,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions
         WHERE type IN ('deposit', 'ad_payment')
         AND DATE(created_at) = CURRENT_DATE) as revenue_today,
        (SELECT COALESCE(SUM(clicks), 0) FROM advertisements
         WHERE DATE(updated_at) = CURRENT_DATE) as clicks_today,
        (SELECT COALESCE(SUM(impressions), 0) FROM advertisements
         WHERE DATE(updated_at) = CURRENT_DATE) as impressions_today
    `);

    // 전체 포인트 통계
    const pointStatsResult = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(amount), 0) FROM points WHERE type = 'earned') as total_earned,
        (SELECT COALESCE(ABS(SUM(amount)), 0) FROM points WHERE type = 'spent') as total_spent,
        (SELECT COUNT(DISTINCT user_id) FROM points) as users_with_points
    `);

    const stats = {
      totalUsers: parseInt(userCountResult.rows[0].count),
      activeAds: parseInt(adsCountResult.rows[0].count),
      todayStats: {
        newUsers: parseInt(todayStatsResult.rows[0].new_users_today),
        revenue: parseFloat(todayStatsResult.rows[0].revenue_today),
        clicks: parseInt(todayStatsResult.rows[0].clicks_today),
        impressions: parseInt(todayStatsResult.rows[0].impressions_today)
      },
      pointStats: {
        totalEarned: parseFloat(pointStatsResult.rows[0].total_earned),
        totalSpent: parseFloat(pointStatsResult.rows[0].total_spent),
        activeUsers: parseInt(pointStatsResult.rows[0].users_with_points)
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
router.get('/recent-activities', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // 최근 로그인
    const recentLoginsResult = await pool.query(`
      SELECT
        ll.username,
        ll.created_at,
        ll.success,
        u.name
      FROM login_logs ll
      LEFT JOIN users u ON ll.user_id = u.id
      ORDER BY ll.created_at DESC
      LIMIT $1
    `, [limit]);

    // 최근 거래
    const recentTransactionsResult = await pool.query(`
      SELECT
        t.*,
        u.username,
        u.name
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT $1
    `, [limit]);

    // 최근 광고
    const recentAdsResult = await pool.query(`
      SELECT
        a.id,
        a.title,
        a.status,
        a.created_at,
        u.username,
        u.name
      FROM advertisements a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT $1
    `, [limit]);

    res.json({
      success: true,
      data: {
        recentLogins: recentLoginsResult.rows,
        recentTransactions: recentTransactionsResult.rows,
        recentAds: recentAdsResult.rows
      }
    });

  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({
      success: false,
      message: '최근 활동 조회 중 오류가 발생했습니다.'
    });
  }
});

// 차트 데이터 (최근 7일)
router.get('/chart-data', authenticateToken, async (req, res) => {
  try {
    const chartDataResult = await pool.query(`
      WITH dates AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          '1 day'::interval
        )::date as date
      )
      SELECT
        d.date,
        COALESCE(COUNT(DISTINCT u.id), 0) as new_users,
        COALESCE(SUM(t.amount), 0) as revenue,
        COALESCE(SUM(a.clicks), 0) as clicks
      FROM dates d
      LEFT JOIN users u ON DATE(u.created_at) = d.date
      LEFT JOIN transactions t ON DATE(t.created_at) = d.date
        AND t.type IN ('deposit', 'ad_payment')
        AND t.status = 'completed'
      LEFT JOIN advertisements a ON DATE(a.updated_at) = d.date
      GROUP BY d.date
      ORDER BY d.date
    `);

    res.json({
      success: true,
      data: chartDataResult.rows
    });

  } catch (error) {
    console.error('Chart data error:', error);
    res.status(500).json({
      success: false,
      message: '차트 데이터 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;