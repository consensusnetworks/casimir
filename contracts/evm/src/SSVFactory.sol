// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

import './SSVPool.sol';

contract SSVFactory {
    // Returns the address of the newly deployed contract
    function deploy(
        address _owner,
        bytes32 _salt
    ) public payable returns (address) {
        // This syntax is a newer way to invoke create2 without assembly, you just need to pass salt
        // https://docs.soliditylang.org/en/latest/control-structures.html#salted-contract-creations-create2
        return address(new SSVPool{salt: _salt}(_owner));
    }
}