require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./src/config/db');

async function seed() {
  const hash = await bcrypt.hash('admin123', 10);
  await db.query(
    `INSERT INTO users (username, name, password_hash, is_admin)
     VALUES ('admin', 'Administrador', $1, TRUE)
     ON CONFLICT (username) DO NOTHING`,
    [hash]
  );
  console.log('Admin criado: usuario=admin senha=admin123');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
