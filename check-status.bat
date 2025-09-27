@echo off
echo ========================================
echo    VERIFICACAO DE STATUS - BXC
echo ========================================
echo.

echo Verificando Backend (porta 3001)...
powershell -Command "try { $response = Invoke-WebRequest -Uri http://localhost:3001/api/test -TimeoutSec 5; Write-Host '✅ Backend: FUNCIONANDO' -ForegroundColor Green; Write-Host $response.Content } catch { Write-Host '❌ Backend: NAO RESPONDE' -ForegroundColor Red }"

echo.
echo Verificando Frontend (porta 3000)...
powershell -Command "try { $response = Invoke-WebRequest -Uri http://localhost:3000 -TimeoutSec 5; Write-Host '✅ Frontend: FUNCIONANDO' -ForegroundColor Green } catch { Write-Host '❌ Frontend: NAO RESPONDE' -ForegroundColor Red }"

echo.
echo Verificando portas em uso...
netstat -ano | findstr ":3000\|:3001"

echo.
echo Pressione qualquer tecla para sair...
pause >nul







