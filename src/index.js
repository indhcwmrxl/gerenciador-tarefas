require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, init } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const STATUS_VALIDOS = ['pendente', 'em_andamento', 'concluida'];

// Health check (útil para a plataforma de nuvem)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/', (req, res) =>
  res.json({
    servico: 'API Gerenciador de Tarefas',
    endpoints: ['GET /tasks', 'GET /tasks/:id', 'POST /tasks', 'PUT /tasks/:id', 'DELETE /tasks/:id'],
  })
);

// CREATE
app.post('/tasks', async (req, res) => {
  try {
    const { titulo, descricao, status = 'pendente', responsavel } = req.body;
    if (!titulo) return res.status(400).json({ erro: 'O campo "titulo" é obrigatório.' });
    if (!STATUS_VALIDOS.includes(status))
      return res.status(400).json({ erro: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}` });

    const { rows } = await pool.query(
      `INSERT INTO tasks (titulo, descricao, status, responsavel)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [titulo, descricao || null, status, responsavel || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao criar tarefa.' });
  }
});

// READ (lista, com filtro opcional ?status=)
app.get('/tasks', async (req, res) => {
  try {
    const { status } = req.query;
    const { rows } = status
      ? await pool.query('SELECT * FROM tasks WHERE status=$1 ORDER BY id', [status])
      : await pool.query('SELECT * FROM tasks ORDER BY id');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao listar tarefas.' });
  }
});

// READ (por id)
app.get('/tasks/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao buscar tarefa.' });
  }
});

// UPDATE
app.put('/tasks/:id', async (req, res) => {
  try {
    const { titulo, descricao, status, responsavel } = req.body;
    if (status && !STATUS_VALIDOS.includes(status))
      return res.status(400).json({ erro: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}` });

    const { rows } = await pool.query(
      `UPDATE tasks SET
         titulo      = COALESCE($1, titulo),
         descricao   = COALESCE($2, descricao),
         status      = COALESCE($3, status),
         responsavel = COALESCE($4, responsavel),
         atualizada_em = NOW()
       WHERE id=$5 RETURNING *`,
      [titulo, descricao, status, responsavel, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao atualizar tarefa.' });
  }
});

// DELETE
app.delete('/tasks/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao deletar tarefa.' });
  }
});

const PORT = process.env.PORT || 3000;

init()
  .then(() => app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`)))
  .catch((e) => {
    console.error('Falha ao conectar/inicializar o banco:', e.message);
    process.exit(1);
  });
