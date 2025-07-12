import * as fs from "fs";
import * as path from "path";

async function main() {
  // MockUSDT ABI
  const mockUSDTArtifact = require("../artifacts/contracts/test/MockUSDT.sol/MockUSDT.json");
  fs.writeFileSync(
    path.join(__dirname, "../abi/MockUSDT.json"),
    JSON.stringify(mockUSDTArtifact.abi, null, 2)
  );
  console.log("MockUSDT ABI exportado para abi/MockUSDT.json");

  // P2PEscrow ABI
  const p2pEscrowArtifact = require("../artifacts/contracts/P2PEscrow.sol/P2PEscrow.json");
  fs.writeFileSync(
    path.join(__dirname, "../abi/P2PEscrow.json"),
    JSON.stringify(p2pEscrowArtifact.abi, null, 2)
  );
  console.log("P2PEscrow ABI exportado para abi/P2PEscrow.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 