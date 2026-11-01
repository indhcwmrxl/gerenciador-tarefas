require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, init } = require('./db');
const { buscarUsuario, notificar, verificarSaude } = require('./clients');

const app = express();
app.use(cors());
app.use(express.json());

const STATUS_VALIDOS = ['pendente', 'em_andamento', 'concluida'];

function lerId(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Confere no users-service se o responsável existe.
// Devolve { id, usuario } ou { erro: { status, corpo } }.
async function resolverResponsavel(valor) {
  const id = lerId(valor);
  if (!id) {
    return { erro: { status: 400, corpo: { erro: 'responsavel_id deve ser um número inteiro positivo.' } } };
  }
  const r = await buscarUsuario(id);
  if (r.indisponivel) {
    console.error(`[erro] users-service indisponível: ${r.motivo}`);
    return { erro: { status: 503, corpo: { erro: 'Serviço de usuários indisponível. Tente novamente em instantes.' } } };
  }
  if (r.naoEncontrado) {
    return { erro: { status: 400, corpo: { erro: `Responsável ${id} não encontrado no serviço de usuários.` } } };
  }
  return { id, usuario: r.usuario };
}

// ---------- Saúde ----------
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Mostra se este serviço e os que ele consome estão no ar
app.get('/health/dependencias', async (req, res) => {
  const [users, notifications] = await Promise.all([
    verificarSaude(process.env.USERS_SERVICE_URL),
    verificarSaude(process.env.NOTIFICATIONS_SERVICE_URL),
  ]);
  res.json({ tasks: 'ok', users, notifications });
});

app.get('/', (req, res) =>
  res.json({
    servico: 'tasks-service',
    endpoints: [
      'GET /health', 'GET /health/dependencias',
      'GET /tasks', 'GET /tasks/:id', 'GET /tasks/:id/completo',
      'POST /tasks', 'PUT /tasks/:id', 'DELETE /tasks/:id',
    ],
  })
);

// ---------- CREATE ----------
app.post('/tasks', async (req, res) => {
  try {
    const { titulo, descricao, status = 'pendente', responsavel, responsavel_id, prioridade = 'media', prazo } = req.body;
    if (!titulo) return res.status(400).json({ erro: 'O campo "titulo" é obrigatório.' });
    if (!STATUS_VALIDOS.includes(status))
      return res.status(400).json({ erro: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}` });

    let respId = null;
    let respNome = responsavel || null;
    if (responsavel_id !== undefined && responsavel_id !== null) {
      const r = await resolverResponsavel(responsavel_id); // chamada HTTP ao users-service
      if (r.erro) return res.status(r.erro.status).json(r.erro.corpo);
      respId = r.id;
      respNome = r.usuario.nome;
    }

    const { rows } = await pool.query(
      `INSERT INTO tasks (titulo, descricao, status, responsavel, responsavel_id, prioridade, prazo)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [titulo, descricao || null, status, respNome, respId, prioridade || 'media', prazo || null]
    );
    const tarefa = rows[0];

    // Avisos: não bloqueiam a resposta e não derrubam a API se falharem
    if (respId) {
      notificar({ tipo: 'tarefa_atribuida', mensagem: `Tarefa "${tarefa.titulo}" atribuída a ${respNome}.`, task_id: tarefa.id });
    }
    if (tarefa.status === 'concluida') {
      notificar({ tipo: 'tarefa_concluida', mensagem: `Tarefa "${tarefa.titulo}" foi concluída.`, task_id: tarefa.id });
    }

    res.status(201).json(tarefa);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao criar tarefa.' });
  }
});

// ---------- READ (lista, filtros opcionais ?status=, ?responsavel_id=, ?user_id=) ----------
app.get('/tasks', async (req, res) => {
  try {
    const { status, responsavel_id, user_id } = req.query;
    const condicoes = [];
    const valores = [];

    if (status) {
      valores.push(status);
      condicoes.push(`status = $${valores.length}`);
    }

    const uid = lerId(responsavel_id) || lerId(user_id);
    if (uid) {
      valores.push(uid);
      condicoes.push(`responsavel_id = $${valores.length}`);
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const { rows } = await pool.query(`SELECT * FROM tasks ${where} ORDER BY id`, valores);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao listar tarefas.' });
  }
});

// ---------- READ (por id) ----------
app.get('/tasks/:id', async (req, res) => {
  try {
    const id = lerId(req.params.id);
    if (!id) return res.status(400).json({ erro: 'O id deve ser um número inteiro positivo.' });
    const { rows } = await pool.query('SELECT * FROM tasks WHERE id=$1', [id]);
    if (!rows.length) return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao buscar tarefa.' });
  }
});

// ---------- READ completo: tarefa + dados do responsável (vindos do users-service) ----------
app.get('/tasks/:id/completo', async (req, res) => {
  try {
    const id = lerId(req.params.id);
    if (!id) return res.status(400).json({ erro: 'O id deve ser um número inteiro positivo.' });
    const { rows } = await pool.query('SELECT * FROM tasks WHERE id=$1', [id]);
    if (!rows.length) return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    const tarefa = rows[0];

    if (!tarefa.responsavel_id) return res.json({ ...tarefa, responsavel_usuario: null });

    const r = await buscarUsuario(tarefa.responsavel_id);
    if (r.indisponivel) {
      console.error(`[erro] users-service indisponível: ${r.motivo}`);
      return res.status(503).json({ erro: 'Serviço de usuários indisponível. Tente novamente em instantes.' });
    }
    if (r.naoEncontrado) {
      return res.json({ ...tarefa, responsavel_usuario: null, aviso: 'O usuário responsável não existe mais.' });
    }
    res.json({ ...tarefa, responsavel_usuario: r.usuario });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao buscar tarefa.' });
  }
});

// ---------- UPDATE ----------
app.put('/tasks/:id', async (req, res) => {
  try {
    const id = lerId(req.params.id);
    if (!id) return res.status(400).json({ erro: 'O id deve ser um número inteiro positivo.' });

    const { titulo, descricao, status, responsavel, responsavel_id, prioridade, prazo } = req.body;
    if (status && !STATUS_VALIDOS.includes(status))
      return res.status(400).json({ erro: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}` });

    const atual = await pool.query('SELECT * FROM tasks WHERE id=$1', [id]);
    if (!atual.rows.length) return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    const antes = atual.rows[0];

    let novoRespId = null;
    let novoNome = responsavel === undefined ? null : responsavel;
    if (responsavel_id !== undefined && responsavel_id !== null) {
      const r = await resolverResponsavel(responsavel_id); // chamada HTTP ao users-service
      if (r.erro) return res.status(r.erro.status).json(r.erro.corpo);
      respId = r.id;
      respNome = r.usuario.nome;
      novoRespId = r.id;
      novoNome = r.usuario.nome;
    }

    const { rows } = await pool.query(
      `UPDATE tasks SET
         titulo         = COALESCE($1, titulo),
         descricao      = COALESCE($2, descricao),
         status         = COALESCE($3, status),
         responsavel    = COALESCE($4, responsavel),
         responsavel_id = COALESCE($5, responsavel_id),
         prioridade     = COALESCE($6, prioridade),
         prazo          = CASE WHEN $8::boolean THEN $7::timestamptz ELSE prazo END,
         atualizada_em  = NOW()
       WHERE id=$9 RETURNING *`,
      [titulo, descricao, status, novoNome, novoRespId, prioridade, prazo || null, prazo !== undefined, id]
    );
    const tarefa = rows[0];

    if (novoRespId && novoRespId !== antes.responsavel_id) {
      notificar({ tipo: 'tarefa_atribuida', mensagem: `Tarefa "${tarefa.titulo}" atribuída a ${novoNome}.`, task_id: tarefa.id });
    }
    if (tarefa.status === 'concluida' && antes.status !== 'concluida') {
      notificar({ tipo: 'tarefa_concluida', mensagem: `Tarefa "${tarefa.titulo}" foi concluída.`, task_id: tarefa.id });
    }

    res.json(tarefa);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao atualizar tarefa.' });
  }
});

// ---------- DELETE ----------
app.delete('/tasks/:id', async (req, res) => {
  try {
    const id = lerId(req.params.id);
    if (!id) return res.status(400).json({ erro: 'O id deve ser um número inteiro positivo.' });
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id=$1', [id]);
    if (!rowCount) return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao deletar tarefa.' });
  }
});

const PORT = process.env.PORT || 3000;

init()
  .then(() => app.listen(PORT, () => console.log(`tasks-service rodando na porta ${PORT}`)))
  .catch((e) => {
    console.error('Falha ao conectar/inicializar o banco:', e.message);
    process.exit(1);
  });
