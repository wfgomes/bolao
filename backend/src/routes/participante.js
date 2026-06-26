const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

function isLocked(phase) {
  if (phase.is_locked_manually) return true;
  if (!phase.start_time) return false;
  return Date.now() >= new Date(phase.start_time).getTime() - 30 * 60 * 1000;
}

router.get('/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  try {
    const { rows: users } = await db.query(
      'SELECT id, name FROM users WHERE id = $1 AND active = TRUE AND is_admin = FALSE',
      [userId]
    );
    if (!users[0]) return res.status(404).json({ error: 'Participante não encontrado' });

    const { rows: phases } = await db.query('SELECT * FROM phases ORDER BY order_num');
    const phaseIds = phases.filter(isLocked).map(p => p.id);

    if (phaseIds.length === 0) {
      return res.json({
        user: users[0],
        stats: { points: 0, exact_scores: 0, correct_outcomes: 0, wrong: 0 },
        phases: [],
        artilheiro: null,
      });
    }

    const { rows: preds } = await db.query(`
      SELECT pr.*,
             g.home_team, g.away_team,
             g.home_score AS game_home, g.away_score AS game_away,
             g.status AS game_status, g.game_datetime,
             p.display_name AS phase_display, p.id AS phase_id, p.order_num
      FROM predictions pr
      JOIN games g ON pr.game_id = g.id
      JOIN phases p ON g.phase_id = p.id
      WHERE pr.user_id = $1 AND p.id = ANY($2::int[])
      ORDER BY p.order_num, g.game_datetime NULLS LAST
    `, [userId, phaseIds]);

    const { rows: artRow } = await db.query(`
      SELECT a.name AS artilheiro_name, a.team, a.goals
      FROM user_artilheiro ua
      JOIN artilheiros a ON ua.artilheiro_id = a.id
      WHERE ua.user_id = $1
    `, [userId]);

    // Pontuação total
    const { rows: pts } = await db.query(`
      SELECT
        (COALESCE(SUM(pr.points), 0) + COALESCE(
          (SELECT a.goals FROM user_artilheiro ua
           JOIN artilheiros a ON ua.artilheiro_id = a.id
           WHERE ua.user_id = $1 LIMIT 1), 0
        ))::int AS points,
        COUNT(CASE WHEN pr.points = 3 THEN 1 END)::int AS exact_scores,
        COUNT(CASE WHEN pr.points = 1 THEN 1 END)::int AS correct_outcomes,
        COUNT(CASE WHEN pr.points = 0 THEN 1 END)::int AS wrong
      FROM predictions pr
      WHERE pr.user_id = $1
    `, [userId]);

    // Agrupa por fase
    const phaseMap = {};
    preds.forEach(p => {
      if (!phaseMap[p.phase_id]) {
        phaseMap[p.phase_id] = {
          phase_id: p.phase_id,
          phase_display: p.phase_display,
          order_num: p.order_num,
          predictions: [],
        };
      }
      phaseMap[p.phase_id].predictions.push(p);
    });

    res.json({
      user: users[0],
      stats: pts[0],
      phases: Object.values(phaseMap).sort((a, b) => a.order_num - b.order_num),
      artilheiro: artRow[0] || null,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao carregar participante' });
  }
});

module.exports = router;
