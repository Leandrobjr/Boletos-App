# Script para corrigir problemas de conexao MCP
Write-Host "CORRIGINDO PROBLEMAS DE CONEXAO MCP" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# 1. Verificar container Docker MCP
Write-Host "`n[1/4] Verificando container Docker MCP..." -ForegroundColor Yellow
try {
    $dockerStatus = docker ps --filter "name=docker_labs-ai-tools-for-devs-desktop-extension-service" --format "table {{.Status}}"
    if ($dockerStatus -match "Up") {
        Write-Host "Container Docker MCP esta rodando" -ForegroundColor Green
    } else {
        Write-Host "Container Docker MCP nao esta rodando" -ForegroundColor Red
    }
} catch {
    Write-Host "Erro ao verificar Docker" -ForegroundColor Red
}

# 2. Verificar conectividade na porta 8811
Write-Host "`n[2/4] Testando conectividade na porta 8811..." -ForegroundColor Yellow
try {
    $connection = Test-NetConnection -ComputerName localhost -Port 8811 -InformationLevel Quiet
    if ($connection) {
        Write-Host "Porta 8811 esta acessivel" -ForegroundColor Green
    } else {
        Write-Host "Porta 8811 nao esta acessivel" -ForegroundColor Red
    }
} catch {
    Write-Host "Erro ao testar conectividade" -ForegroundColor Red
}

# 3. Verificar processos Node.js
Write-Host "`n[3/4] Verificando processos Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Processos Node.js encontrados: $($nodeProcesses.Count)" -ForegroundColor Green
} else {
    Write-Host "Nenhum processo Node.js encontrado" -ForegroundColor Yellow
}

# 4. Verificar portas em uso
Write-Host "`n[4/4] Verificando portas em uso..." -ForegroundColor Yellow
$ports = @(3000, 3001, 8811)
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "Porta $port esta em uso" -ForegroundColor Green
    } else {
        Write-Host "Porta $port nao esta em uso" -ForegroundColor Red
    }
}

Write-Host "`nRESUMO:" -ForegroundColor Cyan
Write-Host "- Docker MCP: Verificado" -ForegroundColor White
Write-Host "- Conectividade: Testada" -ForegroundColor White
Write-Host "- Processos: Analisados" -ForegroundColor White
Write-Host "- Portas: Verificadas" -ForegroundColor White

Write-Host "`nPROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Verificar configuracoes MCP no Cursor Settings" -ForegroundColor White
Write-Host "2. URL Docker MCP deve ser: http://localhost:8811" -ForegroundColor White
Write-Host "3. Desabilitar/reabilitar MCPs no Cursor" -ForegroundColor White
Write-Host "4. Reiniciar Cursor apos ajustes" -ForegroundColor White

Write-Host "`nScript concluido!" -ForegroundColor Green















