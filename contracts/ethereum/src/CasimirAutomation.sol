// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./interfaces/ICasimirAutomation.sol";
import "./interfaces/ICasimirManager.sol";
import {Functions, FunctionsClient} from "./vendor/FunctionsClient.sol";
// import "@chainlink/contracts/src/v0.8/dev/functions/FunctionsClient.sol"; // Once published
import "@openzeppelin/contracts/access/Ownable.sol";

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
    /* Libraries */
    /*************/

    using Functions for Functions.Request;

    /*************/
    /* Constants */
    /*************/

    /** Oracle heartbeat */
    uint256 public constant oracleHeartbeat = 0; // Will use ~half a day in production

    /*************/
    /* Contracts */
    /*************/

    /** Manager contract */
    ICasimirManager private immutable manager;

    /********************/
    /* Dynamic State */
    /********************/

    /** Serialized oracle source code */
    bytes public requestCBOR;
    /** Latest oracle request ID */
    bytes32 public latestRequestId;
    /** Latest oracle response */
    bytes private latestResponse;
    /** Latest oracle response timestamp */
    uint256 private latestResponseTimestamp;
    /** Latest oracle error */
    bytes private latestError;
    /** Latest oracle response count */
    uint256 private responseCounter;
    /** Oracle fulfillment gas limit */
    uint32 fulfillGasLimit;
    /** Oracle subscription ID */
    uint64 private oracleSubId;

    /***************/
    /* Constructor */
    /***************/

    /**
     * Constructor
     * @param managerAddress The manager contract address
     * @param oracleAddress The oracle contract address
     * @param _oracleSubId The oracle subscription ID
     */
    constructor(
        address managerAddress,
        address oracleAddress,
        uint64 _oracleSubId
    ) FunctionsClient(oracleAddress) {
        manager = ICasimirManager(managerAddress);
        oracleSubId = _oracleSubId;
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
     * @param _oracleSubId The oracle billing subscription ID used to pay for Functions requests
     * @param _requestCBOR Bytes representing the CBOR-encoded Functions.Request
     */
    function setRequest(
        uint32 _fulfillGasLimit,
        uint64 _oracleSubId,
        bytes calldata _requestCBOR
    ) external onlyOwner {
        fulfillGasLimit = _fulfillGasLimit;
        oracleSubId = _oracleSubId;
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
        /** Check if the heartbeat interval is lapsed */
        if ((block.timestamp - latestResponseTimestamp) >= oracleHeartbeat) {
            upkeepNeeded = true;
        }

        /** Check if any pools need to exit */
        int256 requiredWithdrawals = int256(manager.getRequestedWithdrawals() + manager.getPendingWithdrawals()) - int256(manager.getExitingValidatorCount() * 32 ether);
        if (requiredWithdrawals > 0) {
            upkeepNeeded = true;
        }
        // Todo provide required withdrawals as performData (or some optimial input, maybe validator count)

        /** Check if any pools are ready */
        uint32[] memory readyPoolIds = manager.getReadyPoolIds();
        if (readyPoolIds.length > 0) {
            upkeepNeeded = true;
        }

        performData = abi.encode(readyPoolIds);
    }

    /**
     * @notice Perform the upkeep
     */
    function performUpkeep(bytes calldata) external override {
        (bool upkeepNeeded, bytes memory performData) = checkUpkeep("");
        require(upkeepNeeded, "Upkeep not needed");

        uint32[] memory readyPoolIds = abi.decode(performData, (uint32[])); // Is encode/decode more efficient than getting again?

        /** Stake the ready pools */
        if (readyPoolIds.length > 0) {
            manager.stakeReadyPools(); // Deposit and move ready to pending
        }

        /** Request a report */
        // bytes32 requestId = s_oracle.sendRequest(oracleSubId, requestCBOR, fulfillGasLimit);
        // s_pendingRequests[requestId] = s_oracle.getRegistry();
        // latestRequestId = requestId;

        // emit RequestSent(requestId);
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
        latestResponseTimestamp = block.timestamp;
        latestResponse = response;
        latestError = err;
        responseCounter = responseCounter + 1;

        if (err.length == 0) {
            /** Decode report */
            (
                uint256 activeStake,
                uint256 sweptStake,
                uint256 sweptExits
            ) = abi.decode(response, (uint256, uint256, uint256));

            // Todo apply sensible heuristics to bound changes in stake

            // Todo check simulation test for mistyped input
            manager.rebalance(activeStake, sweptStake);
            manager.completePendingPools();
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
