const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows: games } = await db.query(`
      SELECT g.id, g.home_team, g.away_team, g.home_score, g.away_score, g.game_datetime, g.status,
             p.display_name AS phase_display, p.order_num
      FROM games g
      JOIN phases p ON g.phase_id = p.id
      WHERE g.status IN ('EA', 'FZ')
      ORDER BY p.order_num, g.game_datetime NULLS LAST
    `);

    if (games.length === 0) return res.json([]);

    const gameIds = games.map(g => g.id);
    const { rows: preds } = await db.query(`
      SELECT pr.game_id, pr.points, u.name AS user_name
      FROM predictions pr
      JOIN users u ON pr.user_id = u.id
      WHERE u.active = TRUE AND pr.game_id = ANY($1::int[]) AND pr.points IS NOT NULL
      ORDER BY u.name
    `, [gameIds]);

    const predMap = {};
    preds.forEach(p => {
      if (!predMap[p.game_id]) predMap[p.game_id] = { cravou: [], resultado: [], errou: [] };
      if (p.points === 3)      predMap[p.game_id].cravou.push(p.user_name);
      else if (p.points === 1) predMap[p.game_id].resultado.push(p.user_name);
      else                     predMap[p.game_id].errou.push(p.user_name);
    });

    // Group by phase
    const phaseMap = {};
    games.forEach(g => {
      if (!phaseMap[g.phase_display]) {
        phaseMap[g.phase_display] = { phase: g.phase_display, order_num: g.order_num, games: [] };
      }
      phaseMap[g.phase_display].games.push({
        ...g,
        ...(predMap[g.id] || { cravou: [], resultado: [], errou: [] }),
      });
    });

    res.json(Object.values(phaseMap).sort((a, b) => a.order_num - b.order_num));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao carregar partidas' });
  }
});

module.exports = router;
