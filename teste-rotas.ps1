# Script de teste para verificar se as rotas de boletos estão funcionando

Write-Host "🧪 TESTE DAS ROTAS DE BOLETOS" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# 1. Testar se o servidor está rodando
Write-Host "`n1. Testando se o servidor está rodando..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/test" -Method GET
    Write-Host "✅ Servidor rodando: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Servidor não está rodando" -ForegroundColor Red
    exit 1
}

# 2. Testar GET /boletos (Livro de Ordens)
Write-Host "`n2. Testando GET /boletos (Livro de Ordens)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/boletos" -Method GET
    $boletos = $response.Content | ConvertFrom-Json
    Write-Host "✅ Livro de Ordens: $($boletos.Count) boletos encontrados" -ForegroundColor Green
    foreach ($boleto in $boletos) {
        Write-Host "   - Boleto $($boleto.numero_controle): R$ $($boleto.valor) (USDT: $($boleto.valor_usdt))" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erro ao buscar livro de ordens" -ForegroundColor Red
}

# 3. Testar GET /boletos/usuario/:uid (Meus Boletos)
Write-Host "`n3. Testando GET /boletos/usuario/:uid (Meus Boletos)..." -ForegroundColor Yellow
try {
    $uid = "jo2px7rqi9ei9G5fvZ0bq2bFoh33"
    $response = Invoke-WebRequest -Uri "http://localhost:3001/boletos/usuario/$uid" -Method GET
    $boletos = $response.Content | ConvertFrom-Json
    Write-Host "✅ Meus Boletos: $($boletos.Count) boletos encontrados" -ForegroundColor Green
    foreach ($boleto in $boletos) {
        Write-Host "   - Boleto $($boleto.numero_controle): R$ $($boleto.valor) (Status: $($boleto.status))" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erro ao buscar meus boletos" -ForegroundColor Red
}

# 4. Testar POST /boletos (Cadastrar novo boleto)
Write-Host "`n4. Testando POST /boletos (Cadastrar novo boleto)..." -ForegroundColor Yellow
try {
    $novoBoleto = @{
        user_id = "jo2px7rqi9ei9G5fvZ0bq2bFoh33"
        cpf_cnpj = "12345678901"
        codigo_barras = "123456789012345678901234567890"
        valor = 321.45
        valor_usdt = 59.20
        vencimento = "2025-09-06"
        instituicao = "banco_teste"
    }
    
    $body = $novoBoleto | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3001/boletos" -Method POST -Body $body -ContentType "application/json"
    $boletoCriado = $response.Content | ConvertFrom-Json
    Write-Host "✅ Boleto criado: $($boletoCriado.numero_controle) - R$ $($boletoCriado.valor)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao criar boleto" -ForegroundColor Red
}

# 5. Verificar se o novo boleto aparece no livro de ordens
Write-Host "`n5. Verificando se o novo boleto aparece no livro de ordens..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/boletos" -Method GET
    $boletos = $response.Content | ConvertFrom-Json
    $novoBoletoEncontrado = $boletos | Where-Object { $_.valor -eq 321.45 }
    if ($novoBoletoEncontrado) {
        Write-Host "✅ Novo boleto encontrado no livro de ordens!" -ForegroundColor Green
    } else {
        Write-Host "❌ Novo boleto NÃO encontrado no livro de ordens" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao verificar livro de ordens" -ForegroundColor Red
}

# 6. Verificar se o novo boleto aparece em meus boletos
Write-Host "`n6. Verificando se o novo boleto aparece em meus boletos..." -ForegroundColor Yellow
try {
    $uid = "jo2px7rqi9ei9G5fvZ0bq2bFoh33"
    $response = Invoke-WebRequest -Uri "http://localhost:3001/boletos/usuario/$uid" -Method GET
    $boletos = $response.Content | ConvertFrom-Json
    $novoBoletoEncontrado = $boletos | Where-Object { $_.valor -eq 321.45 }
    if ($novoBoletoEncontrado) {
        Write-Host "✅ Novo boleto encontrado em meus boletos!" -ForegroundColor Green
    } else {
        Write-Host "❌ Novo boleto NÃO encontrado em meus boletos" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao verificar meus boletos" -ForegroundColor Red
}

Write-Host "`n🎯 TESTE CONCLUÍDO!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green







