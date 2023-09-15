// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "../interfaces/ICasimirManager.sol";

library CasimirArray {
    function removeUint32Item(uint32[] storage uint32Array, uint index) public {
        require(uint32Array.length > 0, "Can't remove from empty array");
        require(index < uint32Array.length, "Index out of bounds");
        for (uint i = index; i < uint32Array.length - 1; i++) {
            uint32Array[i] = uint32Array[i + 1];
        }
        uint32Array.pop();
    }

    function removeBytesItem(bytes[] storage bytesArray, uint index) public {
        require(bytesArray.length > 0, "Can't remove from empty array");
        require(index < bytesArray.length, "Index out of bounds");
        for (uint i = index; i < bytesArray.length - 1; i++) {
            bytesArray[i] = bytesArray[i + 1];
        }
        bytesArray.pop();
    }

    function removeWithdrawalItem(
        ICasimirManager.Withdrawal[] storage withdrawals,
        uint index
    ) public {
        require(withdrawals.length > 0, "Can't remove from empty array");
        require(index < withdrawals.length, "Index out of bounds");
        for (uint i = index; i < withdrawals.length - 1; i++) {
            withdrawals[i] = withdrawals[i + 1];
        }
        withdrawals.pop();
    }
}
