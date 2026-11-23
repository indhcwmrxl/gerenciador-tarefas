# Gerenciador de Tarefas

Projeto incremental da disciplina de **Sistemas Distribuídos** (DCC/UERN).  
**Docente(s):** Glaucia Melissa (Responsável pela disciplina) / Luiziane Paulino dos Santos (Estágio Docência)  
**Domínio:** Gerenciador de Tarefas (evento natural: *"tarefa concluída"*, base para o Módulo 4).

Histórico de entregas e módulos preservados nas tags do Git:
- `entrega-4-mensageria`: Módulo 4 — Comunicação em Sistemas Distribuídos: Mensageria Assíncrona com RabbitMQ (AMQP 0-9-1) e Análise/Projeto de Streaming de Eventos (Kafka/Redpanda).
- `entrega-3-containers`: Módulo 3 — Conteinerização individual via Dockerfile e orquestração completa via Docker Compose com bancos locais e volumes persistentes.
- `entrega-2-microsservicos`: Módulo 2 — Decomposição em 3 microsserviços independentes com comunicação síncrona HTTP/REST.
- `entrega-1-cloud`: Módulo 1 — API monolítica inicial publicada em nuvem com banco gerenciado (Neon/Railway).

---

## Módulo 4 — Mensageria e Streaming de Eventos (Novidade)

Neste módulo, a comunicação entre os microsserviços evoluiu do acoplamento síncrono HTTP para o paradigma **orientado a eventos assíncronos**, integrando o message broker **RabbitMQ** ao ecossistema de containers e analisando a modelagem alternativa com **Streaming de Eventos (Apache Kafka / Redpanda)**.

### Vídeo de Demonstração (Módulo 4)

> [!IMPORTANT]
> **Link do Vídeo no YouTube (Não Listado):** `[INSERIR_LINK_AQUI]`  
> *(Demonstração do RabbitMQ no Docker Compose, execução do teste de mensageria com tarefas concluídas, publicação no produtor, consumo com confirmação manual no consumidor e visualização no RabbitMQ Management UI)*.

---

### O que foi implementado:

1. **Broker de Mensageria RabbitMQ em Container Oficial:**
   - Adicionado o container `rabbitmq` utilizando a imagem oficial enxuta `rabbitmq:3-management-alpine`.
   - Porta AMQP `5672` para troca de mensagens entre aplicações e porta `15672` com painel web completo (**RabbitMQ Management UI**, acessível via `http://localhost:15672` com login `guest`/`guest`).
   - Volume persistente nomeado `gerenciador_rabbitmq_data` garantindo a durabilidade do estado do broker e mensagens enfileiradas.
   - Healthcheck nativo com `rabbitmq-diagnostics -q ping`.

2. **Produtor de Eventos (`tasks-service`):**
   - Biblioteca cliente oficial `amqplib`.
   - Conexão tolerante a falhas com retentativas automáticas e reconexão contínua em segundo plano.
   - Ao transicionar o status de uma tarefa para `"concluida"` (`POST /tasks` ou `PUT /tasks/:id`), dispara o evento `tarefa_concluida` para a exchange direta `tarefas.eventos` com routing key `tarefa.concluida`.
   - Mensagens persistentes (`persistent: true`) com payload JSON estruturado contendo ID, título, responsável e timestamp.

3. **Consumidor de Eventos (`notifications-service`):**
   - Declara e escuta a fila durável `tarefa_concluida` vinculada à exchange.
   - Configurado com `prefetch(1)` (*fair dispatch*) para equilíbrio de carga.
   - Confirmação explícita de processamento via `channel.ack(msg)` após gravação bem-sucedida no banco PostgreSQL `notifications_db`.
   - Tratamento de exceção com `nack` para reprocessamento seguro em caso de indisponibilidade momentânea do banco.

4. **Monitoramento e Observabilidade:**
   - Rota `GET /health/dependencias` atualizada para verificar a saúde e a conectividade com o RabbitMQ em tempo real (`{"tasks":"ok","users":"ok","notifications":"ok","rabbitmq":"ok"}`).
   - Encerramento gracioso (*graceful shutdown*) de canais e conexões AMQP ao receber sinais `SIGTERM` ou `SIGINT`.

---

### Diagrama de Arquitetura do Módulo 4

![Diagrama de Arquitetura Módulo 4](docs/arquitetura-modulo-4.svg)

