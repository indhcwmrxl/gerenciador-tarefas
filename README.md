# Gerenciador de Tarefas

Projeto incremental da disciplina de **Sistemas Distribuídos** (DCC/UERN).  
**Docente(s):** Glaucia Melissa (Responsável pela disciplina) / Luiziane Paulino dos Santos (Estágio Docência)  
**Domínio:** Gerenciador de tarefas (evento: *"tarefa concluída"*).

Histórico de entregas e módulos nas tags do Git:
- `entrega-4-mensageria`: Módulo 4 — Mensageria com RabbitMQ (AMQP) e Análise de Streaming (Kafka/Redpanda).
- `entrega-3-containers`: Módulo 3 — Containers Docker e Docker Compose com bancos locais e volumes.
- `entrega-2-microsservicos`: Módulo 2 — 3 microsserviços independentes com comunicação HTTP/REST.
- `entrega-1-cloud`: Módulo 1 — API monolítica em nuvem com banco PostgreSQL (Neon/Railway).

---

## Módulo 4 — Mensageria e Streaming de Eventos

No Módulo 4, a comunicação entre os microsserviços evoluiu para o modelo assíncrono orientado a eventos usando o **RabbitMQ** (protocolo AMQP). Em vez de o `tasks-service` fazer uma chamada HTTP direta ao `notifications-service` quando uma tarefa é finalizada, agora ele publica o evento `tarefa_concluida` no broker. O `notifications-service` consome essa fila, salva o aviso no banco e confirma o processamento com ACK manual.

Também foi feita a análise conceitual de como esse mesmo cenário seria modelado usando **Streaming de Eventos** (Apache Kafka / Redpanda).

### Vídeo de Demonstração (Módulo 4)

> [!IMPORTANT]
> **Link do Vídeo no YouTube (Não Listado):** `[INSERIR_LINK_AQUI]`  
> *(Demonstração dos 7 containers rodando via Docker Compose, teste de mensageria com criação e conclusão de tarefa, logs do produtor e consumidor, e fila no painel do RabbitMQ)*.

---

### O que foi implementado

1. **RabbitMQ no Docker Compose:**
   - Container oficial `rabbitmq:3-management-alpine`.
   - Porta `5672` (AMQP) para conexão das aplicações e porta `15672` para o painel web de gerenciamento (`http://localhost:15672`, login: `guest`/`guest`).
   - Volume persistente `gerenciador_rabbitmq_data` para não perder mensagens se o container reiniciar.
   - Healthcheck configurado com `rabbitmq-diagnostics -q ping`.

2. **Produtor no `tasks-service`:**
   - Conexão com RabbitMQ usando a biblioteca `amqplib`, com retentativas automáticas e reconexão em caso de queda.
   - Quando o status de uma tarefa muda para `"concluida"` (no `POST /tasks` ou `PUT /tasks/:id`), publica o evento `tarefa_concluida` na exchange direta `tarefas.eventos` com a routing key `tarefa.concluida`.
   - Mensagem marcada como persistente (`persistent: true`).

3. **Consumidor no `notifications-service`:**
   - Escuta a fila durável `tarefa_concluida`.
   - Usa `prefetch(1)` para processar uma mensagem por vez.
   - Salva a notificação no PostgreSQL (`notifications_db`) e em seguida envia o `channel.ack(msg)` para confirmar o recebimento.
   - Se ocorrer erro, faz `nack` com re-enfileiramento.

4. **Healthcheck e Graceful Shutdown:**
   - Endpoint `GET /health/dependencias` atualizado para checar também a conexão com o RabbitMQ (`{"tasks":"ok","users":"ok","notifications":"ok","rabbitmq":"ok"}`).
   - Tratamento de `SIGTERM` e `SIGINT` para fechar os canais e conexões AMQP de forma limpa ao parar os containers.

---

### Arquitetura do Módulo 4

![Diagrama de Arquitetura Módulo 4](docs/arquitetura-modulo-4.svg)

