# Gerenciador de Tarefas

## Link do Vídeo
[Assistir ao vídeo no YouTube](https://www.youtube.com/watch?v=qKR3ZISvTng)

## Tecnologias
- Node.js + Express
- PostgreSQL gerenciado (Neon, free tier)
- Hospedagem: Render (free tier, deploy a partir do GitHub)

## Modelo de dados — `tasks`
| Campo | Tipo | Descrição |
|---|---|---|
| id | serial | Identificador |
| titulo | varchar(150) | Obrigatório |
| descricao | text | Opcional |
| status | varchar | `pendente`, `em_andamento` ou `concluida` |
| responsavel | varchar | Nome do responsável |
| criada_em / atualizada_em | timestamp | Datas automáticas |

## Endpoints
| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Verifica se a API está no ar |
| POST | `/tasks` | Cria tarefa |
| GET | `/tasks` | Lista tarefas (filtro opcional `?status=pendente`) |
| GET | `/tasks/:id` | Busca uma tarefa |
| PUT | `/tasks/:id` | Atualiza tarefa |
| DELETE | `/tasks/:id` | Remove tarefa |

## Variáveis de ambiente
| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão do PostgreSQL |
| `PORT` | Porta (o Render define automaticamente) |

As variáveis são configuradas **pelo painel do Render** — não há segredos no código.

## Como executar localmente
```bash
git clone https://github.com/SEU-USUARIO/gerenciador-tarefas.git
cd gerenciador-tarefas
npm install
cp .env.example .env     # edite com sua DATABASE_URL
npm start
```
A tabela `tasks` é criada automaticamente na primeira execução.

## Testes
Script com curl: `./test-api.sh https://SEU-APP.onrender.com`

Exemplos:
```bash
curl -X POST https://SEU-APP.onrender.com/tasks \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Estudar","responsavel":"Maria"}'

curl https://SEU-APP.onrender.com/tasks
curl -X PUT https://SEU-APP.onrender.com/tasks/1 -H "Content-Type: application/json" -d '{"status":"concluida"}'
curl -X DELETE https://SEU-APP.onrender.com/tasks/1
```
Prints dos testes: pasta `docs/prints/` <!-- ADICIONAR -->

## Justificativa técnica
- **Express**: simples e leve para uma API REST.
- **PostgreSQL (Neon)**: banco relacional gerenciado, com free tier e acesso remoto.
- **Render**: deploy automático a cada push no GitHub, variáveis de ambiente no painel e URL pública com HTTPS.

> Observação: no plano gratuito do Render o serviço "dorme" após inatividade; a primeira requisição pode levar ~50s.
