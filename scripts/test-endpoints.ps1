# ==============================================================================
# Script de Teste Funcional dos Endpoints via Docker Compose (PowerShell / Windows)
# Disciplina: Sistemas Distribuídos (DCC/UERN) - Módulo 3
# ==============================================================================

$T = "http://localhost:3000"
$U = "http://localhost:3001"
$N = "http://localhost:3002"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "      TESTE DE COMUNICAÇÃO ENTRE MICROSSERVIÇOS (WINDOWS 11)      " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

Write-Host "`n1. Verificando Saúde e Dependências..." -ForegroundColor Yellow
$h = Invoke-RestMethod -Uri "$T/health/dependencias"
$h | ConvertTo-Json

Write-Host "`n2. Criando Usuário..." -ForegroundColor Yellow
$rand = Get-Random
$userBody = @{ nome = "Maria Silva"; email = "maria$rand@exemplo.com" } | ConvertTo-Json
$u = Invoke-RestMethod -Method Post -Uri "$U/users" -ContentType "application/json; charset=utf-8" -Body $userBody
$u | ConvertTo-Json
$userId = $u.id
Write-Host "ID do usuário criado: $userId" -ForegroundColor Green

Write-Host "`n3. Criando Tarefa com Responsável..." -ForegroundColor Yellow
$taskBody = @{ titulo = "Implementar Containers no Windows"; responsavel_id = $userId } | ConvertTo-Json
$t = Invoke-RestMethod -Method Post -Uri "$T/tasks" -ContentType "application/json; charset=utf-8" -Body $taskBody
$t | ConvertTo-Json
$taskId = $t.id
Write-Host "ID da tarefa criada: $taskId" -ForegroundColor Green

Write-Host "`n4. Consultando Tarefa Criada..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$T/tasks/$taskId" | ConvertTo-Json

Start-Sleep -Seconds 1
Write-Host "`n5. Consultando Notificação de Atribuição..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$N/notifications?task_id=$taskId" | ConvertTo-Json

Write-Host "`n6. Concluindo a Tarefa..." -ForegroundColor Yellow
Invoke-RestMethod -Method Put -Uri "$T/tasks/$taskId" -ContentType "application/json; charset=utf-8" -Body '{"status":"concluida"}' | ConvertTo-Json

Start-Sleep -Seconds 1
Write-Host "`n7. Consultando Notificações após Conclusão..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$N/notifications?task_id=$taskId" | ConvertTo-Json

Write-Host "`n8. Consultando Tarefa com Dados Completos..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$T/tasks/$taskId/completo" | ConvertTo-Json

Write-Host "`n==================================================================" -ForegroundColor Green
Write-Host "          FLUXO EXECUTADO COM SUCESSO NO WINDOWS 11!             " -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
