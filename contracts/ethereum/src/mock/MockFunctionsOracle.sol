// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/dev/interfaces/FunctionsOracleInterface.sol";

import "hardhat/console.sol";

/**
 * @title MockFunctionsOracle
 */
contract MockFunctionsOracle {

    uint256 private latestRequestIdNumber = 1;
    uint64 private subscriptionId;
    bytes private data;
    uint32 private gasLimit;

    constructor() {}

    /**
     * @notice Returns the address of the registry contract
     * @return address The address of the registry contract
     */
    function getRegistry() external view returns (address) {
        return address(this); // Just returning oracle address instead for mock
    }

    /**
     * @notice Sends a request (encoded as data) using the provided subscriptionId
     * @param _subscriptionId A unique subscription ID allocated by billing system,
     * a client can make requests from different contracts referencing the same subscription
     * @param _data Encoded Chainlink Functions request data, use FunctionsClient API to encode a request
     * @param _gasLimit Gas limit for the fulfillment callback
     * @return requestId A unique request identifier (unique per DON)
     */
    function sendRequest(
        uint64 _subscriptionId,
        bytes calldata _data,
        uint32 _gasLimit
    ) external returns (bytes32 requestId) {

        subscriptionId = _subscriptionId;
        data = _data;
        gasLimit = _gasLimit;

        requestId = keccak256(abi.encode(latestRequestIdNumber));
    }
}
