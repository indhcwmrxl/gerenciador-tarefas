# Changelog

## [entrega-4-mensageria]
- Evolução da comunicação entre microsserviços para arquitetura orientada a eventos assíncronos (AMQP 0-9-1)
- Novo container RabbitMQ (`rabbitmq:3-management-alpine`) orquestrado no Docker Compose com volume persistente (`gerenciador_rabbitmq_data`) e painel Web Management (:15672)
- Produtor de eventos implementado no `tasks-service`: publicação resiliente do evento de domínio `tarefa_concluida` na exchange direta `tarefas.eventos`
- Consumidor de eventos implementado no `notifications-service`: processamento assíncrono da fila durável `tarefa_concluida` com confirmação manual (`channel.ack`) e gravação no banco PostgreSQL
- Conexão tolerante a falhas com retentativas automáticas e reconexão automática contínua em ambos os serviços
- Monitoramento de dependências ampliado em `GET /health/dependencias` com checagem ativa do RabbitMQ
- Scripts automatizados de validação ponta a ponta: `scripts/test-messaging.sh` e `scripts/test-messaging.ps1`
- Script utilitário para consumo de demonstração em tempo real: `scripts/standalone-consumer.js`
- Novo diagrama de arquitetura: `docs/arquitetura-modulo-4.svg`
- Documento analítico completo: `docs/modulo-4-mensageria-e-streaming.md` contendo projeto conceitual com Streaming de Eventos (Kafka/Redpanda), novos consumidores (Auditoria, Analytics, Busca), comparação conceitual e justificativa técnica

## [entrega-3-containers]
- Conteinerização individual de todos os microsserviços via Dockerfile (Node.js 20 Alpine, multi-stage build, execução sem root com usuário `node`)
- Orquestração completa do ambiente local via `docker-compose.yml` (3 microsserviços + 3 instâncias de banco PostgreSQL independentes)
- Configuração de volumes persistentes nomeados (`gerenciador_users_db_data`, `gerenciador_tasks_db_data`, `gerenciador_notifications_db_data`) garantindo durabilidade dos dados
- Healthchecks configurados nos bancos (`pg_isready`) e nas aplicações (`wget /health`), com inicialização ordenada e determinística via `depends_on: condition: service_healthy`
- Encerramento gracioso (*graceful shutdown*) configurado para captura de sinais SIGTERM/SIGINT
- Scripts de validação e automação de testes adicionados: `scripts/test-endpoints.sh` e `scripts/test-persistence.sh`
- Seção comparativa completa no README: Deploy Direto na Plataforma Cloud (Módulos 1 e 2) vs. Execução via Containers (Módulo 3)

## [entrega-2-microsservicos]
- Repositório reorganizado em monorepo: tasks-service, users-service, notifications-service
- Novo users-service (CRUD de usuários) com banco próprio
- Novo notifications-service (registro de avisos) com banco próprio
- tasks-service consulta o users-service por HTTP para validar o responsável (responsavel_id)
- tasks-service envia avisos ao notifications-service quando a tarefa é atribuída ou concluída
- Tratamento de falhas: timeout nas chamadas, 503 quando o users-service está indisponível,
  a tarefa continua sendo salva quando o notifications-service está fora do ar
- Rotas novas: GET /health/dependencias e GET /tasks/:id/completo
- Diagrama de arquitetura em docs/arquitetura.svg

## [entrega-1-cloud]
- API REST de tarefas (CRUD) com Node.js/Express
- Banco PostgreSQL hospedado (Neon)
- Deploy no Railway com variáveis de ambiente via painel
