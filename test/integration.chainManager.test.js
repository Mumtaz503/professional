const { assert, expect } = require("chai");
const { getNamedAccounts, ethers, network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const fs = require("fs");
const path = require("path");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("chainManager staging test", function () {
      let chainManager, idToken, deployer;
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        chainManager = await ethers.getContract("ChainManager", deployer);
        idToken = await ethers.getContract("IDToken", deployer);
      });
      describe("enterUserInfo", function () {
        it("Should work *fingers crossed*", async function () {
          const firstName = "John";
          const lastName = "Doe";
          const field = "spy";
          const edu = "masters";
          const SVG_FILE_PATH = "./images/IdToken.svg";
          const fullSvgPath = path.resolve(SVG_FILE_PATH);
          let idSvg;
          try {
            idSvg = fs.readFileSync(fullSvgPath, "utf8");
          } catch (error) {
            console.error(error);
          }
          const tx = await chainManager.enterUserInfo(
            firstName,
            lastName,
            field,
            edu,
            idSvg
          );
          await tx.wait(1);
          const state = await chainManager.getState();
          assert.equal(state, 0);
        });
      });
    });
