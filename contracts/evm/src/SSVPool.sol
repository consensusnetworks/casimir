// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

contract SSVPool {
    address public owner;

    constructor(address _owner) {
        owner = _owner;
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

}