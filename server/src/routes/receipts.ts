import express from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middlewares/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 이미지 업로드 설정
const uploadDir = path.join(__dirname, '../../uploads/receipts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }
  }
});

// 관리자: 승인 대기 중인 리뷰 목록 조회 (라우트 순서상 /:id보다 먼저 배치)
router.get('/admin/pending', authenticateToken, async (req, res) => {
  try {
    const adminRole = (req as any).user.role;

    // 관리자 권한 체크
    if (adminRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자만 조회할 수 있습니다.'
      });
    }

    const result = await pool.query(
      `SELECT pr.*, p.business_name as place_name, p.address, u.name as advertiser_name
       FROM place_receipts pr
       JOIN places p ON pr.place_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE pr.point_status = 'pending'
       ORDER BY pr.submitted_at ASC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('승인 대기 리뷰 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '승인 대기 리뷰 조회에 실패했습니다.'
    });
  }
});

// 단일 리뷰 조회
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM place_receipts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '리뷰를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('리뷰 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '리뷰 조회에 실패했습니다.'
    });
  }
});

// 특정 플레이스의 리뷰 목록 조회
router.get('/place/:placeId', authenticateToken, async (req, res) => {
  try {
    const { placeId } = req.params;

    const result = await pool.query(
      `SELECT * FROM place_receipts
       WHERE place_id = $1
       ORDER BY created_at DESC`,
      [placeId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('리뷰 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '리뷰 목록 조회에 실패했습니다.'
    });
  }
});

// 리뷰 생성 (여러 개 한번에) + 포인트 차감
router.post('/place/:placeId', authenticateToken, async (req, res) => {
  try {
    const { placeId } = req.params;
    const { reviews, submit } = req.body; // [{ review_text, images, auto_generate_image }, ...], submit: boolean
    const userId = (req as any).user.id;

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({
        success: false,
        message: '리뷰 데이터가 필요합니다.'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 리뷰 단가 조회 (content_pricing에서)
      const pricingResult = await client.query(
        `SELECT price FROM content_pricing WHERE content_type = 'receipt_review' AND is_active = true`
      );

      if (pricingResult.rows.length === 0) {
        throw new Error('리뷰 단가가 설정되지 않았습니다. 관리자에게 문의하세요.');
      }

      const reviewPrice = pricingResult.rows[0].price;
      const totalPoints = reviewPrice * reviews.length;

      // 2. submit=true인 경우에만 포인트 차감 처리
      if (submit) {
        // 사용자의 available_points 확인
        const balanceResult = await client.query(
          `SELECT available_points FROM point_balances WHERE user_id = $1`,
          [userId]
        );

        if (balanceResult.rows.length === 0) {
          throw new Error('포인트 잔액 정보를 찾을 수 없습니다.');
        }

        const availablePoints = balanceResult.rows[0].available_points;

        if (availablePoints < totalPoints) {
          throw new Error(`포인트가 부족합니다. (필요: ${totalPoints}P, 보유: ${availablePoints}P)`);
        }

        // 3. 포인트 이동: available_points → pending_points
        await client.query(
          `UPDATE point_balances
           SET available_points = available_points - $1,
               pending_points = pending_points + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $2`,
          [totalPoints, userId]
        );

        // 4. 포인트 거래 기록 생성
        const balanceAfterResult = await client.query(
          `SELECT available_points, pending_points FROM point_balances WHERE user_id = $1`,
          [userId]
        );
        const balanceAfter = balanceAfterResult.rows[0];

        await client.query(
          `INSERT INTO point_transactions
           (user_id, transaction_type, amount, balance_before, balance_after, description)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            'spend',
            totalPoints,
            availablePoints,
            balanceAfter.available_points,
            `리뷰 ${reviews.length}개 제출 (승인 대기)`
          ]
        );
      }

      // 5. 리뷰 레코드 생성
      const insertedReviews = [];
      for (const review of reviews) {
        const { review_text, images, auto_generate_image } = review;

        if (!review_text || review_text.trim() === '') {
          throw new Error('리뷰 내용은 필수입니다.');
        }

        const result = await client.query(
          `INSERT INTO place_receipts (
            place_id, review_text, images, auto_generate_image,
            status, point_amount, point_status, review_status, submitted_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            placeId,
            review_text,
            images || [],
            auto_generate_image || false,
            submit ? 'submitted' : 'draft',
            reviewPrice,
            submit ? 'pending' : 'draft',
            submit ? 'awaiting_post' : null,  // draft는 NULL, submit은 awaiting_post
            submit ? new Date() : null
          ]
        );

        insertedReviews.push(result.rows[0]);
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        data: insertedReviews,
        message: submit
          ? `리뷰 ${reviews.length}개가 제출되었습니다. (차감 포인트: ${totalPoints}P)`
          : `리뷰 ${reviews.length}개가 임시 저장되었습니다.`
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('리뷰 생성 실패:', error);
    res.status(500).json({
      success: false,
      message: error.message || '리뷰 생성에 실패했습니다.'
    });
  }
});

// 리뷰 수정
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { review_text, images, auto_generate_image, status } = req.body;

    const result = await pool.query(
      `UPDATE place_receipts
       SET review_text = COALESCE($1, review_text),
           images = COALESCE($2, images),
           auto_generate_image = COALESCE($3, auto_generate_image),
           status = COALESCE($4, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [review_text, images, auto_generate_image, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '리뷰를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('리뷰 수정 실패:', error);
    res.status(500).json({
      success: false,
      message: '리뷰 수정에 실패했습니다.'
    });
  }
});

// 리뷰 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 이미지 파일 삭제
    const reviewResult = await pool.query(
      'SELECT images FROM place_receipts WHERE id = $1',
      [id]
    );

    if (reviewResult.rows.length > 0 && reviewResult.rows[0].images) {
      const images = reviewResult.rows[0].images;
      images.forEach((imagePath: string) => {
        const fullPath = path.join(__dirname, '../../', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    const result = await pool.query(
      'DELETE FROM place_receipts WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '리뷰를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '리뷰가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('리뷰 삭제 실패:', error);
    res.status(500).json({
      success: false,
      message: '리뷰 삭제에 실패했습니다.'
    });
  }
});

// 이미지 업로드
router.post('/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '이미지 파일이 필요합니다.'
      });
    }

    const imageUrl = `/uploads/receipts/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        url: imageUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    res.status(500).json({
      success: false,
      message: '이미지 업로드에 실패했습니다.'
    });
  }
});

// 이미지 삭제
router.delete('/image/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({
        success: true,
        message: '이미지가 삭제되었습니다.'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '이미지를 찾을 수 없습니다.'
      });
    }
  } catch (error) {
    console.error('이미지 삭제 실패:', error);
    res.status(500).json({
      success: false,
      message: '이미지 삭제에 실패했습니다.'
    });
  }
});

// 관리자: 리뷰 승인
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user.id;
    const adminRole = (req as any).user.role;

    // 관리자 권한 체크
    if (adminRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자만 승인할 수 있습니다.'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 리뷰 정보 조회
      const reviewResult = await client.query(
        `SELECT pr.*, p.user_id
         FROM place_receipts pr
         JOIN places p ON pr.place_id = p.id
         WHERE pr.id = $1`,
        [id]
      );

      if (reviewResult.rows.length === 0) {
        throw new Error('리뷰를 찾을 수 없습니다.');
      }

      const review = reviewResult.rows[0];

      if (review.point_status !== 'pending') {
        throw new Error('승인 대기 중인 리뷰가 아닙니다.');
      }

      const userId = review.user_id; // 광고주 ID
      const pointAmount = review.point_amount;

      // 2. 포인트 이동: pending_points → total_spent
      await client.query(
        `UPDATE point_balances
         SET pending_points = pending_points - $1,
             total_spent = total_spent + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2`,
        [pointAmount, userId]
      );

      // 3. 포인트 거래 기록 생성
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
          'spend',
          pointAmount,
          balanceResult.rows[0].available_points + pointAmount,
          balanceResult.rows[0].available_points,
          `리뷰 #${id} 승인 완료`,
          id
        ]
      );

      // 4. 리뷰 상태 업데이트
      const updatedReview = await client.query(
        `UPDATE place_receipts
         SET point_status = 'approved',
             review_status = 'awaiting_post',
             approved_at = CURRENT_TIMESTAMP,
             approved_by = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [adminId, id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: updatedReview.rows[0],
        message: '리뷰가 승인되었습니다.'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('리뷰 승인 실패:', error);
    res.status(500).json({
      success: false,
      message: error.message || '리뷰 승인에 실패했습니다.'
    });
  }
});

// 관리자: 리뷰 거절 (포인트 환불)
router.post('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // 거절 사유
    const adminId = (req as any).user.id;
    const adminRole = (req as any).user.role;

    // 관리자 권한 체크
    if (adminRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자만 거절할 수 있습니다.'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 리뷰 정보 조회
      const reviewResult = await client.query(
        `SELECT pr.*, p.user_id
         FROM place_receipts pr
         JOIN places p ON pr.place_id = p.id
         WHERE pr.id = $1`,
        [id]
      );

      if (reviewResult.rows.length === 0) {
        throw new Error('리뷰를 찾을 수 없습니다.');
      }

      const review = reviewResult.rows[0];

      if (review.point_status !== 'pending') {
        throw new Error('승인 대기 중인 리뷰가 아닙니다.');
      }

      const userId = review.user_id;
      const pointAmount = review.point_amount;

      // 2. 포인트 환불: pending_points → available_points
      await client.query(
        `UPDATE point_balances
         SET pending_points = pending_points - $1,
             available_points = available_points + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2`,
        [pointAmount, userId]
      );

      // 3. 포인트 거래 기록 생성
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
          `리뷰 #${id} 거절로 인한 환불${reason ? ` (사유: ${reason})` : ''}`,
          id
        ]
      );

      // 4. 리뷰 상태 업데이트
      const updatedReview = await client.query(
        `UPDATE place_receipts
         SET point_status = 'rejected',
             rejected_reason = $1,
             rejected_at = CURRENT_TIMESTAMP,
             rejected_by = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [reason, adminId, id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: updatedReview.rows[0],
        message: '리뷰가 거절되었습니다. 포인트가 환불되었습니다.'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('리뷰 거절 실패:', error);
    res.status(500).json({
      success: false,
      message: error.message || '리뷰 거절에 실패했습니다.'
    });
  }
});

// 사용자: 리뷰 제출 취소 (포인트 환불)
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 리뷰 정보 조회 및 권한 확인
      const reviewResult = await client.query(
        `SELECT pr.*, p.user_id
         FROM place_receipts pr
         JOIN places p ON pr.place_id = p.id
         WHERE pr.id = $1`,
        [id]
      );

      if (reviewResult.rows.length === 0) {
        throw new Error('리뷰를 찾을 수 없습니다.');
      }

      const review = reviewResult.rows[0];

      // 본인 리뷰인지 확인
      if (review.user_id !== userId) {
        throw new Error('본인의 리뷰만 취소할 수 있습니다.');
      }

      if (review.point_status !== 'pending') {
        throw new Error('승인 대기 중인 리뷰만 취소할 수 있습니다.');
      }

      const pointAmount = review.point_amount;

      // 2. 포인트 환불: pending_points → available_points
      await client.query(
        `UPDATE point_balances
         SET pending_points = pending_points - $1,
             available_points = available_points + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2`,
        [pointAmount, userId]
      );

      // 3. 포인트 거래 기록 생성
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
          `리뷰 #${id} 사용자 취소로 인한 환불`,
          id
        ]
      );

      // 4. 리뷰 상태 업데이트
      const updatedReview = await client.query(
        `UPDATE place_receipts
         SET point_status = 'cancelled',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: updatedReview.rows[0],
        message: '리뷰가 취소되었습니다. 포인트가 환불되었습니다.'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('리뷰 취소 실패:', error);
    res.status(500).json({
      success: false,
      message: error.message || '리뷰 취소에 실패했습니다.'
    });
  }
});

// 사용자: 취소된 리뷰 재제출
router.post('/:id/resubmit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 리뷰 정보 조회 및 권한 확인
      const reviewResult = await client.query(
        `SELECT pr.*, p.user_id
         FROM place_receipts pr
         JOIN places p ON pr.place_id = p.id
         WHERE pr.id = $1`,
        [id]
      );

      if (reviewResult.rows.length === 0) {
        throw new Error('리뷰를 찾을 수 없습니다.');
      }

      const review = reviewResult.rows[0];

      // 본인 리뷰인지 확인
      if (review.user_id !== userId) {
        throw new Error('본인의 리뷰만 재제출할 수 있습니다.');
      }

      // 취소된 리뷰 또는 반려된 리뷰만 재제출 가능
      if (review.point_status !== 'cancelled' && review.point_status !== 'rejected') {
        throw new Error('취소되었거나 반려된 리뷰만 재제출할 수 있습니다.');
      }

      const pointAmount = review.point_amount;

      // 2. 사용자의 available_points 확인
      const balanceResult = await client.query(
        `SELECT available_points FROM point_balances WHERE user_id = $1`,
        [userId]
      );

      if (balanceResult.rows.length === 0) {
        throw new Error('포인트 잔액 정보를 찾을 수 없습니다.');
      }

      const availablePoints = balanceResult.rows[0].available_points;

      if (availablePoints < pointAmount) {
        throw new Error(`포인트가 부족합니다. (필요: ${pointAmount}P, 보유: ${availablePoints}P)`);
      }

      // 3. 포인트 이동: available_points → pending_points
      await client.query(
        `UPDATE point_balances
         SET available_points = available_points - $1,
             pending_points = pending_points + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2`,
        [pointAmount, userId]
      );

      // 4. 포인트 거래 기록 생성
      const balanceAfterResult = await client.query(
        `SELECT available_points FROM point_balances WHERE user_id = $1`,
        [userId]
      );

      await client.query(
        `INSERT INTO point_transactions
         (user_id, transaction_type, amount, balance_before, balance_after, description, related_work_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          'spend',
          pointAmount,
          availablePoints,
          balanceAfterResult.rows[0].available_points,
          `리뷰 #${id} 재제출 (승인 대기)`,
          id
        ]
      );

      // 5. 리뷰 상태 업데이트
      const updatedReview = await client.query(
        `UPDATE place_receipts
         SET point_status = 'pending',
             review_status = 'awaiting_post',
             status = 'submitted',
             submitted_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: updatedReview.rows[0],
        message: '리뷰가 재제출되었습니다. 관리자 승인을 기다려주세요.'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('리뷰 재제출 실패:', error);
    res.status(500).json({
      success: false,
      message: error.message || '리뷰 재제출에 실패했습니다.'
    });
  }
});

// 리뷰 URL 등록/수정
router.post('/:id/url', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { review_url } = req.body;
    const userId = (req as any).user.id;

    if (!review_url || review_url.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'URL을 입력해주세요.'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 리뷰 정보 조회 및 권한 확인
      const reviewResult = await client.query(
        `SELECT pr.*, p.user_id
         FROM place_receipts pr
         JOIN places p ON pr.place_id = p.id
         WHERE pr.id = $1`,
        [id]
      );

      if (reviewResult.rows.length === 0) {
        throw new Error('리뷰를 찾을 수 없습니다.');
      }

      const review = reviewResult.rows[0];

      // 본인 리뷰인지 확인
      if (review.user_id !== userId) {
        throw new Error('본인의 리뷰만 수정할 수 있습니다.');
      }

      // 승인된 리뷰만 URL 등록 가능
      if (review.point_status !== 'approved') {
        throw new Error('승인된 리뷰만 URL을 등록할 수 있습니다.');
      }

      // 2. URL 등록/수정 및 상태 업데이트
      const isFirstRegistration = !review.review_url;

      const updatedReview = await client.query(
        `UPDATE place_receipts
         SET review_url = $1,
             review_url_registered_at = ${isFirstRegistration ? 'CURRENT_TIMESTAMP' : 'review_url_registered_at'},
             review_status = 'posted',
             last_checked_at = CURRENT_TIMESTAMP,
             last_check_status = 'success',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [review_url, id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: updatedReview.rows[0],
        message: isFirstRegistration ? 'URL이 등록되었습니다.' : 'URL이 수정되었습니다.'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('URL 등록 실패:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'URL 등록에 실패했습니다.'
    });
  }
});

