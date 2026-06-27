const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

function isLocked(phase) {
  if (phase.is_locked_manually) return true;
  if (!phase.start_time) return false;
  return Date.now() >= new Date(phase.start_time).getTime() - 30 * 60 * 1000;
}

async function firstPhaseLocked() {
  const { rows } = await db.query('SELECT * FROM phases ORDER BY order_num LIMIT 1');
  if (!rows[0]) return false;
  return isLocked(rows[0]);
}

// Lista artilheiros + escolha do usuário + status do trava
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [artRes, choiceRes, locked] = await Promise.all([
      db.query(`
        SELECT *, GREATEST(goals - goals_offset, 0) AS effective_goals
        FROM artilheiros ORDER BY effective_goals DESC, name
      `),
      db.query(`
        SELECT ua.*, a.name AS artilheiro_name, a.team, a.goals, a.goals_offset,
               GREATEST(a.goals - a.goals_offset, 0) AS effective_goals
        FROM user_artilheiro ua
        JOIN artilheiros a ON ua.artilheiro_id = a.id
        WHERE ua.user_id = $1
      `, [req.user.id]),
      firstPhaseLocked(),
    ]);
    res.json({
      artilheiros: artRes.rows,
      user_choice: choiceRes.rows[0] || null,
      is_locked: locked,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao carregar artilheiros' });
  }
});

// Salva/atualiza escolha do usuário
router.post('/', authMiddleware, async (req, res) => {
  const { artilheiro_id } = req.body;
  if (!artilheiro_id) return res.status(400).json({ error: 'Artilheiro obrigatório' });
  try {
    if (await firstPhaseLocked()) {
      return res.status(403).json({ error: 'Prazo para escolha do artilheiro encerrado' });
    }
    await db.query(`
      INSERT INTO user_artilheiro (user_id, artilheiro_id, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) DO UPDATE SET artilheiro_id = $2, updated_at = NOW()
    `, [req.user.id, artilheiro_id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao salvar escolha' });
  }
});

// Escolhas de todos (visível após trava da primeira fase)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    if (!(await firstPhaseLocked())) {
      return res.status(403).json({ error: 'Disponível após o início da competição' });
    }
    const { rows } = await db.query(`
      SELECT u.id, u.name AS user_name,
             a.name AS artilheiro_name, a.team, a.goals, a.goals_offset,
             GREATEST(COALESCE(a.goals, 0) - COALESCE(a.goals_offset, 0), 0) AS effective_goals
      FROM users u
      LEFT JOIN user_artilheiro ua ON u.id = ua.user_id
      LEFT JOIN artilheiros a ON ua.artilheiro_id = a.id
      WHERE u.active = TRUE AND u.is_admin = FALSE
      ORDER BY u.name
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Erro' });
  }
});

module.exports = router;
