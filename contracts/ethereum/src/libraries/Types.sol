// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "../interfaces/ICasimirManager.sol";

library Types32Array {
    /**
     * @dev Remove a uint32 element from the array
     * @param uint32Array The array of uint32
     */
    function remove(uint32[] storage uint32Array, uint index) internal {
        require(uint32Array.length > 0, "Can't remove from empty array");
        require(index < uint32Array.length, "Index out of bounds");
        for (uint i = index; i < uint32Array.length - 1; i++) {
            uint32Array[i] = uint32Array[i + 1];
        }
        uint32Array.pop();
    }
}

library TypesBytesArray {
    /**
     * @dev Remove a bytes element from the array
     * @param bytesArray The array of bytes
     * @param index The index of the element to remove
     */
    function remove(bytes[] storage bytesArray, uint index) internal {
        require(bytesArray.length > 0, "Can't remove from empty array");
        require(index < bytesArray.length, "Index out of bounds");
        for (uint i = index; i < bytesArray.length - 1; i++) {
            bytesArray[i] = bytesArray[i + 1];
        }
        bytesArray.pop();
    }
}

library TypesWithdrawalArray {
    /**
     * @dev Remove a withdrawal from the array
     * @param withdrawals The array of withdrawals 
     * @param index The index of the withdrawal to remove
     */
    function remove(ICasimirManager.Withdrawal[] storage withdrawals, uint index) internal {
        require(withdrawals.length > 0, "Can't remove from empty array");
        require(index < withdrawals.length, "Index out of bounds");
        for (uint i = index; i < withdrawals.length - 1; i++) {
            withdrawals[i] = withdrawals[i + 1];
        }
        withdrawals.pop();
    }
}

library TypesAddress {
    /**
     * @dev Send ETH to a user
     * @param user The user address
     * @param amount The amount of stake to send
     */
    function send(address user, uint256 amount) internal {
        (bool success, ) = user.call{value: amount}("");
        require(success, "Transfer failed");
    }
}