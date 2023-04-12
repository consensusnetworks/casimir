// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../interfaces/IKeeperRegistry.sol";
import "hardhat/console.sol";

contract MockKeeperRegistry {

    function registerUpkeep(
        address target,
        uint32 gasLimit,
        address admin,
        bytes calldata checkData,
        bytes calldata offchainConfig
    ) external view returns (uint256 id) {
        console.log(target, gasLimit, admin);
        console.log(abi.decode(checkData, (string)));
        console.log(offchainConfig.length);
        return 0;
    }

    function getState()
        external
        pure
        returns (
            State memory state,
            OnchainConfig memory config,
            address[] memory signers,
            address[] memory transmitters,
            uint8 f
        )
    {}
}
