// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./interfaces/ICasimirAutomation.sol";
import "./interfaces/ICasimirManager.sol";
import "./interfaces/ICasimirPoR.sol";
import {Functions, FunctionsClient} from "./vendor/FunctionsClient.sol";
// import "@chainlink/contracts/src/v0.8/dev/functions/FunctionsClient.sol"; // Once published
import "hardhat/console.sol";

// Todo handle:
// - Ready pool DKG triggering
// - Balance increase from rewards and exit completion
// - Slash reshare triggering
// - Withdrawal or maximum reshare exit triggering

/**
 * @title Oracle contract that triggers and handles actions
 */
contract CasimirAutomation is ICasimirAutomation {
    /*************/
    /* Contracts */
    /*************/

    /* Manager contract */
    ICasimirManager private immutable casimirManager;

    /********************/
    /* Dynamic State */
    /********************/

    /* Total stake */
    uint256 private stake;

    /***************/
    /* Constructor */
    /***************/

    /**
     * Constructor
     * @param casimirManagerAddress The manager contract address
     */
    constructor(address casimirManagerAddress) {
        casimirManager = ICasimirManager(casimirManagerAddress);
    }

    /**
     * @notice Check if the upkeep is needed
     * @param checkData The data to check the upkeep
     * @return upkeepNeeded True if the upkeep is needed
     * @return performData The data to perform the upkeep
     */
    function checkUpkeep(
        bytes calldata checkData
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        console.log(abi.decode(checkData, (string)));

        uint32[] memory readyPoolIds = casimirManager.getReadyPoolIds();

        if (readyPoolIds.length > 0) {
            upkeepNeeded = true;
        }

        performData = abi.encode(readyPoolIds);
    }

    /**
     * @notice Perform the upkeep
     * @param performData The data to perform the upkeep
     */
    function performUpkeep(bytes calldata performData) external override {

        /** Stake ready pools */
        uint32[] memory readyPoolIds = abi.decode(performData, (uint32[]));
        for (uint i = 0; i < readyPoolIds.length; i++) {
            casimirManager.stakePool(readyPoolIds[i]);
        }
    }

    /**
     * @notice Get the total stake
     * @return The total stake
     */
    function getStake() external view returns (uint256) {
        return casimirManager.getStake();
    }

    /**
     * @notice Get the expected consensus stake principal
     * @return The expected consensus stake principal
     */
    function getExpectedConsensusPrincipal() external view returns (uint256) {
        return casimirManager.getExpectedConsensusPrincipal();
    }
}
