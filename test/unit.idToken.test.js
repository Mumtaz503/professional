const { expect, assert } = require("chai");
const { decodeBase64 } = require("ethers");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");

describe("IDToken unit tests", () => {
  let idToken, deployer, user;
  const chainId = network.config.chainId;

  beforeEach(async function () {
    deployer = (await getNamedAccounts()).deployer;
    user = (await getNamedAccounts()).user;
    await deployments.fixture(["all"]);
    idToken = await ethers.getContract("IDToken", deployer);
  });
  //Not ideal to have multiple declarations for multiple assertions in one test.
  //But I had no time
  describe("mintNft function", function () {
    it("Should mint the token to the deployer", async function () {
      const firstName = "pablo";
      const lastName = "escobar";
      const field = "Cocaina";
      const tx = await idToken.mintNft(deployer, firstName, lastName, field);
      await tx.wait(1);
      const tokenId1 = await idToken.getTokenCounter();
      assert.equal(tokenId1, 1); //Token counter increases by 1 after every mint
      const fistName2 = "helena";
      const lastName2 = "carter";
      const field2 = "actor";
      const tx2 = await idToken.mintNft(deployer, fistName2, lastName2, field2);
      await tx2.wait(1);
      const stats0 = await idToken.getStats(0);
      const stats = await idToken.getStats(1);
      const tokenId2 = await idToken.getTokenCounter();
      assert.equal(tokenId2, 2); //Token counter shoud now be 2
      console.log(
        `stats for ${firstName} : ${stats0} && stats for ${fistName2} : ${stats}`
      );
    });
  });
  describe("updateStats function", function () {
    beforeEach(async function () {
      const firstName = "Oscar";
      const lastName = "James";
      const field = "Cybersecurity";
      const tx = await idToken.mintNft(deployer, firstName, lastName, field);
      await tx.wait(1);
    });
    it("Should update the stats as needed", async function () {
      const xp = 10;
      const xp2 = 4;
      await idToken.updateStats(0, xp);
      const stats = await idToken.getStats(0);
      const experience = stats.experiencePoints;
      assert.equal(xp, experience);
      await idToken.updateStats(0, xp2); //A user's stats gets added to previous experience points
      const stats2 = await idToken.getStats(0);
      const experience2 = stats2.experiencePoints;
      const addedExp = xp + xp2;
      assert.equal(experience2, addedExp);
      console.log(`stats updated ${stats2}`);
    });
    it("Should update the URI metadata when stats are updated", async function () {
      const xp = 10;
      await idToken.updateStats(0, xp);
      const tokenUriEncodedString = await idToken.tokenURI(0);
      const base64EncodedString = tokenUriEncodedString.replace(
        "data:application/json;base64,",
        ""
      ); //Separating the json object to test
      const jsonString = atob(base64EncodedString);
      const jsonObj = JSON.parse(jsonString);
      assert.equal(jsonObj.attributes[0].value, xp);
      console.log(jsonObj);
      // Token URI metadata value updated to passed xp
      // {
      //   firstname: 'Oscar',
      //   lastname: 'James',
      //   field: 'Cybersecurity',
      //   attributes: [ { trait_type: 'experience', value: 10 } ],
      //   image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj4NCiAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IndoaXRlIiAvPg0KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIiBmaWxsPSJibGFjayI+UHJvZmVzc2lvbmFsIElkZW50aXR5PC90ZXh0Pg0KPC9zdmc+DQo='
      // }
    });
  });
  describe("getImageUri function", function () {
    it("Should set the image Uri correctly upon deployment", async function () {
      const imageUri = await idToken.getImageUri();
      await expect(imageUri).to.contain("data:image");
    });
  });
  describe("tokenURI function", function () {
    beforeEach(async function () {
      const firstName = "alexandre";
      const lastName = "dumas";
      const field = "writer";
      const tx = await idToken.mintNft(deployer, firstName, lastName, field);
      await tx.wait(1); //Wait for 1 block confirmation
    });
    it("Should initialize the token URI metadata correctly", async function () {
      const tokenUriEncodedString = await idToken.tokenURI(0);
      const base64EncodedString = tokenUriEncodedString.replace(
        "data:application/json;base64,",
        ""
      ); //Separating the json object to test
      const jsonString = atob(base64EncodedString);
      const jsonObj = JSON.parse(jsonString);
      await expect(jsonString).to.contain("alexandre");
      assert.equal(jsonObj.attributes[0].value, 0);
      // Token URI metadata Object sucessfully created with values:
      // {
      //   firstname: 'alexandre',
      //   lastname: 'dumas',
      //   field: 'writer',
      //   attributes: [ { trait_type: 'experience', value: 0 } ],
      //   image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj4NCiAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IndoaXRlIiAvPg0KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIiBmaWxsPSJibGFjayI+UHJvZmVzc2lvbmFsIElkZW50aXR5PC90ZXh0Pg0KPC9zdmc+DQo='
      // }
    });
    it("Should revert on transferFrom call", async function () {
      await expect(
        idToken.transferFrom(deployer, user, 0)
      ).to.be.revertedWithCustomError(
        idToken,
        "IDToken__CannotTransferToken()"
      );
    });
    it("Should revert on safeTransferFrom call", async function () {
      await expect(
        idToken.safeTransferFrom(deployer, user, 0)
      ).to.be.revertedWithCustomError(
        idToken,
        "IDToken__CannotTransferToken()"
      );
    });
  });
});
