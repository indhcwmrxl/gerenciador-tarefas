# Gerenciador de Tarefas: Módulo 2 (Microsserviços)

Projeto incremental da disciplina de **Sistemas Distribuídos** (DCC/UERN).
Domínio: **gerenciador de tarefas** (evento natural: "tarefa concluída", usado no Módulo 4).

Neste módulo, a API única do Módulo 1 foi dividida em **3 microsserviços independentes**, cada um com seu código e seu banco de dados, que se comunicam por **HTTP/REST**. O Módulo 1 continua preservado na tag `entrega-1-cloud`.

- Grupo: NOME 1, NOME 2, NOME 3 <!-- TROCAR -->

## URLs públicas (Railway)

| Serviço | URL |
|---|---|
| tasks-service | https://gerenciador-tarefas-production-78f3.up.railway.app |
| users-service | https://COLE-AQUI-A-URL-DO-USERS-SERVICE.up.railway.app <!-- TROCAR --> |
| notifications-service | https://COLE-AQUI-A-URL-DO-NOTIFICATIONS-SERVICE.up.railway.app <!-- TROCAR --> |

## Arquitetura

![Diagrama de arquitetura](docs/arquitetura.svg)

| Serviço | Responsabilidade | Banco (Neon) | Porta local |
|---|---|---|---|
| tasks-service | CRUD de tarefas; valida o responsável e dispara avisos | tasks-db | 3000 |
| users-service | CRUD de usuários (responsáveis) | users-db | 3001 |
| notifications-service | Registra avisos (tarefa atribuída e concluída) | notifications-db | 3002 |

Chamadas entre serviços:
- tasks-service chama users-service: `GET /users/:id` (síncrono; confirma que o responsável existe).
- tasks-service chama notifications-service: `POST /notifications` (não bloqueia a resposta).

## Tratamento de falhas

Toda chamada entre serviços tem timeout (`REQUEST_TIMEOUT_MS`, padrão 5000 ms).

| Situação | Resposta |
|---|---|
| users-service fora do ar ou lento (tarefa com `responsavel_id`) | 503 "Serviço de usuários indisponível" |
| `responsavel_id` inexistente | 400 |
| notifications-service fora do ar | A tarefa é salva normalmente; o aviso não é registrado |

`GET /health/dependencias` (no tasks-service) mostra o estado dos outros serviços.

## Endpoints

- **tasks-service:** `GET /health`, `GET /health/dependencias`, `POST /tasks`, `GET /tasks`, `GET /tasks/:id`, `GET /tasks/:id/completo`, `PUT /tasks/:id`, `DELETE /tasks/:id`
- **users-service:** `GET /health`, `POST /users`, `GET /users`, `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id`
- **notifications-service:** `GET /health`, `POST /notifications`, `GET /notifications` (filtros `?task_id=` e `?tipo=`), `GET /notifications/:id`

## Variáveis de ambiente

| Serviço | Variável | Descrição |
|---|---|---|
| todos | `DATABASE_URL` | Connection string do banco daquele serviço (Neon) |
| todos | `PORT` | Porta (o Railway define sozinho) |
| tasks-service | `USERS_SERVICE_URL` | URL base do users-service |
| tasks-service | `NOTIFICATIONS_SERVICE_URL` | URL base do notifications-service |
| tasks-service | `REQUEST_TIMEOUT_MS` | Timeout das chamadas (padrão 5000) |

Localmente, copie o `.env.example` de cada pasta para `.env`. Na nuvem, as variáveis ficam no painel do Railway. Nenhum segredo vai para o código.

## Como rodar localmente

Requisitos: Node.js 18+ e três bancos PostgreSQL (por exemplo, três projetos no Neon).

```
cd users-service && npm install && cp .env.example .env && npm start
cd notifications-service && npm install && cp .env.example .env && npm start
cd tasks-service && npm install && cp .env.example .env && npm start
```

(Um terminal para cada serviço; edite o `.env` de cada um antes de iniciar.) As tabelas são criadas automaticamente.

## Como testar a comunicação entre os serviços

```
T=http://localhost:3000; U=http://localhost:3001; N=http://localhost:3002
curl -s $T/health/dependencias
curl -s -X POST $U/users -H "Content-Type: application/json" -d '{"nome":"Maria Silva","email":"maria@exemplo.com"}'
curl -s -X POST $T/tasks -H "Content-Type: application/json" -d '{"titulo":"Fazer relatorio","responsavel_id":1}'
curl -s "$N/notifications"
```

Teste de falha: pare o users-service e repita a criação da tarefa com `responsavel_id`; o esperado é HTTP 503 com mensagem amigável. Criar tarefa sem `responsavel_id` continua funcionando.

## Justificativa técnica

- **3 serviços com responsabilidades distintas:** cada um cuida de um assunto e pode ser alterado e publicado sem mexer nos outros.
- **Um banco por serviço:** isolamento; um serviço só acessa os dados de outro pela API dele.
- **HTTP síncrono para o users-service:** a tarefa só deve ser criada se o responsável existir.
- **Aviso sem bloquear:** avisos são secundários; se falharem, a tarefa não pode ser perdida. No Módulo 4 isso evolui para mensageria.
- **Timeout em toda chamada:** evita que um serviço lento trave quem o consome.
- **Monorepo com uma pasta por serviço:** simples de versionar e de publicar no Railway com Root Directory.

## Testes na nuvem

Prints dos testes feitos nos serviços publicados no Railway (arquivos em `docs/prints/`).

**1. Os 3 serviços Online no Railway**

![Os 3 serviços no Railway](docs/prints/railway-3-servicos.png)

**2. Teste de comunicação funcionando**

![Teste na nuvem com sucesso](docs/prints/teste-nuvem-ok.png)

**3. Falha tratada: users-service fora do ar (HTTP 503)**

![Falha tratada (503)](docs/prints/teste-falha-503.png)
