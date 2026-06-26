const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        u.id,
        u.name,
        (COALESCE(SUM(pr.points), 0) + COALESCE(art.goals, 0))::int AS points,
        COALESCE(SUM(pr.points), 0)::int                             AS prediction_points,
        COALESCE(art.goals, 0)::int                                  AS artilheiro_points,
        COUNT(CASE WHEN pr.points = 3 THEN 1 END)::int               AS exact_scores,
        COUNT(CASE WHEN pr.points = 1 THEN 1 END)::int               AS correct_outcomes,
        COUNT(CASE WHEN pr.points = 0 THEN 1 END)::int               AS wrong,
        COUNT(pr.id)::int                                             AS total_predictions,
        art.name                                                      AS artilheiro_name,
        art.goals                                                     AS artilheiro_goals
      FROM users u
      LEFT JOIN predictions pr ON u.id = pr.user_id
      LEFT JOIN user_artilheiro ua ON u.id = ua.user_id
      LEFT JOIN artilheiros art ON ua.artilheiro_id = art.id
      WHERE u.active = TRUE AND u.is_admin = FALSE
      GROUP BY u.id, u.name, art.name, art.goals
      ORDER BY points DESC, exact_scores DESC, u.name
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao carregar classificação' });
  }
});

module.exports = router;
