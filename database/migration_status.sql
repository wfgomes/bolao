ALTER TABLE games ADD COLUMN IF NOT EXISTS status VARCHAR(2);
UPDATE games SET status = 'FZ' WHERE is_finished = TRUE;
