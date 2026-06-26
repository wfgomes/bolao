const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

function isLocked(phase) {
  if (phase.is_locked_manually) return true;
  if (!phase.start_time) return false;
  const lockTime = new Date(phase.start_time).getTime() - 30 * 60 * 1000;
  return Date.now() >= lockTime;
}

router.get('/phases', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM phases ORDER BY order_num');
    res.json(rows.map(p => ({ ...p, is_locked: isLocked(p) })));
  } catch (e) {
    res.status(500).json({ error: 'Erro ao carregar fases' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows: phases } = await db.query('SELECT * FROM phases ORDER BY order_num');
    const { rows: games } = await db.query(`
      SELECT g.*, p.name AS phase_name, p.display_name AS phase_display,
             p.is_locked_manually, p.start_time
      FROM games g
      JOIN phases p ON g.phase_id = p.id
      ORDER BY p.order_num, g.game_datetime NULLS LAST
    `);

    const { rows: preds } = await db.query(
      'SELECT * FROM predictions WHERE user_id = $1',
      [req.user.id]
    );
    const predMap = {};
    preds.forEach(p => { predMap[p.game_id] = p; });

    const phaseMap = {};
    phases.forEach(p => {
      phaseMap[p.id] = { ...p, is_locked: isLocked(p), games: [] };
    });

    games.forEach(g => {
      if (phaseMap[g.phase_id]) {
        phaseMap[g.phase_id].games.push({ ...g, prediction: predMap[g.id] || null });
      }
    });

    res.json(Object.values(phaseMap).filter(p => p.games.length > 0));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao carregar jogos' });
  }
});

module.exports = router;
