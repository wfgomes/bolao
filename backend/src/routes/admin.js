const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { adminMiddleware } = require('../middleware/auth');

router.use(adminMiddleware);

function calcPoints(ph, pa, rh, ra) {
  ph = Number(ph); pa = Number(pa); rh = Number(rh); ra = Number(ra);
  if (ph === rh && pa === ra) return 10;
  const po = ph > pa ? 1 : ph < pa ? -1 : 0;
  const ro = rh > ra ? 1 : rh < ra ? -1 : 0;
  return po === ro ? 5 : 0;
}

// ── Users ──────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, username, name, is_admin, active, created_at FROM users ORDER BY name'
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Erro ao listar usuários' }); }
});

router.post('/users', async (req, res) => {
  const { username, name, password, is_admin = false } = req.body;
  if (!username || !name || !password) return res.status(400).json({ error: 'Campos obrigatórios' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      'INSERT INTO users (username, name, password_hash, is_admin) VALUES ($1,$2,$3,$4) RETURNING id,username,name,is_admin,active',
      [username, name, hash, is_admin]
    );
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Usuário já existe' });
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, password, is_admin, active } = req.body;
  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await db.query(
        `UPDATE users SET
          name = COALESCE($1, name),
          password_hash = $2,
          is_admin = COALESCE($3, is_admin),
          active = COALESCE($4, active)
         WHERE id = $5`,
        [name, hash, is_admin, active, id]
      );
    } else {
      await db.query(
        `UPDATE users SET
          name = COALESCE($1, name),
          is_admin = COALESCE($2, is_admin),
          active = COALESCE($3, active)
         WHERE id = $4`,
        [name, is_admin, active, id]
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Erro ao atualizar usuário' }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Erro ao excluir usuário' }); }
});

// ── Phases ─────────────────────────────────────────────────────────────
router.get('/phases', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM phases ORDER BY order_num');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Erro' }); }
});

router.post('/phases', async (req, res) => {
  const { name, display_name, order_num, start_time } = req.body;
  if (!name || !display_name || !order_num) return res.status(400).json({ error: 'Campos obrigatórios' });
  try {
    const { rows } = await db.query(
      'INSERT INTO phases (name, display_name, order_num, start_time) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, display_name, order_num, start_time || null]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Erro ao criar fase' }); }
});

router.put('/phases/:id', async (req, res) => {
  const { id } = req.params;
  const { name, display_name, order_num, start_time, is_locked_manually } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE phases SET
        name = COALESCE($1, name),
        display_name = COALESCE($2, display_name),
        order_num = COALESCE($3, order_num),
        start_time = $4,
        is_locked_manually = COALESCE($5, is_locked_manually)
       WHERE id = $6 RETURNING *`,
      [name, display_name, order_num, start_time || null, is_locked_manually, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Fase não encontrada' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Erro ao atualizar fase' }); }
});

router.delete('/phases/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM phases WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Erro ao excluir fase' }); }
});

// ── Games ──────────────────────────────────────────────────────────────
router.get('/games', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT g.*, p.display_name AS phase_display, p.name AS phase_name
      FROM games g
      JOIN phases p ON g.phase_id = p.id
      ORDER BY p.order_num, g.game_datetime NULLS LAST
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Erro' }); }
});

router.post('/games', async (req, res) => {
  const { phase_id, home_team, away_team, game_datetime } = req.body;
  if (!phase_id || !home_team || !away_team) return res.status(400).json({ error: 'Campos obrigatórios' });
  try {
    const { rows } = await db.query(
      'INSERT INTO games (phase_id, home_team, away_team, game_datetime) VALUES ($1,$2,$3,$4) RETURNING *',
      [phase_id, home_team, away_team, game_datetime || null]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Erro ao criar jogo' }); }
});

router.put('/games/:id', async (req, res) => {
  const { id } = req.params;
  const { phase_id, home_team, away_team, game_datetime } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE games SET
        phase_id = COALESCE($1, phase_id),
        home_team = COALESCE($2, home_team),
        away_team = COALESCE($3, away_team),
        game_datetime = $4
       WHERE id = $5 RETURNING *`,
      [phase_id, home_team, away_team, game_datetime || null, id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Erro ao atualizar jogo' }); }
});

router.delete('/games/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM games WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Erro ao excluir jogo' }); }
});

// Set game result and recalculate points
router.put('/games/:id/result', async (req, res) => {
  const { id } = req.params;
  const { home_score, away_score } = req.body;
  if (home_score === undefined || away_score === undefined) {
    return res.status(400).json({ error: 'Resultado obrigatório' });
  }
  try {
    await db.query(
      'UPDATE games SET home_score = $1, away_score = $2, is_finished = TRUE WHERE id = $3',
      [home_score, away_score, id]
    );
    const { rows: preds } = await db.query('SELECT * FROM predictions WHERE game_id = $1', [id]);
    for (const pred of preds) {
      const pts = calcPoints(pred.home_score, pred.away_score, home_score, away_score);
      await db.query('UPDATE predictions SET points = $1 WHERE id = $2', [pts, pred.id]);
    }
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao salvar resultado' });
  }
});

// ── Predictions (admin view) ───────────────────────────────────────────
router.get('/predictions', async (req, res) => {
  const { phase_id } = req.query;
  try {
    let query = `
      SELECT pr.*, u.name AS user_name, g.home_team, g.away_team,
             g.home_score AS game_home, g.away_score AS game_away,
             g.is_finished, g.game_datetime, p.display_name AS phase_display
      FROM predictions pr
      JOIN users u ON pr.user_id = u.id
      JOIN games g ON pr.game_id = g.id
      JOIN phases p ON g.phase_id = p.id
      WHERE u.active = TRUE
    `;
    const params = [];
    if (phase_id) { params.push(phase_id); query += ` AND p.id = $${params.length}`; }
    query += ' ORDER BY p.order_num, g.game_datetime NULLS LAST, u.name';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Erro' }); }
});

// ── Standings (admin) ─────────────────────────────────────────────────
router.get('/standings', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        u.id, u.name,
        COALESCE(SUM(pr.points), 0)::int                    AS points,
        COUNT(CASE WHEN pr.points = 10 THEN 1 END)::int     AS exact_scores,
        COUNT(CASE WHEN pr.points = 5  THEN 1 END)::int     AS correct_outcomes,
        COUNT(CASE WHEN pr.points = 0  THEN 1 END)::int     AS wrong,
        COUNT(pr.id)::int                                   AS total_predictions
      FROM users u
      LEFT JOIN predictions pr ON u.id = pr.user_id
      WHERE u.active = TRUE AND u.is_admin = FALSE
      GROUP BY u.id, u.name
      ORDER BY points DESC, exact_scores DESC, u.name
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Erro' }); }
});

module.exports = router;