```
+-----------------------------------------------------------------------------------------+
|                         FLUXO DE MENSAGERIA COM RABBITMQ                                |
|                                                                                         |
|   +-------------------+    publica evento    +-------------------+   consome evento     |
|   |   tasks-service   | -------------------> |     RabbitMQ      | ------------------>  |
|   |    (PRODUTOR)     |  "tarefa_concluida"  |     (BROKER)      |   com ACK manual     |
|   +-------------------+                      +-------------------+                      |
|             |                                          |                                |
|             v                                          v                                |
|       [ tasks-db ]                           [ Fila Persistente ]                       |
|      (Postgres 16)                           (tarefa_concluida)                         |
|                                                        |                                |
|                                                        v                                |
|                                             +-----------------------+                   |
|                                             | notifications-service |                   |
|                                             |     (CONSUMIDOR)      |                   |
|                                             +-----------------------+                   |
|                                                        |                                |
|                                                        v                                |
|                                             [  notifications-db  ]                      |
|                                                 (Postgres 16)                           |
+-----------------------------------------------------------------------------------------+
```

---

### Mapeamento dos Containers (Docker Compose)

| Container | Imagem Base | Portas | Função | Volume Persistente |
|---|---|---|---|---|
| `rabbitmq` | `rabbitmq:3-management-alpine` | `5672` (AMQP), `15672` (UI) | Broker de mensagens | `gerenciador_rabbitmq_data` |
| `tasks-service` | `node:20-alpine` | `3000` | CRUD de tarefas e produtor AMQP | — |
| `notifications-service`| `node:20-alpine` | `3002` | Serviço de avisos e consumidor AMQP | — |
| `users-service` | `node:20-alpine` | `3001` | CRUD de usuários | — |
| `tasks-db` | `postgres:16-alpine` | `5432` | Banco PostgreSQL de tarefas | `gerenciador_tasks_db_data` |
| `notifications-db` | `postgres:16-alpine` | `5433` | Banco PostgreSQL de notificações | `gerenciador_notifications_db_data` |
| `users-db` | `postgres:16-alpine` | `5431` | Banco PostgreSQL de usuários | `gerenciador_users_db_data` |

---

### Logs do fluxo funcionando (Produtor e Consumidor)

Resultado real obtido ao rodar o script `./scripts/test-messaging.sh`:

```text
==============================================================================
   TESTE DE MENSAGERIA E STREAMING DE EVENTOS - MÓDULO 4 (RabbitMQ)            
==============================================================================

[1/6] Verificando status dos containers no Docker Compose...
NAME                    STATUS                    PORTS
rabbitmq                Up 41 seconds (healthy)   0.0.0.0:5672->5672/tcp, 0.0.0.0:15672->15672/tcp
tasks-service           Up 30 seconds (healthy)   0.0.0.0:3000->3000/tcp
notifications-service   Up 35 seconds (healthy)   0.0.0.0:3002->3002/tcp
users-service           Up 41 seconds (healthy)   0.0.0.0:3001->3001/tcp
tasks-db                Up 25 hours (healthy)     0.0.0.0:5432->5432/tcp
notifications-db        Up 25 hours (healthy)     0.0.0.0:5433->5432/tcp
users-db                Up 25 hours (healthy)     0.0.0.0:5431->5432/tcp

[2/6] Verificando saúde das dependências do tasks-service:
Resposta GET /health/dependencias: {"tasks":"ok","users":"ok","notifications":"ok","rabbitmq":"ok"}

[3/6] Criando usuário de teste no users-service:
Usuário criado: {"id":20,"nome":"Auditor de Eventos 1795464596","email":"auditor.1795464596@sd.uern.br"}

[4/6] Criando tarefa com status 'pendente' no tasks-service:
Tarefa criada: {"id":16,"titulo":"Auditoria de Mensageria 1795464596","status":"pendente","responsavel_id":20}

[5/6] Concluindo tarefa (PUT /tasks/16 com status: 'concluida')...
Tarefa atualizada: {"id":16,"titulo":"Auditoria de Mensageria 1795464596","status":"concluida"}

[6/6] Verificando logs do PRODUTOR e do CONSUMIDOR:
--- LOGS DO PRODUTOR (tasks-service) ---
[RabbitMQ Produtor] Conectado com sucesso! Exchange: "tarefas.eventos", Fila: "tarefa_concluida"
[RabbitMQ Produtor] Evento 'tarefa_concluida' publicado com sucesso na exchange 'tarefas.eventos' (Fila: 'tarefa_concluida') | Tarefa #16 ("Auditoria de Mensageria 1795464596")

--- LOGS DO CONSUMIDOR (notifications-service) ---
==================================================
[RabbitMQ Consumidor] MENSAGEM RECEBIDA VIA BROKER
- Fila: tarefa_concluida
- Evento: tarefa_concluida
- Tarefa ID: 16
- Título: "Auditoria de Mensageria 1795464596"
- Responsável: Auditor de Eventos 1795464596
- Timestamp do Evento: 2026-11-23T20:09:56.360Z
==================================================
[RabbitMQ Consumidor] Notificação gravada no banco com sucesso! (ID: 29, Task ID: 16)

Consultando GET /notifications?task_id=16 no notifications-service...
Notificação persistida no banco: [
  {"id":28,"tipo":"tarefa_atribuida","task_id":16},
  {"id":29,"tipo":"tarefa_concluida","mensagem":"Tarefa \"Auditoria de Mensageria 1795464596\" foi concluída.","task_id":16}
]

==============================================================================
   TESTE DO MÓDULO 4 CONCLUÍDO COM SUCESSO!
==============================================================================
```

