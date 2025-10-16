@echo off
echo ========================================
echo    FRONTEND BXC - RODANDO CONTINUAMENTE
echo ========================================
echo.

cd /d %~dp0frontend

:loop
echo [%date% %time%] Iniciando servidor frontend...
npm run dev
echo.
echo [%date% %time%] Servidor parou. Reiniciando em 3 segundos...
timeout /t 3 /nobreak >nul
goto loop







