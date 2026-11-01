// Funções que chamam OUTROS serviços por HTTP (comunicação síncrona).
// Toda chamada tem timeout: se o serviço demorar ou estiver fora do ar,
// devolvemos "indisponivel" em vez de deixar a API travada ou quebrar.

const TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 5000;

async function chamar(baseUrl, caminho, opcoes = {}) {
  if (!baseUrl) return { indisponivel: true, motivo: 'URL do serviço não configurada' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(baseUrl.replace(/\/$/, '') + caminho, {
      ...opcoes,
      signal: controller.signal,
    });
    let corpo = null;
    try { corpo = await resp.json(); } catch (_) { /* resposta sem corpo */ }
    return { status: resp.status, ok: resp.ok, corpo };
  } catch (e) {
    return { indisponivel: true, motivo: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally {
    clearTimeout(timer);
  }
}

// Consulta um usuário no users-service
async function buscarUsuario(id) {
  const r = await chamar(process.env.USERS_SERVICE_URL, `/users/${id}`);
  if (r.indisponivel) return { indisponivel: true, motivo: r.motivo };
  if (r.status === 404) return { naoEncontrado: true };
  if (!r.ok) return { indisponivel: true, motivo: `status ${r.status}` };
  return { usuario: r.corpo };
}

// Registra um aviso no notifications-service. Nunca lança erro:
// se o serviço estiver fora do ar, só registramos no log (a tarefa já foi salva).
async function notificar({ tipo, mensagem, task_id }) {
  const r = await chamar(process.env.NOTIFICATIONS_SERVICE_URL, '/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ tipo, mensagem, task_id }),
  });
  if (r.indisponivel || !r.ok) {
    console.warn(`[aviso] notifications-service indisponível (${r.motivo || 'status ' + r.status}); notificação "${tipo}" não registrada.`);
    return false;
  }
  return true;
}

// Verifica se um serviço responde em /health
async function verificarSaude(baseUrl) {
  const r = await chamar(baseUrl, '/health');
  return r.ok ? 'ok' : 'indisponivel';
}

module.exports = { buscarUsuario, notificar, verificarSaude };
