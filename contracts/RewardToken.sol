// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract RewardToken is ERC1155 {
    uint256 private constant EXPERIENCE_ID = 1;

    /**
     * @dev We can pass the URI of the metadata of the identity token.
     *      However, doing that and the additional functionality falls out of the scope
     *      of the "task level".
     */
    constructor() /*string memory _url*/ ERC1155(/*_url*/ "") {}

    function reward(
        address _to,
        uint256 _erc1155TokenId,
        uint256 _amount
    ) external {
        _mint(_to, _erc1155TokenId, _amount, "");
    }
}
