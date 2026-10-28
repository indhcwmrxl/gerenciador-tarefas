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
    CREATE TABLE IF NOT EXISTS notifications (
      id        SERIAL PRIMARY KEY,
      tipo      VARCHAR(50) NOT NULL,
      mensagem  TEXT NOT NULL,
      task_id   INTEGER,
      criada_em TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

module.exports = { pool, init };
