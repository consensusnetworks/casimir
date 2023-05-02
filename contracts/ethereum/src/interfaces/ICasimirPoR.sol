// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/PoRAddressList.sol";

interface ICasimirPoR is PoRAddressList {
    function getPoRAddressListLength() external view returns (uint256);

    function getPoRAddressList(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (string[] memory);

    function getConsensusStake() external view returns (int256);
}
