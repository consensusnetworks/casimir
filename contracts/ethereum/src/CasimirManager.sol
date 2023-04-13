// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./CasimirAutomation.sol";
import "./interfaces/ICasimirManager.sol";
import "./vendor/interfaces/IDepositContract.sol";
import "./vendor/interfaces/ISSVNetwork.sol";
import "./vendor/interfaces/ISSVToken.sol";
import "./vendor/interfaces/IWETH9.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
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

    /*************/
    /* Constants */
    /*************/

    /** Uniswap 0.3% fee tier */
    uint24 private immutable uniswapFeeTier = 3000;
    /** Staking pool capacity */
    uint256 private poolCapacity = 32 ether;
    /** Scale factor for each reward to stake ratio */
    uint256 scaleFactor = 1 ether;
    /** Sum of scaled reward to stake ratios (arbitrary intial value required) */
    uint256 distributionSum = 1000 ether;

    /*************/
    /* Contracts */
    /*************/

    /** Automation contract address */
    ICasimirAutomation private immutable casimirAutomation;
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
    /* Global Variables */
    /********************/

    /** Last pool ID generated for a new pool */
    Counters.Counter lastPoolId;
    /** Token addresses */
    mapping(Token => address) private tokens;
    /** Unswapped LINK fees */
    uint256 private unswappedLINKFees;
    /** Unswapped SSV fees */
    uint256 private unswappedSSVFees;
    /** User staking accounts */
    mapping(address => User) private users;
    /** Staking pools */
    mapping(uint32 => Pool) private pools;
    /** Total pool deposits ready for stake */
    uint256 private readyDeposits;
    /** IDs of staking pools readily accepting deposits */
    uint32[] private readyPoolIds;
    /** IDs of staking pools at full capacity */
    uint32[] private stakedPoolIds;
    /** Validators (staked or ready) */
    mapping(bytes => Validator) private validators;
    /** Public keys of staked validators  */
    bytes[] private stakedValidatorPublicKeys;
    /** Public keys of ready validators */
    bytes[] private readyValidatorPublicKeys;

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
        tokens[Token.LINK] = linkTokenAddress;
        ssvNetwork = ISSVNetwork(ssvNetworkAddress);
        tokens[Token.SSV] = ssvTokenAddress;
        ssvToken = ISSVToken(ssvTokenAddress);
        swapFactory = IUniswapV3Factory(swapFactoryAddress);
        swapRouter = ISwapRouter(swapRouterAddress);
        tokens[Token.WETH] = wethTokenAddress;

        casimirAutomation = new CasimirAutomation(
            address(this),
            linkFeedAddress
        );
    }

    /**
     * @dev Production will use oracle reporting balance increases, but receive is used for mocking rewards
     */
    receive() external payable nonReentrant {
        reward(msg.value);
    }

    /**
     * @dev Distribute ETH rewards
     * @param rewardAmount The amount of ETH to reward
     */
    function reward(uint256 rewardAmount) private {
        /** Reward fees set to zero for testing */
        ProcessedDeposit memory processedDeposit = processFees(
            rewardAmount,
            Fees(0, 0)
        );

        distributionSum += Math.mulDiv(
            distributionSum,
            processedDeposit.ethAmount,
            getStake()
        );
        distribute(address(this), processedDeposit, block.timestamp);
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

        /** Update user staking account */
        if (users[msg.sender].stake0 > 0) {
            /** Settle user's current stake */
            users[msg.sender].stake0 = getUserStake(msg.sender);
        }
        users[msg.sender].distributionSum0 = distributionSum;
        users[msg.sender].stake0 =
            users[msg.sender].stake0 +
            processedDeposit.ethAmount;

        distribute(msg.sender, processedDeposit, block.timestamp);
    }

    /**
     * @dev Distribute a processed deposit to ready pools
     * @param sender The deposit sender address
     * @param processedDeposit The processed deposit
     * @param time The deposit time
     */
    function distribute(
        address sender,
        ProcessedDeposit memory processedDeposit,
        uint256 time
    ) private {
        /**
         * Todo distribute SSV fees
         * processedDeposit.ssvAmount
         */

        /** Distribute LINK fees to oracle */
        linkToken.transfer(getAutomationAddress(), processedDeposit.linkAmount);

        /** Emit manager reward event */
        emit ManagerDistribution(sender, processedDeposit.ethAmount, time);

        /** Distribute to ready pools */
        while (processedDeposit.ethAmount > 0) {
            /** Get the next ready pool */
            uint32 poolId;
            if (readyPoolIds.length > 0) {
                poolId = readyPoolIds[0];
            } else {
                lastPoolId.increment();
                poolId = uint32(lastPoolId.current());
                readyPoolIds.push(poolId);
            }
            Pool storage pool;
            pool = pools[poolId];
            uint256 remainingCapacity = poolCapacity - pool.deposits;
            if (remainingCapacity > processedDeposit.ethAmount) {
                /** Emit pool deposit event */
                emit PoolDeposit(
                    sender,
                    poolId,
                    processedDeposit.ethAmount,
                    time
                );

                readyDeposits += processedDeposit.ethAmount;
                pool.deposits += processedDeposit.ethAmount;
                processedDeposit.ethAmount = 0;
            } else {
                /** Emit pool deposit event */
                emit PoolDeposit(sender, poolId, remainingCapacity, time);

                readyDeposits -= pool.deposits;
                pool.deposits += remainingCapacity;
                processedDeposit.ethAmount -= remainingCapacity;

                /** Get a new validator and stake pool */
                stakePool(poolId);

                /** Remove pool from open pools */
                for (uint i = 0; i < readyPoolIds.length - 1; i++) {
                    readyPoolIds[i] = readyPoolIds[i + 1];
                }
                readyPoolIds.pop();

                /** Add pool to staked pools */
                stakedPoolIds.push(poolId);
            }
        }
    }

    /**
     * @notice Withdraw user stake from the pool manager
     * @param amount The amount of ETH to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(
            readyDeposits >= amount,
            "Withdrawing more than ready deposits"
        );
        require(users[msg.sender].stake0 > 0, "User does not have a stake");

        /** Settle user's current stake */
        users[msg.sender].stake0 = getUserStake(msg.sender);

        require(
            users[msg.sender].stake0 >= amount,
            "Withdrawing more than user stake"
        );

        /** Update user staking account */
        users[msg.sender].distributionSum0 = distributionSum;
        users[msg.sender].stake0 -= amount;

        /** Update ready deposits */
        readyDeposits -= amount;

        /** Send ETH from manager to user */
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
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
        uint256 ethAmount = (depositAmount * 100) / (100 + feePercent);

        /** Calculate fee amount to swap */
        uint256 feeAmount = depositAmount - ethAmount;

        /** Wrap ETH fees in ERC-20 to use in swap */
        uint256 linkAmount;
        uint256 ssvAmount;
        if (feeAmount > 0) {
            wrap(feeAmount);

            linkAmount = swap(
                tokens[Token.WETH],
                tokens[Token.LINK],
                (feeAmount * fees.LINK) / feePercent
            );

            ssvAmount = swap(
                tokens[Token.WETH],
                tokens[Token.SSV],
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
        IWETH9 wethToken = IWETH9(tokens[Token.WETH]);
        wethToken.deposit{value: amount}();
        wethToken.approve(address(swapRouter), amount);
    }

    /**
     * @dev Swap one token-in for another token-out
     * @param tokenIn The token-in address
     * @param tokenOut The token-out address
     * @param amountIn The amount of token-in to input
     * @return The amount of token-out
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) private returns (uint256) {
        /** Temporarily handle unswappable fees due to liquidity */
        address swapPool = swapFactory.getPool(
            tokenIn,
            tokenOut,
            uniswapFeeTier
        );
        uint128 liquidity = IUniswapV3PoolState(swapPool).liquidity();
        if (liquidity == 0) {
            if (tokenOut == tokens[Token.LINK]) {
                console.log("No liquidity in LINK swap pool");
                unswappedLINKFees += amountIn;
            } else if (tokenOut == tokens[Token.SSV]) {
                console.log("No liquidity in SSV swap pool");
                unswappedSSVFees += amountIn;
            }
            return 0;
        }
        if (tokenOut == tokens[Token.LINK]) {
            amountIn += unswappedLINKFees;
            unswappedLINKFees = 0;
        } else if (tokenOut == tokens[Token.SSV]) {
            amountIn += unswappedSSVFees;
            unswappedSSVFees = 0;
        }

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

        /** Swap tokens */
        return swapRouter.exactInputSingle(params);
    }

    /**
     * @notice Get the current token fees as percentages
     * @return The current token fees as percentages
     */
    function getFees() public pure returns (Fees memory) {
        return Fees(getLINKFee(), getSSVFee());
    }

    /**
     * @notice Get the LINK fee percentage to charge on each deposit
     * @return The LINK fee percentage to charge on each deposit
     */
    function getLINKFee() public pure returns (uint32) {
        return 1;
    }

    /**
     * @notice Get the SSV fee percentage to charge on each deposit
     * @return The SSV fee percentage to charge on each deposit
     */
    function getSSVFee() public pure returns (uint32) {
        return 1;
    }

    /**
     * @dev Activate a pool validator on beacon and SSV
     * @param poolId The pool ID
     */
    function stakePool(uint32 poolId) private returns (bool) {
        require(readyValidatorPublicKeys.length > 0, "No ready validators");

        bytes memory publicKey = readyValidatorPublicKeys[0];
        Validator memory validator = validators[publicKey];
        Pool storage pool = pools[poolId];

        /** Deposit validator */
        beaconDeposit.deposit{value: pool.deposits}(
            publicKey, // bytes
            validator.withdrawalCredentials, // bytes
            validator.signature, // bytes
            validator.depositDataRoot // bytes32
        );

        /** Pay SSV fees and register validator */
        /** Todo update for v3 SSV contracts and dynamic fees */
        uint256 mockSSVFee = 5 ether;
        ssvToken.approve(address(ssvNetwork), mockSSVFee);
        ssvNetwork.registerValidator(
            publicKey, // bytes
            validator.operatorIds, // uint32[]
            validator.sharesPublicKeys, // bytes[]
            validator.sharesEncrypted, // bytes[],
            mockSSVFee // uint256 (fees handled on user deposits)
        );

        /** Update the pool */
        pool.validatorPublicKey = publicKey;
        pool.operatorIds = validator.operatorIds;

        /** Remove validator from inactive validators and add to active validators */
        for (uint i = 0; i < readyValidatorPublicKeys.length - 1; i++) {
            readyValidatorPublicKeys[i] = readyValidatorPublicKeys[i + 1];
        }
        readyValidatorPublicKeys.pop();
        stakedValidatorPublicKeys.push(publicKey);

        emit PoolStaked(poolId, pool.validatorPublicKey, pool.operatorIds);

        return true;
    }

    // /**
    //  * @dev Deactivate a validator from beacon and SSV
    //  */
    // function removeValidator(

    // ) {
    // Todo mark a validator inactive (distinguish from active)
    // }

    /**
     * @dev Add a validator to the pool manager
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
        validators[publicKey] = Validator(
            depositDataRoot,
            operatorIds,
            sharesEncrypted,
            sharesPublicKeys,
            signature,
            withdrawalCredentials
        );
        readyValidatorPublicKeys.push(publicKey);

        emit ValidatorAdded(publicKey, operatorIds);
    }

    // /**
    //  * @dev Remove a validator from the pool manager
    //  */
    // function removeValidator(

    // ) {
    // Todo mark a validator removed (distinguish from inactive)
    // }

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
     * @notice Get the current stake of the pool manager
     * @return The current stake of the pool manager
     */
    function getStake() public view returns (uint256) {
        return stakedPoolIds.length * poolCapacity + readyDeposits;
    }

    /**
     * @notice Get the current ready deposits of the pool manager
     * @return The current ready deposits of the pool manager
     */
    function getReadyDeposits() public view returns (uint256) {
        return readyDeposits;
    }

    /**
     * @notice Get the current stake of a user
     * @param userAddress The user address
     * @return The current stake of a user
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
     * @notice Get a pool by ID
     * @param poolId The pool ID
     * @return The pool
     */
    function getPool(uint32 poolId) external view returns (Pool memory) {
        return pools[poolId];
    }

    /**
     * @notice Get the automation address
     * @return The automation address
     */
    function getAutomationAddress() public view returns (address) {
        return address(casimirAutomation);
    }
}
