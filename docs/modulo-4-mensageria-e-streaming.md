# Módulo 4 — Comunicação em Sistemas Distribuídos: Mensageria e Streaming de Eventos

**Disciplina:** Sistemas Distribuídos — Departamento de Ciência da Computação (DCC/UERN)  
**Docente(s):** Glaucia Melissa (Responsável pela disciplina) / Luiziane Paulino dos Santos (Estágio Docência)  
**Domínio:** Gerenciador de Tarefas  
**Evento Central de Domínio:** `tarefa_concluida` (*Task Completed*)  

---

## 1. Introdução e Objetivo

No **Módulo 2**, a comunicação entre os microsserviços foi implementada de maneira **síncrona** via chamadas HTTP/REST. Embora funcional, o acoplamento temporal inerente ao modelo síncrono apresenta limitações críticas em sistemas distribuídos:
1. **Acoplamento Temporal:** Se o serviço de destino (`notifications-service`) sofrer instabilidade ou lentidão, o serviço de origem (`tasks-service`) fica retido aguardando resposta, desperdiçando threads e conexões.
2. **Perda de Resiliência:** Em caso de indisponibilidade temporária do serviço consumidor no momento exato da requisição, a notificação corre o risco de ser perdida ou de demandar lógicas complexas de retry com backoff no cliente.

O objetivo do **Módulo 4** é evoluir essa arquitetura para o paradigma **orientado a mensagens e eventos assíncronos**, introduzindo o **RabbitMQ** como message broker para desacoplar produtores e consumidores, além de analisar conceitualmente como o mesmo cenário seria concebido utilizando **Streaming de Eventos** (Apache Kafka / Redpanda).

---

## 2. Implementação Prática: Mensageria com RabbitMQ (AMQP)

### 2.1. Arquitetura Implementada

A implementação utiliza o protocolo padrão **AMQP 0-9-1** suportado nativamente pelo **RabbitMQ** (executado via imagem oficial `rabbitmq:3-management-alpine` conteinerizada no Docker Compose).

```
+-----------------------------------------------------------------------------------------+
|                                    MENSAGERIA (AMQP)                                    |
|                                                                                         |
|   +-------------------+              +-------------------+      +---------------------+ |
|   |   PRODUTOR        |   publish    |      BROKER       | ack  |     CONSUMIDOR      | |
|   |  (tasks-service)  | -----------> |    (RabbitMQ)     | ---> |(notifications-serv.)| |
|   |                   |              |                   |      |                     | |
|   +-------------------+              +-------------------+      +---------------------+ |
|             |                                  |                           |            |
|             v                                  v                           v            |
|       [ tasks-db ]                    [ fila persistente ]      [ notifications-db ]    |
|                                       (tarefa_concluida)                                |
+-----------------------------------------------------------------------------------------+
```

### 2.2. Componentes e Fluxo do Evento

1. **Produtor (`tasks-service`):**
   - Ao criar uma tarefa já finalizada (`POST /tasks`) ou ao atualizar o estado de uma tarefa existente para `"concluida"` (`PUT /tasks/:id`), o serviço dispara o método assíncrono `publicarTarefaConcluida(tarefa)`.
   - A mensagem é publicada na exchange direta `tarefas.eventos` com a routing key `tarefa.concluida`.
   - A publicação é configurada com `persistent: true`, garantindo que o broker grave a mensagem em disco para não haver perda mesmo se o RabbitMQ reiniciar.

2. **Broker de Mensageria (`rabbitmq`):**
   - Roteia a mensagem da exchange `tarefas.eventos` para a fila durável `tarefa_concluida`.
   - Armazena a mensagem de forma segura até que o consumidor esteja pronto para processá-la (bufferização e desacoplamento de carga).

3. **Consumidor (`notifications-service`):**
   - Mantém uma conexão persistente e declara interesse na fila `tarefa_concluida`.
   - Configurado com `prefetch(1)` (*fair dispatch*), garantindo que apenas 1 mensagem seja processada por vez.
   - Ao receber o payload JSON, extrai os metadados do evento, registra uma entrada auditável na tabela `notifications` do banco `notifications_db` e emite logs estruturados no console.
   - Envia a confirmação explícita (`channel.ack(msg)`). Se ocorrer uma falha inesperada durante a gravação, a mensagem é nackeada (`channel.nack`) para reprocessamento, garantindo entrega confiável (*at-least-once delivery*).

### 2.3. Estrutura do Payload do Evento (`tarefa_concluida`)

