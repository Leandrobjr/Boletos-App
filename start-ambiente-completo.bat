@echo off
echo ========================================
echo    AMBIENTE COMPLETO BXC
echo ========================================
echo.

echo [1/3] Parando processos existentes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Iniciando Backend (porta 3001)...
start "Backend BXC" cmd /k "cd /d %~dp0 && start-backend-forever.bat"

echo [3/3] Iniciando Frontend (porta 3000)...
timeout /t 3 /nobreak >nul
start "Frontend BXC" cmd /k "cd /d %~dp0 && start-frontend-forever.bat"

echo.
echo ========================================
echo    AMBIENTE INICIADO COM SUCESSO!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Os servidores reiniciarão automaticamente se pararem.
echo Pressione qualquer tecla para sair...
pause >nul







