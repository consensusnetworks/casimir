// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./interfaces/ICasimirAutomation.sol";
import "./interfaces/ICasimirManager.sol";
import "hardhat/console.sol";

/**
 * @title Oracle contract that reports balances and triggers manager actions 
 */
contract CasimirAutomation is ICasimirAutomation {
    /* Total stake */
    uint256 private stake;
    /* Manager contract */
    ICasimirManager private immutable casimirManager;

    constructor(address casimirManagerAddress) {
        casimirManager = ICasimirManager(casimirManagerAddress);
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        upkeepNeeded = validateUpkeep();

        if (upkeepNeeded) {
            performData = abi.encodePacked("Performing upkeep");
        }
    }

    function performUpkeep(bytes calldata performData) external override {

        console.log("Performing upkeep", performData.length);

        /** Revalidate the upkeep */
        if (validateUpkeep()) {
            
            /** Update the stake */
            stake = casimirManager.getStake();
        }
    }

    function validateUpkeep() public view returns (bool upkeepNeeded) {
        bool stakeChanged = stake != casimirManager.getStake();
        console.log(
            "Stake changed from %s to %s",
            stake,
            casimirManager.getStake()
        );
        upkeepNeeded = stakeChanged;
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
        bytes[] memory publicKeys = casimirManager.getStakedValidatorPublicKeys();
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