```json
{
  "evento": "tarefa_concluida",
  "timestamp": "2026-11-23T20:15:00.123Z",
  "task_id": 42,
  "titulo": "Auditoria de Segurança Trimestral",
  "descricao": "Revisar permissões de acesso ao cluster",
  "status": "concluida",
  "responsavel": "Maria Silva",
  "responsavel_id": 3,
  "mensagem": "Tarefa \"Auditoria de Segurança Trimestral\" foi concluída."
}
```

---

## 3. Análise e Projeto Conceitual: Modelagem com Streaming de Eventos (Kafka / Redpanda)

### 3.1. Como o Cenário Seria Modelado com Streaming

Se o mesmo domínio de gerenciamento de tarefas fosse modelado com **Streaming de Eventos** (usando **Apache Kafka** ou **Redpanda**), a abstração central deixaria de ser uma *fila passageira de mensagens descartáveis* e passaria a ser um **Log Imutável e Ordenado de Eventos (Event Stream / Commit Log)** distribuído e particionado.

```
                                  CLUSTER KAFKA / REDPANDA
                            +-----------------------------------+
                            |  Tópico: tarefas.ciclo-de-vida   |
                            |                                   |
+-------------------+       |   Partição 0: [E0][E1][E2]...     |       Consumer Group 1 (Notificações)
|   PRODUTOR        |       |   (Eventos de Tasks pares)        | ----> [ notifications-service ]
|  (tasks-service)  | ====> |                                   |       (offset: 42)
|                   |       |   Partição 1: [E0][E1][E2]...     |
+-------------------+       |   (Eventos de Tasks ímpares)      |       Consumer Group 2 (Auditoria)
                            |                                   | ----> [ audit-compliance-service ]
                            +-----------------------------------+       (offset: 42)
                                                                        
                                                                        Consumer Group 3 (Analytics / BI)
                                                                  ----> [ productivity-analytics ]
                                                                        (offset: 10 - replay histórico)
```

#### O que mudaria na modelagem:
1. **Tópico Particionado (`tarefas.ciclo-de-vida`):** Em vez de filas isoladas por ação (`tarefa_concluida`), haveria um tópico único representando todos os fatos do ciclo de vida das tarefas (`tarefa_criada`, `tarefa_atribuida`, `tarefa_iniciada`, `tarefa_concluida`).
2. **Chave de Particionamento (*Partition Key*):** Cada evento seria publicado usando `task_id` como partition key. Isso assegura que todos os eventos da mesma tarefa vão estritamente para a mesma partição, garantindo **ordenação cronológica garantida** para cada tarefa.
3. **Imutabilidade e Retenção Temporal:** Ao contrário do RabbitMQ (onde a mensagem é removida da fila imediatamente após o `ack`), no Kafka o evento permanece gravado em disco pelo período configurado na política de retenção (ex.: 30 dias, 1 ano, ou infinito com *Log Compaction*).
4. **Gerenciamento de Offsets:** Cada consumidor mantém seu próprio ponteiro de leitura (*offset*). O broker não rastreia quem já consumiu o quê por mensagem, tornando a leitura extremamente escalável e de alto throughput.

### 3.2. Novos Consumidores Potenciais no Modelo de Streaming

No ecossistema de Streaming de Eventos, múltiplos serviços de contextos de negócio completamente distintos podem consumir o mesmo fluxo de eventos sem nenhum impacto no produtor:

1. **`notifications-service` (Consumer Group: `grupo-notificacoes`):**
   - Consome em tempo real para disparar e-mails, push notifications ou avisos no painel da aplicação.
2. **`audit-service` (Consumer Group: `grupo-auditoria-compliance`):**
   - Persiste cada transição de estado da tarefa em um banco analítico ou Data Lake (S3/ClickHouse), garantindo trilha de auditoria completa e imutável para conformidade (LGPD/SOX).
3. **`productivity-analytics-service` (Consumer Group: `grupo-analytics`):**
   - Realiza processamento contínuo de fluxo de dados (*Stream Processing* com Kafka Streams ou Flink) para calcular métricas em tempo real: tempo médio de conclusão (Lead Time / Cycle Time), produtividade por usuário e gargalos por setor.
4. **`search-indexer-service` (Consumer Group: `grupo-busca-fulltext`):**
   - Alimenta índices de busca elástica (Elasticsearch/OpenSearch) com o status atualizado de cada tarefa para buscas instantâneas na interface.

### 3.3. O Poder do Replay de Eventos (*Event Sourcing / Reprocessamento*)

