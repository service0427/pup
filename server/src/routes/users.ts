import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// 모든 사용자 조회 (권한에 따라 필터링)
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const {
      role,
      status,
      parent_id,
      include_subordinates,
      search,
      page = 1,
      limit = 20,
      exclude_role,
      show_admin_children
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT
        u.id,
        u.username,
        u.name,
        u.role,
        u.status,
        u.tier_level,
        u.parent_id,
        u.path,
        u.permissions,
        u.created_at,
        u.last_login_at,
        u.metadata,
        p.name as parent_name,
        COUNT(sub.id) as subordinate_count,
        COALESCE(pb.available_points, 0) as available_points,
        COALESCE(pb.total_earned, 0) as total_earned
      FROM users u
      LEFT JOIN users p ON u.parent_id = p.id
      LEFT JOIN users sub ON sub.parent_id = u.id
      LEFT JOIN point_balances pb ON u.id = pb.user_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // 권한에 따른 필터링
    if (req.user.role === 'distributor') {
      // 총판은 자신과 하위만 조회
      query += ` AND (u.id = $${paramIndex} OR u.path LIKE $${paramIndex + 1})`;
      params.push(req.user.id, `${req.user.path}/%`);
      paramIndex += 2;
    } else if (req.user.role === 'user') {
      // 일반 사용자는 자신만 조회
      query += ` AND u.id = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    }
    // admin은 모든 사용자 조회 가능

    // 필터 조건
    if (role) {
      // 쉼표로 구분된 역할 처리
      if (role.includes(',')) {
        const roles = role.split(',');
        query += ` AND u.role IN (${roles.map((_, i) => `$${paramIndex + i}`).join(',')})`;
        roles.forEach(r => params.push(r));
        paramIndex += roles.length;
      } else {
        query += ` AND u.role = $${paramIndex}`;
        params.push(role);
        paramIndex++;
      }
    }

    if (status) {
      query += ` AND u.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (show_admin_children === 'true') {
      // 최상위 사용자  + admin이 사용자 모두 (총판 아니더라도 나오게)
      query += ` AND (
        u.parent_id IS NULL
        OR u.parent_id IN (
          SELECT id FROM users WHERE role = 'admin'
        )
      )`;
    } else if (parent_id) {
      if (parent_id === 'null') {
        query += ` AND u.parent_id IS NULL`;
      } else {
        query += ` AND u.parent_id = $${paramIndex}`;
        params.push(parseInt(parent_id));
        paramIndex++;
      }
    }

    if (search) {
      query += ` AND (u.username ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // 특정 role 제외
    if (exclude_role) {
      query += ` AND u.role != $${paramIndex}`;
      params.push(exclude_role);
      paramIndex++;
    }

    // developer는 항상 제외 (UI에서 숨김)
    //query += ` AND u.role != $${paramIndex}`;
    query += ` AND u.role NOT IN ($${paramIndex}, $${paramIndex + 1})`;
    params.push('developer', 'admin');
    paramIndex+=2;

    // GROUP BY. 추가
    query += ` GROUP BY u.id, p.name, pb.available_points, pb.total_earned`;

    // 정렬
    query += ` ORDER BY u.path, u.created_at DESC`;

    // 페이징
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // 전체 개수 조회
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      WHERE 1=1
      ${req.user.role === 'distributor' ? `AND (u.id = ${req.user.id} OR u.path LIKE '${req.user.path}/%')` : ''}
      ${req.user.role === 'user' ? `AND u.id = ${req.user.id}` : ''}
      ${role ? `AND u.role = '${role}'` : ''}
      ${status ? `AND u.status = '${status}'` : ''}
      ${parent_id ? `AND u.parent_id = ${parent_id}` : ''}
      ${search ? `AND (u.username ILIKE '%${search}%' OR u.name ILIKE '%${search}%')` : ''}
    `;
    const countResult = await pool.query(countQuery);

    res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total)
        }
      }
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
router.get('/:id', authenticateToken, async (req: any, res) => {
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

// 사용자 생성
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const {
      username,
      password,
      name,
      role = 'user',
      parent_id
    } = req.body;

    // 권한 확인 (관리자, 총판만 사용자 생성 가능)
    if (req.user.role !== 'admin' && req.user.role !== 'distributor' && req.user.role !== 'operator') {
      return res.status(403).json({
        success: false,
        message: '사용자 생성 권한이 없습니다.'
      });
    }

    // 총판이 생성하는 경우 자신이 parent가 되어야 함
    let actualParentId = parent_id;
    if (req.user.role === 'distributor') {
      actualParentId = req.user.id;
    }

    // 비밀번호 해시
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // 사용자 생성
    const result = await pool.query(`
      INSERT INTO users (
        username, password_hash, name, role, parent_id, status
      ) VALUES (
        $1, $2, $3, $4, $5, 'active'
      ) RETURNING id, username, name, role, tier_level, parent_id, path
    `, [username, passwordHash, name, role, actualParentId]);

    const newUserId = result.rows[0].id;

    // 포인트 잔액 초기화 (advertiser, writer, distributor만)
    if (['advertiser', 'writer', 'distributor'].includes(role)) {
      await pool.query(`
        INSERT INTO point_balances (user_id, available_points, pending_points, total_earned, total_spent)
        VALUES ($1, 0, 0, 0, 0)
      `, [newUserId]);
    }

    res.status(201).json({
      success: true,
      message: '사용자가 생성되었습니다.',
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('Create user error:', error);
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: '이미 존재하는 아이디입니다.'
      });
    }
    res.status(500).json({
      success: false,
      message: '사용자 생성 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 정보 수정
router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      role,
      status,
      parent_id,
      permissions
    } = req.body;

    // 권한 확인
    if (req.user.role !== 'admin') {
      if (req.user.role === 'distributor') {
        // 총판은 자신의 하위만 수정 가능
        const targetUser = await pool.query(
          'SELECT path FROM users WHERE id = $1',
          [id]
        );
        if (!targetUser.rows[0]?.path?.startsWith(req.user.path)) {
          return res.status(403).json({
            success: false,
            message: '권한이 없습니다.'
          });
        }
      } else {
        // 일반 사용자는 자신만 수정 가능
        if (req.user.id !== parseInt(id)) {
          return res.status(403).json({
            success: false,
            message: '권한이 없습니다.'
          });
        }
      }
    }

    const result = await pool.query(`
      UPDATE users
      SET
        name = COALESCE($1, name),
        role = COALESCE($2, role),
        status = COALESCE($3, status),
        parent_id = COALESCE($4, parent_id),
        permissions = COALESCE($5, permissions),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [name, role, status, parent_id, permissions, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '사용자 정보가 수정되었습니다.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 수정 중 오류가 발생했습니다.'
    });
  }
});

// 하위 사용자 조회
router.get('/:id/subordinates', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    // 권한 확인
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
      if (req.user.role === 'distributor') {
        // 총판은 자신의 하위만 조회 가능
        const targetUser = await pool.query(
          'SELECT path FROM users WHERE id = $1',
          [id]
        );
        if (!targetUser.rows[0]?.path?.startsWith(req.user.path)) {
          return res.status(403).json({
            success: false,
            message: '권한이 없습니다.'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: '권한이 없습니다.'
        });
      }
    }

    // 하위 사용자 조회 (함수 사용)
    const result = await pool.query(
      'SELECT * FROM get_subordinates($1)',
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get subordinates error:', error);
    res.status(500).json({
      success: false,
      message: '하위 사용자 조회 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 상태 변경 (관리자만)
router.patch('/:id/status', authenticateToken, async (req: any, res) => {
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

// 사용자 포인트 잔액 조회
router.get('/:id/balance', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    // 본인이거나 개발자/관리자만 조회 가능
    if (parseInt(id) !== currentUserId && req.user?.role !== 'developer' && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '다른 사용자의 포인트 정보를 조회할 권한이 없습니다.'
      });
    }

    const result = await pool.query(`
      SELECT
        COALESCE(available_points, 0) as available_points,
        COALESCE(pending_points, 0) as pending_points,
        COALESCE(total_earned, 0) as total_earned,
        COALESCE(total_spent, 0) as total_spent
      FROM point_balances
      WHERE user_id = $1
    `, [id]);

    // 포인트 기록이 없으면 기본값 반환
    const balance = result.rows[0] || {
      available_points: 0,
      pending_points: 0,
      total_earned: 0,
      total_spent: 0
    };

    res.json({
      success: true,
      data: balance
    });

  } catch (error) {
    console.error('Get user balance error:', error);
    res.status(500).json({
      success: false,
      message: '포인트 잔액 조회 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 삭제 (관리자만)
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    // 관리자 권한 확인
    if (req.user.role !== 'admin' && req.user.role !== 'developer') {
      return res.status(403).json({
        success: false,
        message: '권한이 없습니다.'
      });
    }

    // 자기 자신은 삭제할 수 없음
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: '자기 자신은 삭제할 수 없습니다.'
      });
    }

    // 사용자 존재 확인
    const userCheck = await pool.query(
      'SELECT id, username, name, role FROM users WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    const targetUser = userCheck.rows[0];

    // 개발자나 관리자 계정은 삭제할 수 없음
    if (targetUser.role === 'developer' || targetUser.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: '개발자 또는 관리자 계정은 삭제할 수 없습니다.'
      });
    }

    // 하위 사용자가 있는지 확인
    const subordinatesCheck = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE parent_id = $1',
      [id]
    );

    if (parseInt(subordinatesCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: '하위 사용자가 있는 계정은 삭제할 수 없습니다. 먼저 하위 사용자를 삭제하거나 이동시켜주세요.'
      });
    }

    // 사용자 삭제 (실제로는 status를 'deleted'로 변경하는 soft delete)
    const result = await pool.query(
      `UPDATE users
       SET status = 'deleted',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, username, name`,
      [id]
    );

    res.json({
      success: true,
      message: `사용자 ${result.rows[0].name}(${result.rows[0].username})가 삭제되었습니다.`,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 삭제 중 오류가 발생했습니다.'
    });
  }
});

export default router;