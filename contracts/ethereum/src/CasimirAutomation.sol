// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./interfaces/ICasimirAutomation.sol";
import "./interfaces/ICasimirManager.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {Functions, FunctionsClient} from "./vendor/FunctionsClient.sol";
// import "@chainlink/contracts/src/v0.8/dev/functions/FunctionsClient.sol"; // Once published
import "hardhat/console.sol";

// Todo handle:
// - (Change ready pool to open pool and use ready for unstaked pools without a validator)
// - Ready pool DKG triggering
// - Balance increase from rewards and exit completion
// - Slash reshare triggering
// - Withdrawal or maximum reshare exit triggering

/**
 * @title Oracle contract that reports balances and triggers manager actions
 */
contract CasimirAutomation is ICasimirAutomation {
    /********************/
    /* Global Variables */
    /********************/

    /* Total stake */
    uint256 private stake;
    /* Manager contract */
    ICasimirManager private immutable casimirManager;
    /** Chainlink feed contract */
    AggregatorV3Interface private immutable linkFeed;

    /**
     * Constructor
     * @param casimirManagerAddress The manager contract address
     * @param linkFeedAddress The chainlink feed contract address
     */
    constructor(address casimirManagerAddress, address linkFeedAddress) {
        casimirManager = ICasimirManager(casimirManagerAddress);
        linkFeed = AggregatorV3Interface(linkFeedAddress);
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

        upkeepNeeded = validateUpkeep();
        performData = abi.encodePacked("Performing upkeep");
    }

    /**
     * @notice Perform the upkeep
     * @param performData The data to perform the upkeep
     */
    function performUpkeep(bytes calldata performData) external override {
        console.log(abi.decode(performData, (string)));

        /** Revalidate the upkeep */
        if (validateUpkeep()) {
            /** Update the stake */
            stake = casimirManager.getStake();
        }
    }

    /**
     * @notice Validate if the upkeep is needed
     * @return upkeepNeeded True if the upkeep is needed
     */
    function validateUpkeep() public view returns (bool upkeepNeeded) {
        bool stakeChanged = stake != casimirManager.getStake();
        console.log(
            "Stake changed from %s to %s",
            stake,
            casimirManager.getStake()
        );
        upkeepNeeded = stakeChanged;
    }

    /**
     * @notice Get the latest total manager stake on beacon reported from chainlink PoR feed
     * @return The latest total manager stake on beacon
     */
    function getBeaconStake() public view returns (int256) {
        (, /*uint80 roundID*/ int256 answer, , , ) = /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/
        linkFeed.latestRoundData();
        return answer;
    }

    function getPoRAddressListLength()
        external
        view
        override
        returns (uint256)
    {
        return casimirManager.getStakedValidatorPublicKeys().length;
    }

    function getPoRAddressList(
        uint256 startIndex,
        uint256 endIndex
    ) external view override returns (string[] memory) {
        bytes[] memory publicKeys = casimirManager
            .getStakedValidatorPublicKeys();
        address[] memory addresses = new address[](publicKeys.length);
        for (uint256 i = 0; i < publicKeys.length; i++) {
            addresses[i] = address(uint160(bytes20(keccak256(publicKeys[i]))));
        }

        if (startIndex > endIndex) {
            return new string[](0);
        }
        endIndex = endIndex > addresses.length - 1
            ? addresses.length - 1
            : endIndex;
        string[] memory stringAddresses = new string[](
            endIndex - startIndex + 1
        );
        uint256 currIdx = startIndex;
        uint256 strAddrIdx = 0;
        while (currIdx <= endIndex) {
            stringAddresses[strAddrIdx] = toString(
                abi.encodePacked(addresses[currIdx])
            );
            strAddrIdx++;
            currIdx++;
        }
        return stringAddresses;
    }

    function toString(bytes memory data) private pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint256(uint8(data[i] >> 4))];
            str[3 + i * 2] = alphabet[uint256(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }
}
