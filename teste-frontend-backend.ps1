# Script para testar comunicação frontend-backend

Write-Host "🧪 TESTE FRONTEND-BACKEND" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# 1. Testar backend
Write-Host "`n1. Testando Backend (localhost:3001)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/boletos" -Method GET
    $boletos = $response.Content | ConvertFrom-Json
    Write-Host "✅ Backend OK: $($boletos.Count) boletos" -ForegroundColor Green
    foreach ($boleto in $boletos) {
        Write-Host "   - $($boleto.numero_controle): R$ $($boleto.valor)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Backend não responde" -ForegroundColor Red
    exit 1
}

# 2. Testar frontend
Write-Host "`n2. Testando Frontend (localhost:3000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET
    Write-Host "✅ Frontend OK: Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend não responde" -ForegroundColor Red
    exit 1
}

# 3. Testar API do frontend
Write-Host "`n3. Testando API do Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/test" -Method GET
    Write-Host "✅ API Frontend OK: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ API Frontend não disponível (normal em desenvolvimento)" -ForegroundColor Yellow
}

# 4. Cadastrar novo boleto
Write-Host "`n4. Cadastrando novo boleto de teste..." -ForegroundColor Yellow
try {
    $novoBoleto = @{
        user_id = "jo2px7rqi9ei9G5fvZ0bq2bFoh33"
        cpf_cnpj = "99999999999"
        codigo_barras = "99999999999999999999999999999999999999999999999999"
        valor = 999.99
        valor_usdt = 184.16
        vencimento = "2025-12-31"
        instituicao = "teste_frontend"
    }
    
    $body = $novoBoleto | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3001/boletos" -Method POST -Body $body -ContentType "application/json"
    $boletoCriado = $response.Content | ConvertFrom-Json
    Write-Host "✅ Boleto criado: $($boletoCriado.numero_controle) - R$ $($boletoCriado.valor)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao criar boleto" -ForegroundColor Red
}

# 5. Verificar se aparece no backend
Write-Host "`n5. Verificando se novo boleto aparece no backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/boletos" -Method GET
    $boletos = $response.Content | ConvertFrom-Json
    $novoBoletoEncontrado = $boletos | Where-Object { $_.valor -eq 999.99 }
    if ($novoBoletoEncontrado) {
        Write-Host "✅ Novo boleto encontrado no backend!" -ForegroundColor Green
    } else {
        Write-Host "❌ Novo boleto NÃO encontrado no backend" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao verificar backend" -ForegroundColor Red
}

Write-Host "`n🎯 TESTE CONCLUÍDO!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Acesse http://localhost:3000" -ForegroundColor White
Write-Host "2. Vá para 'Comprador' -> 'Comprar USDT'" -ForegroundColor White
Write-Host "3. Clique no botão 'Atualizar'" -ForegroundColor White
Write-Host "4. Verifique se o boleto de R$ 999,99 aparece" -ForegroundColor White







