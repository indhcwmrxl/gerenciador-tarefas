# Sistema Distribuído de Gerenciamento de Tarefas

Implementação incremental desenvolvida no âmbito da disciplina de **Sistemas Distribuídos** do Departamento de Ciência da Computação da Universidade do Estado do Rio Grande do Norte (DCC/UERN).  
**Corpo Docente:** Profa. Dra. Glaucia Melissa / Ma. Luiziane Paulino dos Santos  
**Domínio de Aplicação:** Orquestração e controle de ciclo de vida de tarefas transacionais com emissão de eventos de domínio (`tarefa_concluida`).

Histórico de evolução arquitetural preservado nas tags do repositório:
- `entrega-4-mensageria`: Módulo 4 — Comunicação Assíncrona via AMQP (RabbitMQ) e Análise Formal de Streaming Distribuído (Kafka/Redpanda).
- `entrega-3-containers`: Módulo 3 — Empacotamento, isolamento e orquestração determinística via Docker e Docker Compose.
- `entrega-2-microsservicos`: Módulo 2 — Decomposição arquitetural em microsserviços autônomos com comunicação síncrona HTTP/REST.
- `entrega-1-cloud`: Módulo 1 — Prototipagem cliente-servidor monolítica com persistência gerenciada em nuvem.

---

## Módulo 4 — Comunicação em Sistemas Distribuídos: Mensageria (AMQP) e Streaming de Eventos

Nesta etapa, o acoplamento temporal inerente às comunicações síncronas HTTP/REST foi eliminado mediante a introdução de uma arquitetura orientada a eventos assíncronos baseada no protocolo **AMQP 0-9-1**. O sistema incorpora um Message Broker intermediário (**RabbitMQ**) para desacoplar a emissão do estado de conclusão da tarefa do respectivo processamento de notificações, complementado pela modelagem analítica sob o paradigma de **Streaming de Eventos** (Apache Kafka/Redpanda).

### Registro Audiovisual de Validação

> [!IMPORTANT]
> **Registro de Demonstração Experimental:** `[INSERIR_LINK_AQUI]`  
> *(Evidência empírica da inicialização da topologia, publicação persistente pelo nó tasks-service, roteamento via exchange direta, consumo com confirmação manual (ACK) pelo nó notifications-service e telemetria de filas na API de gestão do broker)*.

---

### Especificação da Implementação Prática

1. **Topologia e Configuração do Message Broker:**
   - Implantação do daemon RabbitMQ em container dedicado através da imagem oficial `rabbitmq:3-management-alpine`.
   - Exposição das interfaces de rede: porta TCP `5672` (protocolo AMQP) e porta TCP `15672` (interface HTTP REST e painel de telemetria).
   - Persistência estruturada em volume nomeado `gerenciador_rabbitmq_data`, assegurando durabilidade de mensagens e metadados de filas entre reinicializações de nó.
   - Sonda de integridade (*liveness/readiness probe*) parametrizada via `rabbitmq-diagnostics -q ping`.

2. **Nó Produtor (`tasks-service`):**
   - Integração da biblioteca cliente `amqplib` com camada de resiliência e reconexão automática com backoff exponencial.
   - Detecção de transição de estado da entidade (`status` -> `"concluida"`).
   - Serialização do payload JSON e publicação na exchange direta `tarefas.eventos` sob a chave de roteamento `tarefa.concluida`.
   - Garantia de durabilidade mediante parametrização do cabeçalho `persistent: true`.

3. **Nó Consumidor (`notifications-service`):**
   - Declaração idempotente e vinculação à fila durável `tarefa_concluida`.
   - Configuração de vazão unitária via `prefetch(1)` (*fair dispatching*), mitigando sobrecarga e garantindo distribuição equitativa entre instâncias concorrentes.
   - Semântica de entrega *at-least-once*: o processamento é concluído com persistência transacional ACID no PostgreSQL (`notifications-db`) antes da emissão do reconhecimento manual explícito (`channel.ack(msg)`).
   - Tratamento de faltas com instrução `channel.nack` e política de re-enfileiramento seguro em caso de indisponibilidade transitória do armazenamento.

4. **Sondagem de Dependências e Desligamento Gracioso (*Graceful Shutdown*):**
   - Extensão da sonda `/health/dependencias` no `tasks-service` para verificação ativa da integridade do canal AMQP em tempo real (`{"tasks":"ok","users":"ok","notifications":"ok","rabbitmq":"ok"}`).
   - Interceptação de sinais POSIX `SIGTERM` e `SIGINT`, assegurando o esvaziamento ordenado de buffers e fechamento simétrico de conexões TCP.

---

### Topologia Arquitetural do Módulo 4

![Topologia Arquitetural Módulo 4](docs/arquitetura-modulo-4.svg)