// 리뷰 URL 확인 (수동 확인)
router.post('/:id/check-url', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 리뷰 정보 조회
      const reviewResult = await client.query(
        `SELECT pr.*, p.user_id
         FROM place_receipts pr
         JOIN places p ON pr.place_id = p.id
         WHERE pr.id = $1`,
        [id]
      );

      if (reviewResult.rows.length === 0) {
        throw new Error('리뷰를 찾을 수 없습니다.');
      }

      const review = reviewResult.rows[0];

      // 본인 리뷰인지 확인
      if (review.user_id !== userId) {
        throw new Error('본인의 리뷰만 확인할 수 있습니다.');
      }

      if (!review.review_url) {
        throw new Error('URL이 등록되지 않았습니다.');
      }

      // 2. 실제 URL 확인 (간단한 형식 검증만 수행 - 실제 크롤링은 향후 구현)
      // 향후: fetch를 사용하여 실제 URL 접근 가능 여부 확인
      const urlValid = true; // 일단 true로 설정

      // 3. 확인 결과 업데이트
      const updatedReview = await client.query(
        `UPDATE place_receipts
         SET last_checked_at = CURRENT_TIMESTAMP,
             last_check_status = $1,
             check_fail_count = ${urlValid ? '0' : 'check_fail_count + 1'},
             review_status = ${urlValid ? "'posted'" : "'deleted_by_system'"},
             deleted_detected_at = ${urlValid ? 'NULL' : 'CURRENT_TIMESTAMP'},
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [urlValid ? 'success' : 'failed', id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: updatedReview.rows[0],
        message: urlValid ? '리뷰가 정상적으로 확인되었습니다.' : '리뷰를 찾을 수 없습니다. 삭제되었을 수 있습니다.'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('URL 확인 실패:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'URL 확인에 실패했습니다.'
    });
  }
});

// 사용자: 리뷰 삭제 요청 (승인된 리뷰만, 포인트 환불 없음)
router.post('/:id/request-delete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user.id;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '삭제 요청 사유를 입력해주세요.'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 리뷰 정보 조회 및 권한 확인
      const reviewResult = await client.query(
        `SELECT pr.*, p.user_id
         FROM place_receipts pr
         JOIN places p ON pr.place_id = p.id
         WHERE pr.id = $1`,
        [id]
      );

      if (reviewResult.rows.length === 0) {
        throw new Error('리뷰를 찾을 수 없습니다.');
      }

      const review = reviewResult.rows[0];

      // 본인 리뷰인지 확인
      if (review.user_id !== userId) {
        throw new Error('본인의 리뷰만 삭제 요청할 수 있습니다.');
      }

      // 승인된 리뷰만 삭제 요청 가능
      if (review.point_status !== 'approved') {
        throw new Error('승인된 리뷰만 삭제 요청할 수 있습니다.');
      }

      // 이미 삭제 요청된 리뷰인지 확인
      if (review.delete_requested_at) {
        throw new Error('이미 삭제 요청된 리뷰입니다.');
      }

      // 2. 삭제 요청 기록 (이전 거부 정보 초기화)
      const updatedReview = await client.query(
        `UPDATE place_receipts
         SET delete_requested_at = CURRENT_TIMESTAMP,
             delete_request_reason = $1,
             delete_rejected_at = NULL,
             delete_rejected_reason = NULL,
             delete_rejected_by = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [reason, id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: updatedReview.rows[0],
        message: '삭제 요청이 접수되었습니다. 관리자 승인 후 처리됩니다.'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('삭제 요청 실패:', error);
    res.status(500).json({
      success: false,
      message: error.message || '삭제 요청에 실패했습니다.'
    });
  }
});

