import { expect } from "chai";
import { ethers } from "hardhat";
import { P2PEscrow, MockUSDT } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("P2PEscrow", function () {
  let p2pEscrow: P2PEscrow;
  let mockUSDT: MockUSDT;
  let owner: SignerWithAddress;
  let seller: SignerWithAddress;
  let buyer: SignerWithAddress;
  let amount: number;

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();
    amount = 1000; // 1000 USDT

    // Deploy MockUSDT
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    mockUSDT = await MockUSDT.deploy();
    await mockUSDT.deployed();

    // Deploy P2PEscrow
    const P2PEscrow = await ethers.getContractFactory("P2PEscrow");
    p2pEscrow = await P2PEscrow.deploy(mockUSDT.address);
    await p2pEscrow.deployed();

    // Mint USDT para o comprador
    await mockUSDT.mint(buyer.address, amount);
  });

  describe("createEscrow", function () {
    it("should create a new escrow", async function () {
      // Aprovar USDT para o contrato
      await mockUSDT.connect(buyer).approve(p2pEscrow.address, amount);

      // Criar escrow
      await expect(
        p2pEscrow.connect(buyer).createEscrow(1, amount, seller.address)
      )
        .to.emit(p2pEscrow, "EscrowCreated")
        .withArgs(1, buyer.address, seller.address, amount);

      // Verificar saldo do contrato
      expect(await mockUSDT.balanceOf(p2pEscrow.address)).to.equal(amount);
    });
  });

  describe("releaseEscrow", function () {
    it("should release funds to seller", async function () {
      // Aprovar e criar escrow
      await mockUSDT.connect(buyer).approve(p2pEscrow.address, amount);
      await p2pEscrow.connect(buyer).createEscrow(1, amount, seller.address);

      // Liberar fundos
      await expect(p2pEscrow.connect(buyer).releaseEscrow(1))
        .to.emit(p2pEscrow, "EscrowReleased")
        .withArgs(1, buyer.address, seller.address, amount);

      // Verificar saldos
      expect(await mockUSDT.balanceOf(p2pEscrow.address)).to.equal(0);
      expect(await mockUSDT.balanceOf(seller.address)).to.equal(amount);
    });
  });

  describe("cancelEscrow", function () {
    it("should return funds to buyer", async function () {
      // Aprovar e criar escrow
      await mockUSDT.connect(buyer).approve(p2pEscrow.address, amount);
      await p2pEscrow.connect(buyer).createEscrow(1, amount, seller.address);

      // Cancelar escrow
      await expect(p2pEscrow.connect(buyer).cancelEscrow(1))
        .to.emit(p2pEscrow, "EscrowCancelled")
        .withArgs(1, buyer.address, seller.address, amount);

      // Verificar saldos
      expect(await mockUSDT.balanceOf(p2pEscrow.address)).to.equal(0);
      expect(await mockUSDT.balanceOf(buyer.address)).to.equal(amount);
    });
  });
}); 