// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "../interfaces/ICasimirManager.sol";

library Types32Array {
    function remove(uint32[] storage arr, uint index) internal {
        require(arr.length > 0, "Can't remove from empty array");
        require(index < arr.length, "Index out of bounds");
        for (uint i = index; i < arr.length - 1; i++) {
            arr[i] = arr[i + 1];
        }
        arr.pop();
    }
}

library TypesBytesArray {
    function remove(bytes[] storage arr, uint index) internal {
        require(arr.length > 0, "Can't remove from empty array");
        require(index < arr.length, "Index out of bounds");
        for (uint i = index; i < arr.length - 1; i++) {
            arr[i] = arr[i + 1];
        }
        arr.pop();
    }
}

library TypesUserWithdrawalArray {
    function remove(ICasimirManager.UserWithdrawal[] storage arr, uint index) internal {
        require(arr.length > 0, "Can't remove from empty array");
        require(index < arr.length, "Index out of bounds");
        for (uint i = index; i < arr.length - 1; i++) {
            arr[i] = arr[i + 1];
        }
        arr.pop();
    }
}