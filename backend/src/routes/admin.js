const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { adminMiddleware } = require('../middleware/auth');

router.use(adminMiddleware);

async function recalcPoints(gameId, rh, ra) {
  const { rows: preds } = await db.query('SELECT * FROM predictions WHERE game_id = $1', [gameId]);
  for (const pred of preds) {
    const pts = calcPoints(pred.home_score, pred.away_score, rh, ra);
    await db.query('UPDATE predictions SET points = $1 WHERE id = $2', [pts, pred.id]);
  }
}

function calcPoints(ph, pa, rh, ra) {
  ph = Number(ph); pa = Number(pa); rh = Number(rh); ra = Number(ra);
  if (ph === rh && pa === ra) return 3;
  const po = ph > pa ? 1 : ph < pa ? -1 : 0;
  const ro = rh > ra ? 1 : rh < ra ? -1 : 0;
  return po === ro ? 1 : 0;
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

// Salva placar → status EA (Em Andamento), recalcula pontos
router.put('/games/:id/result', async (req, res) => {
  const { id } = req.params;
  const { home_score, away_score } = req.body;
  if (home_score === undefined || away_score === undefined) {
    return res.status(400).json({ error: 'Resultado obrigatório' });
  }
  try {
    await db.query(
      'UPDATE games SET home_score = $1, away_score = $2, status = $3, is_finished = FALSE WHERE id = $4',
      [home_score, away_score, 'EA', id]
    );
    await recalcPoints(id, home_score, away_score);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao salvar resultado' });
  }
});

// Finaliza jogo → status FZ, recalcula pontos com placar final
router.put('/games/:id/finalizar', async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE games SET status = $1, is_finished = TRUE WHERE id = $2 RETURNING home_score, away_score',
      ['FZ', req.params.id]
    );
    const { home_score, away_score } = rows[0] || {};
    if (home_score !== null && away_score !== null && home_score !== undefined) {
      await recalcPoints(req.params.id, home_score, away_score);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao finalizar jogo' });
  }
});

// Cancela resultado → limpa placar e pontos
router.delete('/games/:id/result', async (req, res) => {
  try {
    await db.query(
      'UPDATE games SET home_score = NULL, away_score = NULL, status = NULL, is_finished = FALSE WHERE id = $1',
      [req.params.id]
    );
    await db.query('UPDATE predictions SET points = NULL WHERE game_id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao cancelar resultado' });
  }
});

// ── Predictions (admin view) ───────────────────────────────────────────
router.get('/predictions', async (req, res) => {
  const { phase_id, user_id } = req.query;
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
    if (user_id)  { params.push(user_id);  query += ` AND pr.user_id = $${params.length}`; }
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
        (COALESCE(SUM(pr.points), 0) + GREATEST(COALESCE(art.goals, 0) - COALESCE(art.goals_offset, 0), 0))::int AS points,
        COALESCE(SUM(pr.points), 0)::int                                                                          AS prediction_points,
        GREATEST(COALESCE(art.goals, 0) - COALESCE(art.goals_offset, 0), 0)::int                                 AS artilheiro_points,
        COUNT(CASE WHEN pr.points = 3 THEN 1 END)::int               AS exact_scores,
        COUNT(CASE WHEN pr.points = 1 THEN 1 END)::int               AS correct_outcomes,
        COUNT(CASE WHEN pr.points = 0 THEN 1 END)::int               AS wrong,
        COUNT(pr.id)::int                                             AS total_predictions,
        art.name                                                      AS artilheiro_name,
        art.goals                                                     AS artilheiro_goals,
        art.goals_offset                                              AS artilheiro_goals_offset,
        GREATEST(COALESCE(art.goals, 0) - COALESCE(art.goals_offset, 0), 0)::int AS artilheiro_effective_goals
      FROM users u
      LEFT JOIN predictions pr ON u.id = pr.user_id
      LEFT JOIN user_artilheiro ua ON u.id = ua.user_id
      LEFT JOIN artilheiros art ON ua.artilheiro_id = art.id
      WHERE u.active = TRUE AND u.is_admin = FALSE
      GROUP BY u.id, u.name, art.name, art.goals, art.goals_offset
      ORDER BY points DESC, exact_scores DESC, u.name
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Erro' }); }
});

// ── Artilheiros (admin) ───────────────────────────────────────────────
router.get('/artilheiros', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT *, GREATEST(goals - goals_offset, 0) AS effective_goals
      FROM artilheiros ORDER BY effective_goals DESC, name
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Erro' }); }
});

router.post('/artilheiros', async (req, res) => {
  const { name, team, goals = 0, goals_offset = 0 } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  try {
    const { rows } = await db.query(
      'INSERT INTO artilheiros (name, team, goals, goals_offset) VALUES ($1, $2, $3, $4) RETURNING *, GREATEST(goals - goals_offset, 0) AS effective_goals',
      [name, team || null, goals, goals_offset]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Erro ao criar artilheiro' }); }
});

router.put('/artilheiros/:id', async (req, res) => {
  const { name, team, goals, goals_offset } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE artilheiros SET
        name         = COALESCE($1, name),
        team         = COALESCE($2, team),
        goals        = COALESCE($3, goals),
        goals_offset = COALESCE($4, goals_offset)
       WHERE id = $5 RETURNING *, GREATEST(goals - goals_offset, 0) AS effective_goals`,
      [name, team, goals, goals_offset, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Erro ao atualizar artilheiro' }); }
});

router.delete('/artilheiros/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM artilheiros WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Erro ao excluir artilheiro' }); }
});

// Quem escolheu cada artilheiro
router.get('/artilheiro-choices', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT u.name AS user_name, a.name AS artilheiro_name, a.goals
      FROM users u
      LEFT JOIN user_artilheiro ua ON u.id = ua.user_id
      LEFT JOIN artilheiros a ON ua.artilheiro_id = a.id
      WHERE u.active = TRUE AND u.is_admin = FALSE
      ORDER BY a.name, u.name
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Erro' }); }
});

module.exports = router;
