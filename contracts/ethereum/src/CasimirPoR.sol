// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./interfaces/ICasimirPoR.sol";
import "./interfaces/ICasimirManager.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title PoR contract that reports validator balances
 */
contract CasimirPoR is ICasimirPoR {
    /*************/
    /* Contracts */
    /*************/

    /* Manager contract */
    ICasimirManager private immutable casimirManager;
    /** Chainlink PoR feed contract */
    AggregatorV3Interface private immutable linkFeed;

    /***************/
    /* Constructor */
    /***************/

    /**
     * Constructor
     * @param casimirManagerAddress The manager contract address
     * @param linkFeedAddress The chainlink PoR feed contract address
     */
    constructor(address casimirManagerAddress, address linkFeedAddress) {
        casimirManager = ICasimirManager(casimirManagerAddress);
        linkFeed = AggregatorV3Interface(linkFeedAddress);
    }

    /*************/
    /* Functions */
    /*************/

    /**
     * @notice Get the PoR address list length
     * @return The PoR address list length
     */
    function getPoRAddressListLength()
        external
        view
        override
        returns (uint256)
    {
        return casimirManager.getStakedValidatorPublicKeys().length;
    }

    /**
     * @notice Get the PoR address list given a start and end index
     * @param startIndex The start index
     * @param endIndex The end index
     * @return The PoR address list
     */
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

    /**
     * @dev Convert bytes to string
     * @param data The bytes to convert
     * @return The string
     */
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

    /**
     * @notice Get the total manager consensus stake
     * @return The latest total manager consensus stake
     */
    function getConsensusStake() external view returns (int256) {
        (, /*uint80 roundID*/ int256 answer, , , ) = /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/
        linkFeed.latestRoundData();
        return answer;
    }
}