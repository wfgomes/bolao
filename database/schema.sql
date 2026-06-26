DROP TABLE IF EXISTS predictions;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS phases;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE phases (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  order_num INTEGER NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  is_locked_manually BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  phase_id INTEGER REFERENCES phases(id) ON DELETE CASCADE,
  home_team VARCHAR(50) NOT NULL,
  away_team VARCHAR(50) NOT NULL,
  game_datetime TIMESTAMP WITH TIME ZONE,
  home_score INTEGER,
  away_score INTEGER,
  is_finished BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  points INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Default phases for Copa do Mundo 2026
INSERT INTO phases (name, display_name, order_num) VALUES
  ('dezesseis_avos', '16 Avos de Final', 1),
  ('oitavas', 'Oitavas de Final', 2),
  ('quartas', 'Quartas de Final', 3),
  ('semi', 'Semifinais', 4),
  ('terceiro', 'Disputa de 3º Lugar', 5),
  ('final', 'Final', 6);
