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
  console.warn('Aviso: conexão com o banco reiniciada:', err.message);
});

async function init(retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id        SERIAL PRIMARY KEY,
          tipo      VARCHAR(50) NOT NULL,
          mensagem  TEXT NOT NULL,
          task_id   INTEGER,
          criada_em TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      return;
    } catch (err) {
      console.warn(`Tentativa ${i + 1}/${retries} de inicializar banco (notifications-db): ${err.message}`);
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

module.exports = { pool, init };
