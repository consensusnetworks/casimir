// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

/// @title Interface for Chainlink keeper registry
interface IKeeperRegistrar {
    struct RegistrationParams {
        string name;
        bytes encryptedEmail;
        address upkeepContract;
        uint32 gasLimit;
        address adminAddress;
        bytes checkData;
        bytes offchainConfig;
        uint96 amount;
    }

    function registerUpkeep(RegistrationParams calldata requestParams) external returns (uint256);
}
