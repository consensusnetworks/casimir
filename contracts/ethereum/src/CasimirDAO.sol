// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import './interfaces/ICasimirDAO.sol';

contract CasimirDAO is ICasimirDAO {
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public numConfirmationsRequired;

    mapping(uint => mapping(address => bool)) public isOwnerChangeConfirmed;
    mapping(uint => mapping(address => bool)) public isTransactionConfirmed;

    OwnerChange[] public ownerChanges;
    Transaction[] public transactions;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    modifier ownerChangeExists(uint256 changeId) {
        require(changeId < ownerChanges.length, "Owner change does not exist");
        _;
    }

    modifier ownerChangeNotExecuted(uint256 changeId) {
        require(
            !ownerChanges[changeId].executed,
            "Owner change already executed"
        );
        _;
    }

    modifier ownerChangeNotConfirmed(uint256 changeId) {
        require(
            !isOwnerChangeConfirmed[changeId][msg.sender],
            "Owner change already confirmed"
        );
        _;
    }

    modifier transactionExists(uint transactionIndex) {
        require(
            transactionIndex < transactions.length,
            "Transaction does not exist"
        );
        _;
    }

    modifier transactionNotExecuted(uint transactionIndex) {
        require(
            !transactions[transactionIndex].executed,
            "Transaction already executed"
        );
        _;
    }

    modifier transactionNotConfirmed(uint transactionIndex) {
        require(
            !isTransactionConfirmed[transactionIndex][msg.sender],
            "Transaction already confirmed"
        );
        _;
    }

    constructor(address[] memory _owners, uint256 _numConfirmationsRequired) {
        require(_owners.length > 0, "Owners required");
        require(
            _numConfirmationsRequired > 0 &&
                _numConfirmationsRequired <= _owners.length,
            "Invalid number of required confirmations"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function submitOwnerChange(address owner, bool add) public onlyOwner {
        uint256 changeId = ownerChanges.length;

        ownerChanges.push(
            OwnerChange({
                owner: owner,
                add: add,
                executed: false,
                numConfirmations: 0
            })
        );

        emit SubmitOwnerChange(msg.sender, changeId, add);
    }

    function confirmOwnerChange(
        uint256 changeId
    )
        public
        onlyOwner
        ownerChangeExists(changeId)
        ownerChangeNotExecuted(changeId)
        ownerChangeNotConfirmed(changeId)
    {
        OwnerChange storage ownerChange = ownerChanges[changeId];
        ownerChange.numConfirmations += 1;
        isOwnerChangeConfirmed[changeId][msg.sender] = true;

        emit ConfirmOwnerChange(msg.sender, changeId);
    }

    function executeOwnerChange(
        uint256 changeId
    )
        public
        onlyOwner
        ownerChangeNotExecuted(changeId)
        ownerChangeNotConfirmed(changeId)
    {
        OwnerChange storage ownerChange = ownerChanges[changeId];

        require(
            ownerChange.numConfirmations >= numConfirmationsRequired,
            "Cannot execute owner change"
        );

        ownerChange.executed = true;

        if (ownerChange.add) {
            isOwner[ownerChange.owner] = true;
            owners.push(ownerChange.owner);
        } else {
            isOwner[ownerChange.owner] = false;

            for (uint256 i = 0; i < owners.length - 1; i++) {
                if (owners[i] == ownerChange.owner) {
                    owners[i] = owners[owners.length - 1];
                    break;
                }
            }
            owners.pop();
        }

        emit ExecuteOwnerChange(msg.sender, changeId);
    }

    function revokeOwnerChangeConfirmation(
        uint256 changeId
    )
        public
        onlyOwner
        ownerChangeExists(changeId)
        ownerChangeNotExecuted(changeId)
    {
        OwnerChange storage ownerChange = ownerChanges[changeId];

        require(
            isOwnerChangeConfirmed[changeId][msg.sender],
            "Owner change not confirmed"
        );

        ownerChange.numConfirmations -= 1;
        isOwnerChangeConfirmed[changeId][msg.sender] = false;

        emit RevokeOwnerChangeConfirmation(msg.sender, changeId);
    }

    function submitTransaction(
        address to,
        uint256 value,
        bytes memory data
    ) public onlyOwner {
        uint256 transactionIndex = transactions.length;

        transactions.push(
            Transaction({
                to: to,
                value: value,
                data: data,
                executed: false,
                numConfirmations: 0
            })
        );

        emit SubmitTransaction(msg.sender, transactionIndex, to, value, data);
    }

    function confirmTransaction(
        uint256 transactionIndex
    )
        public
        onlyOwner
        transactionExists(transactionIndex)
        transactionNotExecuted(transactionIndex)
        transactionNotConfirmed(transactionIndex)
    {
        Transaction storage transaction = transactions[transactionIndex];
        transaction.numConfirmations += 1;
        isTransactionConfirmed[transactionIndex][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, transactionIndex);
    }

    function executeTransaction(
        uint256 transactionIndex
    )
        public
        onlyOwner
        transactionExists(transactionIndex)
        transactionNotExecuted(transactionIndex)
    {
        Transaction storage transaction = transactions[transactionIndex];

        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "Cannot execute Transaction"
        );

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "Transaction failed");

        emit ExecuteTransaction(msg.sender, transactionIndex);
    }

    function revokeTransactionConfirmation(
        uint256 transactionIndex
    )
        public
        onlyOwner
        transactionExists(transactionIndex)
        transactionNotExecuted(transactionIndex)
    {
        Transaction storage transaction = transactions[transactionIndex];

        require(
            isTransactionConfirmed[transactionIndex][msg.sender],
            "Transaction not confirmed"
        );

        transaction.numConfirmations -= 1;
        isTransactionConfirmed[transactionIndex][msg.sender] = false;

        emit RevokeTransactionConfirmation(msg.sender, transactionIndex);
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getOwnerChangeCount() public view returns (uint256) {
        return ownerChanges.length;
    }

    function getOwnerChange(
        uint256 changeId
    )
        public
        view
        returns (
            address owner,
            bool add,
            bool executed,
            uint256 numConfirmations
        )
    {
        OwnerChange storage ownerChange = ownerChanges[changeId];
        return (
            ownerChange.owner,
            ownerChange.add,
            ownerChange.executed,
            ownerChange.numConfirmations
        );
    }

    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(
        uint256 transactionIndex
    )
        public
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 numConfirmations
        )
    {
        Transaction storage transaction = transactions[transactionIndex];
        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }
}