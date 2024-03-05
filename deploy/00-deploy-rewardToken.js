const { network } = require("hardhat");
const { verify } = require("../utils/verify");
const { developmentChains } = require("../helper-hardhat-config");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("-----------------------------------------");
  log("deploying reward token contract...");

  const rewardToken = await deploy("RewardToken", {
    from: deployer,
    log: true,
    args: [],
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log("-----------------------------------------");

  if (!developmentChains.includes(network.name)) {
    log("-----------------------------------------");
    log("verifying reward token contract...");
    await verify(rewardToken.address, []);
    log("-----------------------------------------");
  }
};

module.exports.tags = ["all", "reward"];
