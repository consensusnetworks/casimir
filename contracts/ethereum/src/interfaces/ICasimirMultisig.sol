// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

interface ICasimirMultisig {
    event Deposit(address indexed sender, uint amount, uint balance);
    event SubmitOwnerChange(
        address indexed owner,
        uint256 changeId,
        bool add
    );
    event ConfirmOwnerChange(address indexed owner, uint256 changeId);
    event RevokeOwnerChangeConfirmation(address indexed owner, uint256 changeId);
    event ExecuteOwnerChange(address indexed owner, uint256 changeId);
    event SubmitTransaction(
        address indexed owner,
        uint indexed txIndex,
        address indexed to,
        uint value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    event RevokeTransactionConfirmation(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);

    struct OwnerChange {
        address owner;
        bool add;
        bool executed;
        uint confirmations;
    }

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint confirmations;
    }

    receive() external payable;

    function submitOwnerChange(
        address owner,
        bool add
    ) external;

    function confirmOwnerChange(
        uint256 changeId
    ) external;

    function executeOwnerChange(
        uint256 changeId
    ) external;

    function revokeOwnerChangeConfirmation(
        uint256 changeId
    ) external;

    function submitTransaction(
        address to,
        uint value,
        bytes memory data
    ) external;

    function confirmTransaction(
        uint256 transactionIndex
    ) external;

    function executeTransaction(
        uint256 transactionIndex
    ) external;

    function revokeTransactionConfirmation(
        uint256 transactionIndex
    ) external;

    function getOwners() external view returns (address[] memory);

    function getOwnerChangeCount() external view returns (uint256);

    function getOwnerChange(
        uint256 changeId
    )
        external
        view
        returns (
            address owner,
            bool add,
            bool executed,
            uint256 confirmations
        );

    function getTransactionCount() external view returns (uint256);

    function getTransaction(
        uint256 transactionIndex
    )
        external
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 confirmations
        );
}