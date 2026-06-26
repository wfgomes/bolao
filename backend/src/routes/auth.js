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

router.put('/profile', authMiddleware, async (req, res) => {
  const { name, current_password, new_password } = req.body;
  if (!name && !new_password) {
    return res.status(400).json({ error: 'Nenhum dado para atualizar' });
  }
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const updates = [];
    const params  = [];

    if (name && name.trim()) {
      params.push(name.trim());
      updates.push(`name = $${params.length}`);
    }

    if (new_password) {
      if (!current_password) return res.status(400).json({ error: 'Informe a senha atual' });
      const valid = await bcrypt.compare(current_password, user.password_hash);
      if (!valid) return res.status(400).json({ error: 'Senha atual incorreta' });
      if (new_password.length < 4) return res.status(400).json({ error: 'Nova senha deve ter ao menos 4 caracteres' });
      params.push(await bcrypt.hash(new_password, 10));
      updates.push(`password_hash = $${params.length}`);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'Nenhuma alteração válida' });

    params.push(req.user.id);
    const { rows: updated } = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING id, username, name, is_admin`,
      params
    );

    const payload = { id: updated[0].id, username: updated[0].username, name: updated[0].name, is_admin: updated[0].is_admin };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: payload });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

module.exports = router;
