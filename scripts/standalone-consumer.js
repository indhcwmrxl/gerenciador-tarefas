#!/usr/bin/env node
// ==============================================================================
// Consumidor Standalone de Demonstração (Módulo 4 - RabbitMQ)
// Permite observar em tempo real eventos publicados na fila 'tarefa_concluida'
// ==============================================================================

const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const QUEUE_NAME = 'tarefa_concluida';
const EXCHANGE_NAME = 'tarefas.eventos';
const ROUTING_KEY = 'tarefa.concluida';

async function main() {
  console.log('------------------------------------------------------------');
  console.log(' Consumidor Standalone de Eventos (RabbitMQ AMQP)');
  console.log(` Conectando ao RabbitMQ em: ${RABBITMQ_URL}`);
  console.log('------------------------------------------------------------');

  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    const channel = await conn.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

    console.log(`[Consumidor Standalone] Conectado! Aguardando eventos na fila '${QUEUE_NAME}'...`);
    console.log('(Pressione Ctrl+C para sair)\n');

    channel.consume(QUEUE_NAME, (msg) => {
      if (!msg) return;
      const conteudo = JSON.parse(msg.content.toString());
      console.log('>>> [EVENTO RECEBIDO EM TEMPO REAL]');
      console.log(JSON.stringify(conteudo, null, 2));
      console.log('------------------------------------------------------------');
      channel.ack(msg);
    });

    const shutdown = async () => {
      console.log('\nEncerrando consumidor...');
      await channel.close();
      await conn.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Erro no consumidor standalone:', err.message);
    process.exit(1);
  }
}

main();