Uma das maiores vantagens do Streaming em relação à mensageria tradicional é o **Replay**:
- Se for lançado um novo microsserviço de Business Intelligence 6 meses após o sistema estar em produção, ele pode simplesmente iniciar seu offset no **início do log (Offset 0)** e processar todo o histórico de eventos passados da empresa para construir seu banco analítico do zero, sem precisar exportar dumps de banco ou pedir nada ao `tasks-service`.
- Em caso de bug em um consumidor, basta corrigir o código, rebobinar o offset (*rewind*) para o momento anterior ao incidente e reprocessar todos os eventos de forma determinística.

---

## 4. Comparação: Mensageria (RabbitMQ) vs. Streaming de Eventos (Kafka / Redpanda)

| Critério de Comparação | Mensageria Tradicional (RabbitMQ) | Streaming de Eventos (Kafka / Redpanda) |
|---|---|---|
| **Abstração Central** | Fila (*Message Queue* temporária com exchanges) | Log Imutável de Eventos particionado (*Distributed Commit Log*) |
| **Destino da Mensagem pós-consumo** | **Apagada da fila** logo após o `ack` do consumidor | **Preservada em disco** pelo tempo de retenção configurado |
| **Múltiplos Consumidores** | Padrão *Competing Consumers* (distribui mensagens entre instâncias) ou Fanout exchange (duplica filas) | Suporta múltiplos *Consumer Groups* independentes lendo o mesmo tópico em ritmos diferentes |
| **Replay / Reprocessamento Histórico** | Não suportado nativamente (a mensagem deixa de existir após consumo) | **Suportado e encorajado** (basta resetar o *offset* de leitura) |
| **Garantia de Ordenação** | Garantida por canal/fila única; difícil de manter com múltiplos consumidores concorrentes na mesma fila | Garantida rigorosamente **por partição** (chaveada pelo ID da entidade) |
| **Roteamento de Mensagens** | **Extremamente flexível e sofisticado** (direct, topic, fanout, headers, dead-letter exchanges) | Roteamento simples baseado em tópico e partição; transformações complexas exigem stream processors |
| **Throughput / Volume de Dados** | Ideal para milhares a dezenas de milhares de msgs/segundo com baixa latência | Projetado para **milhões de eventos/segundo** com leitura/escrita sequencial em disco (*zero-copy*) |
| **Complexidade Operacional** | **Baixa/Média:** Leve, fácil de subir e administrar (Web UI intuitiva pronta para uso) | **Média/Alta:** Demanda gerenciamento de partições, réplicas, retenção e brokers (ou KRaft/ZooKeeper) |

---

## 5. Justificativa Técnica das Escolhas e Cenários de Transição

### Por que o RabbitMQ foi a escolha ideal para o Módulo 4:
1. **Alinhamento ao Domínio Atual:** O `gerenciador-tarefas` é um sistema transacional onde a notificação é um comando/aviso de processamento imediato (*Task Completed -> Notify User*). O RabbitMQ resolve esse problema de desacoplamento assíncrono com máxima eficiência e mínima sobrecarga operacional.
2. **Consumo Rápido e Limpeza Automática:** Não há necessidade imediata de manter o log de eventos dentro do broker de mensagens por meses, pois a persistência durável dos dados de negócio já é de responsabilidade dos bancos relacionais de cada microsserviço (`tasks-db` e `notifications-db`).
3. **Observabilidade Nativa:** A imagem oficial `rabbitmq:3-management-alpine` provê painel web com métricas em tempo real de taxas de entrega, filas e conexões na porta `15672` sem necessidade de ferramentas externas.

### Em que situações a migração para Streaming (Kafka/Redpanda) se justificaria:
A transição para Kafka/Redpanda seria amplamente recomendada caso o projeto evoluísse nos seguintes cenários:
1. **Arquitetura Event-Driven completa (*Event Sourcing* e *CQRS*):** Se o estado das tarefas deixasse de ser atualizado por mutações SQL tradicionais (`UPDATE tasks SET...`) e passasse a ser derivado puramente do replay da cadeia imutável de eventos (`TaskCreated` -> `TaskAssigned` -> `TaskStarted` -> `TaskCompleted`).
2. **Escala de Larga Escala (Big Data / IoT / Milhões de Tarefas):** Se o sistema passasse a gerenciar milhões de eventos por segundo gerados por milhares de equipes distribuídas mundialmente.
3. **Múltiplos Sistemas Analíticos Concorrentes:** Quando diversas áreas da empresa (Finanças, RH, Auditoria, Machine Learning para previsão de atrasos de projetos) precisarem consumir o mesmo fluxo histórico sem onerar o banco operacional.
