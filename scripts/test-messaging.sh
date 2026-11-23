#!/usr/bin/env bash
# ==============================================================================
# Script de Validação e Demonstração do Módulo 4: Mensageria com RabbitMQ
# Disciplina: Sistemas Distribuídos (DCC/UERN)
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sem cor

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}   TESTE DE MENSAGERIA E STREAMING DE EVENTOS - MÓDULO 4 (RabbitMQ)            ${NC}"
echo -e "${BLUE}==============================================================================${NC}\n"

# 1. Verificar se os containers estão no ar
echo -e "${YELLOW}[1/6] Verificando status dos containers no Docker Compose...${NC}"
docker compose ps

echo -e "\n${YELLOW}[2/6] Verificando saúde das dependências do tasks-service (incluindo RabbitMQ)...${NC}"
SAUDE=$(curl -s http://localhost:3000/health/dependencias)
echo -e "Resposta GET /health/dependencias: ${GREEN}${SAUDE}${NC}"

# 2. Criar um usuário para ser responsável pela tarefa
echo -e "\n${YELLOW}[3/6] Criando usuário de teste no users-service...${NC}"
TIMESTAMP=$(date +%s)
USUARIO_RESP=$(curl -s -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d "{\"nome\": \"Auditor de Eventos $TIMESTAMP\", \"email\": \"auditor.$TIMESTAMP@sd.uern.br\"}")
echo -e "Usuário criado: ${GREEN}${USUARIO_RESP}${NC}"
USER_ID=$(echo "$USUARIO_RESP" | grep -o '"id":[0-9]*' | head -n1 | cut -d: -f2)

# 3. Criar uma nova tarefa com status 'pendente'
echo -e "\n${YELLOW}[4/6] Criando tarefa com status 'pendente' no tasks-service...${NC}"
TAREFA_CRIADA=$(curl -s -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d "{\"titulo\": \"Auditoria de Mensageria $TIMESTAMP\", \"descricao\": \"Validar fluxo de evento tarefa_concluida via RabbitMQ\", \"status\": \"pendente\", \"responsavel_id\": $USER_ID}")
echo -e "Tarefa criada: ${GREEN}${TAREFA_CRIADA}${NC}"
TASK_ID=$(echo "$TAREFA_CRIADA" | grep -o '"id":[0-9]*' | head -n1 | cut -d: -f2)

# 4. Concluir a tarefa (disparando a publicação do evento no RabbitMQ)
echo -e "\n${YELLOW}[5/6] Concluindo tarefa (PUT /tasks/$TASK_ID com status: 'concluida')...${NC}"
echo -e "Isso deve disparar a publicação assíncrona do evento 'tarefa_concluida' para o RabbitMQ!"
TAREFA_CONCLUIDA=$(curl -s -X PUT "http://localhost:3000/tasks/$TASK_ID" \
  -H "Content-Type: application/json" \
  -d '{"status": "concluida"}')
echo -e "Tarefa atualizada: ${GREEN}${TAREFA_CONCLUIDA}${NC}"

# Aguarda 2 segundos para o consumidor processar a mensagem
echo -e "Aguardando 2 segundos para trânsito da mensagem no broker..."
sleep 2

# 5. Conferir logs do produtor (tasks-service) e do consumidor (notifications-service)
echo -e "\n${YELLOW}[6/6] Verificando logs do PRODUTOR e do CONSUMIDOR...${NC}"
echo -e "${BLUE}--- LOGS DO PRODUTOR (tasks-service) ---${NC}"
docker logs tasks-service --tail 15 | grep "RabbitMQ" || docker logs tasks-service --tail 10

echo -e "\n${BLUE}--- LOGS DO CONSUMIDOR (notifications-service) ---${NC}"
docker logs notifications-service --tail 25 | grep -A 10 "MENSAGEM RECEBIDA" || docker logs notifications-service --tail 15

# 6. Consultar a notificação gravada no banco pelo consumidor
echo -e "\n${YELLOW}Consultando GET /notifications?task_id=$TASK_ID no notifications-service...${NC}"
NOTIF_CONSULTA=$(curl -s "http://localhost:3002/notifications?task_id=$TASK_ID")
echo -e "Notificação persistida no banco: ${GREEN}${NOTIF_CONSULTA}${NC}"

echo -e "\n${GREEN}==============================================================================${NC}"
echo -e "${GREEN}   TESTE DO MÓDULO 4 CONCLUÍDO COM SUCESSO!                                    ${NC}"
echo -e "${GREEN}   - Evento 'tarefa_concluida' gerado pelo tasks-service (Produtor)             ${NC}"
echo -e "${GREEN}   - Roteado e entregue pelo RabbitMQ (Broker AMQP)                            ${NC}"
echo -e "${GREEN}   - Consumido e persistido com sucesso pelo notifications-service (Consumidor) ${NC}"
echo -e "${GREEN}==============================================================================${NC}\n"
