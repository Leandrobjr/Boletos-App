olyscan# Contratos Inteligentes BoletoXCrypto

Este diretório contém os contratos inteligentes necessários para o funcionamento do sistema BoletoXCrypto.

## Contratos

### P2PEscrow.sol

Contrato principal que gerencia a custódia de USDT entre vendedores e compradores. Funcionalidades:

- **Travar USDT**: Vendedor trava tokens ao cadastrar um boleto
- **Liberar USDT**: Após confirmação de pagamento, libera tokens para o comprador
- **Cancelar Escrow**: Devolve tokens para o vendedor em caso de cancelamento
- **Gerenciar Disputas**: Sistema para resolução de disputas
- **Taxas de Serviço**: 
  - R$ 5,00 para boletos até R$ 200,00
  - 3% para boletos acima de R$ 200,00

### MockUSDT.sol

Token ERC20 que simula o USDT para testes na rede Polygon Amoy.

## Implantação na Testnet Amoy

Para implantar os contratos na testnet Amoy da Polygon, siga os passos abaixo:

1. **Configurar ambiente**:
   - Instale Node.js e npm
   - Instale Hardhat: `npm install --save-dev hardhat`
   - Configure o arquivo hardhat.config.js para a rede Amoy

2. **Obter MATIC de teste**:
   - Acesse o faucet da Polygon Amoy: https://faucet.polygon.technology/
   - Solicite MATIC para seu endereço

3. **Implantar contratos**:
   - Primeiro, implante o MockUSDT: `npx hardhat run scripts/deploy-usdt.js --network amoy`
   - Em seguida, implante o P2PEscrow usando o endereço do MockUSDT: `npx hardhat run scripts/deploy-escrow.js --network amoy`

4. **Verificar contratos**:
   - Verifique os contratos no explorador de blocos da Polygon Amoy

5. **Atualizar endereços no frontend**:
   - Atualize os endereços dos contratos no arquivo `escrowService.js`

## Fluxo de Funcionamento

1. **Vendedor** (possui USDT, quer pagar boleto):
   - Cadastra boleto
   - Trava USDT no contrato escrow

2. **Comprador** (possui reais, quer USDT):
   - Seleciona boleto no livro de ordens
   - Paga o boleto em reais
   - Envia comprovante
   - Recebe USDT após confirmação da baixa

3. **Sistema**:
   - Verifica baixa do boleto (automática ou manual)
   - Libera USDT para o comprador (menos a taxa)
   - Envia a taxa para o administrador do sistema

## Segurança

Os contratos incluem:
- Proteção contra reentrância
- Controle de acesso por função
- Sistema de pausas para emergências
- Função de emergência para retirada de tokens