```
+-----------------------------------------------------------------------------------------+
|                  FLUXO DE TRANSMISSÃO ASSÍNCRONA AMQP 0-9-1                             |
|                                                                                         |
|   +-------------------+    publica evento    +-------------------+   consome evento     |
|   |   tasks-service   | -------------------> |     RabbitMQ      | ------------------>  |
|   |    (PRODUTOR)     |  "tarefa_concluida"  |     (BROKER)      |   com ACK manual     |
|   +-------------------+                      +-------------------+                      |
|             |                                          |                                |
|             v                                          v                                |
|       [ tasks-db ]                           [ Fila Durável ]                           |
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

### Mapeamento da Infraestrutura Distribuída (Topologia de 7 Nós)

| Nó / Container | Imagem Base | Interfaces de Rede | Função Arquitetural | Estrutura de Persistência |
|---|---|---|---|---|
| `rabbitmq` | `rabbitmq:3-management-alpine` | `5672` (AMQP), `15672` (HTTP) | Intermediador de Mensagens (*Message Broker*) | `gerenciador_rabbitmq_data` |
| `tasks-service` | `node:20-alpine` (multi-stage) | `3000` (HTTP) | API de Tarefas e Produtor de Eventos AMQP | — |
| `notifications-service`| `node:20-alpine` (multi-stage) | `3002` (HTTP) | API de Notificações e Consumidor de Eventos AMQP | — |
| `users-service` | `node:20-alpine` (multi-stage) | `3001` (HTTP) | API de Domínio de Usuários e Validação de Chaves | — |
| `tasks-db` | `postgres:16-alpine` | `5432` (TCP) | Armazenamento Relacional Independente (Tarefas) | `gerenciador_tasks_db_data` |
| `notifications-db` | `postgres:16-alpine` | `5433` (TCP) | Armazenamento Relacional Independente (Notificações) | `gerenciador_notifications_db_data` |
| `users-db` | `postgres:16-alpine` | `5431` (TCP) | Armazenamento Relacional Independente (Usuários) | `gerenciador_users_db_data` |

---

### Evidência Empírica de Execução e Convergência de Estado

Registro de telemetria obtido via script de verificação formal `scripts/test-messaging.sh`:

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

### Protocolo de Reprodução Experimental

#### 1. Orquestração da topologia conteinerizada:
```bash
docker compose up --build -d
```

#### 2. Execução do procedimento de validação funcional:
- **Ambiente POSIX (Linux/macOS):**
  ```bash
  ./scripts/test-messaging.sh
  ```
- **Ambiente Windows (PowerShell):**
  ```powershell
  .\scripts\test-messaging.ps1
  ```

#### 3. Monitoramento de consumo desacoplado em tempo real:
Para atestar a recepção independente de eventos:
```bash
node scripts/standalone-consumer.js
```

#### 4. Acesso à interface de telemetria do broker:
Endpoint: `http://localhost:15672` (Credenciais padrão: `guest` / `guest`).

---

### Análise Comparativa Formal: Mensageria (RabbitMQ) vs. Streaming de Eventos (Kafka/Redpanda)

