require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, init } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

function lerId(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/', (req, res) =>
  res.json({
    servico: 'notifications-service',
    endpoints: ['GET /health', 'GET /notifications', 'GET /notifications/:id', 'POST /notifications'],
  })
);

// CREATE - chamado pelo tasks-service
app.post('/notifications', async (req, res) => {
  try {
    const { tipo, mensagem, task_id } = req.body;
    if (!tipo) return res.status(400).json({ erro: 'O campo "tipo" é obrigatório.' });
    if (!mensagem) return res.status(400).json({ erro: 'O campo "mensagem" é obrigatório.' });

    const { rows } = await pool.query(
      'INSERT INTO notifications (tipo, mensagem, task_id) VALUES ($1,$2,$3) RETURNING *',
      [tipo, mensagem, lerId(task_id)]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao registrar notificação.' });
  }
});

// READ (lista, filtros opcionais ?task_id= e ?tipo=)
app.get('/notifications', async (req, res) => {
  try {
    const condicoes = [];
    const valores = [];
    if (req.query.task_id) {
      const t = lerId(req.query.task_id);
      if (!t) return res.status(400).json({ erro: 'task_id deve ser um número inteiro positivo.' });
      valores.push(t);
      condicoes.push(`task_id=$${valores.length}`);
    }
    if (req.query.tipo) {
      valores.push(req.query.tipo);
      condicoes.push(`tipo=$${valores.length}`);
    }
    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const { rows } = await pool.query(`SELECT * FROM notifications ${where} ORDER BY id`, valores);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao listar notificações.' });
  }
});

// READ (por id)
app.get('/notifications/:id', async (req, res) => {
  try {
    const id = lerId(req.params.id);
    if (!id) return res.status(400).json({ erro: 'O id deve ser um número inteiro positivo.' });
    const { rows } = await pool.query('SELECT * FROM notifications WHERE id=$1', [id]);
    if (!rows.length) return res.status(404).json({ erro: 'Notificação não encontrada.' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao buscar notificação.' });
  }
});

const PORT = process.env.PORT || 3002;

init()
  .then(() => app.listen(PORT, () => console.log(`notifications-service rodando na porta ${PORT}`)))
  .catch((e) => {
    console.error('Falha ao conectar/inicializar o banco:', e.message);
    process.exit(1);
  });
