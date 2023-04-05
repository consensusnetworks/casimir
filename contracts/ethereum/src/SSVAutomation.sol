// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "hardhat/console.sol";

contract Counter is AutomationCompatibleInterface {
    /**
     * Public counter variable
     */
    uint public counter;

    /**
     * Use an interval in seconds and a timestamp to slow execution of Upkeep
     */
    uint public immutable interval;
    uint public lastTimeStamp;

    constructor(uint updateInterval) {
        interval = updateInterval;
        lastTimeStamp = block.timestamp;

        counter = 0;
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory checkData)
    {
        upkeepNeeded = validateUpkeep();
        console.log(checkData.length);
    }

    function performUpkeep(bytes calldata performData) external override {
        /** Revalidate the upkeep */
        if (validateUpkeep()) {
            lastTimeStamp = block.timestamp;
            counter = counter + 1;
        }
        console.log(performData.length);
    }

    function validateUpkeep() public view returns (bool) {
        return (block.timestamp - lastTimeStamp) > interval;
    }
}