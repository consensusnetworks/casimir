// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "hardhat/console.sol";
import "./interfaces/IDepositContract.sol";

contract PoolManager {

    address public depositContractAddress = 0x00000000219ab540356cBB839Cbe05303d7705Fa;
    IDepositContract public depositContract = IDepositContract(depositContractAddress);

    constructor() {
        console.log("Deposit contract address:", address(depositContract));
    }

    
}