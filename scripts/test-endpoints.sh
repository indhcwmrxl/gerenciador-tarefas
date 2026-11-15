#!/usr/bin/env bash
# ==============================================================================
# Script de Teste Funcional dos Endpoints via Docker Compose
# Disciplina: Sistemas Distribuídos (DCC/UERN) - Módulo 3
# ==============================================================================
set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

T="http://localhost:3000"
U="http://localhost:3001"
N="http://localhost:3002"

echo -e "${CYAN}==================================================================${NC}"
echo -e "${CYAN}      TESTE DE COMUNICAÇÃO ENTRE MICROSSERVIÇOS (CONTAINERS)      ${NC}"
echo -e "${CYAN}==================================================================${NC}"

echo -e "\n${YELLOW}1. Verificação de Saúde e Dependências (GET /health/dependencias):${NC}"
curl -s "$T/health/dependencias"
echo

echo -e "\n${YELLOW}2. Criando Usuário (POST /users):${NC}"
USER_JSON=$(curl -s -X POST "$U/users" \
  -H "Content-Type: application/json" \
  -d "{\"nome\":\"Maria Silva\",\"email\":\"maria$RANDOM@exemplo.com\"}")
echo "$USER_JSON"
USERID=$(echo "$USER_JSON" | grep -o '"id":[0-9]*' | head -n1 | cut -d: -f2)
echo -e "ID do usuário criado: ${GREEN}$USERID${NC}"

echo -e "\n${YELLOW}3. Criando Tarefa com Responsável (POST /tasks):${NC}"
TASK_JSON=$(curl -s -X POST "$T/tasks" \
  -H "Content-Type: application/json" \
  -d "{\"titulo\":\"Elaborar Relatorio de Containers\",\"responsavel_id\":$USERID}")
echo "$TASK_JSON"
TID=$(echo "$TASK_JSON" | grep -o '"id":[0-9]*' | head -n1 | cut -d: -f2)
echo -e "ID da tarefa criada: ${GREEN}$TID${NC}"

echo -e "\n${YELLOW}4. Consultando Tarefa Criada (GET /tasks/:id):${NC}"
curl -s "$T/tasks/$TID"
echo

echo -e "\n${YELLOW}5. Consultando Notificação de Atribuição (GET /notifications?task_id=:id):${NC}"
sleep 1
curl -s "$N/notifications?task_id=$TID"
echo

echo -e "\n${YELLOW}6. Atualizando Tarefa para 'concluida' (PUT /tasks/:id):${NC}"
curl -s -X PUT "$T/tasks/$TID" \
  -H "Content-Type: application/json" \
  -d '{"status":"concluida"}'
echo

echo -e "\n${YELLOW}7. Consultando Notificação de Conclusão (GET /notifications?task_id=:id):${NC}"
sleep 1
curl -s "$N/notifications?task_id=$TID"
echo

echo -e "\n${YELLOW}8. Consultando Tarefa com Dados Completos do Responsável (GET /tasks/:id/completo):${NC}"
curl -s "$T/tasks/$TID/completo"
echo

echo -e "\n${GREEN}==================================================================${NC}"
echo -e "${GREEN}          FLUXO COMPLETO EXECUTADO COM SUCESSO!                   ${NC}"
echo -e "${GREEN}==================================================================${NC}\n"
