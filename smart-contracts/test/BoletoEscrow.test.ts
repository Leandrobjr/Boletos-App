import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { BoletoEscrow, MockUSDT } from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("BoletoEscrow", function () {
  let boletoEscrow: BoletoEscrow;
  let mockUSDT: MockUSDT;
  let owner: SignerWithAddress;
  let vendedor: SignerWithAddress;
  let comprador: SignerWithAddress;
  let outroUsuario: SignerWithAddress;
  
  // Endereço da carteira da aplicação para receber taxas
  const FEE_RECIPIENT = "0x636731Eb388adeF4f61d3Fb9C80F626F067fD357";

  // Constantes do contrato
  const INITIAL_USDT_SUPPLY = ethers.parseUnits("1000000", 6); // 1M USDT
  const BOLETO_AMOUNT = ethers.parseUnits("100", 6); // 100 USDT
  const TRANSACTION_FEE_PERCENTAGE = 200; // 2%
  const FEE_DENOMINATOR = 10000;
  const PROOF_UPLOAD_DEADLINE = 3600; // 1 hora
  const AUTO_RELEASE_DEADLINE = 259200; // 72 horas
  const INSTANT_RELEASE_WINDOW = 7200; // 2 horas
  const HALF_FEE_WINDOW = 86400; // 24 horas
  const QUARTER_FEE_WINDOW = 172800; // 48 horas
  const COOLDOWN_PERIOD = 300; // 5 minutos

  beforeEach(async function () {
    [owner, vendedor, comprador, outroUsuario] = await ethers.getSigners();

    // Deploy MockUSDT
    const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
    mockUSDT = await MockUSDTFactory.deploy(INITIAL_USDT_SUPPLY);
    await mockUSDT.waitForDeployment();

    // Deploy BoletoEscrow
    const BoletoEscrowFactory = await ethers.getContractFactory("BoletoEscrow");
    boletoEscrow = await BoletoEscrowFactory.deploy(await mockUSDT.getAddress(), FEE_RECIPIENT);
    await boletoEscrow.waitForDeployment();

    // Distribuir USDT para vendedor
    await mockUSDT.transfer(vendedor.address, ethers.parseUnits("10000", 6));
    
    // Vendedor aprova o contrato a gastar USDT
    await mockUSDT.connect(vendedor).approve(
      await boletoEscrow.getAddress(), 
      ethers.parseUnits("10000", 6)
    );
  });

  describe("Deployment", function () {
    it("Deve configurar corretamente o endereço USDT", async function () {
      expect(await boletoEscrow.usdt()).to.equal(await mockUSDT.getAddress());
    });

    it("Deve configurar corretamente o owner", async function () {
      expect(await boletoEscrow.owner()).to.equal(owner.address);
    });

    it("Deve inicializar estatísticas zeradas", async function () {
      const stats = await boletoEscrow.getStats();
      expect(stats._totalTransactions).to.equal(0);
      expect(stats._totalVolumeUSDT).to.equal(0);
      expect(stats._totalFeesCollected).to.equal(0);
    });
  });

  describe("createTransaction", function () {
    const boletoId = 12345;
    const vencimentoFuturo = Math.floor(Date.now() / 1000) + 86400 * 10; // 10 dias no futuro

    it("Deve criar transação com sucesso", async function () {
      const tx = await boletoEscrow.connect(vendedor).createTransaction(
        boletoId,
        BOLETO_AMOUNT,
        vencimentoFuturo
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          return boletoEscrow.interface.parseLog(log as any)?.name === "TransactionCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      // Verificar se o USDT foi travado no contrato
      const expectedTransactionFee = (BOLETO_AMOUNT * BigInt(TRANSACTION_FEE_PERCENTAGE)) / BigInt(FEE_DENOMINATOR);
      const expectedTotal = BOLETO_AMOUNT + expectedTransactionFee;
      expect(await mockUSDT.balanceOf(await boletoEscrow.getAddress())).to.equal(expectedTotal);
    });

    it("Deve rejeitar boleto com vencimento muito próximo", async function () {
      const vencimentoProximo = Math.floor(Date.now() / 1000) + 3600; // 1 hora no futuro
      
      await expect(
        boletoEscrow.connect(vendedor).createTransaction(boletoId, BOLETO_AMOUNT, vencimentoProximo)
      ).to.be.revertedWith("BoletoEscrow: Boleto deve vencer em pelo menos 1 dia");
    });

    it("Deve rejeitar valor zero", async function () {
      await expect(
        boletoEscrow.connect(vendedor).createTransaction(boletoId, 0, vencimentoFuturo)
      ).to.be.revertedWith("BoletoEscrow: Valor deve ser maior que zero");
    });

    it("Deve rejeitar boleto duplicado", async function () {
      // Criar primeira transação
      await boletoEscrow.connect(vendedor).createTransaction(boletoId, BOLETO_AMOUNT, vencimentoFuturo);
      
      // Esperar cooldown
      await time.increase(COOLDOWN_PERIOD + 1);
      
      // Tentar criar novamente com mesmo boleto ID
      await expect(
        boletoEscrow.connect(vendedor).createTransaction(boletoId, BOLETO_AMOUNT, vencimentoFuturo)
      ).to.be.revertedWith("BoletoEscrow: Boleto ja possui transacao ativa");
    });
  });

  describe("selectTransaction", function () {
    let transactionId: string;
    const boletoId = 12345;
    const vencimentoFuturo = Math.floor(Date.now() / 1000) + 86400 * 10;

    beforeEach(async function () {
      const tx = await boletoEscrow.connect(vendedor).createTransaction(
        boletoId,
        BOLETO_AMOUNT,
        vencimentoFuturo
      );
      const receipt = await tx.wait();
      
      const event = receipt?.logs.find(log => {
        try {
          const parsed = boletoEscrow.interface.parseLog(log as any);
          return parsed?.name === "TransactionCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = boletoEscrow.interface.parseLog(event as any);
        transactionId = parsed?.args[0];
      }
    });

    it("Deve permitir comprador selecionar transação", async function () {
      await expect(
        boletoEscrow.connect(comprador).selectTransaction(transactionId)
      ).to.emit(boletoEscrow, "TransactionSelected");

      const transaction = await boletoEscrow.getTransaction(transactionId);
      expect(transaction.buyer).to.equal(comprador.address);
      expect(transaction.status).to.equal(1); // AGUARDANDO_PAGAMENTO
    });

    it("Deve rejeitar vendedor selecionando própria transação", async function () {
      await time.increase(COOLDOWN_PERIOD + 1);
      await expect(
        boletoEscrow.connect(vendedor).selectTransaction(transactionId)
      ).to.be.revertedWith("BoletoEscrow: Vendedor nao pode selecionar propria transacao");
    });

    it.skip("Deve aplicar cooldown entre ações", async function () {
      await time.increase(COOLDOWN_PERIOD + 1);
      await boletoEscrow.connect(comprador).selectTransaction(transactionId);
      
      // Criar nova transação (vendedor tem que esperar cooldown também)
      await time.increase(COOLDOWN_PERIOD + 1);
      const novoBoletoId = 54321;
      await boletoEscrow.connect(vendedor).createTransaction(
        novoBoletoId,
        BOLETO_AMOUNT,
        vencimentoFuturo
      );
      
      const novoTransactionId = await boletoEscrow.getTransactionByBoleto(novoBoletoId);
      
      // Tentar selecionar imediatamente (sem cooldown) deve falhar
      await expect(
        boletoEscrow.connect(comprador).selectTransaction(novoTransactionId)
      ).to.be.revertedWith("BoletoEscrow: Aguarde o periodo de cooldown");
    });
  });

  describe("uploadProof", function () {
    let transactionId: string;
    const boletoId = 12345;
    const vencimentoFuturo = Math.floor(Date.now() / 1000) + 86400 * 10;

    beforeEach(async function () {
      // Criar transação
      const createTx = await boletoEscrow.connect(vendedor).createTransaction(
        boletoId,
        BOLETO_AMOUNT,
        vencimentoFuturo
      );
      const createReceipt = await createTx.wait();
      
      const createEvent = createReceipt?.logs.find(log => {
        try {
          const parsed = boletoEscrow.interface.parseLog(log as any);
          return parsed?.name === "TransactionCreated";
        } catch {
          return false;
        }
      });
      
      if (createEvent) {
        const parsed = boletoEscrow.interface.parseLog(createEvent as any);
        transactionId = parsed?.args[0];
      }

      // Avançar tempo para passar cooldown
      await time.increase(300);

      // Comprador seleciona transação
      await boletoEscrow.connect(comprador).selectTransaction(transactionId);
    });

    it("Deve permitir upload de comprovante dentro do prazo", async function () {
      await expect(
        boletoEscrow.connect(comprador).uploadProof(transactionId)
      ).to.emit(boletoEscrow, "ProofUploaded");

      const transaction = await boletoEscrow.getTransaction(transactionId);
      expect(transaction.status).to.equal(2); // AGUARDANDO_BAIXA
      expect(transaction.proofUploadedAt).to.be.gt(0);
    });

    it("Deve rejeitar upload após prazo expirado", async function () {
      // Avançar tempo além do prazo de 1 hora
      await time.increase(PROOF_UPLOAD_DEADLINE + 1);

      await expect(
        boletoEscrow.connect(comprador).uploadProof(transactionId)
      ).to.be.revertedWith("BoletoEscrow: Prazo para envio de comprovante expirado");
    });

    it("Deve rejeitar upload por usuário que não é o comprador", async function () {
      await expect(
        boletoEscrow.connect(outroUsuario).uploadProof(transactionId)
      ).to.be.revertedWith("BoletoEscrow: Apenas comprador");
    });
  });

  describe("manualRelease e autoRelease", function () {
    let transactionId: string;
    const boletoId = 12345;
    const vencimentoFuturo = Math.floor(Date.now() / 1000) + 86400 * 10;

    beforeEach(async function () {
      // Fluxo completo até upload de comprovante
      const createTx = await boletoEscrow.connect(vendedor).createTransaction(
        boletoId,
        BOLETO_AMOUNT,
        vencimentoFuturo
      );
      const createReceipt = await createTx.wait();
      
      const createEvent = createReceipt?.logs.find(log => {
        try {
          const parsed = boletoEscrow.interface.parseLog(log as any);
          return parsed?.name === "TransactionCreated";
        } catch {
          return false;
        }
      });
      
      if (createEvent) {
        const parsed = boletoEscrow.interface.parseLog(createEvent as any);
        transactionId = parsed?.args[0];
      }

      await time.increase(300); // Cooldown
      await boletoEscrow.connect(comprador).selectTransaction(transactionId);
      await boletoEscrow.connect(comprador).uploadProof(transactionId);
    });

    it("Deve permitir baixa manual pelo vendedor", async function () {
      const compradorBalanceInicial = await mockUSDT.balanceOf(comprador.address);
      const feeRecipientBalanceInicial = await mockUSDT.balanceOf(FEE_RECIPIENT);

      await expect(
        boletoEscrow.connect(vendedor).manualRelease(transactionId)
      ).to.emit(boletoEscrow, "TransactionCompleted");

      const transaction = await boletoEscrow.getTransaction(transactionId);
      expect(transaction.status).to.equal(3); // BAIXADO
      expect(transaction.fundsReleased).to.be.true;

      // Verificar se os fundos foram distribuídos
      const compradorBalanceFinal = await mockUSDT.balanceOf(comprador.address);
      const feeRecipientBalanceFinal = await mockUSDT.balanceOf(FEE_RECIPIENT);

      expect(compradorBalanceFinal).to.be.gt(compradorBalanceInicial);
      expect(feeRecipientBalanceFinal).to.be.gt(feeRecipientBalanceInicial);
    });

    it("Deve permitir baixa automática após 72h", async function () {
      // Avançar tempo para 72h + 1 segundo
      await time.increase(AUTO_RELEASE_DEADLINE + 1);

      await expect(
        boletoEscrow.connect(outroUsuario).autoRelease(transactionId)
      ).to.emit(boletoEscrow, "TransactionCompleted");

      const transaction = await boletoEscrow.getTransaction(transactionId);
      expect(transaction.status).to.equal(3); // BAIXADO
    });

    it("Deve rejeitar baixa automática antes de 72h", async function () {
      await expect(
        boletoEscrow.connect(outroUsuario).autoRelease(transactionId)
      ).to.be.revertedWith("BoletoEscrow: Ainda dentro do prazo de baixa manual");
    });
  });

  describe("Sistema de Taxas por Tempo", function () {
    let transactionId: string;
    const boletoId = 12345;
    const vencimentoFuturo = Math.floor(Date.now() / 1000) + 86400 * 10;

    beforeEach(async function () {
      // Fluxo até upload de comprovante
      const createTx = await boletoEscrow.connect(vendedor).createTransaction(
        boletoId,
        BOLETO_AMOUNT,
        vencimentoFuturo
      );
      const createReceipt = await createTx.wait();
      
      const createEvent = createReceipt?.logs.find(log => {
        try {
          const parsed = boletoEscrow.interface.parseLog(log as any);
          return parsed?.name === "TransactionCreated";
        } catch {
          return false;
        }
      });
      
      if (createEvent) {
        const parsed = boletoEscrow.interface.parseLog(createEvent as any);
        transactionId = parsed?.args[0];
      }

      await time.increase(300);
      await boletoEscrow.connect(comprador).selectTransaction(transactionId);
      await boletoEscrow.connect(comprador).uploadProof(transactionId);
    });

    it("Taxa de transação: 100% devolvida para vendedor (baixa em até 2h)", async function () {
      const vendedorBalanceInicial = await mockUSDT.balanceOf(vendedor.address);
      const feeRecipientBalanceInicial = await mockUSDT.balanceOf(FEE_RECIPIENT);

      // Baixar em 1 hora (dentro de 2h)
      await time.increase(3600);
      await boletoEscrow.connect(vendedor).manualRelease(transactionId);

      const vendedorBalanceFinal = await mockUSDT.balanceOf(vendedor.address);
      const feeRecipientBalanceFinal = await mockUSDT.balanceOf(FEE_RECIPIENT);

      const transaction = await boletoEscrow.getTransaction(transactionId);
      
      // Vendedor deve receber de volta toda a taxa de transação
      expect(vendedorBalanceFinal).to.equal(vendedorBalanceInicial + transaction.transactionFee);
      
      // FeeRecipient deve receber apenas a taxa do comprador
      expect(feeRecipientBalanceFinal).to.equal(feeRecipientBalanceInicial + transaction.buyerFee);
    });

    it("Taxa de transação: 50% devolvida para vendedor (baixa entre 2h e 24h)", async function () {
      const vendedorBalanceInicial = await mockUSDT.balanceOf(vendedor.address);
      const feeRecipientBalanceInicial = await mockUSDT.balanceOf(FEE_RECIPIENT);

      // Baixar em 12 horas (entre 2h e 24h)
      await time.increase(43200);
      await boletoEscrow.connect(vendedor).manualRelease(transactionId);

      const vendedorBalanceFinal = await mockUSDT.balanceOf(vendedor.address);
      const feeRecipientBalanceFinal = await mockUSDT.balanceOf(FEE_RECIPIENT);

      const transaction = await boletoEscrow.getTransaction(transactionId);
      
      // Vendedor deve receber 50% da taxa de transação
      expect(vendedorBalanceFinal).to.equal(vendedorBalanceInicial + (transaction.transactionFee / 2n));
      
      // Owner deve receber taxa do comprador + 50% da taxa de transação
      expect(feeRecipientBalanceFinal).to.equal(feeRecipientBalanceInicial + transaction.buyerFee + (transaction.transactionFee / 2n));
    });

    it("Taxa de transação: 25% devolvida para vendedor (baixa entre 24h e 48h)", async function () {
      const vendedorBalanceInicial = await mockUSDT.balanceOf(vendedor.address);
      const feeRecipientBalanceInicial = await mockUSDT.balanceOf(FEE_RECIPIENT);

      // Baixar em 36 horas (entre 24h e 48h)
      await time.increase(129600);
      await boletoEscrow.connect(vendedor).manualRelease(transactionId);

      const vendedorBalanceFinal = await mockUSDT.balanceOf(vendedor.address);
      const feeRecipientBalanceFinal = await mockUSDT.balanceOf(FEE_RECIPIENT);

      const transaction = await boletoEscrow.getTransaction(transactionId);
      
      // Vendedor deve receber 25% da taxa de transação
      expect(vendedorBalanceFinal).to.equal(vendedorBalanceInicial + (transaction.transactionFee / 4n));
      
      // Owner deve receber taxa do comprador + 75% da taxa de transação
      expect(feeRecipientBalanceFinal).to.equal(feeRecipientBalanceInicial + transaction.buyerFee + (transaction.transactionFee * 3n / 4n));
    });

    it("Taxa de transação: 0% devolvida para vendedor (baixa após 48h)", async function () {
      const vendedorBalanceInicial = await mockUSDT.balanceOf(vendedor.address);
      const feeRecipientBalanceInicial = await mockUSDT.balanceOf(FEE_RECIPIENT);

      // Baixar em 60 horas (após 48h)
      await time.increase(216000);
      await boletoEscrow.connect(vendedor).manualRelease(transactionId);

      const vendedorBalanceFinal = await mockUSDT.balanceOf(vendedor.address);
      const feeRecipientBalanceFinal = await mockUSDT.balanceOf(FEE_RECIPIENT);

      const transaction = await boletoEscrow.getTransaction(transactionId);
      
      // Vendedor não deve receber nada da taxa de transação
      expect(vendedorBalanceFinal).to.equal(vendedorBalanceInicial);
      
      // Owner deve receber toda a taxa (comprador + transação)
      expect(feeRecipientBalanceFinal).to.equal(feeRecipientBalanceInicial + transaction.buyerFee + transaction.transactionFee);
    });
  });

  describe("cancelTransaction", function () {
    let transactionId: string;
    const boletoId = 12345;
    const vencimentoFuturo = Math.floor(Date.now() / 1000) + 86400 * 10;

    beforeEach(async function () {
      const createTx = await boletoEscrow.connect(vendedor).createTransaction(
        boletoId,
        BOLETO_AMOUNT,
        vencimentoFuturo
      );
      const createReceipt = await createTx.wait();
      
      const createEvent = createReceipt?.logs.find(log => {
        try {
          const parsed = boletoEscrow.interface.parseLog(log as any);
          return parsed?.name === "TransactionCreated";
        } catch {
          return false;
        }
      });
      
      if (createEvent) {
        const parsed = boletoEscrow.interface.parseLog(createEvent as any);
        transactionId = parsed?.args[0];
      }
    });

    it("Deve permitir cancelamento pelo vendedor quando status DISPONIVEL", async function () {
      const vendedorBalanceInicial = await mockUSDT.balanceOf(vendedor.address);

      await expect(
        boletoEscrow.connect(vendedor).cancelTransaction(transactionId)
      ).to.emit(boletoEscrow, "TransactionCancelled");

      const transaction = await boletoEscrow.getTransaction(transactionId);
      expect(transaction.status).to.equal(4); // CANCELADO

      // Verificar se o USDT foi devolvido
      const vendedorBalanceFinal = await mockUSDT.balanceOf(vendedor.address);
      const expectedRefund = BOLETO_AMOUNT + ((BOLETO_AMOUNT * BigInt(TRANSACTION_FEE_PERCENTAGE)) / BigInt(FEE_DENOMINATOR));
      expect(vendedorBalanceFinal).to.equal(vendedorBalanceInicial + expectedRefund);
    });

    it("Deve rejeitar cancelamento após transação ser selecionada", async function () {
      await time.increase(300);
      await boletoEscrow.connect(comprador).selectTransaction(transactionId);

      await expect(
        boletoEscrow.connect(vendedor).cancelTransaction(transactionId)
      ).to.be.revertedWith("BoletoEscrow: Status invalido para esta operacao");
    });
  });

  describe("Sistema de Disputas", function () {
    let transactionId: string;
    const boletoId = 12345;
    const vencimentoFuturo = Math.floor(Date.now() / 1000) + 86400 * 10;

    beforeEach(async function () {
      // Fluxo até upload de comprovante
      const createTx = await boletoEscrow.connect(vendedor).createTransaction(
        boletoId,
        BOLETO_AMOUNT,
        vencimentoFuturo
      );
      const createReceipt = await createTx.wait();
      
      const createEvent = createReceipt?.logs.find(log => {
        try {
          const parsed = boletoEscrow.interface.parseLog(log as any);
          return parsed?.name === "TransactionCreated";
        } catch {
          return false;
        }
      });
      
      if (createEvent) {
        const parsed = boletoEscrow.interface.parseLog(createEvent as any);
        transactionId = parsed?.args[0];
      }

      await time.increase(300);
      await boletoEscrow.connect(comprador).selectTransaction(transactionId);
      await boletoEscrow.connect(comprador).uploadProof(transactionId);
    });

    it("Deve permitir criação de disputa por comprador", async function () {
      await expect(
        boletoEscrow.connect(comprador).createDispute(transactionId, "Boleto não foi baixado")
      ).to.emit(boletoEscrow, "DisputeCreated");

      const transaction = await boletoEscrow.getTransaction(transactionId);
      expect(transaction.status).to.equal(6); // DISPUTA
    });

    it("Deve permitir criação de disputa por vendedor", async function () {
      await expect(
        boletoEscrow.connect(vendedor).createDispute(transactionId, "Comprovante falso")
      ).to.emit(boletoEscrow, "DisputeCreated");

      const transaction = await boletoEscrow.getTransaction(transactionId);
      expect(transaction.status).to.equal(6); // DISPUTA
    });

    it("Deve rejeitar criação de disputa por terceiros", async function () {
      await expect(
        boletoEscrow.connect(outroUsuario).createDispute(transactionId, "Motivo qualquer")
      ).to.be.revertedWith("BoletoEscrow: Apenas participantes da transacao");
    });

    it("Deve permitir resolução de disputa pelo administrador - favorável ao comprador", async function () {
      await boletoEscrow.connect(comprador).createDispute(transactionId, "Boleto não foi baixado");

      const compradorBalanceInicial = await mockUSDT.balanceOf(comprador.address);

      await expect(
        boletoEscrow.connect(owner).resolveDispute(transactionId, true, "Comprovante válido")
      ).to.emit(boletoEscrow, "TransactionCompleted");

      const transaction = await boletoEscrow.getTransaction(transactionId);
      expect(transaction.status).to.equal(3); // BAIXADO

      const compradorBalanceFinal = await mockUSDT.balanceOf(comprador.address);
      expect(compradorBalanceFinal).to.be.gt(compradorBalanceInicial);
    });

    it("Deve permitir resolução de disputa pelo administrador - favorável ao vendedor", async function () {
      await boletoEscrow.connect(comprador).createDispute(transactionId, "Boleto não foi baixado");

      const vendedorBalanceInicial = await mockUSDT.balanceOf(vendedor.address);

      await expect(
        boletoEscrow.connect(owner).resolveDispute(transactionId, false, "Comprovante inválido")
      ).to.emit(boletoEscrow, "TransactionCancelled");

      const transaction = await boletoEscrow.getTransaction(transactionId);
      expect(transaction.status).to.equal(4); // CANCELADO

      const vendedorBalanceFinal = await mockUSDT.balanceOf(vendedor.address);
      expect(vendedorBalanceFinal).to.be.gt(vendedorBalanceInicial);
    });
  });

  describe("Funções Administrativas", function () {
    it("Deve permitir pausar contrato pelo owner", async function () {
      await boletoEscrow.connect(owner).pause();
      expect(await boletoEscrow.paused()).to.be.true;
    });

    it("Deve rejeitar operações quando pausado", async function () {
      await boletoEscrow.connect(owner).pause();

      const boletoId = 12345;
      const vencimentoFuturo = Math.floor(Date.now() / 1000) + 86400 * 10;

      await expect(
        boletoEscrow.connect(vendedor).createTransaction(boletoId, BOLETO_AMOUNT, vencimentoFuturo)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Deve permitir retirada de emergência quando pausado", async function () {
      // Primeiro criar uma transação para ter fundos no contrato
      const boletoId = 12345;
      const vencimentoFuturo = Math.floor(Date.now() / 1000) + 86400 * 10;
      await boletoEscrow.connect(vendedor).createTransaction(boletoId, BOLETO_AMOUNT, vencimentoFuturo);

      // Pausar contrato
      await boletoEscrow.connect(owner).pause();

      const feeRecipientBalanceInicial = await mockUSDT.balanceOf(FEE_RECIPIENT);
      const contractBalance = await mockUSDT.balanceOf(await boletoEscrow.getAddress());

      await expect(
        boletoEscrow.connect(owner).emergencyWithdraw(
          await mockUSDT.getAddress(),
          contractBalance,
          "Situação de emergência"
        )
      ).to.emit(boletoEscrow, "EmergencyWithdraw");

      const feeRecipientBalanceFinal = await mockUSDT.balanceOf(FEE_RECIPIENT);
      expect(feeRecipientBalanceFinal).to.equal(feeRecipientBalanceInicial + contractBalance);
    });
  });

  describe("Funções de Consulta", function () {
    let transactionId: string;
    const boletoId = 12345;

    beforeEach(async function () {
      const currentTime = await time.latest();
      const vencimentoFuturo = currentTime + 86400 * 10;
      
      const createTx = await boletoEscrow.connect(vendedor).createTransaction(
        boletoId,
        BOLETO_AMOUNT,
        vencimentoFuturo
      );
      const createReceipt = await createTx.wait();
      
      const createEvent = createReceipt?.logs.find(log => {
        try {
          const parsed = boletoEscrow.interface.parseLog(log as any);
          return parsed?.name === "TransactionCreated";
        } catch {
          return false;
        }
      });
      
      if (createEvent) {
        const parsed = boletoEscrow.interface.parseLog(createEvent as any);
        transactionId = parsed?.args[0];
      }
    });

    it("Deve retornar transação por ID do boleto", async function () {
      const foundTransactionId = await boletoEscrow.getTransactionByBoleto(boletoId);
      expect(foundTransactionId).to.equal(transactionId);
    });

    it("Deve verificar corretamente se pode fazer upload", async function () {
      // Inicialmente false (não selecionado)
      expect(await boletoEscrow.canUploadProof(transactionId)).to.be.false;

      // Após seleção, deve ser true
      await time.increase(300);
      await boletoEscrow.connect(comprador).selectTransaction(transactionId);
      expect(await boletoEscrow.canUploadProof(transactionId)).to.be.true;

      // Após expirar prazo, deve ser false
      await time.increase(PROOF_UPLOAD_DEADLINE + 1);
      expect(await boletoEscrow.canUploadProof(transactionId)).to.be.false;
    });

    it("Deve verificar corretamente se pode fazer baixa automática", async function () {
      await time.increase(300);
      await boletoEscrow.connect(comprador).selectTransaction(transactionId);
      await boletoEscrow.connect(comprador).uploadProof(transactionId);

      // Antes de 72h, deve ser false
      expect(await boletoEscrow.canAutoRelease(transactionId)).to.be.false;

      // Após 72h, deve ser true
      await time.increase(AUTO_RELEASE_DEADLINE + 1);
      expect(await boletoEscrow.canAutoRelease(transactionId)).to.be.true;
    });

    it("Deve retornar estatísticas corretas", async function () {
      const stats = await boletoEscrow.getStats();
      expect(stats._totalTransactions).to.equal(1);
      expect(stats._totalVolumeUSDT).to.equal(BOLETO_AMOUNT);
      expect(stats._contractBalance).to.be.gt(0);
    });
  });

  describe("Cálculo de Taxa do Comprador", function () {
    it("Deve calcular taxa fixa para valores até 100 USDT", async function () {
      const valorBaixo = ethers.parseUnits("50", 6); // 50 USDT
      const taxa = await boletoEscrow.calculateBuyerFee(valorBaixo);
      const taxaEsperada = ethers.parseUnits("5", 6); // R$ 5 em USDT
      expect(taxa).to.equal(taxaEsperada);
    });

    it("Deve calcular taxa percentual para valores acima de 100 USDT", async function () {
      const valorAlto = ethers.parseUnits("500", 6); // 500 USDT
      const taxa = await boletoEscrow.calculateBuyerFee(valorAlto);
      const taxaEsperada = (valorAlto * 400n) / 10000n; // 4%
      expect(taxa).to.equal(taxaEsperada);
    });
  });
});
