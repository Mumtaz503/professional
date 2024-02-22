const { ethers, network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log("-----------------------------------------");
  log("deploying ChainManager contract...");
  const msgValue = ethers.parseEther("50");

  //Contract verification on Etherscan will be done after local-node testing is complete at project level
  const chainManager = await deploy("ChainManager", {
    from: deployer,
    args: [],
    value: msgValue,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log("-----------------------------------------");
};

module.exports.tags = ["all", "ChainManager"];
