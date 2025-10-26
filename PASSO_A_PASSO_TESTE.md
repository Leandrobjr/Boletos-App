# 🧪 **PASSO A PASSO - TESTE DE UPLOAD DE COMPROVANTE**

## 📋 **O QUE VAMOS FAZER:**
Testar se o upload de comprovante está funcionando usando uma página de teste simples.

---

## 🚀 **PASSO 1: ABRIR O ARQUIVO DE TESTE**

### **Opção A - Pelo Windows Explorer:**
1. Abra o **Windows Explorer** (pasta amarela na barra de tarefas)
2. Navegue até: `C:\Users\MarcoAurélio\CascadeProjects\bxc-boletos-app`
3. Encontre o arquivo: `test-upload.html`
4. **Clique duplo** no arquivo para abrir no navegador

### **Opção B - Pelo Navegador:**
1. Abra seu navegador (Chrome, Edge, Firefox)
2. Pressione **Ctrl + L** para focar na barra de endereço
3. Digite: `file:///c:/Users/MarcoAurélio/CascadeProjects/bxc-boletos-app/test-upload.html`
4. Pressione **Enter**

---

## 🎯 **PASSO 2: PREPARAR UM ARQUIVO DE TESTE**

### **Você precisa de:**
- Um arquivo **PDF** ou **imagem** (PNG/JPG)
- Pode ser qualquer arquivo pequeno (até 10MB)
- **Sugestões:**
  - Screenshot da tela (salvar como PNG)
  - Qualquer PDF que você tenha
  - Foto do celular

### **Como criar um arquivo de teste rápido:**
1. Pressione **Print Screen** (tecla PrtSc)
2. Abra o **Paint** (digite "Paint" no menu Iniciar)
3. Pressione **Ctrl + V** para colar
4. Vá em **Arquivo > Salvar Como > PNG**
5. Salve como: `comprovante-teste.png`

---

## 📤 **PASSO 3: FAZER O TESTE**

### **Na página que abriu:**

1. **Campo "ID do Boleto":**
   - Já está preenchido com: `1761191527384`
   - **NÃO MUDE** este valor

2. **Campo "Arquivo de Comprovante":**
   - Clique em **"Escolher arquivo"**
   - Selecione o arquivo que você preparou

3. **Campo "URL da API":**
   - Deixe selecionado: **"Produção (Vercel)"**
   - **NÃO MUDE** este valor

4. **Clique no botão:** **"📤 Enviar Comprovante"**

---

## 🔍 **PASSO 4: VERIFICAR O RESULTADO**

### **✅ SE DEU CERTO:**
- Aparecerá uma caixa **VERDE** com:
  - "✅ Upload realizado com sucesso!"
  - Um link para o arquivo enviado
  - Detalhes do upload

### **❌ SE DEU ERRO:**
- Aparecerá uma caixa **VERMELHA** com:
  - "❌ Erro no upload"
  - Descrição do problema
  - **COPIE** toda a mensagem de erro

---

## 📱 **PASSO 5: ME INFORME O RESULTADO**

### **Se deu certo:**
✅ "Funcionou! O upload foi realizado com sucesso!"

### **Se deu erro:**
❌ "Deu erro: [COLE AQUI A MENSAGEM DE ERRO COMPLETA]"

---

## 🆘 **PROBLEMAS COMUNS:**

### **"Arquivo não abre no navegador"**
- Tente outro navegador (Chrome, Edge, Firefox)
- Ou use a Opção B do Passo 1

### **"Não consigo selecionar arquivo"**
- Certifique-se que o arquivo é PDF, PNG ou JPG
- Tente um arquivo menor (menos de 5MB)

### **"Página não carrega"**
- Verifique se digitou o caminho correto
- Tente copiar e colar o caminho completo

---

## 🎯 **OBJETIVO:**
Descobrir se o problema está no:
- ✅ **Frontend** (página do usuário)
- ❌ **Backend** (servidor da API)
- 🔧 **Configuração** (tokens, CORS, etc.)

---

**💡 DICA:** Se tiver qualquer dúvida, me chame que eu te ajudo passo a passo!