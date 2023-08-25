// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";

interface ICasimirUpkeep is AutomationCompatibleInterface {
    /***************/
    /* Enumerators */
    /***************/

    enum RequestType {
        NONE,
        BALANCES,
        DETAILS
    }
    enum ReportStatus {
        FINALIZED,
        REQUESTING,
        PROCESSING
    }

    /**********/
    /* Events */
    /**********/
    
    event OCRResponse(bytes32 indexed requestId, bytes result, bytes err);
    event RequestSet(bytes newRequestCBOR, uint32 newFulfillGasLimit);
    event OracleAddressSet(address newOracleAddress);
    event UpkeepPerformed(ReportStatus indexed status);

    /*************/
    /* Mutations */
    /*************/

    function performUpkeep(bytes calldata performData) external;
    function setRequest(bytes calldata newRequestCBOR, uint32 newFulfillGasLimit) external;
    function setOracleAddress(address newOracleAddress) external;

    /***********/
    /* Getters */
    /***********/

    function checkUpkeep(
        bytes calldata checkData
    ) external returns (bool upkeepNeeded, bytes memory performData);
}
