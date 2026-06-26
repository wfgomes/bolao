const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Campos obrigatórios' });
  try {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE username = $1 AND active = TRUE',
      [username]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }
    const payload = { id: user.id, username: user.username, name: user.name, is_admin: user.is_admin };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: payload });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

module.exports = router;
