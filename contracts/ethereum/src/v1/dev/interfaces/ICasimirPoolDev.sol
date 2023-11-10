// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "../../interfaces/ICasimirCore.sol";
import "../../vendor/interfaces/IEigenPod.sol";

interface ICasimirPoolDev is ICasimirCore {
    event OperatorIdsSet(uint64[] operatorIds);
    event ResharesSet(uint256 reshares);
    event StatusSet(PoolStatus status);

    error PoolNotEigenStake();
    error InvalidDepositAmount();
    error InvalidWithdrawalCredentials();

    /**
     * @notice Deposit pool stake
     * @param depositDataRoot Deposit data root
     * @param signature Deposit signature
     * @param withdrawalCredentials Validator withdrawal credentials
     */
    function depositStake(
        bytes32 depositDataRoot,
        bytes memory signature,
        bytes memory withdrawalCredentials
    ) external payable;

    /// @notice Deposit pool rewards
    function depositRewards() external;

    /**
     * @notice Set the operator IDs
     * @param newOperatorIds New operator IDs
     */
    function setOperatorIds(uint64[] memory newOperatorIds) external;

    /**
     * @notice Set the reshare count
     * @param newReshares New reshare count
     */
    function setReshares(uint256 newReshares) external;

    /**
     * @notice Set the pool status
     * @param newStatus New status
     */
    function setStatus(PoolStatus newStatus) external;

    /**
     * @notice Verify the withdrawal credentials for the eigen pod
     * @param oracleTimestamp Beacon chain timestamp whose state root the `proof` will be proven against
     * @param stateRootProof Proof against the `beaconStateRoot` for a block root fetched from the oracle
     * @param validatorIndices List of indices of the validators being proven
     * @param validatorFieldsProofs Proofs against the `beaconStateRoot` for each validator in `validatorFields`
     * @param validatorFields Fields of the "Validator Container" referenced in the consensus specs
     */
    function verifyWithdrawalCredentials(
        uint64 oracleTimestamp,
        BeaconChainProofs.StateRootProof calldata stateRootProof,
        uint40[] calldata validatorIndices,
        bytes[] calldata validatorFieldsProofs,
        bytes32 [][] calldata validatorFields
    ) external;

    /**
     * @notice Withdraw pool balance to the manager
     * @param blamePercents Operator loss blame percents
     */
    function withdrawBalance(uint32[] memory blamePercents) external;

    /// @notice Validator public key
    function publicKey() external view returns (bytes memory);

    /// @notice Reshare count
    function reshares() external view returns (uint256);

    /// @notice Pool status
    function status() external view returns (PoolStatus);

    /// @notice Get the pool operator IDs
    function getOperatorIds() external view returns (uint64[] memory);

    /// @notice Get the pool registration
    function getRegistration() external view returns (PoolRegistration memory);
}
