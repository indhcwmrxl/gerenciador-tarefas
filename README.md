# Gerenciador de Tarefas: Módulo 3 (Containers)

Projeto incremental da disciplina de **Sistemas Distribuídos** (DCC/UERN).  
**Docente(s):** Glaucia Melissa (Responsável) / Luiziane Paulino dos Santos (Estágio Docência)  
**Domínio:** Gerenciador de tarefas (evento natural: *"tarefa concluída"*, base para o Módulo 4).

Histórico de entregas preservado nas tags:
- `entrega-1-cloud`: Módulo 1 — API monolítica inicial publicada em nuvem com banco PostgreSQL (Neon/Railway).
- `entrega-2-microsservicos`: Módulo 2 — Decomposição em 3 microsserviços com comunicação síncrona HTTP/REST.
- `entrega-3-containers`: Módulo 3 — Conteinerização individual via Dockerfile e orquestração completa via Docker Compose com bancos locais e volumes persistentes.

---

## Vídeo de Demonstração (Módulo 3)

> [!IMPORTANT]
> **Link do Vídeo no YouTube (Não Listado):** `[INSERIR_LINK_AQUI]`  
> *(Demonstração dos 6 containers subindo via Docker Compose, execução do teste de comunicação e validação da persistência dos dados após `docker-compose down` / `docker-compose up`)*.

---

## O que foi implementado no Módulo 3

Neste módulo, todos os componentes do sistema foram empacotados em containers padronizados e orquestrados localmente de forma autônoma:

1. **Dockerfile individual para cada microsserviço:**
   - Construção com **multi-stage build** baseada na imagem enxuta `node:20-alpine` (reduzindo a imagem final para ~49 MB compactada).
   - Separação entre estágio de dependências (`dependencies`) e estágio de execução (`runner`).
   - Execução com usuário sem privilégios (`USER node`) para segurança dos containers.
   - Instrução `HEALTHCHECK` nativa validando `/health` via `wget`.
   - Tratamento de encerramento gracioso (*graceful shutdown*) para sinais `SIGTERM` e `SIGINT`.
   - Arquivo `.dockerignore` configurado para evitar envio de `node_modules` e arquivos locais.

2. **Orquestração Completa via `docker-compose.yml`:**
   - 3 microsserviços Node.js/Express (`tasks-service`, `users-service`, `notifications-service`).
   - 3 instâncias de banco PostgreSQL 16 Alpine independentes (`users-db`, `tasks-db`, `notifications-db`), preservando o isolamento de dados de microsserviços.
   - **Volumes persistentes nomeados:** `gerenciador_users_db_data`, `gerenciador_tasks_db_data` e `gerenciador_notifications_db_data`.
   - **Inicialização determinística:** healthchecks nos bancos (`pg_isready`) combinados com `depends_on: { condition: service_healthy }`, garantindo que os serviços só subam após o banco estar pronto.
   - Rede interna dedicada do Docker (`gerenciador-network`).

3. **Automação e Teste de Persistência:**
   - Script automatizado `scripts/test-persistence.sh` validando a integridade dos dados antes e depois de um ciclo `docker-compose down` -> `docker-compose up -d`.
   - Script funcional `scripts/test-endpoints.sh` testando o ciclo completo das APIs.

---

## Arquitetura de Containers (Docker Compose)

```
                       [ Host / Navegador / curl ]
                                    |
          +-------------------------+-------------------------+
          | :3000                   | :3001                   | :3002
          v                         v                         v
  +-----------------+       +-----------------+       +-----------------------+
  |  tasks-service  | ----> |  users-service  |       | notifications-service |
  | (Node.js Alpine)|  HTTP | (Node.js Alpine)|       |   (Node.js Alpine)    |
  +-----------------+  REST +-----------------+       +-----------------------+
          |                         |                             |
          | HTTP (async fire&forget)|                             |
          +-------------------------|-----------------------------+
          |                         |                             |
          v                         v                             v
  +-----------------+       +-----------------+       +-----------------------+
  |    tasks-db     |       |    users-db     |       |   notifications-db    |
  | (Postgres 16)   |       | (Postgres 16)   |       |     (Postgres 16)     |
  +-----------------+       +-----------------+       +-----------------------+
          |                         |                             |
          v                         v                             v
  [(vol) tasks_data]        [(vol) users_data]        [(vol) notifications_data]
```

### Mapeamento de Serviços e Portas

