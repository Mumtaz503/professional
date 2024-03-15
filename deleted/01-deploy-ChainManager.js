// const { ethers, network } = require("hardhat");
// const { verify } = require("../utils/verify");
// const { developmentChains } = require("../helper-hardhat-config");

// module.exports = async ({ getNamedAccounts, deployments }) => {
//   const { deploy, log } = deployments;
//   const { deployer } = await getNamedAccounts();
//   log("-----------------------------------------");
//   log("deploying ChainManager contract...");
//   const rewardToken = await ethers.getContract("RewardToken", deployer);
//   const constructorArgs = [rewardToken.target];

//   //Contract verification on Etherscan will be done after local-node testing is complete at project level
//   const chainManager = await deploy("ChainManager", {
//     from: deployer,
//     args: constructorArgs,
//     log: true,
//     waitConfirmations: network.config.blockConfirmations || 1,
//   });
//   log("-----------------------------------------");
//   if (!developmentChains.includes(network.name)) {
//     log("-----------------------------------------");
//     log("verifying reward token contract...");
//     await verify(chainManager.address, constructorArgs);
//     log("-----------------------------------------");
//   }
// };

// module.exports.tags = ["all", "ChainManager"];
