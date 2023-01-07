const hre = require("hardhat");

async function main() {
  // We get the contract to deploy
  const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");

  const accounts = await hre.ethers.getSigners();

  const onwer_count = 3;
  const approvals = 2;
  let owners = accounts.slice(0, onwer_count).map((a) => a.address);
  const msw = await MultiSigWallet.deploy(owners, approvals);

  await msw.deployed();

  console.log("MultiSigWallet deployed to:", msw.address);

  //saveFrontendFiles(greeter);
}

function saveFrontendFiles(greeter) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../frontend/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + "/contract-address.json",
    JSON.stringify({ Greeter: greeter.address }, undefined, 2)
  );

  const GreeterArtifact = artifacts.readArtifactSync("Greeter");

  fs.writeFileSync(
    contractsDir + "/Greeter.json",
    JSON.stringify(GreeterArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
