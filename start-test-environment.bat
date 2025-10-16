@echo off
echo ========================================
echo INICIANDO AMBIENTE DE TESTES LOCAL
echo ========================================

echo.
echo 1. Parando todos os processos Node.js...
taskkill /F /IM node.exe 2>nul

echo.
echo 2. Iniciando Backend de Testes (porta 3001)...
start "Backend-Testes" cmd /k "node server.js"

echo.
echo 3. Aguardando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo 4. Iniciando Frontend de Testes (porta 3000)...
start "Frontend-Testes" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo AMBIENTE INICIADO!
echo ========================================
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo ========================================
echo.
echo Pressione qualquer tecla para abrir o navegador...
pause >nul

echo.
echo Abrindo navegador...
start http://localhost:3000/vendedor

echo.
echo Ambiente de testes pronto!
pause







