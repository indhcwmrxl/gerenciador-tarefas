// ============================================================================
// Módulo 4: Consumidor de Eventos via RabbitMQ (AMQP) - notifications-service
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
 * Inicia o consumidor RabbitMQ e processa as mensagens recebidas da fila.
 * @param {import('pg').Pool} dbPool Pool de conexão com o banco de notificações
 */
async function iniciarConsumidorRabbitMQ(dbPool, tentativas = 10, intervaloMs = 3000) {
  if (channel) return channel;
  if (isConnecting) return null;
  isConnecting = true;

  for (let i = 1; i <= tentativas; i++) {
    try {
      console.log(`[RabbitMQ Consumidor] Conectando ao RabbitMQ (${RABBITMQ_URL}) - tentativa ${i}/${tentativas}...`);
      connection = await amqp.connect(RABBITMQ_URL);

      connection.on('error', (err) => {
        console.error('[RabbitMQ Consumidor] Erro na conexão:', err.message);
      });
      connection.on('close', () => {
        console.warn('[RabbitMQ Consumidor] Conexão encerrada. Tentando reconectar em 5s...');
        channel = null;
        connection = null;
        setTimeout(() => iniciarConsumidorRabbitMQ(dbPool), 5000);
      });

      channel = await connection.createChannel();

      // Assegura que a exchange, fila e vínculo existem (idempotente)
      await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY_CONCLUIDA);

      // Garante processamento justo (fair dispatch) de 1 mensagem por vez
      await channel.prefetch(1);

      console.log(`[RabbitMQ Consumidor] Aguardando mensagens na fila durável '${QUEUE_NAME}'...`);

      // Inicia o consumo assíncrono
      channel.consume(QUEUE_NAME, async (msg) => {
        if (!msg) return;

        try {
          const conteudoStr = msg.content.toString();
          const dados = JSON.parse(conteudoStr);

          console.log(`\n==================================================`);
          console.log(`[RabbitMQ Consumidor] MENSAGEM RECEBIDA VIA BROKER`);
          console.log(`- Fila: ${QUEUE_NAME}`);
          console.log(`- Evento: ${dados.evento || 'tarefa_concluida'}`);
          console.log(`- Tarefa ID: ${dados.task_id}`);
          console.log(`- Título: "${dados.titulo}"`);
          console.log(`- Responsável: ${dados.responsavel || 'Sem responsável'}`);
          console.log(`- Timestamp do Evento: ${dados.timestamp}`);
          console.log(`==================================================`);

          const tipo = dados.evento || 'tarefa_concluida';
          const mensagem = dados.mensagem || `Tarefa "${dados.titulo}" foi concluída.`;
          const taskId = Number.isInteger(Number(dados.task_id)) ? Number(dados.task_id) : null;

          // Persiste a notificação no banco de dados notifications_db
          const { rows } = await dbPool.query(
            'INSERT INTO notifications (tipo, mensagem, task_id) VALUES ($1,$2,$3) RETURNING *',
            [tipo, mensagem, taskId]
          );

          const notificacaoGravada = rows[0];
          console.log(`[RabbitMQ Consumidor] Notificação gravada no banco com sucesso! (ID: ${notificacaoGravada.id}, Task ID: ${taskId})`);

          // Confirma o processamento com ACK para remoção segura da fila
          channel.ack(msg);
        } catch (err) {
          console.error('[RabbitMQ Consumidor] Erro ao processar mensagem recebida:', err.message);
          // Em caso de falha transitória ou erro, rejeita sem descartar ou re-enfileira
          channel.nack(msg, false, true);
        }
      });

      isConnecting = false;
      return channel;
    } catch (err) {
      console.warn(`[RabbitMQ Consumidor] Falha ao conectar (${err.message}). Nova tentativa em ${intervaloMs / 1000}s...`);
      if (i < tentativas) {
        await new Promise((resolve) => setTimeout(resolve, intervaloMs));
      }
    }
  }

  isConnecting = false;
  console.error('[RabbitMQ Consumidor] Não foi possível conectar ao RabbitMQ após várias tentativas. Tentando reconectar em segundo plano...');
  setTimeout(() => iniciarConsumidorRabbitMQ(dbPool), 5000);
  return null;
}

/**
 * Encerra o canal e conexão com o RabbitMQ.
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
    console.log('[RabbitMQ Consumidor] Conexão com RabbitMQ fechada.');
  } catch (err) {
    console.error('[RabbitMQ Consumidor] Erro ao fechar conexão RabbitMQ:', err.message);
  }
}

/**
 * Retorna se o canal do consumidor RabbitMQ está ativo.
 */
function verificarConexaoRabbitMQ() {
  return channel ? 'ok' : 'indisponivel';
}

module.exports = {
  iniciarConsumidorRabbitMQ,
  fecharRabbitMQ,
  verificarConexaoRabbitMQ,
};
