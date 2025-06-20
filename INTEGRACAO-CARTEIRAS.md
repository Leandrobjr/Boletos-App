# Integração de Carteiras Digitais - BXC Boletos

Este documento detalha a estratégia de integração de carteiras digitais no sistema BXC Boletos, comparando a implementação atual do protótipo com a implementação final planejada usando wagmi/viem.

## Implementação Atual (Protótipo)

O protótipo atual utiliza uma simulação simplificada de conexão com carteiras digitais através do componente `WalletConnector.jsx`. Esta implementação:

- **Simula** a conexão com MetaMask, WalletConnect e Coinbase Wallet
- **Gera** endereços aleatórios para representar carteiras conectadas
- **Exibe** saldos simulados e permite desconexão
- **Não interage** realmente com a blockchain

### Limitações do Protótipo:
- Não realiza conexões reais com carteiras
- Não permite transações na blockchain
- Não suporta assinatura de mensagens para autenticação
- Não detecta mudanças de rede ou conta

## Implementação Final (wagmi/viem)

A implementação final utilizará as bibliotecas wagmi e viem para integração real com carteiras Web3, oferecendo:

### 1. Configuração Inicial

```javascript
// config/wagmiConfig.js
import { createConfig, http } from 'wagmi'
import { mainnet, polygon, bsc } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, polygon, bsc],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
  },
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.WALLET_CONNECT_PROJECT_ID,
    }),
    coinbaseWallet({
      appName: 'BXC Boletos',
    }),
  ],
})
```

### 2. Hook Personalizado para Gerenciar Conexão

```javascript
// hooks/useWallet.js
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'

export function useWallet() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({
    address,
  })

  // Formatar endereço para exibição
  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return {
    address,
    formattedAddress: formatAddress(address),
    isConnected,
    chainId,
    connect,
    disconnect,
    connectors,
    isPending,
    balance,
  }
}
```

### 3. Componente de Conexão de Carteira

```jsx
// components/wallet/WalletConnector.jsx
import { useState } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  FaEthereum, 
  FaWallet, 
  FaSignOutAlt, 
  FaExchangeAlt 
} from 'react-icons/fa'

export function WalletConnector() {
  const [isOpen, setIsOpen] = useState(false)
  const { 
    address, 
    formattedAddress, 
    isConnected, 
    connect, 
    disconnect, 
    connectors, 
    isPending, 
    balance 
  } = useWallet()

  // Renderizar botão de conexão ou informações da carteira
  if (isConnected) {
    return (
      <div className="flex items-center space-x-4">
        <div className="bg-green-100 p-1 rounded-full">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
        </div>
        <div className="text-sm">
          <div className="font-medium">{formattedAddress}</div>
          <div className="text-xs text-gray-500">
            {balance?.formatted.slice(0, 6)} {balance?.symbol}
          </div>
        </div>
        <button 
          onClick={disconnect}
          className="text-red-500 hover:text-red-700"
        >
          <FaSignOutAlt />
        </button>
      </div>
    )
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="flex items-center space-x-2"
      >
        <FaWallet />
        <span>Conectar Carteira</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Conectar Carteira</Dialog.Title>
            <Dialog.Description>
              Escolha um dos provedores abaixo para conectar sua carteira digital.
            </Dialog.Description>
          </Dialog.Header>
          
          <div className="space-y-4 mt-4">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => {
                  connect({ connector })
                  setIsOpen(false)
                }}
                disabled={isPending}
                className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="bg-orange-100 p-2 rounded-full mr-3">
                    <FaEthereum className="text-orange-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{connector.name}</div>
                    <div className="text-xs text-gray-500">
                      Conecte-se à sua carteira {connector.name}
                    </div>
                  </div>
                </div>
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  )
}
```

## Funcionalidades Adicionais na Implementação Final

### 1. Autenticação Baseada em Carteira

