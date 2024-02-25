const { expect, assert } = require("chai");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

describe("ChainManager unit tests", () => {
  let chainManager, deployer, user, idToken;

  beforeEach(async function () {
    deployer = (await getNamedAccounts()).deployer;
    user = (await getNamedAccounts()).user;
    await deployments.fixture(["all"]);
    chainManager = await ethers.getContract("ChainManager", deployer);
    idToken = await ethers.getContract("IDToken", deployer);
  });

  describe("enterUserInformation function", function () {
    it("Should save the entered info", async function () {
      const firstName = "Islam";
      const lastName = "Makhachev";
      const field = "fighter";
      const tx = await chainManager.enterUserInfo(firstName, lastName, field);
      const txReciept = await tx.wait(1);
      const { gasUsed } = txReciept;
      console.log(gasUsed); //0.000120648 ETH gas used to call this func which equals to 0.36 usd
      const userInfo = await chainManager.getUserInfo(deployer);
      const dataEntered = await chainManager.getState();
      await expect(userInfo).to.contain("Islam");
      assert.equal(dataEntered, 1);
    });
    it("Should mint the token to the deployer with performUpkeep", async function () {
      const firstName = "Walter";
      const lastName = "White";
      const field = "Chemistry teacher";
      const education = "P.H.D";
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
        education,
        idSvg
      );
      await tx.wait(1);
      await network.provider.request({ method: "evm_mine", params: [] });
      // const transactionResponse = await chainManager.performUpkeep("0x");
      // const transactionReciept = await transactionResponse.wait(1);
      // const { gasUsed } = transactionReciept;
      // console.log(`Gas used ${gasUsed}`);
      //1.85 USD is the transaction cost. We'll have to pay LINK token of this amount to chainlink automation nodes.
      await expect(chainManager.performUpkeep("0x")).to.emit(
        chainManager,
        "UpkeepPerformed"
      );
      /* Updated Token URI metadata with Education added */
      // {
      //   "firstname": "Walter",
      //   "lastname": "White",
      //   "field": "Chemistry teacher",
      //   "education": "P.H.D",
      //   "attributes": [
      //     { "trait_type": "experience", "value": 0 },
      //     { "trait_type": "education", "value": 0 }
      //   ],
      //   "image": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj4NCiAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IndoaXRlIiAvPg0KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIiBmaWxsPSJibGFjayI+UHJvZmVzc2lvbmFsIElkZW50aXR5PC90ZXh0Pg0KPC9zdmc+DQo="
      // }
    });
  });
});
