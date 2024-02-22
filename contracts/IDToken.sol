// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

/**
 * @title IDToken a non-transferable ERC-721 token that allows professional individuals to
 *          create their on-chain Identities.
 * The metadata of these identities will reflect the changes in user's attributes
 * These identities are 100% on-chain and non-transferable
 * I will mention what can be added later on
 * @dev The IDToken extends the ERC721URIStorage and Ownable contracts.
 * @dev The openzeppelin ERC-721 (v0.5.0) contract doesn't allow for `_setTokenURI`
 *      function so we had to use ERC721URIStorage to change the tokenURI
 *      whenever a professional's stats change i.e their experience, hiring, rewards, etc.
 * @notice The contract's functionality and outputs are explained in the idToken.test.js file
 *         in the 'test' folder.
 * @notice For the task level, I have only included the base level functionality as explained
 *         in the docs I shared with you.
 *         Additional functionality can be added as per requirements
 */
contract IDToken is ERC721URIStorage, Ownable {
    /* Custom error codes to save gas (see gas-report.txt file in gas-reports folder)*/
    error IDToken__QueryForNonExistentToken();
    error IDToken__ImageNotFound();
    error IDToken__CannotTransferToken();

    /** @dev allows for a usage of uint256 for encoding bytes and strings */
    using Strings for uint256;

    /** @dev a struct type declaration to keep track of a user's info
     *  @notice experiencePoints can be equated to the amount of our ERC-1155 tokens a user
     *          holds in their wallets. Its a thought for project level.
     *          This isn't possible in your budget range.
     */
    struct Stats {
        string firstName;
        string lastName;
        string field;
        uint256 experiencePoints;
    }

    /** @dev s_tokenCounter acts as the tokenId of the professional's token
     *       can change this to another form of creating the ID at project level
     */
    uint256 private s_tokenCounter;
    string private s_idSvgUri;
    address private immutable i_chainMgr;

    /** @dev events are used in the front-end to render the changes on the blockchain.
     *       Can add more events for tokenURI and metadata.
     */
    event IdTokenMinted(
        address indexed professional_,
        uint256 indexed tokenId_,
        string fName_,
        string lName_,
        string field_
    );
    event StatsUpdated(
        address indexed professional_,
        uint256 indexed tokenId_,
        uint256 experiencePoints_
    );

    /** @dev mapping to keep track of all the userInfo/stats against the issued tokenId */
    mapping(uint256 => Stats) private s_tokenIdToStats;

    /** @param _chainMgr is the address of chain manager contract that acts as the owner of this
     *         token contract
     */
    constructor(
        // string memory _idTokenSvg,
        address _chainMgr
    ) ERC721("Professional", "PRO") Ownable(_chainMgr) {
        i_chainMgr = _chainMgr;
        s_tokenCounter = 0;
    }

    /**
     * @dev The function can only be called by the chain manager contract
     *      this is done to minimize the gas costs a professional may face when minting.
     *      a professional will call the "enterUserInformation" function in the chain manager
     *      contract by passing in the required info then this function will be triggered
     *      in an automated manner to mint the token to the user.
     * @param _to The address of the professional who will call this function in
     *            the chain manager contract
     * @param _fName The first name of the professional
     * @param _lName The last name of the professional
     * @param _field The field of the
     * @param _svg The svg image of the identity token
     * @notice This is only the basic functionality of the function. At "project level" there
     *          will be quite a few checks to ensure that the function is not prone to
     *          reentrancy attacks since its making a call to an outside contract.
     *          We can add additional checks to not allow a professional to make more than 1 identity
     *          We can also add a different tokenId obtained through on-chain randomness.
     *          not possible at task level
     */
    function mintNft(
        address _to,
        string memory _fName,
        string memory _lName,
        string memory _field,
        string memory _svg
    ) external onlyOwner {
        s_tokenIdToStats[s_tokenCounter] = Stats(_fName, _lName, _field, 0);
        _safeMint(_to, s_tokenCounter);
        s_tokenCounter = s_tokenCounter + 1;
        s_idSvgUri = svgToImageUri(_svg);
        emit IdTokenMinted(_to, s_tokenCounter, _fName, _lName, _field);
        console.log("Working");
    }

    /**
     * @dev is set to onlyOwner and will be called by the chain manager contract
     *      an organization or a company can reward an employ (professional) ERC-1155 tokens
     *      the amount will be reflected as _experiencePoints here.
     *      the function updates the experiencePoints in the s_tokenIdToStats mapping
     *      then sets the new tokenURI
     * @param _tokenId Is the ID of the minted professional identity. We can get it from the event fired from
     *                  'mintNft' function or we can make function selector calls to get the id
     * @param _experiencePoints the amount of ERC-1155 tokens minted to the professional by the
     *                          company/organization
     */
    function updateStats(
        uint256 _tokenId,
        uint256 _experiencePoints
    ) external onlyOwner {
        if (_ownerOf(_tokenId) == address(0)) {
            revert IDToken__QueryForNonExistentToken();
        }

        s_tokenIdToStats[_tokenId].experiencePoints += _experiencePoints;
        emit StatsUpdated(
            _ownerOf(_tokenId),
            _tokenId,
            s_tokenIdToStats[_tokenId].experiencePoints
        );
        _setTokenURI(_tokenId, tokenURI(_tokenId));
    }

    /**
     * @dev The purpose of this function is to block the transfer of identity token to anyone
     *      hence making the identity token non-transferable and the professional to be completely
     *      under control of their identity
     * @param _to The address of the reciever which in this case is set to null
     * @param _tokenId The token id of the identity token
     * @param _auth optional auth parameter in the overriden function
     */
    function _update(
        address _to,
        uint256 _tokenId,
        address _auth
    ) internal override(ERC721) returns (address) {
        address from = _ownerOf(_tokenId);
        if (from != address(0) && _to != address(0)) {
            revert IDToken__CannotTransferToken();
        }
        return super._update(_to, _tokenId, _auth);
    }

    /**
     * @dev the base URI for the metadata of the identity
     *      "data:application/json;base64," allows for the json object to be rendered in the
     *      browser for viewing
     */
    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    /**
     * @dev The function returns a stringified token URI metadata
     *      after concatenating the Base64 encoded json object with _baseURI
     *      (This was the hardest part)
     * @param _tokenId the token ID of the minted Identity token
     */
    function tokenURI(
        uint256 _tokenId
    ) public view virtual override returns (string memory) {
        if (ownerOf(_tokenId) == address(0)) {
            revert IDToken__QueryForNonExistentToken();
        }

        if (bytes(s_idSvgUri).length == 0) {
            revert IDToken__ImageNotFound();
        }
        /**
         * @notice the values in the json object will reflect the updated values
         *          after they are set in the '_setTokenURI' function
         */
        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"firstname":"',
                                s_tokenIdToStats[_tokenId].firstName,
                                '","lastname":"',
                                s_tokenIdToStats[_tokenId].lastName,
                                '", "field":"',
                                s_tokenIdToStats[_tokenId].field,
                                '", "attributes": [{"trait_type":"experience","value":',
                                (s_tokenIdToStats[_tokenId].experiencePoints)
                                    .toString(),
                                '}],"image":"',
                                s_idSvgUri,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    /**
     * @dev The function returns a string of image URI after concatenating the baseURI with
     *      the svg image data.
     *      "data:image/svg+xml;base64," allows for the svg image to be viewed in the browser
     * @param _svgData the string of svg image passed in the constructor
     */
    function svgToImageUri(
        string memory _svgData
    ) internal pure returns (string memory) {
        string memory baseURI = "data:image/svg+xml;base64,";
        string memory base64EncodedSvg = Base64.encode(
            bytes(string(abi.encodePacked(_svgData)))
        );
        return string(abi.encodePacked(baseURI, base64EncodedSvg));
    }

    /* Functions for testing */
    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getImageUri() public view returns (string memory) {
        return s_idSvgUri;
    }

    function getStats(uint256 _tokenId) public view returns (Stats memory) {
        return s_tokenIdToStats[_tokenId];
    }
}
