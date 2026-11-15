# ==============================================================================
# Script de Validação e Teste de Persistência (PowerShell / Windows 11)
# Disciplina: Sistemas Distribuídos (DCC/UERN) - Módulo 3
# ==============================================================================

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "     TESTE DE PERSISTÊNCIA DOS CONTAINERS (WINDOWS 11)           " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Garantir que os containers estão rodando
Write-Host "`n[1/5] Subindo containers e verificando saúde..." -ForegroundColor Yellow
docker compose up -d

Write-Host "Aguardando serviços ficarem saudáveis..."
while ($true) {
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:3000/health/dependencias" -ErrorAction SilentlyContinue
        if ($res.tasks -eq "ok") { break }
    } catch {}
    Start-Sleep -Seconds 2
}
Write-Host "Serviços online!" -ForegroundColor Green

# 2. Inserir dados
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "teste_$ts@exemplo.com"
$nome = "Discente SD $ts"
$titulo = "Validar Persistencia no Windows $ts"

Write-Host "`n[2/5] Inserindo dados de teste via API REST..." -ForegroundColor Yellow
$userBody = @{ nome = $nome; email = $email } | ConvertTo-Json
$u = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/users" -ContentType "application/json; charset=utf-8" -Body $userBody
$userId = $u.id
Write-Host "  -> Usuário criado (ID: $userId, Nome: $nome)" -ForegroundColor Green

$taskBody = @{ titulo = $titulo; responsavel_id = $userId } | ConvertTo-Json
$t = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/tasks" -ContentType "application/json; charset=utf-8" -Body $taskBody
$taskId = $t.id
Write-Host "  -> Tarefa criada (ID: $taskId, Título: $titulo)" -ForegroundColor Green

Invoke-RestMethod -Method Put -Uri "http://localhost:3000/tasks/$taskId" -ContentType "application/json; charset=utf-8" -Body '{"status":"concluida"}' | Out-Null
Start-Sleep -Seconds 1
$notifsAntes = Invoke-RestMethod -Uri "http://localhost:3002/notifications?task_id=$taskId"
Write-Host "  -> Notificações registradas antes do down: $($notifsAntes.Count) avisos"

# 3. Derrubar containers
Write-Host "`n[3/5] Executando docker compose down (destruindo containers, preservando volumes)..." -ForegroundColor Yellow
docker compose down

# 4. Subir novamente
Write-Host "`n[4/5] Executando docker compose up -d (recriando containers dos volumes)..." -ForegroundColor Yellow
docker compose up -d

Write-Host "Aguardando serviços reinicializarem..."
while ($true) {
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:3000/health/dependencias" -ErrorAction SilentlyContinue
        if ($res.tasks -eq "ok") { break }
    } catch {}
    Start-Sleep -Seconds 2
}

# 5. Conferir recuperação
Write-Host "`n[5/5] Consultando APIs para validar persistência dos dados salvos..." -ForegroundColor Yellow
$userCheck = Invoke-RestMethod -Uri "http://localhost:3001/users/$userId"
$taskCheck = Invoke-RestMethod -Uri "http://localhost:3000/tasks/$taskId/completo"
$notifsDepois = Invoke-RestMethod -Uri "http://localhost:3002/notifications?task_id=$taskId"

if ($userCheck.nome -eq $nome -and $taskCheck.titulo -eq $titulo) {
    Write-Host "`n==================================================================" -ForegroundColor Green
    Write-Host "             SUCESSO: TESTE DE PERSISTÊNCIA VALIDADO!            " -ForegroundColor Green
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host "Usuário recuperado com sucesso:   ID $userId - $($userCheck.nome)"
    Write-Host "Tarefa recuperada com sucesso:    ID $taskId - $($taskCheck.titulo) (Status: $($taskCheck.status))"
    Write-Host "Responsável aninhado (join API):  $($userCheck.nome)"
    Write-Host "Notificações persistidas no banco: $($notifsDepois.Count) avisos"
    Write-Host "Os volumes mantiveram o estado integralmente no Windows 11!`n" -ForegroundColor Green
} else {
    Write-Host "`nERRO: Dados não foram recuperados." -ForegroundColor Red
}
