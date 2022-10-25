// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

/**
 * @title Pool contract that groups and stakes deposits  
 */
contract SSVPool {

    /** All user balances */
    mapping (address => uint256) private userBalances;

    constructor() {}

    /**
     * @notice Deposit to the pool
     * @param userAddress The user address of the depositor
     */
    function deposit(address userAddress) external payable {
        userBalances[userAddress] += msg.value;
        if (address(this).balance == 32000000000000000000) {
            
        }
    }

    /**
     * @notice Get the total pool balance
     * @return The total pool balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get a given user's pool balance
     * @param userAddress The user address to look up
     * @return The user's pool balance
     */
    function getUserBalance(address userAddress) external view returns (uint256) {
        return userBalances[userAddress];
    }

}