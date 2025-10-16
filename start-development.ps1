Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   AMBIENTE DE DESENVOLVIMENTO BXC" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Parando processos existentes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "[2/4] Iniciando Backend (porta 3001)..." -ForegroundColor Green
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d $PWD && node server.js" -WindowStyle Normal

Write-Host "[3/4] Aguardando backend inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "[4/4] Iniciando Frontend (porta 3000)..." -ForegroundColor Green
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d $PWD\frontend && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    AMBIENTE INICIADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")







