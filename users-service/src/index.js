require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, init } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function lerId(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/', (req, res) =>
  res.json({
    servico: 'users-service',
    endpoints: ['GET /health', 'GET /users', 'GET /users/:id', 'POST /users', 'PUT /users/:id', 'DELETE /users/:id'],
  })
);

// CREATE
app.post('/users', async (req, res) => {
  try {
    const { nome, email } = req.body;
    if (!nome) return res.status(400).json({ erro: 'O campo "nome" é obrigatório.' });
    if (!email || !EMAIL_REGEX.test(email))
      return res.status(400).json({ erro: 'Informe um "email" válido.' });

    const { rows } = await pool.query(
      'INSERT INTO users (nome, email) VALUES ($1,$2) RETURNING *',
      [nome, email]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ erro: 'Já existe um usuário com esse email.' });
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao criar usuário.' });
  }
});

// READ (lista)
app.get('/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY id');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao listar usuários.' });
  }
});

// READ (por id) - é esta rota que o tasks-service consulta
app.get('/users/:id', async (req, res) => {
  try {
    const id = lerId(req.params.id);
    if (!id) return res.status(400).json({ erro: 'O id deve ser um número inteiro positivo.' });
    const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
    if (!rows.length) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao buscar usuário.' });
  }
});

// UPDATE
app.put('/users/:id', async (req, res) => {
  try {
    const id = lerId(req.params.id);
    if (!id) return res.status(400).json({ erro: 'O id deve ser um número inteiro positivo.' });
    const { nome, email } = req.body;
    if (email && !EMAIL_REGEX.test(email)) return res.status(400).json({ erro: 'Informe um "email" válido.' });

    const { rows } = await pool.query(
      `UPDATE users SET nome = COALESCE($1, nome), email = COALESCE($2, email)
       WHERE id=$3 RETURNING *`,
      [nome, email, id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ erro: 'Já existe um usuário com esse email.' });
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao atualizar usuário.' });
  }
});

// DELETE
app.delete('/users/:id', async (req, res) => {
  try {
    const id = lerId(req.params.id);
    if (!id) return res.status(400).json({ erro: 'O id deve ser um número inteiro positivo.' });
    const { rowCount } = await pool.query('DELETE FROM users WHERE id=$1', [id]);
    if (!rowCount) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao deletar usuário.' });
  }
});

const PORT = process.env.PORT || 3001;

init()
  .then(() => app.listen(PORT, () => console.log(`users-service rodando na porta ${PORT}`)))
  .catch((e) => {
    console.error('Falha ao conectar/inicializar o banco:', e.message);
    process.exit(1);
  });
