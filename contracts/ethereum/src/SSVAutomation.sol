// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./interfaces/ISSVManager.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "hardhat/console.sol";

contract SSVAutomation is AutomationCompatibleInterface {
    /* Total stake */
    uint256 public stake;
    /* SSV manager contract */
    ISSVManager private immutable ssvManager;

    constructor(address ssvManagerAddress) {
        ssvManager = ISSVManager(ssvManagerAddress);
        stake = ssvManager.getStake();
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
            console.log("Performing upkeep");
        }
        console.log(performData.length);
    }

    function validateUpkeep() public view returns (bool upkeepNeeded) {
        bool stakeChanged = stake != ssvManager.getStake();
        console.log("Stake changed from %s to %s", stake, ssvManager.getStake());
        upkeepNeeded = stakeChanged;
    }
}