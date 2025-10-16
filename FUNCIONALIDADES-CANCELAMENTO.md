# 📋 FUNCIONALIDADES DE CANCELAMENTO - VENDEDOR vs COMPRADOR

## ⚠️ **IMPORTANTE: Duas funcionalidades diferentes!**

### **1. VENDEDOR - Cancelar/Excluir Boleto** 🔴
- **Função:** `handleCancelarBoletoVendedor()`
- **Quem:** Vendedor que cadastrou o boleto
- **Quando:** Boleto está DISPONIVEL (não travado, não pago)
- **O que faz:** Remove o boleto do sistema e libera USDT travados

### **2. COMPRADOR - Cancelar Compra** 🔵
- **Função:** `handleCancelarCompra(boleto)`
- **Quem:** Comprador que selecionou o boleto
- **Quando:** Até o envio do comprovante
- **O que faz:** Cancela a compra e libera o boleto para outros

## 🔧 **IMPLEMENTAÇÃO:**

### **VENDEDOR - handleCancelarBoletoVendedor:**
```javascript
// Usado quando:
// - Tempo expira (tempoRestante === 0)
// - Botão "Cancelar" no modal de compra
// - Vendedor quer remover boleto do sistema

const handleCancelarBoletoVendedor = async () => {
  // Libera USDT travados no contrato
  // Remove boleto do sistema
  // Volta status para DISPONIVEL
};
```

### **COMPRADOR - handleCancelarCompra:**
```javascript
// Usado quando:
// - Comprador clica "Cancelar Compra" no dropdown
// - Boleto está em status PENDENTE_PAGAMENTO

const handleCancelarCompra = async (boleto) => {
  // Validação: não pode cancelar após envio do comprovante
  // Chama API para cancelar compra
  // Atualiza status para CANCELADO
};
```

## 📊 **FLUXO DE STATUS:**

### **VENDEDOR:**
1. **DISPONIVEL** → Vendedor pode cancelar ✅
2. **PENDENTE_PAGAMENTO** → Vendedor NÃO pode cancelar ❌
3. **AGUARDANDO_BAIXA** → Vendedor NÃO pode cancelar ❌
4. **BAIXADO** → Vendedor NÃO pode cancelar ❌

### **COMPRADOR:**
1. **PENDENTE_PAGAMENTO** → Comprador pode cancelar ✅
2. **AGUARDANDO_BAIXA** → Comprador NÃO pode cancelar ❌
3. **BAIXADO** → Comprador NÃO pode cancelar ❌

## 🎯 **CHAMADAS CORRETAS:**

### **VENDEDOR:**
```javascript
// Tempo expirado
if (tempoRestante === 0) {
  handleCancelarBoletoVendedor();
}

// Botão cancelar no modal
onClick={() => handleCancelarBoletoVendedor()}
```

### **COMPRADOR:**
```javascript
// Botão no dropdown
onClick={() => handleCancelarCompra(boleto)}
```

## ✅ **RESULTADO:**

**DUAS FUNCIONALIDADES IMPLEMENTADAS CORRETAMENTE!**

- ✅ **Vendedor:** Pode cancelar boleto quando DISPONIVEL
- ✅ **Comprador:** Pode cancelar compra até envio do comprovante
- ✅ **Validações:** Cada um tem suas regras específicas
- ✅ **Fluxo:** Respeita o status do boleto







