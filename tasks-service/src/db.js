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
      return;
    } catch (err) {
      console.warn(`Tentativa ${i + 1}/${retries} de inicializar banco (tasks-db): ${err.message}`);
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

module.exports = { pool, init };
