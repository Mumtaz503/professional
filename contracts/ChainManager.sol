// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import {IDToken} from "./IDToken.sol";
import {RewardToken} from "./RewardToken.sol";
import "hardhat/console.sol";

/**
 * @title ChainManager manages the interaction of organizations and professionals
 * @notice Allows the users to mint gas minimized professional identities.
 *         Allows organizations to hire/onboard professionals.
 */
contract ChainManager is AutomationCompatibleInterface {
    error ChainManager__UpkeepNotNeeded();
    IDToken idTokenContract = new IDToken(address(this));

    /** @notice I did not use the ERC-1155 token contract here because it won't make any sense if we don't have
     *          Additional attributes for the user to reward. However, the idea of rewarding is explained below
     *          in the rewardUser function
     */
    RewardToken private rewardToken;

    /**
     * @dev DataEntered tracks the state of the contract whenever a professional enters their information
     */
    enum DataEntered {
        NO, //0
        YES //1
    }

    /**
     * @dev This struct tracks the user's information. Can be used later for verification of identities at
     *      project level.
     *      If this struct was to include more lengthy user information we must use bytes objects of required length
     */
    struct UserInfo {
        string firstName;
        string lastName;
        string field;
        string education;
    }

    /**
     * @dev Initialize the DataEntered enum as 0 this won't trigger automation until the enum changes to 1
     */
    DataEntered private s_dataEntered = DataEntered.NO;

    address private s_tokenReciever;
    string private s_idSvgBase;

    /**
     * @dev Mappings to track user's info against their addresses and user's svg (generated on the front-end)
     */
    mapping(address => UserInfo) private s_addressToUserInfo;
    mapping(address => string) private s_addressToSvg;
    event UpkeepPerformed(uint256 balance);

    /**
     * @notice Constructor is payable so at the deployment whoever owns the contract must deploy some ETH to cover
     *          transaction costs. That later professional/organization interactions may cause
     * @dev msg.value in wei 50 * 10 ** 18 = 50 ETH
     */
    constructor() payable {
        require(msg.value >= 50 * 1e18, "not enough ETH");
    }

    /**
     * @dev The function updates the required user info and sets the DataEntered enum to 'Yes' to
     *      trigger automation
     * @param _fName The first name of the user
     * @param _lName The last name of the user
     * @param _field The field of profession
     * @param _svg The IdToken Image (generated on the front-end)
     */
    function enterUserInfo(
        string memory _fName,
        string memory _lName,
        string memory _field,
        string memory _edu,
        string memory _svg
    ) public {
        UserInfo memory userInfo = UserInfo(_fName, _lName, _field, _edu);
        s_dataEntered = DataEntered.YES;
        s_tokenReciever = msg.sender;
        s_addressToUserInfo[msg.sender] = userInfo;
        s_addressToSvg[msg.sender] = _svg;
    }

    /**
     * @dev Whenever the user enters their info the DataEntered turns 'yes' or to '1' and that triggers
     *      checkUpkeep
     * Optional Parameter for a checkData.
     * @return upkeepNeeded the boolean that returns true of the DataEntered is set to 'Yes'
     */
    function checkUpkeep(
        bytes memory /*checkData*/
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory /*performData*/)
    {
        upkeepNeeded = (DataEntered.YES == s_dataEntered);
        return (upkeepNeeded, "0x0");
    }

    /**
     * @dev checkUpkeep will return true once the DataEntered enum's value changes to 1.
     *      this will happen only when a user enters a data.
     *      This will then triggers performUpkeep which mints the identity token to the user's address
     *      cost for performing this function will be paid to chainLink automation oracles in LINK tokens
     */
    function performUpkeep(bytes calldata /*performData*/) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert ChainManager__UpkeepNotNeeded();
        }

        idTokenContract.mintNft(
            s_tokenReciever,
            s_addressToUserInfo[s_tokenReciever].firstName,
            s_addressToUserInfo[s_tokenReciever].lastName,
            s_addressToUserInfo[s_tokenReciever].field,
            s_addressToUserInfo[s_tokenReciever].education,
            s_addressToSvg[s_tokenReciever]
        );

        // This logs as 1. Indicating that the token reciever got an ID token
        console.log(idTokenContract.balanceOf(s_tokenReciever));

        // This logs the Base64 encoded JSON object of the token URI metadata for the identity
        console.log(idTokenContract.tokenURI(0));

        emit UpkeepPerformed(idTokenContract.balanceOf(s_tokenReciever));

        s_dataEntered = DataEntered.NO;
    }

    /**
     *
     * @param _tokenId the token id of the identity owner, we can get it from the event that is emitted
     *                  or we can use the function selector calls that solidity allows
     * @param _value The value that an organization rewards a user with. The value of ERC-1155 tokens.
     */
    function rewardUser(
        uint256 _tokenId,
        uint256 _value /*, uint256 _erc1155TokenId*/
    ) external {
        idTokenContract.updateStats(_tokenId, _value);
    }

    function academicVerification(uint256 _tokenId, uint256 _value) external {
        // Perform academic verification logic here...
        // Make a call to RewardToken contract to mint ERC-1155 for Education verification to professional
        idTokenContract.verifyEducation(_tokenId, _value);
    }

    function getUserInfo(address _user) public view returns (UserInfo memory) {
        return s_addressToUserInfo[_user];
    }

    function getState() public view returns (DataEntered) {
        return s_dataEntered;
    }
}
