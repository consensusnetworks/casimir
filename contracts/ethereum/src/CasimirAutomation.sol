// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./interfaces/ICasimirAutomation.sol";
import "./interfaces/ICasimirManager.sol";
import {Functions, FunctionsClient} from "./vendor/FunctionsClient.sol";
// import "@chainlink/contracts/src/v0.8/dev/functions/FunctionsClient.sol"; // Once published
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

// Dev-only imports
import "hardhat/console.sol";

// To be done by automation and functions oracle:
// 1. Store withdrawal requests ✔
// 2. Request exits for withdrawals
// 3. Store pending exits and pending withdrawals
// 4. Get completed exits in upkeep (triggered by any amount increase > reward threshold)
// 5. Fulfill withdrawals and redistribute
// 6. Get cluster snapshots before staking ready pools

// To be enabled with operator registry and selection (not an audit essential, postponing for now):
// 1. Replace lost stake with operator collateral
// 2. Distribute operators to minimize undercollateralization risk

// To be enabled with single-instance @casimir/keys oracle (not an audit essential, postponing for now):
// 1. Validator keygen triggering
// 2. Validator reshare triggering (for penalties or otherwise)
// 3. Validator exit triggering (for max reshares or by liquidity needs)

/**
 * @title Oracle contract that triggers and handles actions
 */
contract CasimirAutomation is ICasimirAutomation, FunctionsClient, Ownable {

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

    /* Latest functions response */
    bytes private latestResponse;
    /* Latest functions error */
    bytes private latestError;
    /* Latest functions response count */
    uint256 private responseCounter;

    /***************/
    /* Constructor */
    /***************/

    /**
     * Constructor
     * @param casimirManagerAddress The manager contract address
     */
    constructor(address casimirManagerAddress, address linkFunctionsAddress) FunctionsClient(linkFunctionsAddress) {
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

        /** Get amount swept to manager */
        uint256 amountSwept = SafeCast.toUint256(casimirManager.getExecutionSwept());
        if (amountSwept >= rewardThreshold) {
            upkeepNeeded = true;
        } else {
            /** Set swept amounts below threshold to zero */
            amountSwept = 0;
        }

        performData = abi.encode(readyPoolIds, amountSwept);
    }

    /**
     * @notice Perform the upkeep
     * @param performData The data to perform the upkeep
     */
    function performUpkeep(bytes calldata performData) external override {

        (uint32[] memory readyPoolIds, uint256 executionSwept) = abi.decode(performData, (uint32[], uint256));

        /** Stake ready pools */
        for (uint256 i = 0; i < readyPoolIds.length; i++) {
            casimirManager.stakeNextPool();
        }

        /** Compound rewards */
        if (executionSwept > 0) {
            casimirManager.reward(executionSwept);
        }
    }

    /**
     * @notice Callback that is invoked once the DON has resolved the request or hit an error
     *
     * @param requestId The request ID, returned by sendRequest()
     * @param response Aggregated response from the user code
     * @param err Aggregated error from the user code or from the execution pipeline
     * Either response or error parameter will be set, but never both
     */
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        latestResponse = response;
        latestError = err;
        responseCounter = responseCounter + 1;
        emit OCRResponse(requestId, response, err);
    }

    /**
     * @notice Update the functions oracle address
     * @param oracle New oracle address
     */
    function setOracleAddress(address oracle) external onlyOwner {
        setOracle(oracle);
    }
}
