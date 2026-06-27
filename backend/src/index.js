require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');

async function migrate() {
  await db.query(`
    ALTER TABLE artilheiros
      ADD COLUMN IF NOT EXISTS goals_offset INTEGER NOT NULL DEFAULT 0
  `);
}

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/games',       require('./routes/games'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/standings',   require('./routes/standings'));
app.use('/api/artilheiro',  require('./routes/artilheiro'));
app.use('/api/partidas',    require('./routes/partidas'));
app.use('/api/admin',        require('./routes/admin'));
app.use('/api/participante', require('./routes/participante'));

// Serve Vue frontend in production
if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}
migrate().then(() => {
  require('./autoUpdate');
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
}).catch(e => { console.error('Migrate error:', e); process.exit(1); });
