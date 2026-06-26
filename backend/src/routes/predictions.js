const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

function isLocked(phase) {
  if (phase.is_locked_manually) return true;
  if (!phase.start_time) return false;
  const lockTime = new Date(phase.start_time).getTime() - 30 * 60 * 1000;
  return Date.now() >= lockTime;
}

// All users' predictions for a locked phase
router.get('/phase/:phaseId', authMiddleware, async (req, res) => {
  const { phaseId } = req.params;
  try {
    const { rows: phases } = await db.query('SELECT * FROM phases WHERE id = $1', [phaseId]);
    const phase = phases[0];
    if (!phase) return res.status(404).json({ error: 'Fase não encontrada' });
    if (!isLocked(phase)) return res.status(403).json({ error: 'Fase ainda não foi travada' });

    const { rows } = await db.query(`
      SELECT pr.*, u.name AS user_name,
             g.home_team, g.away_team, g.home_score AS game_home,
             g.away_score AS game_away, g.is_finished, g.game_datetime
      FROM predictions pr
      JOIN users u ON pr.user_id = u.id
      JOIN games g ON pr.game_id = g.id
      WHERE g.phase_id = $1 AND u.active = TRUE
      ORDER BY u.name, g.game_datetime NULLS LAST
    `, [phaseId]);

    const userMap = {};
    rows.forEach(r => {
      if (!userMap[r.user_id]) {
        userMap[r.user_id] = { user_id: r.user_id, user_name: r.user_name, predictions: [] };
      }
      userMap[r.user_id].predictions.push(r);
    });

    res.json(Object.values(userMap));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao carregar palpites' });
  }
});

// Submit/update predictions (batch upsert)
router.post('/', authMiddleware, async (req, res) => {
  const { predictions } = req.body;
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return res.status(400).json({ error: 'Nenhum palpite enviado' });
  }

  const gameIds = predictions.map(p => p.game_id);
  try {
    const { rows: games } = await db.query(`
      SELECT g.id, p.is_locked_manually, p.start_time
      FROM games g
      JOIN phases p ON g.phase_id = p.id
      WHERE g.id = ANY($1::int[])
    `, [gameIds]);

    const gameMap = {};
    games.forEach(g => { gameMap[g.id] = g; });

    for (const pred of predictions) {
      const game = gameMap[pred.game_id];
      if (!game) return res.status(404).json({ error: `Jogo ${pred.game_id} não encontrado` });
      if (isLocked(game)) return res.status(403).json({ error: 'Esta fase já está travada' });
      const h = Number(pred.home_score), a = Number(pred.away_score);
      if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) {
        return res.status(400).json({ error: 'Placar inválido' });
      }
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      for (const pred of predictions) {
        await client.query(`
          INSERT INTO predictions (user_id, game_id, home_score, away_score, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (user_id, game_id) DO UPDATE
          SET home_score = $3, away_score = $4, updated_at = NOW()
        `, [req.user.id, pred.game_id, pred.home_score, pred.away_score]);
      }
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao salvar palpites' });
  }
});

module.exports = router;
