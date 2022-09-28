// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

// Manager contract that accepts, processes, and distributes ETH to SSV pools
contract SSVManager {

    // Staking pool used to run a validator
    struct StakingPool {
        // Contract address of the pool
        address contractAddress;
        // Current amount in the pool
        uint256 currentAmount;
    }

    // Staking pools in need of ETH
    StakingPool[] public openStakingPools;
    // User stakes across all pools
    mapping (address => address[]) public userStakes;
    // User deposit event
    event Deposit(address userAddress, uint256 depositAmount, uint256 depositTime);

    constructor() {}

    // Deposit ETH to Casimir SSV Pool Manager
    function deposit() public payable {
        emit Deposit(msg.sender, msg.value, block.timestamp);
        // Check open staking pools
        // Get first one and distribute
        // Take overflow and distribute to second and so on
        // If none available create a new one
        // Cleanup completed staking pools in the meanwhile
        // Add pool addresses to user stakes
    }

}