> [!NOTE]
> Para formulação teórica aprofundada, consulte o documento analítico dedicado:  
> 📄 [docs/modulo-4-mensageria-e-streaming.md](file:///home/joao/Documentos/gerenciador-tarefas/docs/modulo-4-mensageria-e-streaming.md)

#### 1. Abstração Estrutural de 3 Elementos (Topologia AMQP Implementada)
```
+--------------------+        +---------------------+        +-----------------------+
|    NÓ PRODUTOR     |  AMQP  |   MESSAGE BROKER    |  ACK   |     NÓ CONSUMIDOR     |
|  (tasks-service)   | =====> | (RabbitMQ: 5672)    | =====> | (notifications-serv.) |
|                    |        | fila: tarefa_concl. |        |                       |
+--------------------+        +---------------------+        +-----------------------+
```

#### 2. Modelagem Alternativa sob o Paradigma de Streaming Distribuído:
- **Estrutura de Commit Log Imutável:** Em contraposição às filas transientes do RabbitMQ (cujas mensagens são destruídas após a recepção do ACK), o modelo de streaming estrutura os eventos em um log ordenado, distribuído e imutável (`tarefas.ciclo-de-vida`). A durabilidade é governada por políticas temporais de retenção (dias, meses ou anos).
- **Chave de Particionamento e Ordenação Determinística:** A adoção do identificador da entidade (`task_id`) como partition key assegura que eventos correlacionados convirjam para a mesma partição física, assegurando ordenação estrita per-entity.
- **Topologia de Múltiplos Grupos Consumidores (*Consumer Groups*):**
  - `grupo-notificacoes` (`notifications-service`): consumo reativo para sinalização imediata ao usuário.
  - `grupo-auditoria` (`audit-service`): persistência contínua para trilhas de compliance e conformidade regulatória.
  - `grupo-analytics` (`analytics-service`): processamento de fluxo em tempo real (métricas de Lead Time, SLA e taxa de vazão).
  - `grupo-indexacao` (`search-indexer`): atualização contínua de índices invertidos de busca.
- **Capacidade de Reprocessamento Histórico (*Event Replay*):** A descentralização do controle de leitura através de ponteiros de deslocamento (*offsets*) gerenciados pelo próprio consumidor viabiliza a reinicialização a partir do offset zero (*rewind*), permitindo que novos nós reconstruam seu estado derivado a partir de todo o histórico pregresso de eventos.

#### 3. Síntese Comparativa de Propriedades Distribuídas:

| Propriedade Arquitetural | Mensageria Tradicional (AMQP / RabbitMQ) | Streaming Distribuído (Kafka / Redpanda) |
|---|---|---|
| **Abstração Central** | Fila transitória de mensagens (*Message Queue*) | Log distribuído de eventos ordenado por partição |
| **Destino do Dado pós-consumo** | Expurgo imediato após reconhecimento (`ack`) | Preservação em disco parametrizada por tempo ou volume |
| **Consumo Concorrente** | Disputa de fila (*Competing Consumers*) ou replicação | Grupos de consumidores isolados com partições atribuídas |
| **Replay / Reprocessamento** | Ausente por concepção de projeto | Suportado deterministicamente via reset de offset |
| **Mecanismo de Roteamento** | Avançado em broker (direct, topic, fanout, headers) | Roteamento baseado em tópico e partição |
| **Vazão Típica** | Milhares a dezenas de milhares de ops/s | Milhões de eventos/s via escritas sequenciais em disco |
| **Sobrecarga Operacional** | Baixa a moderada, ideal para fluxos transacionais | Moderada a elevada, justificável em alta volumetria e analytics |

#### 4. Justificativa Técnica:
- **Adequação do RabbitMQ ao Domínio:** O domínio do Gerenciador de Tarefas apresenta característica transacional de comando e notificação, onde o ciclo de vida da mensagem encerra-se com o recebimento do alerta. O RabbitMQ provê entrega garantida (*at-least-once*) com mínima latência e reduzido custo operacional.
- **Condicionantes para Migração a Streaming:** A substituição da camada de mensageria por Apache Kafka/Redpanda justificaria-se em cenários de alta volumetria (dezenas de milhares de transações concorrentes), adoção integral do padrão arquitetural de *Event Sourcing* e necessidade de auditoria analítica retrospectiva contínua.

---

## Módulo 3 — Empacotamento e Isolamento via Containers

Nesta etapa, a totalidade dos nós foi conteinerizada sob imagens imutáveis e orquestrada de forma determinística via Docker Compose:

### Especificação do Módulo 3:
1. **Dockerfiles Individuais:** Construção em múltiplos estágios (*multi-stage build*) com imagem `node:20-alpine`, execução sob usuário não-privilegiado (`USER node`) e sondas de integridade nativas.
2. **Orquestração Declarativa:** 3 microsserviços e 3 bancos relacionais PostgreSQL 16 Alpine independentes vinculados a volumes persistentes nomeados.
3. **Validação de Persistência:** Scripts [scripts/test-persistence.sh](file:///home/joao/Documentos/gerenciador-tarefas/scripts/test-persistence.sh) e [scripts/test-persistence.ps1](file:///home/joao/Documentos/gerenciador-tarefas/scripts/test-persistence.ps1) comprovando durabilidade dos dados após ciclos de destruição e recriação de containers.

---

## Módulo 2 — Decomposição em Microsserviços e Implantação em Nuvem

Arquitetura distribuída decomposta em 3 microsserviços autônomos com persistência relacional isolada:
- **tasks-service:** Gestão transacional de tarefas e coordenação de chamadas.
- **users-service:** Domínio de usuários responsáveis.
- **notifications-service:** Registro persistente de avisos.

Interfaces públicas legadas (Railway/Neon):
- `tasks-service`: https://tasks-service-production-dd13.up.railway.app
- `users-service`: https://users-service-production-9f90.up.railway.app
- `notifications-service`: https://notifications-service-production-c3c4.up.railway.app

---

## Interfaces e Endpoints

- **tasks-service:** `GET /health`, `GET /health/dependencias`, `POST /tasks`, `GET /tasks`, `GET /tasks/:id`, `GET /tasks/:id/completo`, `PUT /tasks/:id`, `DELETE /tasks/:id`
- **users-service:** `GET /health`, `POST /users`, `GET /users`, `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id`
- **notifications-service:** `GET /health`, `POST /notifications`, `GET /notifications`, `GET /notifications/:id`

## Variáveis de Ambiente da Topologia

| Componente | Variável | Descrição Técnica |
|---|---|---|
| Todos | `DATABASE_URL` | String de conexão com o banco relacional PostgreSQL |
| Todos | `PORT` | Porta de escuta da interface HTTP do processo |
| Todos | `PGSSL` | Parâmetro booleano de TLS/SSL para conexões com o banco |
| tasks-service | `USERS_SERVICE_URL` | URI base para resolução de dependências no users-service |
| tasks-service | `NOTIFICATIONS_SERVICE_URL` | URI base para envio de notificações síncronas |
| tasks-service | `REQUEST_TIMEOUT_MS` | Limite temporal para interrupção de requisições HTTP (5000 ms) |
| tasks-service / notifications-service | `RABBITMQ_URL` | String de conexão com o daemon AMQP (`amqp://guest:guest@rabbitmq:5672`) |
