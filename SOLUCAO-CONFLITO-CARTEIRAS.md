# 🔧 SOLUÇÃO PARA CONFLITO ENTRE CARTEIRAS

## 🚨 PROBLEMA IDENTIFICADO
O erro indica conflito entre MetaMask e Rabby:
```
MetaMask encountered an error setting the global Ethereum provider - this is likely due to another Ethereum wallet extension also setting the global Ethereum provider
```

## 🛠️ SOLUÇÕES IMEDIATAS

### 1. **DESABILITAR RABBY TEMPORARIAMENTE**
1. Abra o Chrome
2. Vá para `chrome://extensions/`
3. Encontre a extensão **Rabby**
4. Clique em **"Desativar"** temporariamente
5. Recarregue a página

### 2. **VERIFICAR META MASK**
1. Certifique-se que o MetaMask está **ativado**
2. Verifique se está na rede **Polygon Amoy**
3. Se não estiver, adicione a rede:
   - **Network Name**: Polygon Amoy
   - **RPC URL**: https://rpc-amoy.polygon.technology
   - **Chain ID**: 80002
   - **Currency Symbol**: MATIC

### 3. **LIMPAR CACHE DO NAVEGADOR**
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Cache" e "Cookies"
3. Clique em "Limpar dados"
4. Recarregue a página

### 4. **MODO INCOGNITO**
1. Abra uma janela incógnita (`Ctrl + Shift + N`)
2. Acesse `http://localhost:3000`
3. Teste a conexão do MetaMask

## 🔧 CONFIGURAÇÃO CORRIGIDA

### **RainbowKit Simplificado**
A configuração foi simplificada para evitar conflitos:
- Removido `walletConnect`
- Removido `target: 'metaMask'`
- `autoConnect: false`

### **Verificar Configuração**
1. Abra o console do navegador (F12)
2. Digite: `window.ethereum`
3. Deve retornar o objeto do MetaMask

## 🚀 TESTE RÁPIDO

### **Passo 1: Desabilitar Rabby**
```bash
# No Chrome: chrome://extensions/
# Desativar Rabby temporariamente
```

### **Passo 2: Recarregar Página**
```bash
# Pressione F5 ou Ctrl + R
```

### **Passo 3: Testar MetaMask**
```bash
# Clique no botão "Conectar Carteira"
# Deve abrir o MetaMask
```

## 📋 CHECKLIST DE RESOLUÇÃO

- [ ] Rabby desabilitado temporariamente
- [ ] MetaMask ativado
- [ ] Rede Polygon Amoy configurada
- [ ] Cache limpo
- [ ] Página recarregada
- [ ] MetaMask abre ao clicar

## 🔄 SE AINDA NÃO FUNCIONAR

### **Opção 1: Usar Apenas MetaMask**
- Mantenha apenas o MetaMask ativo
- Desabilite outras carteiras

### **Opção 2: Usar Apenas Rabby**
- Desabilite o MetaMask
- Configure o Rabby para Polygon Amoy

### **Opção 3: Modo Incógnito**
- Teste em janela incógnita
- Sem extensões conflitantes

## 🎯 RESULTADO ESPERADO
- ✅ MetaMask abre normalmente
- ✅ Conexão estabelecida
- ✅ Rede Polygon Amoy selecionada
- ✅ Pronto para testes dos contratos







