@echo off
echo ========================================
echo REDEPLOY CONTRATO P2PEscrow CORRIGIDO
echo ========================================

echo.
echo 1. Compilando contratos...
cd smart-contracts
npx hardhat compile

echo.
echo 2. Fazendo redeploy na Amoy testnet...
npx hardhat run scripts/deploy.ts --network amoy

echo.
echo 3. Atualizando configuração do frontend...
cd ..

echo.
echo ========================================
echo REDEPLOY CONCLUÍDO!
echo ========================================
echo Verifique os novos endereços em:
echo smart-contracts/deployed-contracts.json
echo ========================================
pause







