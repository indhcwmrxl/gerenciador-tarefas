require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { pool, init } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function lerId(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function hashPassword(password) {
  if (!password) return null;
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !password) return false;
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, key] = parts;
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === key;
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/', (req, res) =>
  res.json({
    servico: 'users-service',
    endpoints: [
      'GET /health',
      'GET /users',
      'GET /users/:id',
      'POST /users',
      'PUT /users/:id',
      'DELETE /users/:id',
      'POST /auth/register',
      'POST /auth/login',
    ],
  })
);

// AUTH: REGISTRO / CRIAÇÃO DE CONTA
app.post(['/auth/register', '/register'], async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !nome.trim()) {
      return res.status(400).json({ erro: 'O campo "nome" é obrigatório.' });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ erro: 'Informe um "email" válido.' });
    }
    if (!senha || senha.length < 4) {
      return res.status(400).json({ erro: 'A "senha" deve ter pelo menos 4 caracteres.' });
    }

    const hashed = hashPassword(senha);
    const { rows } = await pool.query(
      'INSERT INTO users (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email, criado_em',
      [nome.trim(), email.trim().toLowerCase(), hashed]
    );

    const user = rows[0];
    res.status(201).json({
      mensagem: 'Conta criada com sucesso!',
      usuario: user,
    });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ erro: 'Já existe um usuário com esse email.' });
    }
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao criar conta.' });
  }
});

// AUTH: LOGIN
app.post(['/auth/login', '/login'], async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ erro: 'Informe um "email" válido.' });
    }
    if (!senha) {
      return res.status(400).json({ erro: 'O campo "senha" é obrigatório.' });
    }

    const { rows } = await pool.query(
      'SELECT id, nome, email, senha, criado_em FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (!rows.length) {
      return res.status(401).json({ erro: 'Usuário não encontrado com este email.' });
    }

    const user = rows[0];

    if (!user.senha) {
      return res.status(401).json({ erro: 'Esta conta ainda não possui uma senha configurada. Crie uma nova conta com senha.' });
    }

    const valida = verifyPassword(senha, user.senha);
    if (!valida) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    const usuarioLimpo = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      criado_em: user.criado_em,
    };

    res.json({
      mensagem: 'Login efetuado com sucesso!',
      usuario: usuarioLimpo,
      token: `token_${user.id}_${Date.now()}`,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao processar login.' });
  }
});

// CREATE (CRUD padrão, compatível com os testes anteriores)
app.post('/users', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome) return res.status(400).json({ erro: 'O campo "nome" é obrigatório.' });
    if (!email || !EMAIL_REGEX.test(email))
      return res.status(400).json({ erro: 'Informe um "email" válido.' });

    const hashed = senha ? hashPassword(senha) : null;
    const { rows } = await pool.query(
      'INSERT INTO users (nome, email, senha) VALUES ($1,$2,$3) RETURNING id, nome, email, criado_em',
      [nome, email, hashed]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ erro: 'Já existe um usuário com esse email.' });
    console.error(e);
    res.status(500).json({ erro: 'Erro interno ao criar usuário.' });
  }
});

// READ (lista) - Não expõe a senha
app.get('/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nome, email, criado_em FROM users ORDER BY id');
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
    const { rows } = await pool.query('SELECT id, nome, email, criado_em FROM users WHERE id=$1', [id]);
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
    const { nome, email, senha } = req.body;
    if (email && !EMAIL_REGEX.test(email)) return res.status(400).json({ erro: 'Informe um "email" válido.' });

    const hashed = senha ? hashPassword(senha) : undefined;

    let query = `UPDATE users SET nome = COALESCE($1, nome), email = COALESCE($2, email)`;
    const params = [nome, email];

    if (hashed) {
      params.push(hashed);
      query += `, senha = $${params.length}`;
    }

    params.push(id);
    query += ` WHERE id=$${params.length} RETURNING id, nome, email, criado_em`;

    const { rows } = await pool.query(query, params);
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
