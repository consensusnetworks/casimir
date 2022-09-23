// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "hardhat/console.sol";
import "./interfaces/IDepositContract.sol";

contract PoolManager {

    IDepositContract public depositContract;

    constructor(address depositContractAddress) {
        depositContract = IDepositContract(depositContractAddress);
    }

    event Stake(address userAddress, uint256 stakedAmount);

    uint256 public constant depositThreshold = 32 ether;

    mapping (address => uint256) public userBalances;

    function stake() public payable {
        emit Stake(msg.sender, msg.value);
        userBalances[msg.sender] += msg.value;


    }

}