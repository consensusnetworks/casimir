// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./interfaces/ICasimirCore.sol";

/// @title Core shared methods
abstract contract CasimirCore is ICasimirCore {
    /// @dev Validate an address is not the zero address
    function onlyAddress(address checkAddress) internal pure {
        if (checkAddress == address(0)) {
            revert InvalidAddress();
        }
    }
}
