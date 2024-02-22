const { network, ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// const SVG_FILE_PATH = "./images/IdToken.svg";

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log("-----------------------------------------");
  log("deploying IDToken contract...");

  // const fullSvgPath = path.resolve(SVG_FILE_PATH);
  // let idSvg;
  // try {
  //   idSvg = fs.readFileSync(fullSvgPath, "utf8");
  // } catch (error) {
  //   console.error(error);
  // }

  const chainManager = await ethers.getContract("ChainManager", deployer);
  const constructorArguments = [/*idSvg,*/ chainManager.target];

  //Contract verification on Etherscan will be done after local-node testing is complete at project level
  const idToken = await deploy("IDToken", {
    from: deployer,
    args: constructorArguments,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  log("-----------------------------------------");
};

module.exports.tags = ["all", "IDToken"];