| Container | Imagem Base | Porta Interna | Porta no Host | Volume Persistente |
|---|---|---|---|---|
| `users-db` | `postgres:16-alpine` | 5432 | 5431 | `gerenciador_users_db_data` |
| `tasks-db` | `postgres:16-alpine` | 5432 | 5432 | `gerenciador_tasks_db_data` |
| `notifications-db` | `postgres:16-alpine` | 5432 | 5433 | `gerenciador_notifications_db_data` |
| `users-service` | Multi-stage `node:20-alpine` | 3001 | 3001 | — |
| `tasks-service` | Multi-stage `node:20-alpine` | 3000 | 3000 | — |
| `notifications-service` | Multi-stage `node:20-alpine` | 3002 | 3002 | — |

---

## Como Executar Localmente com Docker

### Pré-requisitos
- Docker instalado (v20+ ou Docker Desktop)
- Docker Compose v2+ (`docker compose` ou `docker-compose`)

### 1. Clonar o repositório
```bash
git clone https://github.com/indhcwmrxl/gerenciador-tarefas.git
cd gerenciador-tarefas
git checkout entrega-3-containers
```

### 2. Construir e iniciar todos os serviços
```bash
docker-compose up --build -d
```
*Em poucos segundos, os 3 bancos e os 3 microsserviços estarão rodando e saudáveis.*

### 3. Verificar o status dos containers
```bash
docker-compose ps
```
Você verá todos os 6 containers com status `Up (healthy)`.

### 4. Visualizar os logs em tempo real
```bash
docker-compose logs -f
# Ou de um serviço específico:
docker-compose logs -f tasks-service
```

### 5. Parar os containers (mantendo os dados persistidos)
```bash
docker-compose down
```
> [!NOTE]
> O comando `docker-compose down` remove apenas os containers e redes. Os dados continuam salvos nos volumes Docker.  
> *(Caso queira apagar também os dados, execute com `-v`: `docker-compose down -v`)*.

---

## Como Testar os Endpoints

Com os containers em execução, você pode executar o script automatizado:
```bash
./scripts/test-endpoints.sh
```

Ou executar manualmente via `curl`:
```bash
T=http://localhost:3000
U=http://localhost:3001
N=http://localhost:3002

# 1. Checar saúde e comunicação entre microsserviços
curl -s $T/health/dependencias; echo

# 2. Criar usuário no users-service
USERID=$(curl -s -X POST $U/users -H "Content-Type: application/json" -d "{\"nome\":\"Maria Silva\",\"email\":\"maria$RANDOM@exemplo.com\"}" | grep -o '"id":[0-9]*' | cut -d: -f2)
echo "ID do usuário: $USERID"

# 3. Criar tarefa associada ao usuário no tasks-service
TID=$(curl -s -X POST $T/tasks -H "Content-Type: application/json" -d "{\"titulo\":\"Implementar Containers\",\"responsavel_id\":$USERID}" | grep -o '"id":[0-9]*' | cut -d: -f2)
echo "ID da tarefa: $TID"

# 4. Consultar tarefa
curl -s $T/tasks/$TID; echo

# 5. Consultar notificação de atribuição gerada automaticamente
curl -s "$N/notifications?task_id=$TID"; echo

# 6. Concluir a tarefa (dispara notificação de conclusão)
curl -s -X PUT $T/tasks/$TID -H "Content-Type: application/json" -d '{"status":"concluida"}'; echo

# 7. Conferir ambas notificações
curl -s "$N/notifications?task_id=$TID"; echo

# 8. Consultar tarefa completa (com dados aninhados do responsável)
curl -s $T/tasks/$TID/completo; echo
```

---

## Teste de Persistência Documentado (`down` / `up`)

Um dos requisitos centrais do Módulo 3 é comprovar que os dados inseridos nas APIs permanecem íntegros mesmo após desligar e remover os containers via `docker-compose down`.

### Execução Automatizada
Basta rodar o script incluído no projeto:
```bash
./scripts/test-persistence.sh
```

### Evidência de Execução Real

