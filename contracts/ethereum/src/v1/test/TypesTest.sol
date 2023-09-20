// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "../interfaces/ICasimirManager.sol";
import "../libraries/Types.sol";

interface ITypesTest {
    function addUint32Array(uint32[] memory array) external;
    function addBytesArray(bytes[] memory array) external;
    function addWithdrawals(ICasimirManager.Withdrawal[] memory withdrawals) external;
    function getUint32Array() external view returns (uint32[] memory);
    function getBytesArray() external view returns (bytes[] memory);
    function getWithdrawals() external view returns (ICasimirManager.Withdrawal[] memory);
    function removeUint32(uint index) external;
    function removeBytes(uint index) external;
    function removeWithdrawal(uint index) external;
    function send(address user, uint256 amount) external;
}

/**
 * @title Types test contract that tests array removal functions
 */
contract TypesTest is ITypesTest {
    /** Use internal type for uint32 array */
    using Types32Array for uint32[];
    /** Use internal type for bytes array */
    using TypesBytesArray for bytes[];
    /** Use internal type for withdrawal array */
    using TypesWithdrawalArray for ICasimirManager.Withdrawal[];
    /** Use internal type for address */
    using TypesAddress for address;

    /** Test uint 32 array */
    uint32[] public uint32Array;
    /** Test bytes array */
    bytes[] public bytesArray;
    /** Test withdrawal array */
    ICasimirManager.Withdrawal[] public withdrawals;

    /**
     * Receive ETH
     */
    receive() external payable {}

    /**
     * @dev Add a uint32 array to the test array
     * @param newUint32Array The array to add
     */
    function addUint32Array(uint32[] memory newUint32Array) external override {
        for (uint i = 0; i < newUint32Array.length; i++) {
            uint32Array.push(newUint32Array[i]);
        }
    }

    /**
     * @dev Add a bytes array to the test array
     * @param newBytesArray The array to add
     */
    function addBytesArray(bytes[] memory newBytesArray) external override {
        for (uint i = 0; i < newBytesArray.length; i++) {
            bytesArray.push(newBytesArray[i]);
        }
    }

    /**
     * @dev Add a withdrawal array to the test array
     * @param newWithdrawals The array to add
     */
    function addWithdrawals(ICasimirManager.Withdrawal[] memory newWithdrawals) external override {
        for (uint i = 0; i < newWithdrawals.length; i++) {
            withdrawals.push(newWithdrawals[i]);
        }
    }

    /**
     * @dev Get the uint32 array
     * @return The uint32 array
     */
    function getUint32Array() external view override returns (uint32[] memory) {
        return uint32Array;
    }

    /**
     * @dev Get the bytes array
     * @return The bytes array
     */
    function getBytesArray() external view override returns (bytes[] memory) {
        return bytesArray;
    }

    /**
     * @dev Get the withdrawal array
     * @return The withdrawal array
     */
    function getWithdrawals() external view override returns (ICasimirManager.Withdrawal[] memory) {
        return withdrawals;
    }

    /**
     * @dev Remove a uint32 element from the array
     * @param index The index of the element to remove
     */
    function removeUint32(uint index) external {
        uint32Array.remove(index);
    }

    /**
     * @dev Remove a bytes element from the array
     * @param index The index of the element to remove
     */
    function removeBytes(uint index) external {
        bytesArray.remove(index);
    }

    /**
     * @dev Remove a withdrawal from the array
     * @param index The index of the withdrawal to remove
     */
    function removeWithdrawal(uint index) external {
        withdrawals.remove(index);
    }

    /**
     * @dev Send ETH to a user
     * @param user The user address
     * @param amount The amount of stake to send
     */
    function send(address user, uint256 amount) external {
        user.send(amount);
    }
}