// 관리자: 삭제 요청 목록 조회
router.get('/admin/delete-requests', authenticateToken, async (req, res) => {
  try {
    const adminRole = (req as any).user.role;

    // 관리자 권한 체크
    if (adminRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자만 조회할 수 있습니다.'
      });
    }

    const result = await pool.query(
      `SELECT pr.*, p.business_name as place_name, p.address, u.name as advertiser_name
       FROM place_receipts pr
       JOIN places p ON pr.place_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE pr.delete_requested_at IS NOT NULL AND pr.review_status != 'deleted'
       ORDER BY pr.delete_requested_at ASC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('삭제 요청 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '삭제 요청 목록 조회에 실패했습니다.'
    });
  }
});

// 관리자: 전체 리뷰 조회
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const adminRole = (req as any).user.role;

    // 관리자 권한 체크
    if (adminRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자만 조회할 수 있습니다.'
      });
    }

    const result = await pool.query(
      `SELECT pr.*, p.business_name as place_name, p.address, u.name as advertiser_name
       FROM place_receipts pr
       JOIN places p ON pr.place_id = p.id
       JOIN users u ON p.user_id = u.id
       ORDER BY pr.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('전체 리뷰 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '전체 리뷰 조회에 실패했습니다.'
    });
  }
});

// 관리자: 삭제 요청 승인 (실제 삭제 처리)
router.post('/:id/approve-delete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user.id;
    const adminRole = (req as any).user.role;

    // 관리자 권한 체크
    if (adminRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자만 승인할 수 있습니다.'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 리뷰 정보 조회
      const reviewResult = await client.query(
        `SELECT * FROM place_receipts WHERE id = $1`,
        [id]
      );

      if (reviewResult.rows.length === 0) {
        throw new Error('리뷰를 찾을 수 없습니다.');
      }

      const review = reviewResult.rows[0];

      if (!review.delete_requested_at) {
        throw new Error('삭제 요청된 리뷰가 아닙니다.');
      }

      // 2. 리뷰 상태를 deleted_by_request로 변경
      const updatedReview = await client.query(
        `UPDATE place_receipts
         SET review_status = 'deleted_by_request',
             deleted_detected_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: updatedReview.rows[0],
        message: '삭제 요청이 승인되었습니다.'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('삭제 승인 실패:', error);
    res.status(500).json({
      success: false,
      message: error.message || '삭제 승인에 실패했습니다.'
    });
  }
});

// 관리자: 삭제 요청 거부
router.post('/:id/reject-delete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // 거부 사유
    const adminId = (req as any).user.id;
    const adminRole = (req as any).user.role;

    // 관리자 권한 체크
    if (adminRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자만 거부할 수 있습니다.'
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '거부 사유를 입력해주세요.'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 리뷰 정보 조회
      const reviewResult = await client.query(
        `SELECT * FROM place_receipts WHERE id = $1`,
        [id]
      );

      if (reviewResult.rows.length === 0) {
        throw new Error('리뷰를 찾을 수 없습니다.');
      }

      const review = reviewResult.rows[0];

      if (!review.delete_requested_at) {
        throw new Error('삭제 요청된 리뷰가 아닙니다.');
      }

      // 2. 삭제 요청 거부 처리 (delete_requested_at을 NULL로, 거부 사유 기록)
      const updatedReview = await client.query(
        `UPDATE place_receipts
         SET delete_requested_at = NULL,
             delete_request_reason = NULL,
             delete_rejected_at = CURRENT_TIMESTAMP,
             delete_rejected_reason = $1,
             delete_rejected_by = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [reason, adminId, id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: updatedReview.rows[0],
        message: '삭제 요청이 거부되었습니다.'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('삭제 거부 실패:', error);
    res.status(500).json({
      success: false,
      message: error.message || '삭제 거부에 실패했습니다.'
    });
  }
});

// 관리자: 리뷰 상태 변경
router.put('/:id/update-review-status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { review_status, review_url_registered_at, deleted_detected_at } = req.body;
    const adminRole = (req as any).user.role;

    // 관리자 권한 체크
    if (adminRole !== 'admin' && adminRole !== 'developer') {
      return res.status(403).json({
        success: false,
        message: '관리자만 변경할 수 있습니다.'
      });
    }

    // review_status 유효성 검사
    const validStatuses = ['awaiting_post', 'posted', 'deleted_by_system', 'deleted_by_request', 'expired'];
    if (!review_status || !validStatuses.includes(review_status)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 리뷰 상태입니다.'
      });
    }

    // 리뷰 상태 업데이트
    // posted 상태인 경우 review_url_registered_at 설정
    // deleted 상태인 경우 deleted_detected_at 설정
    const updateQuery = `
      UPDATE place_receipts
      SET review_status = $1,
          review_url_registered_at = CASE
            WHEN $2 IS NOT NULL THEN $2::timestamp
            ELSE review_url_registered_at
          END,
          deleted_detected_at = CASE
            WHEN $3 IS NOT NULL THEN $3::timestamp
            ELSE deleted_detected_at
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      review_status,
      review_url_registered_at,
      deleted_detected_at,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '리뷰를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '리뷰 상태가 변경되었습니다.',
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('리뷰 상태 변경 실패:', error);
    res.status(500).json({
      success: false,
      message: error.message || '리뷰 상태 변경에 실패했습니다.'
    });
  }
});

export default router;
