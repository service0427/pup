import pool from '../config/database';

/**
 * 자동 환불 배치 작업
 *
 * 승인되지 않은 리뷰가 system_settings.auto_refund_days를 초과하면
 * 자동으로 포인트를 환불하는 작업
 *
 * 실행 시점: 매일 자정 또는 수동 실행
 */
export async function runAutoRefund() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. 자동 환불 기간 설정값 조회
    const settingsResult = await client.query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'auto_refund_days'`
    );

    if (settingsResult.rows.length === 0) {
      throw new Error('auto_refund_days 설정을 찾을 수 없습니다.');
    }

    const autoRefundDays = parseInt(settingsResult.rows[0].setting_value);

    // 2. 환불 대상 리뷰 조회 (제출일로부터 N일 경과한 pending 상태 리뷰)
    const expiredReviewsResult = await client.query(
      `SELECT pr.*, p.advertiser_id
       FROM place_receipts pr
       JOIN places p ON pr.place_id = p.id
       WHERE pr.point_status = 'pending'
         AND pr.submitted_at IS NOT NULL
         AND pr.submitted_at <= NOW() - INTERVAL '${autoRefundDays} days'`
    );

    const expiredReviews = expiredReviewsResult.rows;

    if (expiredReviews.length === 0) {
      console.log('[자동 환불] 환불 대상 리뷰가 없습니다.');
      await client.query('COMMIT');
      return {
        success: true,
        message: '환불 대상 리뷰가 없습니다.',
        refundedCount: 0
      };
    }

    console.log(`[자동 환불] ${expiredReviews.length}개의 리뷰를 환불 처리합니다.`);

    // 3. 각 리뷰에 대해 환불 처리
    let refundedCount = 0;
    for (const review of expiredReviews) {
      const userId = review.advertiser_id;
      const pointAmount = review.point_amount;
      const reviewId = review.id;

      try {
        // 포인트 환불: pending_points → available_points
        await client.query(
          `UPDATE point_balances
           SET pending_points = pending_points - $1,
               available_points = available_points + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $2`,
          [pointAmount, userId]
        );

        // 포인트 거래 기록 생성
        const balanceResult = await client.query(
          `SELECT available_points FROM point_balances WHERE user_id = $1`,
          [userId]
        );

        await client.query(
          `INSERT INTO point_transactions
           (user_id, transaction_type, amount, balance_before, balance_after, description, related_work_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            userId,
            'refund',
            pointAmount,
            balanceResult.rows[0].available_points - pointAmount,
            balanceResult.rows[0].available_points,
            `리뷰 #${reviewId} 자동 환불 (${autoRefundDays}일 경과)`,
            reviewId
          ]
        );

        // 리뷰 상태 업데이트
        await client.query(
          `UPDATE place_receipts
           SET point_status = 'refunded',
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [reviewId]
        );

        refundedCount++;
        console.log(`[자동 환불] 리뷰 #${reviewId} 환불 완료 (${pointAmount}P → 사용자 #${userId})`);
      } catch (error) {
        console.error(`[자동 환불] 리뷰 #${reviewId} 환불 실패:`, error);
        // 개별 리뷰 환불 실패 시 다음 리뷰 계속 처리
      }
    }

    await client.query('COMMIT');

    console.log(`[자동 환불] 완료: ${refundedCount}/${expiredReviews.length}개 환불`);

    return {
      success: true,
      message: `${refundedCount}개의 리뷰가 자동 환불되었습니다.`,
      refundedCount
    };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[자동 환불] 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 수동 실행용 엔트리포인트
 *
 * 사용법:
 *   npx ts-node src/jobs/autoRefund.ts
 */
if (require.main === module) {
  console.log('[자동 환불] 배치 작업 시작...');
  runAutoRefund()
    .then((result) => {
      console.log('[자동 환불] 결과:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('[자동 환불] 에러:', error);
      process.exit(1);
    });
}
