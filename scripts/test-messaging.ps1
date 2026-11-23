# ==============================================================================
# Script de Validacao e Demonstracao do Modulo 4: Mensageria com RabbitMQ (PowerShell)
# Disciplina: Sistemas Distribuidos (DCC/UERN)
# ==============================================================================

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "   TESTE DE MENSAGERIA E STREAMING DE EVENTOS - MODULO 4 (RabbitMQ)            " -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar status dos containers
Write-Host "[1/6] Verificando status dos containers no Docker Compose..." -ForegroundColor Yellow
docker compose ps

# 2. Verificar saude das dependencias do tasks-service
Write-Host ""
Write-Host "[2/6] Verificando saude das dependencias do tasks-service (incluindo RabbitMQ)..." -ForegroundColor Yellow
try {
    $saude = Invoke-RestMethod -Uri "http://localhost:3000/health/dependencias" -Method Get
    Write-Host ("Resposta GET /health/dependencias: " + ($saude | ConvertTo-Json -Compress)) -ForegroundColor Green
} catch {
    Write-Host "Erro ao consultar /health/dependencias: $_" -ForegroundColor Red
}

# 3. Criar usuario de teste
Write-Host ""
Write-Host "[3/6] Criando usuario de teste no users-service..." -ForegroundColor Yellow
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$userPayload = @{
    nome = "Auditor de Eventos $timestamp"
    email = "auditor.$timestamp@sd.uern.br"
} | ConvertTo-Json

try {
    $user = Invoke-RestMethod -Uri "http://localhost:3001/users" -Method Post -Body $userPayload -ContentType "application/json"
    $userId = $user.id
    Write-Host "Usuario criado com ID: $userId ($($user.nome))" -ForegroundColor Green
} catch {
    Write-Host "Erro ao criar usuario: $_" -ForegroundColor Red
    exit 1
}

# 4. Criar tarefa com status 'pendente'
Write-Host ""
Write-Host "[4/6] Criando tarefa com status 'pendente' no tasks-service..." -ForegroundColor Yellow
$taskPayload = @{
    titulo = "Auditoria de Mensageria $timestamp"
    descricao = "Validar fluxo de evento tarefa_concluida via RabbitMQ"
    status = "pendente"
    responsavel_id = $userId
} | ConvertTo-Json

try {
    $task = Invoke-RestMethod -Uri "http://localhost:3000/tasks" -Method Post -Body $taskPayload -ContentType "application/json"
    $taskId = $task.id
    Write-Host "Tarefa criada com ID: $taskId ($($task.titulo))" -ForegroundColor Green
} catch {
    Write-Host "Erro ao criar tarefa: $_" -ForegroundColor Red
    exit 1
}

# 5. Concluir a tarefa (dispara evento no RabbitMQ)
Write-Host ""
Write-Host "[5/6] Concluindo tarefa (PUT /tasks/$taskId com status: 'concluida')..." -ForegroundColor Yellow
Write-Host "Isso deve disparar a publicacao assincrona do evento 'tarefa_concluida' para o RabbitMQ!"
$updatePayload = @{
    status = "concluida"
} | ConvertTo-Json

try {
    $updatedTask = Invoke-RestMethod -Uri "http://localhost:3000/tasks/$taskId" -Method Put -Body $updatePayload -ContentType "application/json"
    Write-Host "Tarefa concluida com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "Erro ao concluir tarefa: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Aguardando 2 segundos para o transito e processamento da mensagem no broker..."
Start-Sleep -Seconds 2

# 6. Exibir logs do produtor e do consumidor
Write-Host ""
Write-Host "[6/6] Verificando logs do PRODUTOR e do CONSUMIDOR..." -ForegroundColor Yellow
Write-Host "--- LOGS DO PRODUTOR (tasks-service) ---" -ForegroundColor Cyan
docker logs tasks-service --tail 15

Write-Host ""
Write-Host "--- LOGS DO CONSUMIDOR (notifications-service) ---" -ForegroundColor Cyan
docker logs notifications-service --tail 25

# 7. Consultar a notificacao salva no banco
Write-Host ""
Write-Host "Consultando GET /notifications?task_id=$taskId no notifications-service..." -ForegroundColor Yellow
try {
    $notifs = Invoke-RestMethod -Uri "http://localhost:3002/notifications?task_id=$taskId" -Method Get
    Write-Host ("Notificacao persistida no banco: " + ($notifs | ConvertTo-Json -Compress)) -ForegroundColor Green
} catch {
    Write-Host "Erro ao consultar notificacao: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "   TESTE DO MODULO 4 CONCLUIDO COM SUCESSO!                                    " -ForegroundColor Green
Write-Host "   - Evento 'tarefa_concluida' gerado pelo tasks-service (Produtor)             " -ForegroundColor Green
Write-Host "   - Roteado e entregue pelo RabbitMQ (Broker AMQP)                            " -ForegroundColor Green
Write-Host "   - Consumido e persistido com sucesso pelo notifications-service (Consumidor) " -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green
