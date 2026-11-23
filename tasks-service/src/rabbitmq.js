// ============================================================================
// Módulo 4: Produtor de Eventos via RabbitMQ (AMQP) - tasks-service
// ============================================================================
const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = 'tarefas.eventos';
const ROUTING_KEY_CONCLUIDA = 'tarefa.concluida';
const QUEUE_NAME = 'tarefa_concluida';

let connection = null;
let channel = null;
let isConnecting = false;

/**
 * Conecta ao RabbitMQ com lógica de tentativas automáticas (resiliência).
 */
async function conectarRabbitMQ(tentativas = 10, intervaloMs = 3000) {
  if (channel) return channel;
  if (isConnecting) return null;
  isConnecting = true;

  for (let i = 1; i <= tentativas; i++) {
    try {
      console.log(`[RabbitMQ Produtor] Conectando ao RabbitMQ (${RABBITMQ_URL}) - tentativa ${i}/${tentativas}...`);
      connection = await amqp.connect(RABBITMQ_URL);
      
      connection.on('error', (err) => {
        console.error('[RabbitMQ Produtor] Erro na conexão:', err.message);
      });
      connection.on('close', () => {
        console.warn('[RabbitMQ Produtor] Conexão encerrada. Tentando reconectar em 5s...');
        channel = null;
        connection = null;
        setTimeout(() => conectarRabbitMQ(), 5000);
      });

      channel = await connection.createChannel();
      
      // Declara a exchange direta para eventos de tarefas
      await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
      // Declara a fila durável para garantir que as mensagens não sejam perdidas
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      // Vincula a fila à exchange com a routing key específica
      await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY_CONCLUIDA);

      console.log(`[RabbitMQ Produtor] Conectado com sucesso! Exchange: "${EXCHANGE_NAME}", Fila: "${QUEUE_NAME}", Routing Key: "${ROUTING_KEY_CONCLUIDA}"`);
      isConnecting = false;
      return channel;
    } catch (err) {
      console.warn(`[RabbitMQ Produtor] Falha ao conectar (${err.message}). Nova tentativa em ${intervaloMs / 1000}s...`);
      if (i < tentativas) {
        await new Promise((resolve) => setTimeout(resolve, intervaloMs));
      }
    }
  }

  isConnecting = false;
  console.error('[RabbitMQ Produtor] Não foi possível conectar ao RabbitMQ após várias tentativas. O serviço continuará funcionando e tentará reconectar em segundo plano.');
  setTimeout(() => conectarRabbitMQ(), 5000);
  return null;
}

/**
 * Publica o evento de conclusão de tarefa na exchange do RabbitMQ.
 */
async function publicarTarefaConcluida(tarefa) {
  try {
    if (!channel) {
      await conectarRabbitMQ(3, 1000);
    }

    if (!channel) {
      console.warn(`[RabbitMQ Produtor] Canal indisponível. Não foi possível publicar evento para tarefa #${tarefa.id}.`);
      return false;
    }

    const payload = {
      evento: 'tarefa_concluida',
      timestamp: new Date().toISOString(),
      task_id: tarefa.id,
      titulo: tarefa.titulo,
      descricao: tarefa.descricao,
      status: tarefa.status,
      responsavel: tarefa.responsavel,
      responsavel_id: tarefa.responsavel_id,
      mensagem: `Tarefa "${tarefa.titulo}" foi concluída.`
    };

    const mensagemBuffer = Buffer.from(JSON.stringify(payload));
    const publicado = channel.publish(EXCHANGE_NAME, ROUTING_KEY_CONCLUIDA, mensagemBuffer, {
      persistent: true, // Garante que a mensagem seja salva em disco pelo RabbitMQ
      contentType: 'application/json',
      messageId: `task-${tarefa.id}-${Date.now()}`
    });

    if (publicado) {
      console.log(`[RabbitMQ Produtor] Evento 'tarefa_concluida' publicado com sucesso na exchange '${EXCHANGE_NAME}' (Fila: '${QUEUE_NAME}') | Tarefa #${tarefa.id} ("${tarefa.titulo}")`);
      return true;
    } else {
      console.warn(`[RabbitMQ Produtor] Buffer cheio ao tentar publicar evento para tarefa #${tarefa.id}.`);
      return false;
    }
  } catch (err) {
    console.error(`[RabbitMQ Produtor] Erro ao publicar evento de conclusão:`, err.message);
    return false;
  }
}

/**
 * Fecha canal e conexão de forma graciosa.
 */
async function fecharRabbitMQ() {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    console.log('[RabbitMQ Produtor] Conexão com RabbitMQ fechada com sucesso.');
  } catch (err) {
    console.error('[RabbitMQ Produtor] Erro ao fechar conexão com RabbitMQ:', err.message);
  }
}

/**
 * Retorna o status de conexão atual com o RabbitMQ.
 */
function verificarConexaoRabbitMQ() {
  return channel ? 'ok' : 'indisponivel';
}

module.exports = {
  conectarRabbitMQ,
  publicarTarefaConcluida,
  fecharRabbitMQ,
  verificarConexaoRabbitMQ,
};
