// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BoletoEscrow
 * @dev Contrato para gerenciar escrow de boletos com USDT
 */
contract BoletoEscrow is ReentrancyGuard, Ownable {
    // Token USDT (Polygon Amoy)
    IERC20 public usdtToken;
    
    // Taxa de serviço (5%)
    uint256 public constant TAXA_SERVICO = 500; // 5% = 500/10000
    uint256 public constant TAXA_BASE = 10000;
    
    // Estrutura do boleto
    struct Boleto {
        string boletoId;
        address comprador;
        address vendedor;
        uint256 valorUsdt;
        uint256 valorTaxa;
        uint256 valorLiquido;
        BoletoStatus status;
        uint256 criadoEm;
        uint256 tempoLimite;
    }
    
    // Status do boleto
    enum BoletoStatus {
        DISPONIVEL,
        TRAVADO,
        PENDENTE_PAGAMENTO,
        AGUARDANDO_BAIXA,
        BAIXADO,
        CANCELADO
    }
    
    // Mapeamentos
    mapping(string => Boleto) public boletos;
    mapping(address => string[]) public boletosPorComprador;
    mapping(address => string[]) public boletosPorVendedor;
    
    // Eventos
    event BoletoTravado(string indexed boletoId, address indexed comprador, uint256 valorUsdt, uint256 valorTaxa);
    event BoletoLiberado(string indexed boletoId, address indexed comprador, address indexed vendedor, uint256 valorLiquido);
    event BoletoCancelado(string indexed boletoId, address indexed comprador, uint256 valorDevolvido);
    event TaxaColetada(string indexed boletoId, uint256 valorTaxa);
    
    // Construtor
    constructor(address _usdtToken) {
        usdtToken = IERC20(_usdtToken);
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Travar valor do boleto (comprador)
     */
    function travarBoleto(
        string memory _boletoId,
        uint256 _valorUsdt,
        address _vendedor
    ) external nonReentrant {
        require(bytes(_boletoId).length > 0, "Boleto ID invalido");
        require(_valorUsdt > 0, "Valor deve ser maior que zero");
        require(_vendedor != address(0), "Endereco vendedor invalido");
        require(_vendedor != msg.sender, "Comprador nao pode ser vendedor");
        require(boletos[_boletoId].status == BoletoStatus.DISPONIVEL, "Boleto nao disponivel");
        
        // Calcular taxas
        uint256 valorTaxa = (_valorUsdt * TAXA_SERVICO) / TAXA_BASE;
        uint256 valorLiquido = _valorUsdt - valorTaxa;
        
        // Transferir USDT do comprador para o contrato
        require(
            usdtToken.transferFrom(msg.sender, address(this), _valorUsdt),
            "Transferencia USDT falhou"
        );
        
        // Criar boleto
        boletos[_boletoId] = Boleto({
            boletoId: _boletoId,
            comprador: msg.sender,
            vendedor: _vendedor,
            valorUsdt: _valorUsdt,
            valorTaxa: valorTaxa,
            valorLiquido: valorLiquido,
            status: BoletoStatus.TRAVADO,
            criadoEm: block.timestamp,
            tempoLimite: block.timestamp + 1 hours // 1 hora
        });
        
        // Adicionar aos mapeamentos
        boletosPorComprador[msg.sender].push(_boletoId);
        boletosPorVendedor[_vendedor].push(_boletoId);
        
        emit BoletoTravado(_boletoId, msg.sender, _valorUsdt, valorTaxa);
    }
    
    /**
     * @dev Liberar valor do boleto (vendedor)
     */
    function liberarBoleto(
        string memory _boletoId,
        address _enderecoComprador,
        address _enderecoVendedor
    ) external nonReentrant {
        Boleto storage boleto = boletos[_boletoId];
        require(boleto.status == BoletoStatus.AGUARDANDO_BAIXA, "Boleto nao aguardando baixa");
        require(boleto.vendedor == msg.sender, "Apenas vendedor pode liberar");
        require(boleto.comprador == _enderecoComprador, "Endereco comprador invalido");
        
        // Atualizar status
        boleto.status = BoletoStatus.BAIXADO;
        
        // Transferir valor líquido para o vendedor
        require(
            usdtToken.transfer(_enderecoVendedor, boleto.valorLiquido),
            "Transferencia vendedor falhou"
        );
        
        // Coletar taxa (enviar para owner)
        require(
            usdtToken.transfer(owner(), boleto.valorTaxa),
            "Transferencia taxa falhou"
        );
        
        emit BoletoLiberado(_boletoId, _enderecoComprador, _enderecoVendedor, boleto.valorLiquido);
        emit TaxaColetada(_boletoId, boleto.valorTaxa);
    }
    
    /**
     * @dev Cancelar boleto (comprador)
     */
    function cancelarBoleto(string memory _boletoId) external nonReentrant {
        Boleto storage boleto = boletos[_boletoId];
        require(boleto.comprador == msg.sender, "Apenas comprador pode cancelar");
        require(boleto.status == BoletoStatus.TRAVADO, "Boleto nao pode ser cancelado");
        require(block.timestamp <= boleto.tempoLimite, "Tempo limite expirado");
        
        // Atualizar status
        boleto.status = BoletoStatus.CANCELADO;
        
        // Devolver valor total para o comprador
        require(
            usdtToken.transfer(msg.sender, boleto.valorUsdt),
            "Devolucao falhou"
        );
        
        emit BoletoCancelado(_boletoId, msg.sender, boleto.valorUsdt);
    }
    
    /**
     * @dev Consultar status do boleto
     */
    function consultarStatus(string memory _boletoId) external view returns (BoletoStatus) {
        return boletos[_boletoId].status;
    }
    
    /**
     * @dev Obter informações do boleto
     */
    function getBoleto(string memory _boletoId) external view returns (Boleto memory) {
        return boletos[_boletoId];
    }
    
    /**
     * @dev Obter boletos por comprador
     */
    function getBoletosPorComprador(address _comprador) external view returns (string[] memory) {
        return boletosPorComprador[_comprador];
    }
    
    /**
     * @dev Obter boletos por vendedor
     */
    function getBoletosPorVendedor(address _vendedor) external view returns (string[] memory) {
        return boletosPorVendedor[_vendedor];
    }
    
    /**
     * @dev Verificar se boleto pode ser cancelado
     */
    function podeCancelar(string memory _boletoId) external view returns (bool) {
        Boleto storage boleto = boletos[_boletoId];
        return (
            boleto.status == BoletoStatus.TRAVADO &&
            block.timestamp <= boleto.tempoLimite
        );
    }
    
    /**
     * @dev Atualizar status para PENDENTE_PAGAMENTO (backend)
     */
    function atualizarStatusPagamento(string memory _boletoId) external {
        Boleto storage boleto = boletos[_boletoId];
        require(boleto.status == BoletoStatus.TRAVADO, "Boleto deve estar travado");
        boleto.status = BoletoStatus.PENDENTE_PAGAMENTO;
    }
    
    /**
     * @dev Atualizar status para AGUARDANDO_BAIXA (backend)
     */
    function atualizarStatusBaixa(string memory _boletoId) external {
        Boleto storage boleto = boletos[_boletoId];
        require(boleto.status == BoletoStatus.PENDENTE_PAGAMENTO, "Boleto deve estar pendente");
        boleto.status = BoletoStatus.AGUARDANDO_BAIXA;
    }
    
    /**
     * @dev Retornar status para DISPONIVEL (backend)
     */
    function retornarDisponivel(string memory _boletoId) external {
        Boleto storage boleto = boletos[_boletoId];
        require(boleto.status == BoletoStatus.TRAVADO, "Boleto deve estar travado");
        boleto.status = BoletoStatus.DISPONIVEL;
    }
    
    /**
     * @dev Retirar taxas acumuladas (owner)
     */
    function retirarTaxas() external onlyOwner {
        uint256 saldo = usdtToken.balanceOf(address(this));
        require(saldo > 0, "Nenhuma taxa para retirar");
        
        require(
            usdtToken.transfer(owner(), saldo),
            "Retirada de taxas falhou"
        );
    }
    
    /**
     * @dev Obter saldo de taxas
     */
    function getSaldoTaxas() external view returns (uint256) {
        return usdtToken.balanceOf(address(this));
    }
}







