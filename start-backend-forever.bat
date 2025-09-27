@echo off
echo ========================================
echo    BACKEND BXC - RODANDO CONTINUAMENTE
echo ========================================
echo.

:loop
echo [%date% %time%] Iniciando servidor backend...
node server.js
echo.
echo [%date% %time%] Servidor parou. Reiniciando em 3 segundos...
timeout /t 3 /nobreak >nul
goto loop