---

### Como rodar e testar

#### 1. Subir os containers:
```bash
docker compose up --build -d
```

#### 2. Executar o teste de mensageria:
- **No Linux/macOS:**
  ```bash
  ./scripts/test-messaging.sh
  ```
- **No Windows (PowerShell):**
  ```powershell
  .\scripts\test-messaging.ps1
  ```

#### 3. Testar com o consumidor standalone (opcional):
Para ver as mensagens chegando em tempo real em um terminal separado:
```bash
node scripts/standalone-consumer.js
```

#### 4. Painel web do RabbitMQ:
Acesse no navegador: `http://localhost:15672` (Usuário: `guest`, Senha: `guest`).

---

### Comparação: Mensageria (RabbitMQ) vs. Streaming (Kafka/Redpanda)

> [!NOTE]
> O documento completo com a análise detalhada está em:  
> 📄 [docs/modulo-4-mensageria-e-streaming.md](file:///home/joao/Documentos/gerenciador-tarefas/docs/modulo-4-mensageria-e-streaming.md)

#### 1. Diagrama simples (Produtor → Broker → Consumidor)
```
+--------------------+        +---------------------+        +-----------------------+
|      PRODUTOR      |  AMQP  |    BROKER (FILA)    |  ACK   |      CONSUMIDOR       |
|  (tasks-service)   | =====> | (RabbitMQ: 5672)    | =====> |(notifications-service)|
|                    |        | fila: tarefa_concl. |        |                       |
+--------------------+        +---------------------+        +-----------------------+
```

#### 2. Como esse cenário seria modelado com Streaming (Kafka/Redpanda):
- **Tópico com log imutável:** Em vez de uma fila temporária onde a mensagem é apagada após o `ack`, o Kafka armazena os eventos em um log permanente particionado (`tarefas.ciclo-de-vida`). A mensagem fica salva pelo tempo configurado (ex.: 30 dias ou 1 ano).
- **Chave de partição:** O `task_id` seria a partition key, garantindo que todos os eventos da mesma tarefa fiquem na mesma partição e na ordem exata em que aconteceram.
- **Vários consumidores independentes:**
  - `notifications-service`: consome para mandar avisos na hora.
  - `audit-service`: guarda o histórico de alterações para auditoria.
  - `analytics-service`: calcula métricas de tempo médio de conclusão e produtividade.
  - `search-indexer`: atualiza a busca textual no Elasticsearch.
- **Replay de eventos:** Novos serviços podem entrar meses depois e ler os eventos desde o **início (Offset 0)** para reconstruir seu banco do zero, algo que o RabbitMQ não faz nativamente.

#### 3. Tabela comparativa:

| Critério | Mensageria (RabbitMQ) | Streaming (Kafka / Redpanda) |
|---|---|---|
| **Modelo central** | Fila de mensagens temporária | Log de eventos imutável particionado |
| **Após o consumo** | Mensagem é apagada após o `ack` | Mensagem continua salva em disco pelo tempo de retenção |
| **Consumidores** | Concorrentes na mesma fila ou filas replicadas | Grupos de consumidores independentes com offsets próprios |
| **Replay histórico** | Não suporta nativamente | Suporta nativamente (basta resetar o offset) |
| **Roteamento** | Muito flexível (direct, topic, fanout, headers) | Baseado no tópico e na partição |
| **Volume de dados** | Milhares de mensagens por segundo | Milhões de eventos por segundo |
| **Complexidade** | Simples de rodar e configurar (tem UI pronta) | Maior complexidade de configuração e infraestrutura |

#### 4. Justificativa da escolha:
- **Por que RabbitMQ no Gerenciador de Tarefas:** O nosso sistema precisa apenas disparar uma notificação quando a tarefa é concluída. O RabbitMQ atende isso perfeitamente, com entrega garantida, baixa complexidade e painel pronto para monitorar.
- **Quando valeria a pena usar Kafka:** Se o sistema precisasse de Event Sourcing (guardar todo o histórico de mudanças em vez de só o estado atual), tivesse centenas de milhares de tarefas por segundo ou vários serviços analíticos lendo o mesmo fluxo histórico.

---

## Módulo 3 — Containers e Docker Compose

Neste módulo, todos os componentes do sistema foram empacotados em containers padronizados e orquestrados localmente via Docker Compose:

1. **Dockerfile individual para cada serviço:** Multi-stage build com `node:20-alpine`, usuário sem privilégios (`USER node`) e healthchecks nativos.
2. **Docker Compose:** 3 microsserviços + 3 bancos independentes Postgres 16 Alpine com volumes persistentes nomeados.
3. **Persistência de dados:** Testada e comprovada através dos scripts `scripts/test-persistence.sh` e `scripts/test-persistence.ps1`.

---

## Módulo 2 — Microsserviços e Deploy em Nuvem

Microsserviços independentes com bancos próprios:
- **tasks-service:** CRUD de tarefas e envio de notificações.
- **users-service:** CRUD de usuários responsáveis.
- **notifications-service:** Registro de notificações.

URLs públicas (Railway/Neon):
- `tasks-service`: https://tasks-service-production-dd13.up.railway.app
- `users-service`: https://users-service-production-9f90.up.railway.app
- `notifications-service`: https://notifications-service-production-c3c4.up.railway.app

---

## Endpoints das APIs

- **tasks-service:** `GET /health`, `GET /health/dependencias`, `POST /tasks`, `GET /tasks`, `GET /tasks/:id`, `GET /tasks/:id/completo`, `PUT /tasks/:id`, `DELETE /tasks/:id`
- **users-service:** `GET /health`, `POST /users`, `GET /users`, `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id`
- **notifications-service:** `GET /health`, `POST /notifications`, `GET /notifications`, `GET /notifications/:id`

## Variáveis de Ambiente

| Serviço | Variável | Descrição |
|---|---|---|
| Todos | `DATABASE_URL` | String de conexão com o banco PostgreSQL |
| Todos | `PORT` | Porta onde o serviço roda |
| Todos | `PGSSL` | Se ativa SSL (`true` na nuvem / `false` no Docker local) |
| tasks-service | `USERS_SERVICE_URL` | URL do users-service |
| tasks-service | `NOTIFICATIONS_SERVICE_URL` | URL do notifications-service |
| tasks-service | `REQUEST_TIMEOUT_MS` | Timeout das chamadas HTTP (padrão: 5000 ms) |
| tasks-service / notifications-service | `RABBITMQ_URL` | URL de conexão com o RabbitMQ (`amqp://guest:guest@rabbitmq:5672`) |
