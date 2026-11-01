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
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.warn('Aviso: conexão ociosa com Neon reiniciada:', err.message);
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id        SERIAL PRIMARY KEY,
      nome      VARCHAR(100) NOT NULL,
      email     VARCHAR(150) NOT NULL UNIQUE,
      criado_em TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS senha VARCHAR(255)');
}

module.exports = { pool, init };
