# 📋 REGRAS DE CANCELAMENTO - COMPRADOR

## ⚠️ **REGRAS IMPORTANTES:**

### **QUANDO PODE CANCELAR:**
- ✅ **PENDENTE_PAGAMENTO** - Boleto selecionado, aguardando pagamento
- ✅ **Antes do envio do comprovante**

### **QUANDO NÃO PODE CANCELAR:**
- ❌ **AGUARDANDO_BAIXA** - Após envio do comprovante
- ❌ **BAIXADO** - Boleto já baixado
- ❌ **CANCELADO** - Já cancelado
- ❌ **EXCLUIDO** - Boleto excluído

## 🔧 **IMPLEMENTAÇÃO:**

### **Frontend (CompradorPage.jsx):**
```javascript
// Validação no botão
disabled={boleto.status === 'BAIXADO' || 
         boleto.status === 'CANCELADO' || 
         boleto.status === 'AGUARDANDO_BAIXA' || 
         boleto.comprovante_url || 
         boleto.comprovanteUrl}

// Validação na função
if (boleto.status === 'AGUARDANDO_BAIXA' || 
    boleto.comprovante_url || 
    boleto.comprovanteUrl) {
  // Bloquear cancelamento
}
```

### **Backend (server.js):**
```javascript
// Validação na API
if (boletoStatus === 'AGUARDANDO_BAIXA') {
  return res.status(400).json({ 
    error: 'Cancelamento não permitido',
    message: 'Não é possível cancelar a compra após o envio do comprovante de pagamento.'
  });
}
```

## 📊 **FLUXO DE STATUS:**

1. **DISPONIVEL** → Comprador seleciona
2. **PENDENTE_PAGAMENTO** → ✅ **PODE CANCELAR**
3. **AGUARDANDO_BAIXA** → ❌ **NÃO PODE CANCELAR**
4. **BAIXADO** → ❌ **NÃO PODE CANCELAR**

## 🎯 **MENSAGENS DE ERRO:**

### **Frontend:**
- "Cancelamento não permitido"
- "Não é possível cancelar a compra após o envio do comprovante de pagamento."

### **Backend:**
- Status: 400 Bad Request
- Error: "Cancelamento não permitido"
- Message: "Não é possível cancelar a compra após o envio do comprovante de pagamento."

## ✅ **RESULTADO:**

**REGRAS IMPLEMENTADAS COM SUCESSO!**

- ✅ Validação no frontend (botão e função)
- ✅ Validação no backend (API)
- ✅ Mensagens de erro claras
- ✅ Fluxo de status respeitado