```text
==================================================================
     TESTE DE PERSISTÊNCIA DOS CONTAINERS (DOCKER COMPOSE)        
==================================================================

[1/5] Subindo containers e verificando saúde dos serviços...
Aguardando serviços ficarem prontos (healthcheck)...
✓ Todos os serviços e bancos estão online e saudáveis!

[2/5] Inserindo dados de teste via API REST...
  -> Usuário criado (ID: 2, Nome: Discente SD 1794760134)
  -> Tarefa criada (ID: 2, Título: Validar Persistencia de Volumes 1794760134)
  -> Notificações registradas antes do down: 2 avisos

[3/5] Executando docker-compose down (destruindo containers, preservando volumes)...
[+] Running 7/7
 ✔ Container tasks-service          Removed
 ✔ Container notifications-service  Removed
 ✔ Container users-service          Removed
 ✔ Container tasks-db               Removed
 ✔ Container notifications-db       Removed
 ✔ Container users-db               Removed
 ✔ Network gerenciador-network      Removed

[4/5] Executando docker-compose up -d (recriando containers a partir dos volumes)...
[+] Running 7/7
 ✔ Network gerenciador-network      Created
 ✔ Container notifications-db       Healthy
 ✔ Container users-db               Healthy
 ✔ Container tasks-db               Healthy
 ✔ Container users-service          Healthy
 ✔ Container notifications-service  Healthy
 ✔ Container tasks-service          Started

[5/5] Consultando APIs para validar persistência dos dados salvos...

==================================================================
             SUCESSO: TESTE DE PERSISTÊNCIA VALIDADO!            
==================================================================
Usuário recuperado com sucesso:   ID 2 - Discente SD 1794760134
Tarefa recuperada com sucesso:    ID 2 - Validar Persistencia de Volumes 1794760134 (Status: concluida)
Responsável aninhado (join API):  Discente SD 1794760134
Notificações persistidas no banco: 2 avisos
Os volumes gerenciador_*_db_data mantiveram o estado integralmente!
```

---

## Comparação Técnica: Deploy Direto na Nuvem (Módulos 1 e 2) vs. Containers (Módulo 3)

| Critério de Análise | Deploy Direto na Nuvem (Módulos 1 e 2) | Execução via Containers (Módulo 3) |
|---|---|---|
| **Ambiente de Execução** | Depende do runtime do provedor (Railway instalando Node via buildpack; Neon gerenciando instâncias Postgres). | Imagens imutáveis e isoladas via Docker (`node:20-alpine` e `postgres:16-alpine`), idênticas em qualquer máquina ou SO. |
| **Reprodução Local** | Trabalhosa: exigia clonar o repo, instalar versão compatível de Node.js, rodar `npm install` em 3 pastas, abrir 3 terminais e configurar manualmente 3 bancos no Neon ou local. | Imediata: um único comando (`docker-compose up --build -d`) sobe toda a topologia distribuída (6 containers) sem exigir Node ou Postgres instalados no host. |
| **Paridade Dev/Prod** | Baixa: discrepâncias de versão de Node, bibliotecas do SO ou portas no host podiam gerar comportamentos inesperados ("na minha máquina funciona"). | Alta: todo o ambiente (SO Alpine, dependências, variáveis, rede e banco) é declarado em código (`Infrastructure as Code`). |
| **Segurança e Privilégios** | Processos Node rodando com usuário padrão do host ou da VM. | Isolamento de namespace por container e execução com usuário não-root (`USER node`), limitando a superfície de ataque. |
| **Persistência de Dados** | Delegada a serviço PaaS (Neon com storage em nuvem gerenciado). | Gerenciada explicitamente pelo grupo através de **Docker Volumes nomeados** independentes por microsserviço. |

### O que mudou?
- Antes, a aplicação dependia de serviços de terceiros (Neon e Railway) e do ambiente local do desenvolvedor estar previamente configurado.
- Agora, a aplicação e seus bancos foram completamente empacotados em artefatos versionáveis (imagens Docker e manifesto Compose), permitindo execução 100% *offline*, padronizada e portátil.

### O que ficou mais fácil?
- **Subida em lote com um único comando:** Inicialização de 6 serviços com resolução automática de portas e redes internas.
- **Ordem de inicialização determinística:** Com `healthcheck` e `depends_on`, os microsserviços não quebram tentando conectar em bancos que ainda não terminaram o boot.
- **Isolamento de dependências:** Nenhuma dependência precisa estar instalada no computador de quem for testar além do próprio Docker.

### O que ficou mais difícil / Desafios enfrentados?
- **Gerenciamento de volumes:** Exigiu atenção redobrada para não perder os dados em comandos destrutivos (diferença entre `down` e `down -v`).
- **Comunicação inter-containers:** Substituição de `localhost` por nomes de serviços do Compose (`users-service`, `tasks-db`, etc.) e controle de DNS interno na rede Docker.
- **Tratamento de sinais:** Necessidade de implementar captura de `SIGTERM`/`SIGINT` no Node.js para que o container não sofresse timeout de 10s ao encerrar.

---

## Infraestrutura em Nuvem (Módulo 2 - Preservada)

As URLs públicas implantadas no Railway e bancos no Neon continuam disponíveis e ativas para consulta:

| Serviço | URL Pública (Railway) |
|---|---|
| `tasks-service` | https://tasks-service-production-dd13.up.railway.app |
| `users-service` | https://users-service-production-9f90.up.railway.app |
| `notifications-service` | https://notifications-service-production-c3c4.up.railway.app |

Healthcheck na nuvem: [/health/dependencias](https://tasks-service-production-dd13.up.railway.app/health/dependencias)
