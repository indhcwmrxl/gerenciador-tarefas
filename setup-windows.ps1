# ==============================================================================
# Script de Instalação e Inicialização Automatizada (Windows 11)
# Gerenciador de Tarefas - Módulo 3: Containers (Sistemas Distribuídos - UERN)
# ==============================================================================

# Força codificação UTF-8 no console do PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  SETUP AUTOMATIZADO DO GERENCIADOR DE TAREFAS (WINDOWS 11)      " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Verificar / Instalar Git
Write-Host "`n[1/5] Verificando se o Git está instalado..." -ForegroundColor Yellow
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git não encontrado. Instalando Git via winget..." -ForegroundColor Cyan
    winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
} else {
    Write-Host "✓ Git já está instalado!" -ForegroundColor Green
}

# 2. Verificar / Instalar Docker Desktop
Write-Host "`n[2/5] Verificando se o Docker Desktop está instalado..." -ForegroundColor Yellow
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    Write-Host "Docker não encontrado. Instalando Docker Desktop via winget..." -ForegroundColor Cyan
    winget install --id Docker.DockerDesktop -e --source winget --accept-package-agreements --accept-source-agreements
    Write-Host "Docker Desktop instalado! Caso necessário, reinicie o computador para concluir a instalação do WSL2." -ForegroundColor Yellow
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
} else {
    Write-Host "✓ Docker já está instalado!" -ForegroundColor Green
}

# 3. Garantir que o Docker Desktop está em execução
Write-Host "`n[3/5] Verificando se o serviço do Docker está rodando..." -ForegroundColor Yellow
$dockerRunning = $false
try {
    $dockerInfo = docker info 2>$null
    if ($LASTEXITCODE -eq 0) { $dockerRunning = $true }
} catch {}

if (-not $dockerRunning) {
    Write-Host "Iniciando Docker Desktop..." -ForegroundColor Cyan
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
    } else {
        Start-Process "Docker Desktop" -ErrorAction SilentlyContinue
    }
    
    Write-Host "Aguardando o Docker inicializar completamente..." -NoNewline
    $tentativas = 0
    while (-not $dockerRunning -and $tentativas -lt 40) {
        Start-Sleep -Seconds 3
        Write-Host "." -NoNewline
        try {
            docker info 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) { $dockerRunning = $true }
        } catch {}
        $tentativas++
    }
    Write-Host ""
}

if (-not $dockerRunning) {
    Write-Host "`nAviso: O Docker Desktop ainda está inicializando ou precisa ser aberto manualmente." -ForegroundColor Red
    Write-Host "Por favor, abra o 'Docker Desktop' no menu Iniciar e aguarde a baleia ficar verde na barra de tarefas.`n" -ForegroundColor Yellow
    pause
} else {
    Write-Host "✓ Docker está ativo e pronto!" -ForegroundColor Green
}

# 4. Clonar ou atualizar o repositório
Write-Host "`n[4/5] Baixando os arquivos do projeto..." -ForegroundColor Yellow
$repoUrl = "https://github.com/indhcwmrxl/gerenciador-tarefas.git"
$pastaProjeto = "gerenciador-tarefas"

if (-not (Test-Path "docker-compose.yml")) {
    if (-not (Test-Path $pastaProjeto)) {
        git clone -b entrega-3-containers $repoUrl
        Set-Location $pastaProjeto
    } else {
        Set-Location $pastaProjeto
        git checkout entrega-3-containers
        git pull origin entrega-3-containers
    }
} else {
    Write-Host "Executando diretamente da pasta do projeto." -ForegroundColor Green
}

# 5. Construir e subir todos os 6 containers
Write-Host "`n[5/5] Construindo imagens e subindo os 6 containers..." -ForegroundColor Yellow

$useLegacyCompose = $false
try {
    $ver = docker compose version 2>$null
    if ($LASTEXITCODE -ne 0) {
        if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
            $useLegacyCompose = $true
        }
    }
} catch {
    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        $useLegacyCompose = $true
    }
}

if ($useLegacyCompose) {
    docker-compose up --build -d
} else {
    docker compose up --build -d
}

Write-Host "`nAguardando todos os containers e bancos ficarem saudáveis (healthy)..." -ForegroundColor Yellow
$pronto = $false
$tentativasHealth = 0
while (-not $pronto -and $tentativasHealth -lt 30) {
    Start-Sleep -Seconds 2
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:3000/health/dependencias" -ErrorAction SilentlyContinue
        if ($res.tasks -eq "ok" -and $res.users -eq "ok" -and $res.notifications -eq "ok") {
            $pronto = $true
        }
    } catch {}
    $tentativasHealth++
}

Write-Host "`n==================================================================" -ForegroundColor Green
Write-Host "          TUDO PRONTO! TODOS OS CONTAINERS ESTÃO ATIVOS!          " -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green

if ($useLegacyCompose) {
    docker-compose ps
} else {
    docker compose ps
}

Write-Host "`nExecutando teste funcional dos endpoints..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
if (Test-Path ".\scripts\test-endpoints.ps1") {
    .\scripts\test-endpoints.ps1
}
