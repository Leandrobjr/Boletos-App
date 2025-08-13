import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaCreditCard, FaCalendarAlt, FaUniversity, FaLock, FaWallet, FaCheckCircle } from 'react-icons/fa';
import { useAccount, useConnect, useDisconnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { buildApiUrl } from '../../config/apiConfig';

function formatarMoeda(valor) {
  try {
    let limpo = String(valor || "").replace(/\D/g, "");
    if (!limpo) return "0,00";
    limpo = limpo.replace(/^0+/, "");
    if (limpo.length === 0) limpo = "0";
    if (limpo.length === 1) return "0,0" + limpo;
    if (limpo.length === 2) return "0," + limpo;
    let inteiro = limpo.slice(0, -2);
    let centavos = limpo.slice(-2);
    inteiro = parseInt(inteiro, 10).toLocaleString("pt-BR");
    return `${inteiro},${centavos}`;
  } catch {
    return "0,00";
  }
}

function formatarMoedaInput(valor) {
  // Permite apenas números, vírgula e ponto
  let limpo = valor.replace(/[^\d.,]/g, "");
  // Troca ponto por vírgula
  limpo = limpo.replace(/\./g, ",");
  // Remove vírgulas duplicadas
  const partes = limpo.split(",");
  if (partes.length > 2) {
    limpo = partes[0] + "," + partes.slice(1).join("");
  }
  return limpo;
}

function formatarMoedaFinal(valor) {
  // Formata para padrão brasileiro ao sair do campo
  let limpo = valor.replace(/[^\d,]/g, "");
  if (!limpo) return "0,00";
  if (!limpo.includes(",")) {
    // Se não tem vírgula, adiciona centavos
    limpo = limpo.padStart(3, "0");
    limpo = limpo.slice(0, -2) + "," + limpo.slice(-2);
  }
  // Remove zeros à esquerda
  limpo = limpo.replace(/^0+(\d)/, "$1");
  // Garante sempre dois dígitos após a vírgula
  const [int, dec] = limpo.split(",");
  return parseInt(int, 10).toLocaleString("pt-BR") + "," + (dec ? dec.padEnd(2, "0").slice(0,2) : "00");
}

function BoletoForm({ user, onBoletoAdded, handleWalletConnection, isConnected, address }) {
  console.log('[BoletoForm] Renderizou. user:', user);
  const [valor, setValor] = useState("0,00");
  const [cotacao, setCotacao] = useState(null);
  const [usdt, setUsdt] = useState("");
  const [cotLoading, setCotLoading] = useState(false);
  const [wallet, setWallet] = useState("");
  const [escrowOk, setEscrowOk] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [cpfCnpjError, setCpfCnpjError] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [codigoBarrasError, setCodigoBarrasError] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [instituicao, setInstituicao] = useState("ASAAS");
  const [loading, setLoading] = useState(false);
  const [debugEnviado, setDebugEnviado] = useState(null);
  const [debugResposta, setDebugResposta] = useState(null);
  const [debugErro, setDebugErro] = useState(null);

  const { openConnectModal } = useConnectModal();
  const { isConnected, address } = useAccount();

  useEffect(() => {
    console.log('[BoletoForm] isConnected mudou:', isConnected, 'address:', address);
  }, [isConnected, address]);

  async function buscarCotacao() {
    setCotLoading(true);
    setFeedback("");
    try {
      const resp = await fetch(buildApiUrl('/api/proxy/coingecko?ticker=tether&vs=brl'));
      const data = await resp.json();
      if (data && data.price != null) {
        setCotacao(Number(data.price));
      } else {
        throw new Error('Cotação indisponível');
      }
    } catch (e) {
      setFeedback("Erro ao buscar cotação do USDT. Tente novamente.");
    }
    setCotLoading(false);
  }

  useEffect(() => {
    if (valor && cotacao) {
      const limpo = valor.replace(/\D/g, "");
      const inteiro = limpo.slice(0, -2) || "0";
      const centavos = limpo.slice(-2).padStart(2, "0");
      const valorNum = parseFloat(inteiro + "." + centavos);
      if (!isNaN(valorNum) && cotacao > 0) {
        // Calcula o valor em USDT
        const valorUSDT = valorNum / cotacao;
        // Adiciona a taxa de serviço de 1%
        const taxaServico = valorUSDT * 0.01;
        const valorTotalUSDT = valorUSDT + taxaServico;
        setUsdt(valorTotalUSDT.toFixed(2));
      } else {
        setUsdt("");
      }
    } else {
      setUsdt("");
    }
  }, [valor, cotacao]);

  useEffect(() => { buscarCotacao(); }, []);

  useEffect(() => {
    // Limpa feedback e campos ao montar ou ao desconectar carteira
    setFeedback("");
    setEscrowOk(false);
    setCpfCnpj("");
    setCodigoBarras("");
    setValor("0,00");
    setVencimento("");
    setInstituicao("ASAAS");
    setUsdt("");
  }, [isConnected]);

  function validarCodigoBarras(valor) {
    const limpo = valor.replace(/\D/g, "");
    return limpo.length === 47;
  }

  function validarCpfCnpj(value) {
    const cpf = value.replace(/\D/g, "");
    if (cpf.length === 11) {
      let sum = 0;
      let rest;
      if (/^(\d)\1+$/.test(cpf)) return false;
      for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i-1, i)) * (11 - i);
      rest = (sum * 10) % 11;
      if ((rest === 10) || (rest === 11)) rest = 0;
      if (rest !== parseInt(cpf.substring(9, 10))) return false;
      sum = 0;
      for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i-1, i)) * (12 - i);
      rest = (sum * 10) % 11;
      if ((rest === 10) || (rest === 11)) rest = 0;
      if (rest !== parseInt(cpf.substring(10, 11))) return false;
      return true;
    }
    if (cpf.length === 14) {
      let tamanho = cpf.length - 2;
      let numeros = cpf.substring(0, tamanho);
      let digitos = cpf.substring(tamanho);
      let soma = 0;
      let pos = tamanho - 7;
      for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
      }
      let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
      if (resultado !== parseInt(digitos.charAt(0))) return false;
      tamanho = tamanho + 1;
      numeros = cpf.substring(0, tamanho);
      soma = 0;
      pos = tamanho - 7;
      for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
      }
      resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
      if (resultado !== parseInt(digitos.charAt(1))) return false;
      return true;
    }
    return false;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    alert('[DEBUG] UID usado no cadastro: ' + (user?.uid || 'N/A'));
    if (!validarCpfCnpj(cpfCnpj)) {
      setCpfCnpjError("CPF ou CNPJ inválido!");
      alert("CPF ou CNPJ inválido!");
      setLoading(false);
      return;
    } else {
      setCpfCnpjError("");
    }
    if (!validarCodigoBarras(codigoBarras)) {
      setCodigoBarrasError("O código de barras deve conter exatamente 47 dígitos.");
      alert("O código de barras deve conter exatamente 47 dígitos.");
      setLoading(false);
      return;
    } else {
      setCodigoBarrasError("");
    }
    const limpo = valor.replace(/\D/g, "");
    const inteiro = limpo.slice(0, -2) || "0";
    const centavos = limpo.slice(-2).padStart(2, "0");
    const valorNum = parseFloat(inteiro + "." + centavos);
    if (isNaN(valorNum) || valorNum <= 0) {
      alert("Valor inválido! Informe um valor numérico maior que zero.");
      setLoading(false);
      return;
    }
    const dataVenc = vencimento ? new Date(vencimento) : null;
    if (!dataVenc || isNaN(dataVenc.getTime())) {
      alert("Data de vencimento inválida!");
      setLoading(false);
      return;
    }
    if (!instituicao.trim()) {
      alert("Instituição emissora é obrigatória!");
      setLoading(false);
      return;
    }
    setLoading(true);
    // Buscar o maior numeroControle existente via API
    let numeroControle = 1;
    try {
      const resp = await fetch(buildApiUrl('/boletos'));
      const boletos = await resp.json();
      const numeros = boletos.map(b => Number(b.numero_controle)).filter(n => !isNaN(n));
      if (numeros.length > 0) {
        numeroControle = Math.max(...numeros) + 1;
      }
    } catch (err) {
      console.log('Erro ao buscar numeroControle:', err);
    }
    const numeroControleStr = String(numeroControle).padStart(3, '0');
    const boletoObj = {
      uid: user.uid,
      cpfCnpj,
      codigoBarras,
      valor: valorNum,
      valor_usdt: usdt, // ✅ Adicionar valor USDT convertido
      vencimento: dataVenc.toISOString().slice(0,10),
      instituicao,
      status: "pendente",
      numeroControle: numeroControleStr
    };
    
    console.log('🔍 DEBUG BoletoForm - Dados sendo enviados:', {
      valor: valorNum,
      valor_usdt: usdt,
      cotacao: cotacao,
      valor_original: valor
    });
    setDebugEnviado(boletoObj);
    try {
      const resp = await fetch(buildApiUrl('/boletos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boletoObj)
      });
      const respData = await resp.json();
      setDebugResposta(respData);
      if (!resp.ok) throw new Error('Erro ao cadastrar boleto');
      setCpfCnpj(""); setCodigoBarras(""); setValor(""); setVencimento(""); setInstituicao("");
      if (onBoletoAdded) onBoletoAdded();
      setDebugErro(null);
    } catch (e) {
      setDebugErro(e.message);
      alert("Erro ao cadastrar boleto: " + e.message);
    }
    setLoading(false);
  };

  async function conectarETravar() {
    if (carregando) {
      setFeedback("Aguarde, processando...");
      return;
    }
    setCarregando(true);
    setFeedback("Aguarde, processando...");
    setEscrowOk(false);
    try {
      // Verificamos se a carteira está conectada usando a prop isConnected
      if (!isConnected || !address) {
        setFeedback("Conecte sua carteira antes de finalizar a operação.");
        setCarregando(false);
        console.log('[DEBUG] Tentativa de travar USDT sem carteira conectada');
        return;
      }
      
      if (!window.ethereum) {
        setFeedback("Nenhuma carteira encontrada. Instale MetaMask ou similar.");
        setCarregando(false);
        return;
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 137n && network.chainId !== 80002n) { // 137 = Polygon, 80002 = Polygon Amoy
        setFeedback("Por favor, conecte sua carteira à rede Polygon ou Polygon Amoy para continuar.");
        setCarregando(false);
        return;
      }
      
      // Usamos o endereço já conectado que foi passado como prop
      setWallet(address);
      const usdtAmount = ethers.parseUnits(usdt, 6);
      
      try {
        // Usamos o endereço já conectado para as operações de aprovação e travamento
        await approveUSDT(null, address, usdtAmount);
        await lockUSDT(null, address, 0, usdtAmount);
        setEscrowOk(true);
        setFeedback("Boleto travado aguardando pagamento! Tempo restante para pagamento: 15 minutos.");
        iniciarTemporizador(15 * 60);
      } catch (innerErr) {
        if (innerErr?.code === 4001 || (innerErr?.message && innerErr.message.toLowerCase().includes("user rejected"))) {
          setFeedback("Transação cancelada pelo usuário na carteira.");
        } else {
          setFeedback("Erro ao processar transação: " + (innerErr?.message || innerErr));
        }
      }
    } catch (err) {
      setFeedback("Erro inesperado: " + (err?.message || err));
    }
    setCarregando(false);
  }

  function iniciarTemporizador(segundos) {
    setFeedback(prev => prev + `\nTempo restante para pagamento: ${Math.floor(segundos/60)} minutos.`);
  }

  return (
    <div className="max-w-500 mx-auto mt-6 box-shadow-6 border-radius-4 bg-background-paper">
      <div style={{ background: '#ffe', color: '#b8860b', padding: 8, marginBottom: 8, borderRadius: 4 }}>
        <b>[DEBUG] Painel de debug do BoletoForm</b><br/>
        isConnected: {String(isConnected)}<br/>
        address: {address || '-'}<br/>
        carregando: {String(carregando)}<br/>
        usdt: {usdt}<br/>
      </div>
      <div className="flex items-center pb-0 pt-3">
        <FaLock className="text-primary-main" size={36} />
        <h2 className="text-2xl font-bold text-primary-main">Cadastrar novo boleto</h2>
        <p className="text-sm text-text-secondary">Preencha os dados do boleto para vender e travar o valor em USDT</p>
      </div>
      <div className="border-b border-b-2 mb-2"></div>
      <div className="p-4">
        <form onSubmit={handleSubmit} autoComplete="off" noValidate>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <input
                type="text"
                name="cpfCnpj"
                value={cpfCnpj}
                onChange={e => setCpfCnpj(e.target.value.replace(/\D/g, ""))}
                maxLength={18}
                className={`w-full h-14 font-size-1-3rem mb-2 ${cpfCnpjError ? 'border-red-500' : ''}`}
                placeholder="CPF/CNPJ"
              />
              {cpfCnpjError && <p className="text-red-500">{cpfCnpjError}</p>}
            </div>
            <div className="col-span-12">
              <input
                type="text"
                name="codigoBarras"
                value={codigoBarras}
                onChange={e => setCodigoBarras(e.target.value.replace(/\D/g, ""))}
                maxLength={48}
                style={{
                  fontFamily: 'monospace',
                  letterSpacing: 0.8,
                  fontSize: 16
                }}
                required
                className={`w-full ${codigoBarrasError ? 'border-red-500' : ''}`}
                placeholder="Código de barras"
              />
              {codigoBarrasError && <p className="text-red-500">{codigoBarrasError || 'Somente números'}</p>}
            </div>
            <div className="col-span-12 sm:col-span-6">
              <input
                className="flex h-11 rounded-3xl border-2 border-input bg-background px-4 py-2.5 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-48"
                id="valor"
                type="text"
                name="valor"
                value={valor}
                onChange={e => setValor(formatarMoeda(e.target.value))}
                onPaste={e => {
                  e.preventDefault();
                  const texto = e.clipboardData.getData('Text');
                  setValor(formatarMoeda(texto));
                }}
                placeholder="0,00"
                autoComplete="off"
              />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <input
                type="text"
                name="usdt"
                value={usdt}
                className="w-full font-bold font-size-1-3rem letter-spacing-1 text-right bg-f5f5f5 border-radius-4 mb-2"
                placeholder="Valor em USDT"
                inputProps={{
                  readOnly: true,
                  style: {
                    fontWeight: 'bold',
                    fontSize: '1.3rem',
                    letterSpacing: 1,
                    textAlign: 'right',
                    background: '#f5f5f5',
                    borderRadius: 4,
                    height: 56
                  }
                }}
              />
            </div>
            <div className="col-span-12 sm:col-span-12 flex items-center mt-1">
              <p className="text-sm text-text-secondary mr-2">
                Cotação USDT/BRL: <b>{cotLoading ? <div className="animate-spin h-4 w-4 mx-1" /> : cotacao ? `R$ ${cotacao}` : '--'}</b>
              </p>
              <button type="button" onClick={buscarCotacao} className="ml-1 text-primary-main text-sm">
                Atualizar cotação
              </button>
            </div>
            <div className="col-span-12">
              <input
                type="date"
                name="vencimento"
                value={vencimento}
                onChange={e => setVencimento(e.target.value)}
                required
                className="w-full h-14"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <FaCalendarAlt className="text-primary-main mr-2" size={20} />
                }}
              />
            </div>
            <div className="col-span-12">
              <input
                type="text"
                name="instituicao"
                value={instituicao}
                onChange={e => setInstituicao(e.target.value)}
                required
                className="w-full"
                InputProps={{
                  startAdornment: <FaUniversity className="text-primary-main mr-2" size={20} />
                }}
              />
            </div>
            {feedback && (
              <div className="col-span-12">
                <p className={`mb-2 ${escrowOk ? 'text-green-500' : 'text-red-500'}`}>{feedback}</p>
              </div>
            )}
            {!isConnected && (
            <div className="col-span-12 sm:col-span-6">
              <ConnectButton label="Conectar Carteira" />
            </div>
            )}
            {isConnected && (
              <>
                <div className="col-span-12 sm:col-span-6">
                  <button
                    type="button"
                    className="w-full h-14 bg-success text-white"
                    disabled
                    onClick={() => console.log('[BoletoForm] Botão de carteira conectada clicado')}
                  >
                    {address ? `Conectado: ${address.slice(0, 6)}...${address.slice(-4)}` : 'Carteira conectada'}
                  </button>
                </div>
              <div className="col-span-12 sm:col-span-6 mt-1">
                <button
                  type="button"
                  className="w-full h-14 bg-primary text-white"
                  onClick={conectarETravar}
                  disabled={carregando || !usdt || usdt === "0"}
                >
                  {carregando ? "Processando..." : "Finalizar e Travar USDT"}
                </button>
              </div>
              </>
            )}
            <div className="col-span-12 flex justify-end mt-1">
              <button
                type="button"
                className="text-sm text-secondary"
                onClick={() => window.location.href = '/'}
                disabled={carregando}
              >
                Fechar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BoletoForm;