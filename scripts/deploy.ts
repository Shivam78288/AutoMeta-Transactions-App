import hre, { ethers } from "hardhat";
import { writeFileSync } from "fs";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  // Deploy forwarder first to get the address for Recipient Contract constructor

  const wallet = new hre.ethers.Wallet(process.env.PRIVATE_KEY || "");
  const relayer = wallet.address;

  console.log("forwarder deployment started");
  const Forwarder = await hre.ethers.getContractFactory("Forwarder");
  const forwarder = await Forwarder.deploy(relayer);
  await forwarder.deployed();
  console.log("forwarder deployment ended");

  console.log("recipient deployment started");
  const Recipient = await hre.ethers.getContractFactory("RecipientERC20");
  const recipient = await Recipient.deploy(forwarder.address);
  await recipient.deployed();

  // Just to mint for some testing
  await recipient.mint(
    process.env.TESTER_ADDRESS,
    ethers.utils.parseEther("1000")
  );
  console.log("recipient deployment ended");

  writeFileSync(
    "src/deploy.json",
    JSON.stringify({
      RecipientERC20: recipient.address,
      Forwarder: forwarder.address,
    })
  );

  console.log(
    `RecipientERC20: ${recipient.address}`,
    `Forwarder: ${forwarder.address}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
