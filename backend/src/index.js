require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/games',       require('./routes/games'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/standings',   require('./routes/standings'));
app.use('/api/admin',       require('./routes/admin'));

// Serve Vue frontend in production
if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