```javascript
// hooks/useAuth.js
import { useSignMessage } from 'wagmi'
import { useWallet } from './useWallet'
import { useState, useEffect } from 'react'

export function useAuth() {
  const { address, isConnected } = useWallet()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authToken, setAuthToken] = useState(null)
  
  const { signMessageAsync } = useSignMessage()
  
  // Autenticar usuário quando conectar carteira
  useEffect(() => {
    if (isConnected && address) {
      authenticate()
    } else {
      setIsAuthenticated(false)
      setAuthToken(null)
    }
  }, [isConnected, address])
  
  // Função para autenticar com assinatura
  const authenticate = async () => {
    try {
      // Gerar nonce do backend
      const response = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      })
      
      const { nonce } = await response.json()
      
      // Assinar mensagem com nonce
      const message = `Autenticação no BXC Boletos\nEndereço: ${address}\nNonce: ${nonce}`
      const signature = await signMessageAsync({ message })
      
      // Verificar assinatura no backend
      const authResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, nonce })
      })
      
      const { token } = await authResponse.json()
      
      // Armazenar token e atualizar estado
      setAuthToken(token)
      setIsAuthenticated(true)
      localStorage.setItem('authToken', token)
      
    } catch (error) {
      console.error('Erro na autenticação:', error)
      setIsAuthenticated(false)
    }
  }
  
  return {
    isAuthenticated,
    authToken,
    authenticate
  }
}
```

### 2. Interação com Smart Contracts

```javascript
// hooks/useEscrow.js
import { useContractWrite, useContractRead } from 'wagmi'
import { escrowABI } from '@/contracts/escrowABI'
import { parseEther } from 'viem'

const ESCROW_CONTRACT_ADDRESS = '0x...'

export function useEscrow() {
  // Bloquear fundos para pagamento de boleto
  const { write: lockFunds, isLoading: isLocking } = useContractWrite({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: escrowABI,
    functionName: 'lockFunds',
  })
  
  // Liberar fundos após confirmação de pagamento
  const { write: releaseFunds, isLoading: isReleasing } = useContractWrite({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: escrowABI,
    functionName: 'releaseFunds',
  })
  
  // Cancelar bloqueio de fundos
  const { write: cancelLock, isLoading: isCancelling } = useContractWrite({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: escrowABI,
    functionName: 'cancelLock',
  })
  
  // Obter saldo bloqueado do usuário
  const { data: lockedBalance } = useContractRead({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: escrowABI,
    functionName: 'getLockedBalance',
    watch: true,
  })
  
  // Função para bloquear fundos para pagamento
  const bloquearFundos = async (boletoId, valor, beneficiario) => {
    try {
      await lockFunds({
        args: [boletoId, beneficiario],
        value: parseEther(valor.toString()),
      })
      return true
    } catch (error) {
      console.error('Erro ao bloquear fundos:', error)
      return false
    }
  }
  
  return {
    bloquearFundos,
    liberarFundos: releaseFunds,
    cancelarBloqueio: cancelLock,
    saldoBloqueado: lockedBalance,
    isLocking,
    isReleasing,
    isCancelling
  }
}
```

## Benefícios da Nova Implementação

1. **Conexão Real**: Interação direta com carteiras Web3 reais
2. **Segurança**: Utilização de bibliotecas robustas e testadas
3. **Flexibilidade**: Suporte a múltiplas redes e carteiras
4. **Autenticação**: Sistema seguro baseado em assinatura de mensagens
5. **Transações**: Capacidade de realizar transações reais na blockchain
6. **Monitoramento**: Detecção de eventos e mudanças na carteira

## Considerações de Segurança

1. **Validação de Assinaturas**: Sempre verificar assinaturas no backend
2. **Proteção contra Replay Attacks**: Usar nonces únicos para cada autenticação
3. **Validação de Transações**: Confirmar transações antes de atualizar o estado da UI
4. **Tratamento de Erros**: Implementar tratamento robusto de erros de conexão e transação
5. **Segurança de Contratos**: Auditar contratos inteligentes antes do deploy

## Próximos Passos

1. Configurar projeto wagmi com provedores e conectores
2. Implementar componente WalletConnector com shadcn UI
3. Desenvolver sistema de autenticação baseado em assinaturas
4. Criar smart contracts para escrow de pagamentos
5. Integrar sistema de notificações para eventos da blockchain
