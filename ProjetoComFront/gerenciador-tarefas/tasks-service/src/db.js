require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('ERRO: variável de ambiente DATABASE_URL não definida.');
  process.exit(1);
}

// Bancos gerenciados (Neon) exigem SSL. Para banco local sem SSL, use PGSSL=false
const useSSL = process.env.PGSSL !== 'false';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          SERIAL PRIMARY KEY,
      titulo      VARCHAR(150) NOT NULL,
      descricao   TEXT,
      status      VARCHAR(20) NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente','em_andamento','concluida')),
      responsavel VARCHAR(100),
      responsavel_id INTEGER,
      criada_em   TIMESTAMP NOT NULL DEFAULT NOW(),
      atualizada_em TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  // Bancos criados no Módulo 1 ainda não têm a coluna responsavel_id
  await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS responsavel_id INTEGER');
  await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS prioridade VARCHAR(20) DEFAULT \'media\'');
  await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS prazo TIMESTAMP WITH TIME ZONE');
  await pool.query(`
    DO $$ 
    BEGIN 
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'prazo' AND data_type = 'date'
      ) THEN 
        ALTER TABLE tasks ALTER COLUMN prazo TYPE TIMESTAMP WITH TIME ZONE USING prazo::timestamp with time zone;
      END IF;
    END $$;
  `);
}

module.exports = { pool, init };
