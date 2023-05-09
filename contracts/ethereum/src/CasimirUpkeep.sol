// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./interfaces/ICasimirUpkeep.sol";
import "./interfaces/ICasimirManager.sol";
import {Functions, FunctionsClient} from "@chainlink/contracts/src/v0.8/dev/functions/FunctionsClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Dev-only imports
import "hardhat/console.sol";

/**
 * @title Oracle contract that triggers and handles actions
 */
contract CasimirUpkeep is ICasimirUpkeep, FunctionsClient, Ownable {
    /*************/
    /* Libraries */
    /*************/

    using Functions for Functions.Request;

    /*************/
    /* Constants */
    /*************/

    /** Oracle heartbeat */
    uint256 public constant reportHeartbeat = 0; // Will use a ~quarter of a day in production
    /** Pool capacity */
    uint256 public constant poolCapacity = 32 ether;

    /*************/
    /* Immutable */
    /*************/

    /** Manager contract */
    ICasimirManager private immutable manager;

    /********************/
    /* Dynamic State */
    /********************/

    /** Binary request source code */
    bytes public requestCBOR;
    /** Latest request ID */
    bytes32 public latestRequestId;
    /** Latest fulfilled request ID */
    bytes32 public latestFulfilledRequestId;
    /** Latest response */
    bytes private latestResponse;
    /** Latest response timestamp */
    uint256 private latestResponseTimestamp;
    /** Latest error */
    bytes private latestError;
    /** Latest response count */
    uint256 private responseCounter;
    /** Fulfillment gas limit */
    uint32 fulfillGasLimit;
    /** Functions subscription ID */
    uint64 private functionsSubscriptionId;

    /***************/
    /* Constructor */
    /***************/

    /**
     * Constructor
     * @param managerAddress The manager contract address
     * @param functionsOracleAddress The functions oracle contract address
     * @param _functionsSubscriptionId The functions subscription ID
     */
    constructor(
        address managerAddress,
        address functionsOracleAddress,
        uint64 _functionsSubscriptionId
    ) FunctionsClient(functionsOracleAddress) {
        manager = ICasimirManager(managerAddress);
        functionsSubscriptionId = _functionsSubscriptionId;
    }

    /**
     * @notice Generate a new Functions.Request(off-chain, saving gas)
     * @param source JavaScript source code
     * @param secrets Encrypted secrets payload
     * @param args List of arguments accessible from within the source code
     */
    function generateRequest(
        string calldata source,
        bytes calldata secrets,
        string[] calldata args
    ) public pure returns (bytes memory) {
        Functions.Request memory req;
        req.initializeRequest(
            Functions.Location.Inline,
            Functions.CodeLanguage.JavaScript,
            source
        );
        if (secrets.length > 0) {
            req.addRemoteSecrets(secrets);
        }
        if (args.length > 0) {
            req.addArgs(args);
        }
        return req.encodeCBOR();
    }

    /**
     * @notice Set the bytes representing the CBOR-encoded Functions.Request
     * @param _fulfillGasLimit Maximum amount of gas used to call the client contract's `handleOracleFulfillment` function
     * @param _functionsSubscriptionId The functions billing subscription ID used to pay for Functions requests
     * @param _requestCBOR Bytes representing the CBOR-encoded Functions.Request
     */
    function setRequest(
        uint32 _fulfillGasLimit,
        uint64 _functionsSubscriptionId,
        bytes calldata _requestCBOR
    ) external onlyOwner {
        fulfillGasLimit = _fulfillGasLimit;
        functionsSubscriptionId = _functionsSubscriptionId;
        requestCBOR = _requestCBOR;
    }

    /**
     * @notice Check if the upkeep is needed
     * @return upkeepNeeded True if the upkeep is needed
     */
    function checkUpkeep(
        bytes memory
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        if ((block.timestamp - latestResponseTimestamp) >= reportHeartbeat) {
            upkeepNeeded = true;
        }

        int256 requiredWithdrawals = int256(manager.getRequestedWithdrawals() + manager.getPendingWithdrawals()) - int256(manager.getExitingValidatorCount() * 32 ether);
        if (requiredWithdrawals > 0) {
            upkeepNeeded = true;
        }
        // Todo provide required withdrawals as performData (or some optimial input, maybe validator count)

        if (latestFulfilledRequestId != "" && latestFulfilledRequestId != latestRequestId) {
            upkeepNeeded = false;
        }

        performData = abi.encode(requiredWithdrawals);
    }

    /**
     * @notice Perform the upkeep
     */
    function performUpkeep(bytes calldata) external override {
        (bool upkeepNeeded, bytes memory performData) = checkUpkeep("");
        require(upkeepNeeded, "Upkeep not needed");

        int256 requiredWithdrawals = abi.decode(performData, (int256));

        /** Initiate withdrawals and request exits */
        if (requiredWithdrawals > 0) {
            // Todo this should bound withdrawals and request exits
            manager.initiateRequestedWithdrawals(manager.getRequestedWithdrawalQueue().length);
            manager.completePendingWithdrawals(manager.getPendingWithdrawalQueue().length);
        }

        /** Placeholder request */
        Functions.Request memory req;

        /** Request a report */
        bytes32 requestId = sendRequest(req, functionsSubscriptionId, fulfillGasLimit);
        latestRequestId = requestId;

        emit UpkeepPerformed(performData);
    }

    /**
     * @notice Callback that is invoked once the DON has resolved the request or hit an error
     * @param requestId The request ID, returned by sendRequest()
     * @param response Aggregated response from the user code
     * @param err Aggregated error from the user code or from the sweptStake pipeline
     * Either response or error parameter will be set, but never both
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        latestFulfilledRequestId = requestId;
        latestResponseTimestamp = block.timestamp;
        latestResponse = response;
        latestError = err;
        responseCounter = responseCounter + 1;

        if (err.length == 0) {
            /** Decode report */
            uint256 report = abi.decode(response, (uint256));

            /** Unpack values */
            uint256 activeStake = uint256(uint64(report)) * 1 gwei;
            uint256 sweptRewards = uint256(uint64(report >> 64)) * 1 gwei;
            uint256 sweptExits = uint256(uint64(report >> 128)) * 1 gwei;
            uint32 depositCount = uint32(report >> 192);
            uint32 exitCount = uint32(report >> 224);

            // if (sweptExits < exitCount * poolCapacity) {
            //     sweptExits = amount recovered from blamed operator collateral
            // }

            /** Rebalance the stake */
            manager.rebalanceStake(
                activeStake, 
                sweptRewards, 
                sweptExits,
                depositCount,
                exitCount
            );
        }

        emit OCRResponse(requestId, response, err);
    }

    /**
     * @notice Update the functions oracle address
     * @param newOracleAddress New oracle address
     */
    function setOracleAddress(address newOracleAddress) external onlyOwner {
        setOracle(newOracleAddress);
    }

    // Dev-only functions

    /**
     * @notice Fulfill the request for testing
     * @param requestId The request ID, returned by sendRequest()
     * @param response Aggregated response from the user code
     * @param err Aggregated error from the user code or from the sweptStake pipeline
     * Either response or error parameter will be set, but never both
     */
    function mockFulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) external {
        fulfillRequest(requestId, response, err);
    }
}
