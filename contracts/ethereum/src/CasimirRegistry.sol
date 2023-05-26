// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import './interfaces/ICasimirManager.sol';
import './interfaces/ICasimirRegistry.sol';
import './libraries/Types.sol';
import './vendor/interfaces/ISSVNetworkViews.sol';

// Todo efficiently reshare or exit pools when deregistering

contract CasimirRegistry is ICasimirRegistry {
    using TypesAddress for address;

    ICasimirManager private manager;
    ISSVNetworkViews private ssvNetworkViews;
    uint256 requiredCollateral = 4 ether;
    uint256 minimumCollateralDeposit = 100000000000000000;
    mapping(uint64 => Operator) private operators;

    constructor(address managerAddress, address ssvNetworkViewsAddress) {
        manager = ICasimirManager(managerAddress);
        ssvNetworkViews = ISSVNetworkViews(ssvNetworkViewsAddress);
    }

    /**
     * @notice Register an operator with the set
     * @param operatorId The operator ID
     */
    function registerOperator(uint64 operatorId) external payable {
        require(msg.value >= requiredCollateral, "Insufficient registration collateral");
        (address operatorOwner, , , ,) = ssvNetworkViews.getOperatorById(operatorId);
        require(msg.sender == operatorOwner, "Only operator owner can register");

        operators[operatorId] = Operator({
            id: operatorId,
            collateral: int256(msg.value),
            poolCount: 0,
            deregistering: false
        });

        emit OperatorRegistered(operatorId);
    }

    /**
     * @notice Request to deregister an operator from the set
     * @param operatorId The operator ID
     */
    function requestOperatorDeregistration(uint64 operatorId) external {
        Operator storage operator = operators[operatorId];
        require(operator.collateral >= 0, "Operator owes collateral");
        (address operatorOwner, , , ,) = ssvNetworkViews.getOperatorById(operatorId);
        require(msg.sender == operatorOwner, "Only operator owner can request deregister");

        operator.deregistering = true;

        emit OperatorDeregistrationRequested(operatorId);

        // Now the oracle reshares or exits their pools as needed then deregisters
    }

    /**
     * @notice Deregister an operator from the set
     * @param operatorId The operator ID
     */
    function completeOperatorDeregistration(uint64 operatorId) external {
        require(msg.sender == address(manager), "Only manager can deregister operators");
        Operator storage operator = operators[operatorId];
        require(operator.collateral >= 0, "Operator owes collateral");

        (address operatorOwner, , , ,) = ssvNetworkViews.getOperatorById(operatorId);

        delete operators[operatorId];

        if (operator.collateral > 0) {
            operatorOwner.send(uint256(operator.collateral));
        }

        emit OperatorDeregistrationCompleted(operatorId);
    }

    /**
     * @notice Deposit collateral for an operator
     * @param operatorId The operator ID
     */
    function depositCollateral(uint64 operatorId) external payable {
        require(msg.value > minimumCollateralDeposit, "Insufficient collateral deposit");
        Operator storage operator = operators[operatorId];
        require(operator.id != 0, "Operator is not registered");
        (address operatorOwner, , , ,) = ssvNetworkViews.getOperatorById(operatorId);
        require(msg.sender == operatorOwner, "Only operator owner can deposit collateral");

        operator.collateral += int256(msg.value);
    }

    /**
     * @notice Set the collateral for an operator
     * @param operatorId The operator ID
     * @param collateral The collateral
     */
    function setOperatorCollateral(uint64 operatorId, int256 collateral) external {
        require(msg.sender == address(manager), "Only manager can set operator collateral");
        
        Operator storage operator = operators[operatorId];
        operator.collateral = collateral;
    }


    /**
     * @notice Get the collateral for an operator
     * @param operatorId The operator ID
     * @return The collateral
     */
    function getOperatorCollateral(uint64 operatorId) external view returns (int256) {
        return operators[operatorId].collateral;
    }    
}