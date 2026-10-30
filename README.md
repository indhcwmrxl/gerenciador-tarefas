# Gerenciador de Tarefas: Módulo 2 (Microsserviços)

Projeto incremental da disciplina de **Sistemas Distribuídos** (DCC/UERN).
Domínio: **gerenciador de tarefas** (evento natural: "tarefa concluída", usado no Módulo 4).

Neste módulo, a API única do Módulo 1 foi dividida em **3 microsserviços independentes**, cada um com seu código e seu banco de dados, que se comunicam por **HTTP/REST**. O Módulo 1 continua preservado na tag `entrega-1-cloud`.

- Grupo: NOME 1, NOME 2, NOME 3 <!-- TROCAR -->

## URLs públicas (Railway)

| Serviço | URL |
|---|---|
| tasks-service | https://tasks-service-production-dd13.up.railway.app |
| users-service | https://users-service-production-9f90.up.railway.app |
| notifications-service | https://notifications-service-production-c3c4.up.railway.app |

Verificação rápida no navegador: abra [/health/dependencias](https://tasks-service-production-dd13.up.railway.app/health/dependencias). Deve mostrar `{"tasks":"ok","users":"ok","notifications":"ok"}`.

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

## Como testar a comunicação na nuvem

Qualquer pessoa pode repetir estes testes contra os serviços publicados. Basta um terminal com `curl` (Linux/macOS) ou o PowerShell (Windows). Se os serviços ficaram parados, a primeira chamada pode demorar alguns segundos, porque serviços e bancos "acordam".

### 1. Verificação rápida no navegador

- [tasks-service /health/dependencias](https://tasks-service-production-dd13.up.railway.app/health/dependencias): mostra se o tasks-service enxerga os outros dois (deve ser `ok` nos três).
- [users-service /health](https://users-service-production-9f90.up.railway.app/health) e [notifications-service /health](https://notifications-service-production-c3c4.up.railway.app/health): devem responder `{"status":"ok"}`.

### 2. Fluxo completo: Linux/macOS (curl)

```bash
T=https://tasks-service-production-dd13.up.railway.app
U=https://users-service-production-9f90.up.railway.app
N=https://notifications-service-production-c3c4.up.railway.app

# 1) os 3 serviços se enxergam?
curl -s $T/health/dependencias; echo

# 2) cria um usuário no users-service (guarda o id em USERID)
USERID=$(curl -s -X POST $U/users -H "Content-Type: application/json" -d "{\"nome\":\"Maria Silva\",\"email\":\"maria$RANDOM@exemplo.com\"}" | sed -n 's/.*"id":\([0-9]*\).*/\1/p'); echo "id do usuário: $USERID"

# 3) cria uma tarefa para esse usuário (o tasks-service consulta o users-service por HTTP)
TID=$(curl -s -X POST $T/tasks -H "Content-Type: application/json" -d "{\"titulo\":\"Fazer relatorio\",\"responsavel_id\":$USERID}" | sed -n 's/.*"id":\([0-9]*\).*/\1/p'); echo "id da tarefa: $TID"
curl -s $T/tasks/$TID; echo

# 4) o aviso chegou ao notifications-service?
sleep 3; curl -s "$N/notifications?task_id=$TID"; echo

# 5) conclui a tarefa e confere o segundo aviso
curl -s -X PUT $T/tasks/$TID -H "Content-Type: application/json" -d '{"status":"concluida"}'; echo
sleep 3; curl -s "$N/notifications?task_id=$TID"; echo

# 6) tarefa com os dados do usuário (consulta HTTP ao users-service)
curl -s $T/tasks/$TID/completo; echo
```

### 3. Fluxo completo: Windows (PowerShell)

```powershell
$T = "https://tasks-service-production-dd13.up.railway.app"
$U = "https://users-service-production-9f90.up.railway.app"
$N = "https://notifications-service-production-c3c4.up.railway.app"

# 1) os 3 serviços se enxergam?
Invoke-RestMethod -Uri "$T/health/dependencias"

# 2) cria um usuário no users-service
$u = Invoke-RestMethod -Method Post -Uri "$U/users" -ContentType "application/json; charset=utf-8" -Body (@{nome="Maria Silva"; email="maria$(Get-Random)@exemplo.com"} | ConvertTo-Json)
$u

# 3) cria uma tarefa para esse usuário (o tasks-service consulta o users-service por HTTP)
$t = Invoke-RestMethod -Method Post -Uri "$T/tasks" -ContentType "application/json; charset=utf-8" -Body (@{titulo="Fazer relatorio"; responsavel_id=$u.id} | ConvertTo-Json)
$t

# 4) o aviso chegou ao notifications-service?
Start-Sleep -Seconds 3
Invoke-RestMethod -Uri "$N/notifications?task_id=$($t.id)"

# 5) conclui a tarefa e confere o segundo aviso
Invoke-RestMethod -Method Put -Uri "$T/tasks/$($t.id)" -ContentType "application/json; charset=utf-8" -Body '{"status":"concluida"}'
Start-Sleep -Seconds 3
Invoke-RestMethod -Uri "$N/notifications?task_id=$($t.id)"

# 6) tarefa com os dados do usuário (consulta HTTP ao users-service)
Invoke-RestMethod -Uri "$T/tasks/$($t.id)/completo"
```

### Resultado esperado

| Etapa | O que deve aparecer |
|---|---|
| 1 | `tasks`, `users` e `notifications` com `ok` |
| 2 | O usuário criado, com `id` |
| 3 | A tarefa com `"responsavel":"Maria Silva"` (nome que veio do users-service) |
| 4 | Um aviso com `"tipo":"tarefa_atribuida"` |
| 5 | A tarefa com `"status":"concluida"` e, na lista, também `"tipo":"tarefa_concluida"` |
| 6 | A tarefa com o campo `responsavel_usuario` (nome e e-mail) |

### 4. Mensagens de erro

**Linux/macOS (curl)** (o código HTTP aparece no fim de cada linha):

```bash
curl -s -w '  (HTTP %{http_code})\n' -X POST $T/tasks -H "Content-Type: application/json" -d '{"descricao":"sem titulo"}'
curl -s -w '  (HTTP %{http_code})\n' -X POST $T/tasks -H "Content-Type: application/json" -d '{"titulo":"x","status":"feito"}'
curl -s -w '  (HTTP %{http_code})\n' -X POST $T/tasks -H "Content-Type: application/json" -d '{"titulo":"x","responsavel_id":999999}'
curl -s -w '  (HTTP %{http_code})\n' $T/tasks/999999
curl -s -o /dev/null -X POST $U/users -H "Content-Type: application/json" -d '{"nome":"A","email":"repetido@exemplo.com"}'
curl -s -w '  (HTTP %{http_code})\n' -X POST $U/users -H "Content-Type: application/json" -d '{"nome":"B","email":"repetido@exemplo.com"}'
```

**Windows (PowerShell):**

```powershell
function Erro($metodo, $url, $corpo) { try { Invoke-RestMethod -Method $metodo -Uri $url -ContentType "application/json; charset=utf-8" -Body $corpo } catch { "HTTP " + [int]$_.Exception.Response.StatusCode + "  " + $_.ErrorDetails.Message } }

Erro Post "$T/tasks" '{"descricao":"sem titulo"}'
Erro Post "$T/tasks" '{"titulo":"x","status":"feito"}'
Erro Post "$T/tasks" '{"titulo":"x","responsavel_id":999999}'
try { Invoke-RestMethod -Uri "$T/tasks/999999" } catch { "HTTP " + [int]$_.Exception.Response.StatusCode + "  " + $_.ErrorDetails.Message }
Erro Post "$U/users" '{"nome":"A","email":"repetido@exemplo.com"}' | Out-Null
Erro Post "$U/users" '{"nome":"B","email":"repetido@exemplo.com"}'
```

| Teste | Mensagem esperada | HTTP |
|---|---|---|
| Tarefa sem título | `O campo "titulo" é obrigatório.` | 400 |
| Status inválido | `Status inválido. Use: pendente, em_andamento, concluida` | 400 |
| Responsável que não existe | `Responsável 999999 não encontrado no serviço de usuários.` | 400 |
| Tarefa que não existe | `Tarefa não encontrada.` | 404 |
| E-mail repetido | `Já existe um usuário com esse email.` | 409 |

### 5. Teste de falha: users-service fora do ar

Este teste mostra o tratamento de erro entre serviços. Ele exige desligar o users-service, o que só é possível para quem tem acesso ao painel do Railway do grupo (quem não tiver pode fazê-lo localmente, seguindo a seção "Como rodar localmente": pare o users-service com Ctrl+C e use as URLs `http://localhost:...`).

1. No Railway, abra o **users-service**, aba **Deployments**, nos três pontinhos do deploy ativo clique em **Remove** (isso só desliga; o serviço e as variáveis continuam).
2. Espere cerca de 30 segundos e rode:

```bash
curl -s -w '  (HTTP %{http_code})\n' -X POST $T/tasks -H "Content-Type: application/json" -d '{"titulo":"Teste de falha","responsavel_id":1}'
curl -s $T/health/dependencias; echo
curl -s -w '  (HTTP %{http_code})\n' -X POST $T/tasks -H "Content-Type: application/json" -d '{"titulo":"Sem responsavel"}'
```

```powershell
try { Invoke-RestMethod -Method Post -Uri "$T/tasks" -ContentType "application/json; charset=utf-8" -Body '{"titulo":"Teste de falha","responsavel_id":1}' } catch { "HTTP " + [int]$_.Exception.Response.StatusCode + "  " + $_.ErrorDetails.Message }
Invoke-RestMethod -Uri "$T/health/dependencias"
Invoke-RestMethod -Method Post -Uri "$T/tasks" -ContentType "application/json; charset=utf-8" -Body '{"titulo":"Sem responsavel"}'
```

| Comando | Resultado esperado |
|---|---|
| Criar tarefa **com** `responsavel_id` | `{"erro":"Serviço de usuários indisponível. Tente novamente em instantes."}` com **HTTP 503** (pode levar até 5 s, o timeout) |
| `/health/dependencias` | `{"tasks":"ok","users":"indisponivel","notifications":"ok"}` |
| Criar tarefa **sem** `responsavel_id` | A tarefa é criada normalmente (HTTP 201), com `"responsavel":null` |

3. Para religar: no users-service, **Deployments**, nos três pontinhos do deploy removido, **Redeploy**.

Se o notifications-service estiver fora do ar, a tarefa também é salva normalmente; só o aviso não é registrado.

## Tratamento de falhas

Toda chamada entre serviços tem timeout (`REQUEST_TIMEOUT_MS`, padrão 5000 ms).

| Situação | Resposta |
|---|---|
| users-service fora do ar ou lento (tarefa com `responsavel_id`) | 503 "Serviço de usuários indisponível" |
| `responsavel_id` inexistente | 400 |
| notifications-service fora do ar | A tarefa é salva normalmente; o aviso não é registrado |

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

(Um terminal para cada serviço; edite o `.env` de cada um antes de iniciar.) As tabelas são criadas automaticamente. Os testes acima funcionam do mesmo jeito localmente, trocando as URLs por `http://localhost:3000` (tasks), `http://localhost:3001` (users) e `http://localhost:3002` (notifications).

## Justificativa técnica

- **3 serviços com responsabilidades distintas:** cada um cuida de um assunto e pode ser alterado e publicado sem mexer nos outros.
- **Um banco por serviço:** isolamento; um serviço só acessa os dados de outro pela API dele.
- **HTTP síncrono para o users-service:** a tarefa só deve ser criada se o responsável existir.
- **Aviso sem bloquear:** avisos são secundários; se falharem, a tarefa não pode ser perdida. No Módulo 4 isso evolui para mensageria.
- **Timeout em toda chamada:** evita que um serviço lento trave quem o consome.
- **Monorepo com uma pasta por serviço:** simples de versionar e de publicar no Railway com Root Directory.
