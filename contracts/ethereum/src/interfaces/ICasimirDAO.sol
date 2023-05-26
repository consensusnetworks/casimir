// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

interface ICasimirDAO {
    event Deposit(address indexed sender, uint amount, uint balance);
    event SubmitTransaction(
        address indexed owner,
        uint indexed txIndex,
        address indexed to,
        uint value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint numConfirmations;
    }

    receive() external payable;

    function submitTransaction(
        address _to,
        uint _value,
        bytes memory _data
    ) external;

    function confirmTransaction(
        uint _txIndex
    ) external;

    function executeTransaction(
        uint _txIndex
    ) external;

    function revokeConfirmation(
        uint _txIndex
    ) external;

    function getOwners() external view returns (address[] memory);

    function getTransactionCount() external view returns (uint);

    function getTransaction(
        uint _txIndex
    )
        external
        view
        returns (
            address to,
            uint value,
            bytes memory data,
            bool executed,
            uint numConfirmations
        );
}