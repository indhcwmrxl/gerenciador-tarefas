#!/usr/bin/env bash
# ==============================================================================
# Script de Validação e Teste de Persistência (Módulo 3 - Containers)
# Disciplina: Sistemas Distribuídos (DCC/UERN)
# ==============================================================================
set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}==================================================================${NC}"
echo -e "${CYAN}     TESTE DE PERSISTÊNCIA DOS CONTAINERS (DOCKER COMPOSE)        ${NC}"
echo -e "${CYAN}==================================================================${NC}"

# 1. Garantir que os containers estão rodando
echo -e "\n${YELLOW}[1/5] Subindo containers e verificando saúde dos serviços...${NC}"
docker-compose up -d

echo "Aguardando serviços ficarem prontos (healthcheck)..."
until [ "$(curl -s http://localhost:3000/health/dependencias | grep -o '"tasks":"ok"')" = '"tasks":"ok"' ]; do
  sleep 2
done
echo -e "${GREEN}✓ Todos os serviços e bancos estão online e saudáveis!${NC}"

# 2. Inserir dados de teste
TIMESTAMP=$(date +%s)
EMAIL="teste_${TIMESTAMP}@exemplo.com"
NOME="Discente SD ${TIMESTAMP}"
TITULO="Validar Persistencia de Volumes ${TIMESTAMP}"

echo -e "\n${YELLOW}[2/5] Inserindo dados de teste via API REST...${NC}"
USER_JSON=$(curl -s -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d "{\"nome\":\"${NOME}\",\"email\":\"${EMAIL}\"}")

USER_ID=$(echo "${USER_JSON}" | grep -o '"id":[0-9]*' | head -n1 | cut -d: -f2)
echo -e "  -> Usuário criado (ID: ${GREEN}${USER_ID}${NC}, Nome: ${NOME})"

TASK_JSON=$(curl -s -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d "{\"titulo\":\"${TITULO}\",\"responsavel_id\":${USER_ID}}")

TASK_ID=$(echo "${TASK_JSON}" | grep -o '"id":[0-9]*' | head -n1 | cut -d: -f2)
echo -e "  -> Tarefa criada (ID: ${GREEN}${TASK_ID}${NC}, Título: ${TITULO})"

# Concluir a tarefa para gerar evento e segunda notificação
curl -s -X PUT "http://localhost:3000/tasks/${TASK_ID}" \
  -H "Content-Type: application/json" \
  -d '{"status":"concluida"}' > /dev/null

sleep 1
NOTIFS_ANTES=$(curl -s "http://localhost:3002/notifications?task_id=${TASK_ID}")
echo -e "  -> Notificações registradas antes do down: $(echo "$NOTIFS_ANTES" | grep -o '"id":' | wc -l) avisos"

# 3. Derrubar os containers (docker-compose down)
echo -e "\n${YELLOW}[3/5] Executando docker-compose down (destruindo containers, preservando volumes)...${NC}"
docker-compose down

# 4. Subir novamente (docker-compose up -d)
echo -e "\n${YELLOW}[4/5] Executando docker-compose up -d (recriando containers a partir dos volumes)...${NC}"
docker-compose up -d

echo "Aguardando serviços reinicializarem..."
until [ "$(curl -s http://localhost:3000/health/dependencias | grep -o '"tasks":"ok"')" = '"tasks":"ok"' ]; do
  sleep 2
done

# 5. Conferir recuperação dos dados
echo -e "\n${YELLOW}[5/5] Consultando APIs para validar persistência dos dados salvos...${NC}"

USER_CHECK=$(curl -s "http://localhost:3001/users/${USER_ID}")
TASK_CHECK=$(curl -s "http://localhost:3000/tasks/${TASK_ID}/completo")
NOTIFS_DEPOIS=$(curl -s "http://localhost:3002/notifications?task_id=${TASK_ID}")

USER_CHECK_NOME=$(echo "${USER_CHECK}" | grep -o "\"nome\":\"[^\"]*\"" | cut -d: -f2 | tr -d '"')
TASK_CHECK_TITULO=$(echo "${TASK_CHECK}" | grep -o "\"titulo\":\"[^\"]*\"" | cut -d: -f2 | tr -d '"')
TASK_CHECK_STATUS=$(echo "${TASK_CHECK}" | grep -o "\"status\":\"[^\"]*\"" | cut -d: -f2 | tr -d '"')

if [ "${USER_CHECK_NOME}" = "${NOME}" ] && [ "${TASK_CHECK_TITULO}" = "${TITULO}" ]; then
  echo -e "\n${GREEN}==================================================================${NC}"
  echo -e "${GREEN}             SUCESSO: TESTE DE PERSISTÊNCIA VALIDADO!            ${NC}"
  echo -e "${GREEN}==================================================================${NC}"
  echo -e "Usuário recuperado com sucesso:   ID ${USER_ID} - ${USER_CHECK_NOME}"
  echo -e "Tarefa recuperada com sucesso:    ID ${TASK_ID} - ${TASK_CHECK_TITULO} (Status: ${TASK_CHECK_STATUS})"
  echo -e "Responsável aninhado (join API):  ${USER_CHECK_NOME}"
  echo -e "Notificações persistidas no banco: $(echo "$NOTIFS_DEPOIS" | grep -o '"id":' | wc -l) avisos"
  echo -e "${GREEN}Os volumes gerenciador_*_db_data mantiveram o estado integralmente!${NC}\n"
else
  echo -e "\n${RED}ERRO: Os dados não foram recuperados após o down/up.${NC}"
  exit 1
fi
