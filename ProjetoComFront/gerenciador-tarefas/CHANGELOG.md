# Changelog

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
