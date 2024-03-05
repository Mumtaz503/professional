const { ethers, network } = require("hardhat");
const fs = require("fs");

const FRONTEND_ADDRESSES_FILE = "../constants/rewardTokenAddress.json";
const FRONTEND_ABI_FILE = "../constants/rewardTokenAbi.json";

module.exports = async function () {
  if (process.env.UPDATE_FRONTEND) {
    console.log("Updating Files for Front-end");
    updateContractAddresses();
    updateAbi();
  }
};

async function updateContractAddresses() {
  const rewardToken = await ethers.getContract("RewardToken");
  const chainId = network.config.chainId.toString();
  const currentAddresses = JSON.parse(
    fs.readFileSync(FRONTEND_ADDRESSES_FILE, "utf8")
  );
  if (chainId in currentAddresses) {
    if (!currentAddresses[chainId].includes(rewardToken.target)) {
      currentAddresses[chainId].push(rewardToken.target);
    }
  }
  {
    currentAddresses[chainId] = [rewardToken.target];
  }
  fs.writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify(currentAddresses));
}

async function updateAbi() {
  const rewardToken = await ethers.getContract("RewardToken");
  fs.writeFileSync(
    FRONTEND_ABI_FILE,
    rewardToken.interface.format(ethers.utils.FormatTypes.json)
  );
}

module.exports.tags = ["frontend"];
