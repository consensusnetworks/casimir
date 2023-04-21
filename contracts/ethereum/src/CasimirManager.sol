// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./CasimirAutomation.sol";
import "./CasimirPoR.sol";
import "./interfaces/ICasimirManager.sol";
import "./vendor/interfaces/IDepositContract.sol";
import "./vendor/interfaces/ISSVNetwork.sol";
import "./vendor/interfaces/ISSVToken.sol";
import "./vendor/interfaces/IWETH9.sol";
import "./libraries/Types.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/pool/IUniswapV3PoolState.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "hardhat/console.sol";

/**
 * @title Manager contract that accepts and distributes deposits
 */
contract CasimirManager is ICasimirManager, Ownable, ReentrancyGuard {
    /*************/
    /* Libraries */
    /*************/

    /** Use counter for incrementing IDs */
    using Counters for Counters.Counter;
    /** Use math for precise division */
    using Math for uint256;
    /** Use internal type for uint32 array */
    using Types32Array for uint32[];
    /** Use internal type for bytes array */
    using TypesBytesArray for bytes[];

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
    /** PoR contract */
    ICasimirPoR private immutable casimirPoR;
    /** Beacon deposit contract */
    IDepositContract private immutable beaconDeposit;
    /** LINK ERC-20 token contract */
    IERC20 private immutable linkToken;
    /** SSV network contract */
    ISSVNetwork private immutable ssvNetwork;
    /** SSV ERC-20 token contract */
    ISSVToken private immutable ssvToken;
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
    Counters.Counter lastPoolId;
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
    /** LINK fee percentage (intial value required) */
    uint32 linkFee = 1;
    /** SSV fee percentage (intial value required) */
    uint32 ssvFee = 1;

    /**
     * @notice Constructor
     * @param beaconDepositAddress The Beacon deposit address
     * @param linkFeedAddress The Chainlink data feed address
     * @param linkTokenAddress The Chainlink token address
     * @param ssvNetworkAddress The SSV network address
     * @param ssvTokenAddress The SSV token address
     * @param swapFactoryAddress The Uniswap factory address
     * @param swapRouterAddress The Uniswap router address
     * @param wethTokenAddress The WETH contract address
     */
    constructor(
        address beaconDepositAddress,
        address linkFeedAddress,
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
        ssvToken = ISSVToken(ssvTokenAddress);
        swapFactory = IUniswapV3Factory(swapFactoryAddress);
        swapRouter = ISwapRouter(swapRouterAddress);
        tokenAddresses[Token.WETH] = wethTokenAddress;

        /** Create automation and PoR contracts */
        casimirAutomation = new CasimirAutomation(address(this));
        casimirPoR = new CasimirPoR(address(this), linkFeedAddress);
    }

    /**
     * @dev Used for mocking sweeps from Beacon to the manager
     */
    receive() external payable nonReentrant {}

    /**
     * @dev Distribute ETH rewards
     * @param amount The amount of ETH to reward
     */
    function reward(uint256 amount) public {
        require(
            amount >= rewardThreshold,
            "Reward amount must be equal or greater than reward threshold"
        );

        /** Reward fees set to zero for testing */
        ProcessedDeposit memory processedDeposit = processFees(
            amount,
            Fees(0, 0)
        );

        distributionSum += Math.mulDiv(
            distributionSum,
            processedDeposit.ethAmount,
            getStake()
        );
        distribute(address(this), processedDeposit);
    }

    /**
     * @notice Deposit user stake to the pool manager
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Deposit amount must be greater than 0");

        ProcessedDeposit memory processedDeposit = processFees(
            msg.value,
            getFees()
        );

        /** Update user account state */
        if (users[msg.sender].stake0 > 0) {
            /** Settle user's current stake */
            users[msg.sender].stake0 = getUserStake(msg.sender);
        }
        users[msg.sender].distributionSum0 = distributionSum;
        users[msg.sender].stake0 += processedDeposit.ethAmount;

        distribute(msg.sender, processedDeposit);
    }

    /**
     * @dev Distribute a processed deposit to ready pools
     * @param sender The deposit sender address
     * @param processedDeposit The processed deposit
     */
    function distribute(
        address sender,
        ProcessedDeposit memory processedDeposit
    ) private {
        emit ManagerDistribution(
            sender,
            processedDeposit.ethAmount,
            processedDeposit.linkAmount,
            processedDeposit.ssvAmount
        );

        /** Distribute to open pools */
        while (processedDeposit.ethAmount > 0) {
            /** Get the next open pool */
            uint32 poolId;
            if (openPoolIds.length > 0) {
                poolId = openPoolIds[0];
            } else {
                lastPoolId.increment();
                poolId = uint32(lastPoolId.current());
                openPoolIds.push(poolId);
            }
            Pool storage pool;
            pool = pools[poolId];
            uint256 remainingCapacity = poolCapacity - pool.deposits;
            if (remainingCapacity > processedDeposit.ethAmount) {
                /** Emit event before updating values */
                emit PoolDeposit(sender, poolId, processedDeposit.ethAmount);

                /** Update pool state */
                openDeposits += processedDeposit.ethAmount;
                pool.deposits += processedDeposit.ethAmount;
                
                processedDeposit.ethAmount = 0;
            } else {
                /** Emit event before updating values */
                emit PoolDeposit(sender, poolId, remainingCapacity);

                /** Move pool from open to ready state */
                openDeposits -= pool.deposits;
                pool.deposits += remainingCapacity;

                openPoolIds.remove(0);
                readyPoolIds.push(poolId);

                processedDeposit.ethAmount -= remainingCapacity;
            }
        }

        /** Distribute LINK fees to automation contract */
        linkToken.transfer(getAutomationAddress(), processedDeposit.linkAmount);
    }

    /**
     * @notice Withdraw user stake from the pool manager
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

        /** Update user account state */
        users[msg.sender].distributionSum0 = distributionSum;
        users[msg.sender].stake0 -= amount;

        /** Update balance state */
        Pool storage pool = pools[openPoolIds[0]];
        pool.deposits -= amount;
        openDeposits -= amount;

        /** Send ETH from manager to user */
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit UserWithdrawed(msg.sender, amount);
    }

    /**
     * @dev Stake a pool validator and register with SSV
     * @param poolId The pool ID
     */
    function stakePool(uint32 poolId) public {
        require(readyValidatorPublicKeys.length > 0, "No ready validators");

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
     * @dev Process fees from a deposit
     * @param depositAmount The amount of ETH to deposit
     * @param fees The fees to process
     * @return The processed deposit
     */
    function processFees(
        uint256 depositAmount,
        Fees memory fees
    ) private returns (ProcessedDeposit memory) {
        /** Calculate total fee percentage */
        uint32 feePercent = fees.LINK + fees.SSV;

        /** Calculate ETH amount to return in processed deposit */
        uint256 ethAmount = Math.mulDiv(depositAmount, 100, 100 + feePercent);

        /** Calculate fee amount to swap */
        uint256 feeAmount = depositAmount - ethAmount;

        /** Wrap ETH fees in ERC-20 to use in swap */
        uint256 linkAmount;
        uint256 ssvAmount;
        if (feeAmount > 0) {
            wrap(feeAmount);

            linkAmount = swap(
                tokenAddresses[Token.WETH],
                tokenAddresses[Token.LINK],
                (feeAmount * fees.LINK) / feePercent
            );

            ssvAmount = swap(
                tokenAddresses[Token.WETH],
                tokenAddresses[Token.SSV],
                (feeAmount * fees.SSV) / feePercent
            );
        }
        return ProcessedDeposit(ethAmount, linkAmount, ssvAmount);
    }

    /**
     * @dev Deposit WETH to use ETH in swaps
     * @param amount The amount of ETH to deposit
     */
    function wrap(uint256 amount) private {
        IWETH9 wethToken = IWETH9(tokenAddresses[Token.WETH]);
        wethToken.deposit{value: amount}();
        wethToken.approve(address(swapRouter), amount);
    }

    /**
     * @dev Swap one token-in for another token-out
     * @param tokenIn The token-in address
     * @param tokenOut The token-out address
     * @param amountIn The amount of token-in to input
     * @return amountOut The amount of token-out
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) private returns (uint256 amountOut) {
        /** Temporarily handle unswappable fees due to liquidity */
        address swapPool = swapFactory.getPool(
            tokenIn,
            tokenOut,
            uniswapFeeTier
        );
        uint256 liquidity = IUniswapV3PoolState(swapPool).liquidity();
        uint256 desiredAmountIn = amountIn + unswappedTokens[tokenIn];
        uint256 realAmountIn;

        if (liquidity < desiredAmountIn) {
            realAmountIn = liquidity;
            unswappedTokens[tokenIn] = desiredAmountIn - liquidity;
        } else {
            realAmountIn = desiredAmountIn;
            unswappedTokens[tokenIn] = 0;
        }

        if (realAmountIn > 0) {
            /** Get swap params */
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
                .ExactInputSingleParams({
                    tokenIn: tokenIn,
                    tokenOut: tokenOut,
                    fee: uniswapFeeTier,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: realAmountIn,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                });

            /** Swap token */
            amountOut = swapRouter.exactInputSingle(params);
        }
    }

    /**
     * @dev Request a pool exit
     * @param poolId The staked pool ID
     */
    function requestPoolExit(uint32 poolId) public {
        require(msg.sender == getAutomationAddress(), "Only automation can request pool exits");
        
        Pool storage pool = pools[poolId];
        pool.exiting = true;

        /** Record validator as exiting for automation */
        exitingValidatorPublicKeys.push(pool.validatorPublicKey);

        emit PoolExitRequested(poolId);
    }

    /**
     * @dev Complete a pool exit
     * @param poolIndex The staked pool index
     * @param stakedValidatorIndex The staked validator index
     * @param exitingValidatorIndex The exiting validator index
     */
    function completePoolExit(uint256 poolIndex, uint256 stakedValidatorIndex, uint256 exitingValidatorIndex) public {
        require(msg.sender == getAutomationAddress(), "Only automation can complete pool exits");
        
        uint32 poolId = stakedPoolIds[poolIndex];
        Pool storage pool = pools[poolId];

        require(pool.exiting, "Pool is not exiting");

        bytes memory validatorPublicKey = pool.validatorPublicKey;
        bytes memory stakedValidatorPublicKey = stakedValidatorPublicKeys[stakedValidatorIndex];
        bytes memory exitingValidatorPublicKey = exitingValidatorPublicKeys[exitingValidatorIndex];

        require(keccak256(validatorPublicKey) == keccak256(stakedValidatorPublicKey) && keccak256(validatorPublicKey) == keccak256(exitingValidatorPublicKey), "Pool validator does not match staked and exiting validator");

        /** Remove pool from staked pools and delete */
        stakedPoolIds.remove(poolIndex);
        delete pools[poolId];

        /** Remove validator from staked and exiting states and delete */
        stakedValidatorPublicKeys.remove(stakedValidatorIndex);
        exitingValidatorPublicKeys.remove(exitingValidatorIndex);
        delete validators[validatorPublicKey];

        /** Remove validator from SSV */
        ssvNetwork.removeValidator(validatorPublicKey);

        emit PoolExitCompleted(poolId);
    }

    /**
     * @dev Add a validator to the pool manager
     * @param depositDataRoot The deposit data root
     * @param publicKey The validator public key
     * @param operatorIds The operator IDs
     * @param sharesEncrypted The encrypted shares
     * @param sharesPublicKeys The public keys of the shares
     * @param signature The signature
     * @param withdrawalCredentials The withdrawal credentials
     */
    function addValidator(
        bytes32 depositDataRoot,
        bytes calldata publicKey,
        uint32[] memory operatorIds,
        bytes[] memory sharesEncrypted,
        bytes[] memory sharesPublicKeys,
        bytes calldata signature,
        bytes calldata withdrawalCredentials
    ) public onlyOwner {
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
     * @notice Get the current token fees as percentages
     * @return The current token fees as percentages
     */
    function getFees() public view returns (Fees memory) {
        return Fees(getLINKFee(), getSSVFee());
    }

    /**
     * @notice Get the LINK fee percentage to charge on each deposit
     * @return The LINK fee percentage to charge on each deposit
     */
    function getLINKFee() public view returns (uint32) {
        return linkFee;
    }

    /**
     * @notice Get the SSV fee percentage to charge on each deposit
     * @return The SSV fee percentage to charge on each deposit
     */
    function getSSVFee() public view returns (uint32) {
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
    function getReadyPoolIds() public view returns (uint32[] memory) {
        return readyPoolIds;
    }

    /**
     * @notice Get a list of all staked pool IDs
     * @return A list of all staked pool IDs
     */
    function getStakedPoolIds() public view returns (uint32[] memory) {
        return stakedPoolIds;
    }

    /**
     * @notice Get the total manager stake
     * @return The total manager stake
     */
    function getStake() public view returns (uint256) {
        /** Total manager execution stake */
        int256 executionStake = getExecutionStake();

        /** Total manager consensus stake */
        int256 consensusStake = getExpectedConsensusStake();

        return SafeCast.toUint256(executionStake + consensusStake);
    }

    /**
     * @notice Get the total manager execution stake
     * @return The total manager execution stake
     */
    function getExecutionStake() public view returns (int256) {
        return int256(readyPoolIds.length * poolCapacity + openDeposits);
    }

    /**
     * @notice Get the total manager execution swept amount
     * @return The total manager execution swept amount
     */
    function getExecutionSwept() public view returns (int256) {
        return int256(address(this).balance) - getExecutionStake();
    }

    /**
     * @notice Get the total manager consensus stake
     * @return The latest total manager consensus stake
     */
    function getConsensusStake() public view returns (int256) {
        return casimirPoR.getConsensusStake();
    }

    /**
     * @notice Get the total manager expected consensus stake
     * @dev The expected stake will be honored with slashing recovery in place
     * @return The the total manager expected consensus stake
     */
    function getExpectedConsensusStake() public view returns (int256) {
        return int256(getStakedPoolIds().length * poolCapacity);
    }

    /**
     * @notice Get the total manager open deposits
     * @return The total manager open deposits
     */
    function getOpenDeposits() public view returns (uint256) {
        return openDeposits;
    }

    /**
     * @notice Get the total user stake for a given user address
     * @param userAddress The user address
     * @return The total user stake
     */
    function getUserStake(address userAddress) public view returns (uint256) {
        require(users[userAddress].stake0 > 0, "User does not have a stake");

        return
            Math.mulDiv(
                users[userAddress].stake0,
                distributionSum,
                users[userAddress].distributionSum0
            );
    }

    /**
     * @notice Get the pool details for a given pool ID
     * @param poolId The pool ID
     * @return The pool details
     */
    function getPoolDetails(
        uint32 poolId
    ) external view returns (PoolDetails memory) {
        Pool memory pool = pools[poolId];

        /** Pool will not have validator or operators if still in ready state */
        bytes memory emptyBytes = new bytes(0);
        if (keccak256(pool.validatorPublicKey) == keccak256(emptyBytes)) {
            return PoolDetails(pool.deposits, emptyBytes, new uint32[](0), pool.exiting);
        } else {
            Validator memory validator = validators[pool.validatorPublicKey];
            return PoolDetails(pool.deposits, pool.validatorPublicKey, validator.operatorIds, pool.exiting);
        }
    }

    /**
     * @notice Get the automation address
     * @return The automation address
     */
    function getAutomationAddress() public view returns (address) {
        return address(casimirAutomation);
    }

    /**
     * @notice Get the PoR address
     * @return The PoR address
     */
    function getPoRAddress() public view returns (address) {
        return address(casimirPoR);
    }
}
