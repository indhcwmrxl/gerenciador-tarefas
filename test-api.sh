#!/usr/bin/env bash
# Uso: ./test-api.sh https://sua-api.onrender.com
BASE=${1:-http://localhost:3000}
echo "== Health =="; curl -s $BASE/health; echo
echo "== Criar =="; curl -s -X POST $BASE/tasks -H "Content-Type: application/json" \
  -d '{"titulo":"Estudar Sistemas Distribuídos","descricao":"Módulo 1","responsavel":"Maria"}'; echo
echo "== Listar =="; curl -s $BASE/tasks; echo
echo "== Atualizar (id 1) =="; curl -s -X PUT $BASE/tasks/1 -H "Content-Type: application/json" \
  -d '{"status":"concluida"}'; echo
echo "== Buscar (id 1) =="; curl -s $BASE/tasks/1; echo
echo "== Deletar (id 1) =="; curl -s -o /dev/null -w "HTTP %{http_code}\n" -X DELETE $BASE/tasks/1