```
+-----------------------------------------------------------------------------------------+
|                    FLUXO DE MENSAGERIA IMPLEMENTADO (AMQP 0-9-1)                        |
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

### Mapeamento Completo de Serviços e Containers (7 Containers)

| Container | Imagem Base | Portas no Host | Finalidade / Papel | Volume Persistente |
|---|---|---|---|---|
| `rabbitmq` | `rabbitmq:3-management-alpine` | `5672` (AMQP), `15672` (Web UI) | **Message Broker** para desacoplamento de eventos | `gerenciador_rabbitmq_data` |
| `tasks-service` | `node:20-alpine` (multi-stage) | `3000` | CRUD de tarefas e **Produtor de Eventos AMQP** | — |
| `notifications-service`| `node:20-alpine` (multi-stage) | `3002` | API de avisos e **Consumidor de Eventos AMQP** | — |
| `users-service` | `node:20-alpine` (multi-stage) | `3001` | CRUD de usuários responsáveis pelas tarefas | — |
| `tasks-db` | `postgres:16-alpine` | `5432` | Banco de dados independente do tasks-service | `gerenciador_tasks_db_data` |
| `notifications-db` | `postgres:16-alpine` | `5433` | Banco de dados independente de notificações | `gerenciador_notifications_db_data` |
| `users-db` | `postgres:16-alpine` | `5431` | Banco de dados independente do users-service | `gerenciador_users_db_data` |

---

### Log de Demonstração do Fluxo Publicado e Consumido

Execução validada ponta a ponta através do script automatizado `scripts/test-messaging.sh`:

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

### Como Rodar e Testar o Módulo 4

#### 1. Iniciar toda a infraestrutura conteinerizada:
```bash
docker compose up --build -d
```

#### 2. Executar o teste automatizado de mensageria:
- **No Linux/macOS:**
  ```bash
  ./scripts/test-messaging.sh
  ```
- **No Windows 11 (PowerShell):**
  ```powershell
  .\scripts\test-messaging.ps1
  ```

#### 3. Testar com Consumidor Standalone em Tempo Real (Opcional):
Abra um terminal adicional para acompanhar a chegada de eventos diretamente no broker:
```bash
node scripts/standalone-consumer.js
```

#### 4. Acessar o Painel Web do RabbitMQ:
Abra no navegador `http://localhost:15672` (Usuário: `guest`, Senha: `guest`) para visualizar a fila `tarefa_concluida`, taxas de entrega e conexões ativas.

---

### Análise e Comparação Técnica: Mensageria (RabbitMQ) vs. Streaming de Eventos (Kafka/Redpanda)

