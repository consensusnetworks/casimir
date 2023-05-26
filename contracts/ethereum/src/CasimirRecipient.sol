// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./interfaces/ICasimirRecipient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Dev-only imports
import "hardhat/console.sol";

/**
 * @title Recipient contract that distributes validator execution fee rewards
 */
contract CasimirRecipient is Ownable, ReentrancyGuard, ICasimirRecipient {
    uint256 private rewards;

    receive() external payable nonReentrant {
        rewards += msg.value;
    }
}