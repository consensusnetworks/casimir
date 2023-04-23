// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./CasimirAutomation.sol";
import "./interfaces/ICasimirManager.sol";
import "./libraries/Types.sol";
import "./vendor/interfaces/IDepositContract.sol";
import "./vendor/interfaces/ISSVNetwork.sol";
import "./vendor/interfaces/IWETH9.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/pool/IUniswapV3PoolState.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

// Dev-only imports
import "hardhat/console.sol";

/**
 * @title Manager contract that accepts and distributes deposits
 */
contract CasimirManager is ICasimirManager, Ownable, ReentrancyGuard {
    /*************/
    /* Libraries */
    /*************/

    /** Use math for precise division */
    using Math for uint256;
    /** Use internal type for uint32 array */
    using Types32Array for uint32[];
    /** Use internal type for bytes array */
    using TypesBytesArray for bytes[];
    /** Use internal type for user withdrawal array */
    using TypesUserWithdrawalArray for UserWithdrawal[];

    /*************/
    /* Constants */
    /*************/

    /** Pool capacity */
    uint256 private constant poolCapacity = 32 ether;
    /* Reward threshold (0.1 ETH) */
    uint256 private constant rewardThreshold = 100000000000000000;
    /** Scale factor for each reward to stake ratio */
    uint256 private constant scaleFactor = 1 ether;
    /** Uniswap 0.3% fee tier */
    uint24 private constant uniswapFeeTier = 3000;

    /*************/
    /* Contracts */
    /*************/

    /** Automation contract */
    ICasimirAutomation private immutable casimirAutomation;
    /** Beacon deposit contract */
    IDepositContract private immutable beaconDeposit;
    /** LINK ERC-20 token contract */
    IERC20 private immutable linkToken;
    /** SSV network contract */
    ISSVNetwork private immutable ssvNetwork;
    /** SSV ERC-20 token contract */
    IERC20 private immutable ssvToken;
    /** Uniswap factory contract */
    IUniswapV3Factory private immutable swapFactory;
    /** Uniswap router contract  */
    ISwapRouter private immutable swapRouter;

    /***************/
    /* Enumerators */
    /***************/

    /** Token abbreviations */
    enum Token {
        LINK,
        SSV,
        WETH
    }

    /********************/
    /* Dynamic State */
    /********************/

    /** Last pool ID generated for a new pool */
    uint256 lastPoolId;
    /** Token addresses */
    mapping(Token => address) private tokenAddresses;
    /** Unswapped tokens by address */
    mapping(address => uint256) private unswappedTokens;
    /** All users */
    mapping(address => User) private users;
    /** All pools (open, ready, or staked) */
    mapping(uint32 => Pool) private pools;
    /** Total deposits in open pools */
    uint256 private openDeposits;
    /** IDs of pools open for deposits */
    uint32[] private openPoolIds;
    /** IDs of pools ready for stake */
    uint32[] private readyPoolIds;
    /** IDs of staking pools at full capacity */
    uint32[] private stakedPoolIds;
    /** All validators (ready or staked) */
    mapping(bytes => Validator) private validators;
    /** Public keys of ready validators */
    bytes[] private readyValidatorPublicKeys;
    /** Public keys of staked validators */
    bytes[] private stakedValidatorPublicKeys;
    /** Public keys of exiting validators */
    bytes[] private exitingValidatorPublicKeys;
    /** Sum of scaled reward to stake ratios (intial value required) */
    uint256 distributionSum = 1000 ether;
    /** Requested withdrawals */
    UserWithdrawal[] private requestedWithdrawalQueue;
    /** Pending withdrawals */
    UserWithdrawal[] private pendingWithdrawalQueue;
    /** Total requested withdrawals */
    uint256 private requestedWithdrawals;
    /** Total pending withdrawals */
    uint256 private pendingWithdrawals;
    /** LINK fee percentage (intial value required) */
    uint32 linkFee = 1;
    /** SSV fee percentage (intial value required) */
    uint32 ssvFee = 1;

    /**
     * @notice Constructor
     * @param beaconDepositAddress The Beacon deposit address
     * @param linkOracleAddress The Chainlink functions oracle address
     * @param linkTokenAddress The Chainlink token address
     * @param ssvNetworkAddress The SSV network address
     * @param ssvTokenAddress The SSV token address
     * @param swapFactoryAddress The Uniswap factory address
     * @param swapRouterAddress The Uniswap router address
     * @param wethTokenAddress The WETH contract address
     */
    constructor(
        address beaconDepositAddress,
        address linkOracleAddress,
        address linkTokenAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address swapFactoryAddress,
        address swapRouterAddress,
        address wethTokenAddress
    ) {
        beaconDeposit = IDepositContract(beaconDepositAddress);
        linkToken = IERC20(linkTokenAddress);
        tokenAddresses[Token.LINK] = linkTokenAddress;
        ssvNetwork = ISSVNetwork(ssvNetworkAddress);
        tokenAddresses[Token.SSV] = ssvTokenAddress;
        ssvToken = IERC20(ssvTokenAddress);
        swapFactory = IUniswapV3Factory(swapFactoryAddress);
        swapRouter = ISwapRouter(swapRouterAddress);
        tokenAddresses[Token.WETH] = wethTokenAddress;

        /** Deploy automation contract */
        casimirAutomation = new CasimirAutomation(
            address(this),
            linkOracleAddress
        );
    }

    /**
     * @dev Distribute ETH rewards
     * @param amount The amount of ETH to reward
     */
    function reward(uint256 amount) external {
        require(
            msg.sender == address(casimirAutomation),
            "Only automation contract can distribute rewards"
        );
        require(
            amount >= rewardThreshold,
            "Reward amount must be equal or greater than reward threshold"
        );

        /** Reward fees set to zero for testing */
        uint256 processedAmount = processFees(amount, Fees(0, 0));

        distributionSum += Math.mulDiv(
            distributionSum,
            processedAmount,
            getStake()
        );

        distribute(processedAmount);

        emit RewardDistributed(msg.sender, processedAmount);
    }

    /**
     * @notice Deposit user stake to the pool manager
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Deposit amount must be greater than 0");

        uint256 processedAmount = processFees(msg.value, getFees());

        /** Update user account state */
        if (users[msg.sender].stake0 > 0) {
            /** Settle user's current stake */
            users[msg.sender].stake0 = getUserStake(msg.sender);
        }
        users[msg.sender].distributionSum0 = distributionSum;
        users[msg.sender].stake0 += processedAmount;

        distribute(processedAmount);

        emit UserDepositDistributed(msg.sender, processedAmount);
    }

    /**
     * @dev Distribute ETH to ready pools
     * @param amount The amount of ETH to distribute
     */
    function distribute(uint256 amount) private {
        /** Distribute ETH to open pools */
        while (amount > 0) {
            /** Get the next open pool */
            uint32 poolId;
            if (openPoolIds.length > 0) {
                poolId = openPoolIds[0];
            } else {
                lastPoolId += 1;
                poolId = uint32(lastPoolId);
                openPoolIds.push(poolId);
            }
            Pool storage pool;
            pool = pools[poolId];
            uint256 remainingCapacity = poolCapacity - pool.deposits;
            if (remainingCapacity > amount) {
                /** Emit event before updating values */
                emit PoolIncreased(msg.sender, poolId, amount);

                openDeposits += amount;
                pool.deposits += amount;
                amount = 0;
            } else {
                /** Emit event before updating values */
                emit PoolIncreased(msg.sender, poolId, remainingCapacity);

                openDeposits -= pool.deposits;
                pool.deposits += remainingCapacity;
                amount -= remainingCapacity;

                /** Move pool from open to ready state */
                openPoolIds.remove(0);
                readyPoolIds.push(poolId);
            }
        }
    }

    /**
     * @notice Withdraw user stake
     * @param amount The amount of ETH to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(openDeposits >= amount, "Withdrawing more than open deposits");
        require(users[msg.sender].stake0 > 0, "User does not have a stake");

        /** Settle user's compounded stake */
        users[msg.sender].stake0 = getUserStake(msg.sender);

        require(
            users[msg.sender].stake0 >= amount,
            "Withdrawing more than user stake"
        );

        /** Instantly withdraw if full amount is available */
        if (amount <= openDeposits) {
            withdrawInstantly(amount);
        } else {
            requestWithdrawal(amount);
        }
    }

    /**
     * @dev Withdraw user stake instantly from open deposits
     * @param amount The amount of ETH to withdraw
     */
    function withdrawInstantly(uint256 amount) private {
        /** Update user account state */
        users[msg.sender].distributionSum0 = distributionSum;
        users[msg.sender].stake0 -= amount;

        /** Update balance state */
        Pool storage pool = pools[openPoolIds[0]];
        pool.deposits -= amount;
        openDeposits -= amount;

        send(msg.sender, amount);

        emit UserWithdrawed(msg.sender, amount);
    }

    /**
     * @dev Request to withdraw user stake from exited deposits
     * @param amount The amount of ETH to withdraw
     */
    function requestWithdrawal(uint256 amount) private {
        /** Update requested withdrawals state */
        requestedWithdrawalQueue.push(
            UserWithdrawal({user: msg.sender, amount: amount})
        );
        requestedWithdrawals += amount;

        emit UserWithdrawalRequested(msg.sender, amount);
    }

    /**
     * @notice Initiate the next withdrawal of user stake from exited deposits
     */
    function inititateNextWithdrawal() external {
        require(
            msg.sender == address(casimirAutomation),
            "Only automation contract can initiate withdrawals"
        );

        /** Get next requested withdrawal */
        UserWithdrawal memory userWithdrawal = requestedWithdrawalQueue[0];

        /** Update requested withdrawals state */
        requestedWithdrawalQueue.remove(0);
        requestedWithdrawals -= userWithdrawal.amount;

        /** Update pending withdrawals state */
        pendingWithdrawalQueue.push(userWithdrawal);
        pendingWithdrawals += userWithdrawal.amount;

        /** Update user account state */
        users[userWithdrawal.user].distributionSum0 = distributionSum;
        users[userWithdrawal.user].stake0 -= userWithdrawal.amount;

        emit UserWithdrawalInitiated(
            userWithdrawal.user,
            userWithdrawal.amount
        );
    }

    /**
     * @notice Complete the next withdrawal of user stake from exited deposits
     */
    function completeNextWithdrawal() external {
        require(
            msg.sender == address(casimirAutomation),
            "Only automation contract can complete withdrawals"
        );

        /** Get next pending withdrawal */
        UserWithdrawal memory userWithdrawal = pendingWithdrawalQueue[0];

        /** Update pending withdrawals state */
        pendingWithdrawalQueue.remove(0);
        pendingWithdrawals -= userWithdrawal.amount;

        send(userWithdrawal.user, userWithdrawal.amount);

        emit UserWithdrawed(userWithdrawal.user, userWithdrawal.amount);
    }

    /**
     * @dev Send ETH to a recipient
     * @param recipient The recipient address
     * @param amount The amount of ETH to send
     */
    function send(address recipient, uint256 amount) private {
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @notice Stake the next ready pool
     */
    function stakeNextPool() external {
        require(
            msg.sender == address(casimirAutomation),
            "Only automation contract can stake pools"
        );
        require(readyValidatorPublicKeys.length > 0, "No ready validators");

        /** Get next ready pool ID */
        uint32 poolId = readyPoolIds[0];

        /** Get next ready validator */
        bytes memory validatorPublicKey = readyValidatorPublicKeys[0];
        Validator memory validator = validators[validatorPublicKey];

        /** Get the pool */
        Pool storage pool = pools[poolId];
        pool.validatorPublicKey = validatorPublicKey;

        /** Move pool from ready to staked state */
        readyPoolIds.remove(0);
        stakedPoolIds.push(poolId);

        /** Move validator from inactive to active state and add to pool */
        readyValidatorPublicKeys.remove(0);
        stakedValidatorPublicKeys.push(validatorPublicKey);

        /** Deposit validator */
        beaconDeposit.deposit{value: pool.deposits}(
            validatorPublicKey, // bytes
            validator.withdrawalCredentials, // bytes
            validator.signature, // bytes
            validator.depositDataRoot // bytes32
        );

        /** Pay SSV fees and register validator */
        /** Todo update for v3 SSV contracts and dynamic fees */
        uint256 mockSSVFee = 5 ether;
        ssvToken.approve(address(ssvNetwork), mockSSVFee);
        ssvNetwork.registerValidator(
            validatorPublicKey, // bytes
            validator.operatorIds, // uint32[]
            validator.sharesPublicKeys, // bytes[]
            validator.sharesEncrypted, // bytes[],
            mockSSVFee // uint256 (fees handled on user deposits)
        );

        emit PoolStaked(poolId);
    }

    /**
     * @notice Request a pool exit
     * @param poolId The staked pool ID
     */
    function requestPoolExit(uint32 poolId) external {
        require(
            msg.sender == address(casimirAutomation),
            "Only automation can request pool exits"
        );

        Pool storage pool = pools[poolId];

        require(!pool.exiting, "Pool is already exiting");

        pool.exiting = true;

        /** Record validator as exiting for automation */
        exitingValidatorPublicKeys.push(pool.validatorPublicKey);

        emit PoolExitRequested(poolId);
    }

    /**
     * @notice Complete a pool exit
     * @param poolStakedIndex The pool's staked index
     * @param validatorStakedIndex The validator's staked index
     * @param validatorExitingIndex The validator's exiting index
     */
    function completePoolExit(
        uint256 poolStakedIndex,
        uint256 validatorStakedIndex,
        uint256 validatorExitingIndex
    ) external {
        require(
            msg.sender == address(casimirAutomation),
            "Only automation can complete pool exits"
        );

        uint32 poolId = stakedPoolIds[poolStakedIndex];
        Pool storage pool = pools[poolId];

        require(pool.exiting, "Pool is not exiting");

        bytes memory validatorPublicKey = pool.validatorPublicKey;
        bytes memory stakedValidatorPublicKey = stakedValidatorPublicKeys[
            validatorStakedIndex
        ];
        bytes memory exitingValidatorPublicKey = exitingValidatorPublicKeys[
            validatorExitingIndex
        ];

        require(
            keccak256(validatorPublicKey) ==
                keccak256(stakedValidatorPublicKey) &&
                keccak256(validatorPublicKey) ==
                keccak256(exitingValidatorPublicKey),
            "Pool validator does not match staked and exiting validator"
        );

        /** Remove pool from staked pools and delete */
        stakedPoolIds.remove(poolStakedIndex);
        delete pools[poolId];

        /** Remove validator from staked and exiting states and delete */
        stakedValidatorPublicKeys.remove(validatorStakedIndex);
        exitingValidatorPublicKeys.remove(validatorExitingIndex);
        delete validators[validatorPublicKey];

        /** Remove validator from SSV */
        ssvNetwork.removeValidator(validatorPublicKey);

        emit PoolExited(poolId);
    }

    /**
     * @notice Register a validator with the pool manager
     * @param depositDataRoot The deposit data root
     * @param publicKey The validator public key
     * @param operatorIds The operator IDs
     * @param sharesEncrypted The encrypted shares
     * @param sharesPublicKeys The public keys of the shares
     * @param signature The signature
     * @param withdrawalCredentials The withdrawal credentials
     */
    function registerValidator(
        bytes32 depositDataRoot,
        bytes calldata publicKey,
        uint32[] memory operatorIds,
        bytes[] memory sharesEncrypted,
        bytes[] memory sharesPublicKeys,
        bytes calldata signature,
        bytes calldata withdrawalCredentials
    ) external onlyOwner {
        /** Create validator and add to ready state */
        validators[publicKey] = Validator(
            depositDataRoot,
            operatorIds,
            sharesEncrypted,
            sharesPublicKeys,
            signature,
            withdrawalCredentials
        );
        readyValidatorPublicKeys.push(publicKey);

        emit ValidatorAdded(publicKey);
    }

    /**
     * @dev Process fees from a deposit
     * @param depositAmount The full deposit amount
     * @param fees The fees to process
     * @return processedAmount The processed deposit amount
     */
    function processFees(
        uint256 depositAmount,
        Fees memory fees
    ) private returns (uint256 processedAmount) {
        /** Calculate total fee percentage */
        uint32 feePercent = fees.LINK + fees.SSV;

        /** Calculate ETH amount to return in processed deposit */
        uint256 ethAmount = Math.mulDiv(depositAmount, 100, 100 + feePercent);

        /** Calculate fee amount to swap */
        uint256 feeAmount = depositAmount - ethAmount;

        /** Wrap and swap */
        if (feeAmount > 0) {
            wrapFees(feeAmount);

            (, uint256 unswappedLINK) = swapFees(
                tokenAddresses[Token.WETH],
                tokenAddresses[Token.LINK],
                Math.mulDiv(feeAmount, fees.LINK, feePercent)
            );
            // Todo use link.tokenIncreaseAllowance(swappedLINK) if available
            linkToken.approve(
                address(casimirAutomation),
                linkToken.balanceOf(address(this))
            );
            unswappedTokens[tokenAddresses[Token.LINK]] += unswappedLINK;

            (, uint256 unswappedSSV) = swapFees(
                tokenAddresses[Token.WETH],
                tokenAddresses[Token.SSV],
                Math.mulDiv(feeAmount, fees.SSV, feePercent)
            );
            // Todo use ssv.tokenIncreaseAllowance(swappedSSV) if available
            ssvToken.approve(
                address(casimirAutomation),
                ssvToken.balanceOf(address(this))
            );
            unswappedTokens[tokenAddresses[Token.SSV]] += unswappedSSV;
        }
        processedAmount = ethAmount;
    }

    /**
     * @dev Deposit WETH to use ETH in swaps
     * @param amount The amount of ETH to deposit
     */
    function wrapFees(uint256 amount) private {
        IWETH9 wethToken = IWETH9(tokenAddresses[Token.WETH]);
        wethToken.deposit{value: amount}();
        wethToken.approve(address(swapRouter), amount);
    }

    /**
     * @dev Swap token in for token out
     */
    function swapFees(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) private returns (uint256 amountOut, uint256 amountUnswapped) {
        address swapPool = swapFactory.getPool(
            tokenIn,
            tokenOut,
            uniswapFeeTier
        );
        uint256 liquidity = IUniswapV3PoolState(swapPool).liquidity();
        if (liquidity < amountIn) {
            amountUnswapped = amountIn - liquidity;
            amountIn = liquidity;
        }
        if (amountIn > 0) {
            /** Get swap params */
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
                .ExactInputSingleParams({
                    tokenIn: tokenIn,
                    tokenOut: tokenOut,
                    fee: uniswapFeeTier,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: amountIn,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                });

            /** Perform swap */
            amountOut = swapRouter.exactInputSingle(params);
        }
    }

    /**
     * @dev Update link fee
     * @param newFee The new fee
     */
    function setLINKFee(uint32 newFee) external onlyOwner {
        linkFee = newFee;
    }

    /**
     * @dev Update ssv fee
     * @param newFee The new fee
     */
    function setSSVFee(uint32 newFee) external onlyOwner {
        ssvFee = newFee;
    }

    /**
     * @notice Update the functions oracle address
     * @param oracle New oracle address
     */
    function setOracleAddress(address oracle) external onlyOwner {
        casimirAutomation.setOracleAddress(oracle);
    }

    /**
     * @notice Get the current token fees as percentages
     * @return fees The current token fees as percentages
     */
    function getFees() public view returns (Fees memory fees) {
        fees = Fees(linkFee, ssvFee);
    }

    /**
     * @notice Get the total manager stake
     * @return stake The total manager stake
     */
    function getStake() public view returns (uint256 stake) {
        /** Total manager execution stake */
        int256 executionStake = getExecutionStake();

        /** Total manager consensus stake */
        int256 consensusStake = getExpectedConsensusStake();

        stake = SafeCast.toUint256(executionStake + consensusStake);
    }

    /**
     * @notice Get the total manager execution stake
     * @return executionStake The total manager execution stake
     */
    function getExecutionStake() public view returns (int256 executionStake) {
        executionStake = int256(
            readyPoolIds.length * poolCapacity + openDeposits
        );
    }

    /**
     * @notice Get the total manager execution swept amount
     * @return executionSwept The total manager execution swept amount
     */
    function getExecutionSwept() public view returns (int256 executionSwept) {
        executionSwept = int256(address(this).balance) - getExecutionStake();
    }

    /**
     * @notice Get the total manager expected consensus stake
     * @dev Pending user withdrawal amount is subtracted from the expected stake
     * @dev The expected stake will be honored with penalty recovery in place
     * @return expectedConsensusStake The total manager expected consensus stake
     */
    function getExpectedConsensusStake()
        public
        view
        returns (int256 expectedConsensusStake)
    {
        expectedConsensusStake =
            int256(stakedPoolIds.length * poolCapacity) -
            int256(pendingWithdrawals);
    }

    /**
     * @notice Get the total user stake for a given user address
     * @param userAddress The user address
     * @return userStake The total user stake
     */
    function getUserStake(
        address userAddress
    ) public view returns (uint256 userStake) {
        require(users[userAddress].stake0 > 0, "User does not have a stake");
        userStake = Math.mulDiv(
            users[userAddress].stake0,
            distributionSum,
            users[userAddress].distributionSum0
        );
    }

    // External view functions

    /**
     * @notice Get the LINK fee percentage to charge on each deposit
     * @return The LINK fee percentage to charge on each deposit
     */
    function getLINKFee() external view returns (uint32) {
        return linkFee;
    }

    /**
     * @notice Get the SSV fee percentage to charge on each deposit
     * @return The SSV fee percentage to charge on each deposit
     */
    function getSSVFee() external view returns (uint32) {
        return ssvFee;
    }

    /**
     * @notice Get staked validator public keys
     * @return A list of active validator public keys
     */
    function getStakedValidatorPublicKeys()
        external
        view
        returns (bytes[] memory)
    {
        return stakedValidatorPublicKeys;
    }

    /**
     * @notice Get ready validator public keys
     * @return A list of inactive validator public keys
     */
    function getReadyValidatorPublicKeys()
        external
        view
        returns (bytes[] memory)
    {
        return readyValidatorPublicKeys;
    }

    /**
     * @notice Get a list of all open pool IDs
     * @return A list of all open pool IDs
     */
    function getOpenPoolIds() external view returns (uint32[] memory) {
        return openPoolIds;
    }

    /**
     * @notice Get a list of all ready pool IDs
     * @return A list of all ready pool IDs
     */
    function getReadyPoolIds() external view returns (uint32[] memory) {
        return readyPoolIds;
    }

    /**
     * @notice Get a list of all staked pool IDs
     * @return A list of all staked pool IDs
     */
    function getStakedPoolIds() external view returns (uint32[] memory) {
        return stakedPoolIds;
    }

    /**
     * @notice Get the total manager open deposits
     * @return The total manager open deposits
     */
    function getOpenDeposits() external view returns (uint256) {
        return openDeposits;
    }

    /**
     * @notice Get the pool details for a given pool ID
     * @param poolId The pool ID
     * @return poolDetails The pool details
     */
    function getPoolDetails(
        uint32 poolId
    ) external view returns (PoolDetails memory poolDetails) {
        Pool memory pool = pools[poolId];

        /** Pool in ready state will not have validator or operators */
        bytes memory emptyBytes = new bytes(0);
        if (keccak256(pool.validatorPublicKey) == keccak256(emptyBytes)) {
            poolDetails = PoolDetails(
                pool.deposits,
                emptyBytes,
                new uint32[](0),
                pool.exiting
            );
        } else {
            Validator memory validator = validators[pool.validatorPublicKey];
            poolDetails = PoolDetails(
                pool.deposits,
                pool.validatorPublicKey,
                validator.operatorIds,
                pool.exiting
            );
        }
    }

    /**
     * @notice Get the automation address
     * @return automationAddress The automation address
     */
    function getAutomationAddress()
        external
        view
        returns (address automationAddress)
    {
        automationAddress = address(casimirAutomation);
    }

    // Dev-only functions

    /**
     * @dev Will be removed in production
     * @dev Used for mocking sweeps from Beacon to the manager
     */
    receive() external payable nonReentrant {}
}
