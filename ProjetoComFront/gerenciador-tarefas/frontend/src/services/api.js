// Serviço de Comunicação com a API de Microsserviços

const isLocalhost = 
  typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_CONFIG = {
  tasksUrl: import.meta.env.VITE_TASKS_URL || (isLocalhost ? 'http://localhost:3000' : 'https://tasks-service-production-dd13.up.railway.app'),
  usersUrl: import.meta.env.VITE_USERS_URL || (isLocalhost ? 'http://localhost:3001' : 'https://users-service-production-9f90.up.railway.app'),
  notificationsUrl: import.meta.env.VITE_NOTIFICATIONS_URL || (isLocalhost ? 'http://localhost:3002' : 'https://notifications-service-production-c3c4.up.railway.app'),
};

export function getApiUrls() {
  return API_CONFIG;
}

async function request(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      // Resposta sem corpo JSON (ex: 204 No Content)
    }

    if (!res.ok) {
      const erroMsg = data?.erro || data?.message || `Erro no servidor (código ${res.status})`;
      const err = new Error(erroMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('O tempo de conexão com o servidor foi esgotado. Verifique sua conexão.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ================= AUTENTICAÇÃO E USUÁRIOS =================
export const apiUsers = {
  async register({ nome, email, senha }) {
    const { usersUrl } = getApiUrls();
    return request(`${usersUrl}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha }),
    });
  },

  async login({ email, senha }) {
    const { usersUrl } = getApiUrls();
    return request(`${usersUrl}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
  },

  async list() {
    const { usersUrl } = getApiUrls();
    return request(`${usersUrl}/users`);
  },

  async getById(id) {
    const { usersUrl } = getApiUrls();
    return request(`${usersUrl}/users/${id}`);
  },

  async create({ nome, email, senha }) {
    const { usersUrl } = getApiUrls();
    return request(`${usersUrl}/users`, {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha }),
    });
  },

  async delete(id) {
    const { usersUrl } = getApiUrls();
    return request(`${usersUrl}/users/${id}`, { method: 'DELETE' });
  },
};

// ================= GESTÃO DE TAREFAS =================
export const apiTasks = {
  async list({ userId = null, status = '' } = {}) {
    const { tasksUrl } = getApiUrls();
    const params = new URLSearchParams();
    if (userId) params.append('responsavel_id', userId);
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`${tasksUrl}/tasks${query}`);
  },

  async getById(id) {
    const { tasksUrl } = getApiUrls();
    return request(`${tasksUrl}/tasks/${id}`);
  },

  async getCompleto(id) {
    const { tasksUrl } = getApiUrls();
    return request(`${tasksUrl}/tasks/${id}/completo`);
  },

  async create({ titulo, descricao, status, responsavel_id, prioridade, prazo }) {
    const { tasksUrl } = getApiUrls();
    return request(`${tasksUrl}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ titulo, descricao, status, responsavel_id, prioridade, prazo }),
    });
  },

  async update(id, dados) {
    const { tasksUrl } = getApiUrls();
    return request(`${tasksUrl}/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    });
  },

  async delete(id) {
    const { tasksUrl } = getApiUrls();
    return request(`${tasksUrl}/tasks/${id}`, { method: 'DELETE' });
  },
};

// ================= NOTIFICAÇÕES =================
export const apiNotifications = {
  async list(taskId = null, tipo = null) {
    const { notificationsUrl } = getApiUrls();
    const params = new URLSearchParams();
    if (taskId) params.append('task_id', taskId);
    if (tipo) params.append('tipo', tipo);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`${notificationsUrl}/notifications${query}`);
  },
};

// ================= STATUS DO SISTEMA =================
export const apiHealth = {
  async check() {
    const { tasksUrl } = getApiUrls();
    try {
      const res = await fetch(`${tasksUrl}/health`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch (_) {
      return false;
    }
  },
};
