// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface ISSVManager {
    event ManagerDistribution(address indexed sender, uint256 ethAmount, uint256 time);
    event PoolDeposit(address indexed sender, uint32 poolId, uint256 amount, uint256 time);
    event PoolStaked(uint32 indexed poolId, bytes validatorPublicKey, uint32[] operatorIds);
    event ValidatorAdded(bytes publicKey, uint32[] operatorIds);

    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function getFees() external view returns (uint32 LINKFee, uint32 SSVFee);
    function getLINKFee() external view returns (uint32);
    function getSSVFee() external view returns (uint32);
    function getStakedValidatorPublicKeys() external view returns (bytes[] memory);
    function getReadyValidatorPublicKeys() external view returns (bytes[] memory);
    function getReadyPoolIds() external view returns (uint32[] memory);
    function getStakedPoolIds() external view returns (uint32[] memory);
    function getStake() external view returns (uint256);
    function getReadyDeposits() external view returns (uint256);
    function getUserStake(address userAddress) external view returns (uint256);
}