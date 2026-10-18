require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('ERRO: variável de ambiente DATABASE_URL não definida.');
  process.exit(1);
}

// Bancos gerenciados (Neon, Supabase, Render) exigem SSL.
// Para banco local, defina PGSSL=false no .env
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
      criada_em   TIMESTAMP NOT NULL DEFAULT NOW(),
      atualizada_em TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

module.exports = { pool, init };
