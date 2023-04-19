// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./interfaces/ICasimirAutomation.sol";
import "./interfaces/ICasimirManager.sol";
import "./interfaces/ICasimirPoR.sol";
import {Functions, FunctionsClient} from "./vendor/FunctionsClient.sol";
// import "@chainlink/contracts/src/v0.8/dev/functions/FunctionsClient.sol"; // Once published
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
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
    /* Constants */
    /*************/

    /* Reward threshold (0.1 ETH) */
    uint256 private constant rewardThreshold = 100000000000000000;

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

        /** Get ready pools to stake */
        uint32[] memory readyPoolIds = casimirManager.getReadyPoolIds();

        if (readyPoolIds.length > 0) {
            upkeepNeeded = true;
        }

        /** Get Beacon rewards swept to manager */
        uint256 executionSwept = SafeCast.toUint256(casimirManager.getExecutionSwept());

        if (executionSwept >= rewardThreshold) {
            upkeepNeeded = true;
        } else {
            /** Set swept amounts below threshold to zero */
            executionSwept = 0;
        }

        performData = abi.encode(readyPoolIds, executionSwept);
    }

    /**
     * @notice Perform the upkeep
     * @param performData The data to perform the upkeep
     */
    function performUpkeep(bytes calldata performData) external override {

        (uint32[] memory readyPoolIds, uint256 executionSwept) = abi.decode(performData, (uint32[], uint256));

        /** Stake ready pools */
        for (uint i = 0; i < readyPoolIds.length; i++) {
            casimirManager.stakePool(readyPoolIds[i]);
        }

        /** Compound rewards */
        if (executionSwept > 0) {
            casimirManager.reward(executionSwept);
        }
    }

    /**
     * @notice Get the total manager stake
     * @return The total manager stake
     */
    function getStake() external view returns (uint256) {
        return casimirManager.getStake();
    }

    /**
     * @notice Get the total manager execution swept amount
     * @return The total manager execution swept amount
     */
    function getExecutionSwept() public view returns (int256) {
        return casimirManager.getExecutionSwept();
    }

    /**
     * @notice Get the total manager expected consensus stake
     * @return The total manager expected consensus stake
     */
    function getExpectedConsensusStake() external view returns (int256) {
        return casimirManager.getExpectedConsensusStake();
    }
}