> [!NOTE]
> Para aprofundamento teórico e diagramas detalhados, consulte o documento analítico completo:  
> 📄 [docs/modulo-4-mensageria-e-streaming.md](file:///home/joao/Documentos/gerenciador-tarefas/docs/modulo-4-mensageria-e-streaming.md)

#### 1. Diagrama de 3 Caixas (Mensageria Implementada)
```
+--------------------+        +---------------------+        +-----------------------+
|      PRODUTOR      |  AMQP  |    BROKER (FILA)    |  ACK   |      CONSUMIDOR       |
|   (tasks-service)  | =====> | (RabbitMQ: 5672)    | =====> |(notifications-service)|
|                    |        | fila: tarefa_concl. |        |                       |
+--------------------+        +---------------------+        +-----------------------+
```

#### 2. Como esse cenário seria modelado com Streaming de Eventos (Apache Kafka / Redpanda):
- **Log Imutável e Tópicos Particionados:** Ao invés de uma fila descartável onde as mensagens são apagadas após o processamento, haveria um tópico particionado único (`tarefas.ciclo-de-vida`). Cada evento (`tarefa_criada`, `tarefa_concluida`) seria gravado como um registro imutável com retention configurável (dias ou anos).
- **Chave de Particionamento (*Partition Key*):** A chave seria o `task_id`, garantindo que todas as ações sobre uma mesma tarefa caiam na mesma partição, mantendo a ordem estrita dos acontecimentos.
- **Múltiplos Consumidores com Offsets Independentes:**
  - `notifications-service` (Consumer Group 1): consome para enviar alertas imediatos.
  - `audit-service` (Consumer Group 2): armazena o histórico completo para conformidade e auditoria (LGPD).
  - `analytics-service` (Consumer Group 3): processa métricas em tempo real (SLA, Lead Time, produtividade de equipes).
  - `search-indexer` (Consumer Group 4): atualiza índices no Elasticsearch.
- **Replay de Eventos (*Rewind*):** Novos microsserviços poderiam ser criados meses depois e simplesmente ler desde o **Offset 0** para reconstruir seu estado a partir de todo o histórico passado de eventos, algo impossível na mensageria tradicional.

#### 3. Tabela Comparativa Resumida:

| Critério | Mensageria Tradicional (RabbitMQ) | Streaming de Eventos (Kafka / Redpanda) |
|---|---|---|
| **Abstração** | Fila transitória de mensagens | Log imutável de eventos ordenado por partição |
| **Pós-consumo** | Mensagem apagada após o `ack` | Preservada em disco segundo política de retenção |
| **Múltiplos Consumidores** | Competing consumers ou filas duplicadas | Múltiplos Consumer Groups com ponteiros de *offset* independentes |
| **Replay Histórico** | Não suportado nativamente | Suportado nativamente (basta resetar o *offset*) |
| **Roteamento** | Altamente flexível (direct, topic, fanout, headers) | Roteamento por tópico e chave de partição |
| **Throughput** | Alto (milhares a dezenas de milhares de msgs/s) | Massivo (milhões de eventos por segundo) |
| **Complexidade** | Baixa a moderada, ideal para aplicações transacionais | Alta, ideal para Event Sourcing, Big Data e Analytics contínuo |

#### 4. Justificativa Técnica:
- **Por que RabbitMQ no Gerenciador de Tarefas:** Excelente casamento com a necessidade de processamento assíncrono de comandos/notificações transacionais com entrega garantida, baixa complexidade de implantação e UI de gestão integrada.
- **Quando migrar para Streaming (Kafka/Redpanda):** Se o sistema evoluir para arquiteturas de *Event Sourcing*, necessitar de métricas analíticas em tempo real de grandes volumes de tarefas corporativas ou requerer trilha de auditoria retroativa com reprocessamento histórico.

---

## Módulo 3 — Containers e Docker Compose

Neste módulo, todos os componentes do sistema foram empacotados em containers padronizados e orquestrados localmente de forma autônoma:

### O que foi implementado no Módulo 3:
1. **Dockerfile individual para cada microsserviço:** Multi-stage build com `node:20-alpine`, execução sem root (`USER node`), healthchecks nativos.
2. **Orquestração via `docker-compose.yml`:** 3 microsserviços + 3 bancos independentes Postgres 16 Alpine com volumes persistentes nomeados.
3. **Scripts de teste de persistência:** `scripts/test-persistence.sh` e `scripts/test-persistence.ps1` comprovando a persistência dos dados após ciclo de `down` e `up`.

### Comparação Técnica: Deploy Direto na Nuvem vs. Containers

| Critério de Análise | Deploy Direto na Nuvem (Módulos 1 e 2) | Execução via Containers (Módulo 3) |
|---|---|---|
| **Ambiente de Execução** | Depende do runtime do provedor (Railway instalando Node via buildpack; Neon gerenciando instâncias Postgres). | Imagens imutáveis e isoladas via Docker (`node:20-alpine` e `postgres:16-alpine`), idênticas em qualquer máquina ou SO. |
| **Reprodução Local** | Trabalhosa: exigia clonar o repo, instalar versão compatível de Node.js, rodar `npm install` em 3 pastas, abrir 3 terminais e configurar manualmente 3 bancos no Neon ou local. | Imediata: um único comando (`docker compose up --build -d`) sobe toda a topologia distribuída sem exigir Node ou Postgres no host. |
| **Paridade Dev/Prod** | Baixa: discrepâncias de versão de Node, bibliotecas do SO ou portas no host podiam gerar comportamentos inesperados. | Alta: todo o ambiente é declarado em código (`Infrastructure as Code`). |
| **Segurança e Privilégios** | Processos Node rodando com usuário padrão do host ou da VM. | Isolamento de namespace por container e execução com usuário não-root (`USER node`). |
| **Persistência de Dados** | Delegada a serviço PaaS (Neon com storage em nuvem gerenciado). | Gerenciada explicitamente através de **Docker Volumes nomeados** independentes por microsserviço. |

---

## Módulo 2 — Infraestrutura em Nuvem (Railway e Neon)

A infraestrutura publicada na nuvem durante o Módulo 2 continua ativa e disponível:
- **Railway:** responsável pela hospedagem e execução dos serviços `tasks-service`, `users-service` e `notifications-service`.
- **Neon:** responsável pelo armazenamento dos dados, com bancos PostgreSQL independentes para cada microsserviço.

### URLs públicas (Railway)
| Serviço | URL |
|---|---|
| `tasks-service` | https://tasks-service-production-dd13.up.railway.app |
| `users-service` | https://users-service-production-9f90.up.railway.app |
| `notifications-service` | https://notifications-service-production-c3c4.up.railway.app |

---

## Endpoints das APIs

- **tasks-service:** `GET /health`, `GET /health/dependencias`, `POST /tasks`, `GET /tasks`, `GET /tasks/:id`, `GET /tasks/:id/completo`, `PUT /tasks/:id`, `DELETE /tasks/:id`
- **users-service:** `GET /health`, `POST /users`, `GET /users`, `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id`
- **notifications-service:** `GET /health`, `POST /notifications`, `GET /notifications`, `GET /notifications/:id`

## Variáveis de Ambiente

| Serviço | Variável | Descrição |
|---|---|---|
| Todos | `DATABASE_URL` | Connection string do banco PostgreSQL (Neon ou container local) |
| Todos | `PORT` | Porta do serviço |
| Todos | `PGSSL` | Define se exige SSL (`true` para Neon na nuvem; `false` para Docker local) |
| tasks-service | `USERS_SERVICE_URL` | URL base do users-service |
| tasks-service | `NOTIFICATIONS_SERVICE_URL` | URL base do notifications-service |
| tasks-service | `REQUEST_TIMEOUT_MS` | Timeout das chamadas HTTP (padrão 5000 ms) |
| tasks-service / notifications-service | `RABBITMQ_URL` | Connection string do broker AMQP (`amqp://guest:guest@rabbitmq:5672`) |
