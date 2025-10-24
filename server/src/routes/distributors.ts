import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// 총판의 캠페인 생성 가능 여부 확인
router.get('/can-create-campaign', authenticateToken, async (req: any, res) => {
  try {
    const { distributor_id } = req.query;

    // 권한 확인
    let targetDistributorId = req.user.id;
    if (distributor_id && req.user.role === 'admin') {
      // 관리자는 다른 총판 조회 가능
      targetDistributorId = parseInt(distributor_id);
    } else if (distributor_id && distributor_id !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: '다른 총판의 정보를 조회할 권한이 없습니다.'
      });
    }

    // 총판 권한 확인
    if (req.user.role !== 'admin' && req.user.role !== 'distributor') {
      return res.status(403).json({
        success: false,
        message: '총판 권한이 필요합니다.'
      });
    }

    const result = await pool.query(`
      SELECT
        u.id,
        u.username,
        u.name,
        u.role,
        get_subordinate_advertiser_count(u.id) as subordinate_advertiser_count,
        can_distributor_create_campaign(u.id) as can_create_campaign
      FROM users u
      WHERE u.id = $1
    `, [targetDistributorId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '총판을 찾을 수 없습니다.'
      });
    }

    const distributor = result.rows[0];

    res.json({
      success: true,
      data: {
        distributor_id: distributor.id,
        username: distributor.username,
        name: distributor.name,
        subordinate_advertiser_count: parseInt(distributor.subordinate_advertiser_count),
        can_create_campaign: distributor.can_create_campaign,
        restriction_reason: distributor.can_create_campaign
          ? null
          : `하위 광고주가 ${distributor.subordinate_advertiser_count}명 있어 직접 캠페인을 생성할 수 없습니다.`
      }
    });

  } catch (error) {
    console.error('Check campaign creation eligibility error:', error);
    res.status(500).json({
      success: false,
      message: '캠페인 생성 가능 여부 확인 중 오류가 발생했습니다.'
    });
  }
});

// 총판의 하위 광고주 목록 조회
router.get('/subordinate-advertisers', authenticateToken, async (req: any, res) => {
  try {
    const { distributor_id } = req.query;

    // 권한 확인
    let targetDistributorId = req.user.id;
    if (distributor_id && req.user.role === 'admin') {
      targetDistributorId = parseInt(distributor_id);
    } else if (distributor_id && distributor_id !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: '다른 총판의 하위 광고주를 조회할 권한이 없습니다.'
      });
    }

    // 총판 권한 확인
    if (req.user.role !== 'admin' && req.user.role !== 'distributor') {
      return res.status(403).json({
        success: false,
        message: '총판 권한이 필요합니다.'
      });
    }

    const result = await pool.query(
      'SELECT * FROM get_subordinate_advertisers($1)',
      [targetDistributorId]
    );

    res.json({
      success: true,
      data: {
        distributor_id: targetDistributorId,
        subordinate_advertisers: result.rows,
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('Get subordinate advertisers error:', error);
    res.status(500).json({
      success: false,
      message: '하위 광고주 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 총판 비즈니스 규칙 요약 조회 (관리자용)
router.get('/business-rules', authenticateToken, async (req: any, res) => {
  try {
    // 관리자만 전체 총판 규칙 조회 가능
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.'
      });
    }

    const result = await pool.query(`
      SELECT * FROM distributor_business_rules
      ORDER BY subordinate_advertiser_count DESC, username
    `);

    // 요약 통계
    const summaryResult = await pool.query(`
      SELECT
        COUNT(*) as total_distributors,
        COUNT(CASE WHEN can_create_campaign THEN 1 END) as can_create_campaign_count,
        COUNT(CASE WHEN NOT can_create_campaign THEN 1 END) as cannot_create_campaign_count,
        SUM(subordinate_advertiser_count) as total_subordinate_advertisers,
        SUM(available_points) as total_available_points,
        SUM(pending_point_requests) as total_pending_requests
      FROM distributor_business_rules
    `);

    res.json({
      success: true,
      data: {
        distributors: result.rows,
        summary: summaryResult.rows[0]
      }
    });

  } catch (error) {
    console.error('Get distributor business rules error:', error);
    res.status(500).json({
      success: false,
      message: '총판 비즈니스 규칙 조회 중 오류가 발생했습니다.'
    });
  }
});

// 총판이 캠페인 생성을 시도할 때 검증 (middleware로 사용 가능)
router.post('/validate-campaign-creation', authenticateToken, async (req: any, res) => {
  try {
    const { distributor_id } = req.body;

    // 권한 확인
    let targetDistributorId = req.user.id;
    if (distributor_id && req.user.role === 'admin') {
      targetDistributorId = parseInt(distributor_id);
    } else if (req.user.role === 'distributor') {
      targetDistributorId = req.user.id;
    } else {
      return res.status(403).json({
        success: false,
        message: '캠페인 생성 권한이 없습니다.'
      });
    }

    const result = await pool.query(
      'SELECT can_distributor_create_campaign($1) as can_create',
      [targetDistributorId]
    );

    const canCreate = result.rows[0].can_create;

    if (!canCreate) {
      // 하위 광고주 정보 조회
      const subordinatesResult = await pool.query(
        'SELECT get_subordinate_advertiser_count($1) as count',
        [targetDistributorId]
      );

      const subordinateCount = subordinatesResult.rows[0].count;

      return res.status(400).json({
        success: false,
        message: '캠페인 생성이 제한되었습니다.',
        reason: `하위 광고주가 ${subordinateCount}명 있어 직접 캠페인을 생성할 수 없습니다. 하위 광고주에게 캠페인 생성을 위임하거나, 모든 하위 광고주를 다른 총판으로 이전한 후 시도해주세요.`,
        data: {
          distributor_id: targetDistributorId,
          subordinate_advertiser_count: parseInt(subordinateCount),
          can_create_campaign: false
        }
      });
    }

    res.json({
      success: true,
      message: '캠페인 생성이 가능합니다.',
      data: {
        distributor_id: targetDistributorId,
        subordinate_advertiser_count: 0,
        can_create_campaign: true
      }
    });

  } catch (error) {
    console.error('Validate campaign creation error:', error);
    res.status(500).json({
      success: false,
      message: '캠페인 생성 검증 중 오류가 발생했습니다.'
    });
  }
});

export default router;