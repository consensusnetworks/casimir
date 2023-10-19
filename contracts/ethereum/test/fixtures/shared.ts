import { ethers, network, upgrades } from 'hardhat'
import { loadFixture, time, setBalance } from '@nomicfoundation/hardhat-network-helpers'
import { CasimirFactory, CasimirManager, CasimirRegistry, CasimirUpkeep, CasimirViews, FunctionsBillingRegistry, FunctionsOracle, FunctionsOracleFactory, ISSVViews } from '../../build/@types'
import { fulfillReport, runUpkeep } from '../../helpers/upkeep'
import { activatePoolsHandler, depositFunctionsBalanceHandler, depositUpkeepBalanceHandler, initiatePoolHandler, reportCompletedExitsHandler } from '../../helpers/oracle'
import { round } from '../../helpers/math'
import ISSVViewsAbi from '../../build/abi/ISSVViews.json'
import requestConfig from '@casimir/functions/Functions-request-config'

upgrades.silenceWarnings()

/** Fixture to deploy SSV manager contract */
export async function deploymentFixture() {
    if (!process.env.DEPOSIT_CONTRACT_ADDRESS) throw new Error('No deposit contract address provided')
    if (!process.env.KEEPER_REGISTRAR_ADDRESS) throw new Error('No keeper registrar address provided')
    if (!process.env.KEEPER_REGISTRY_ADDRESS) throw new Error('No keeper registry address provided')
    if (!process.env.LINK_TOKEN_ADDRESS) throw new Error('No link token address provided')
    if (!process.env.LINK_ETH_FEED_ADDRESS) throw new Error('No link eth feed address provided')
    if (!process.env.SSV_NETWORK_ADDRESS) throw new Error('No ssv network address provided')
    if (!process.env.SSV_TOKEN_ADDRESS) throw new Error('No ssv token address provided')
    if (!process.env.SWAP_FACTORY_ADDRESS) throw new Error('No swap factory address provided')
    if (!process.env.SWAP_ROUTER_ADDRESS) throw new Error('No swap router address provided')
    if (!process.env.WETH_TOKEN_ADDRESS) throw new Error('No weth token address provided')

    const [, daoOracle, donTransmitter] = await ethers.getSigners()

    const functionsOracleFactoryFactory = await ethers.getContractFactory('FunctionsOracleFactory')
    const functionsOracleFactory = await functionsOracleFactoryFactory.deploy() as FunctionsOracleFactory
    await functionsOracleFactory.deployed()

    const deployNewOracle = await functionsOracleFactory.deployNewOracle()
    const deployNewOracleReceipt = await deployNewOracle.wait()
    if (!deployNewOracleReceipt.events) throw new Error('Functions oracle deployment failed')
    const functionsOracleAddress = deployNewOracleReceipt.events[1].args?.don as string
    const functionsOracle = await ethers.getContractAt('FunctionsOracle', functionsOracleAddress) as FunctionsOracle
    const acceptOwnership = await functionsOracle.acceptOwnership()
    await acceptOwnership.wait()

    const functionsBillingRegistryArgs = {
        linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
        linkEthFeedAddress: process.env.LINK_ETH_FEED_ADDRESS,
        functionsOracleAddress: functionsOracle.address
    }
    const functionsBillingRegistryFactory = await ethers.getContractFactory('FunctionsBillingRegistry')
    const functionsBillingRegistry = await functionsBillingRegistryFactory.deploy(...Object.values(functionsBillingRegistryArgs)) as FunctionsBillingRegistry
    await functionsBillingRegistry.deployed()

    const functionsBillingRegistryConfig = {
        maxGasLimit: 400_000,
        stalenessSeconds: 86_400,
        gasAfterPaymentCalculation:
            21_000 + 5_000 + 2_100 + 20_000 + 2 * 2_100 - 15_000 + 7_315,
        weiPerUnitLink: ethers.BigNumber.from('5000000000000000'),
        gasOverhead: 100_000,
        requestTimeoutSeconds: 300,
    }

    await functionsBillingRegistry.setConfig(
        functionsBillingRegistryConfig.maxGasLimit,
        functionsBillingRegistryConfig.stalenessSeconds,
        functionsBillingRegistryConfig.gasAfterPaymentCalculation,
        functionsBillingRegistryConfig.weiPerUnitLink,
        functionsBillingRegistryConfig.gasOverhead,
        functionsBillingRegistryConfig.requestTimeoutSeconds
    )

    const beaconLibraryFactory = await ethers.getContractFactory('CasimirBeacon')
    const beaconLibrary = await beaconLibraryFactory.deploy()

    const managerBeaconFactory = await ethers.getContractFactory('CasimirManager', {
        libraries: {
            CasimirBeacon: beaconLibrary.address
        }
    })
    const managerBeacon = await upgrades.deployBeacon(managerBeaconFactory, { 
        constructorArgs: [
            functionsBillingRegistry.address,
            process.env.KEEPER_REGISTRAR_ADDRESS as string,
            process.env.KEEPER_REGISTRY_ADDRESS as string,
            process.env.LINK_TOKEN_ADDRESS as string,
            process.env.SSV_NETWORK_ADDRESS as string,
            process.env.SSV_TOKEN_ADDRESS as string,
            process.env.SWAP_FACTORY_ADDRESS as string,
            process.env.SWAP_ROUTER_ADDRESS as string,
            process.env.WETH_TOKEN_ADDRESS as string
        ],
        unsafeAllow: ['external-library-linking'] 
    })
    await managerBeacon.deployed()

    const poolBeaconFactory = await ethers.getContractFactory('CasimirPool')
    const poolBeacon = await upgrades.deployBeacon(poolBeaconFactory, { 
        constructorArgs: [
            process.env.DEPOSIT_CONTRACT_ADDRESS as string
        ]
    })
    await poolBeacon.deployed()

    const registryBeaconFactory = await ethers.getContractFactory('CasimirRegistry')
    const registryBeacon = await upgrades.deployBeacon(registryBeaconFactory, { 
        constructorArgs: [
            process.env.SSV_VIEWS_ADDRESS as string
        ]
    })
    await registryBeacon.deployed()

    const upkeepBeaconFactory = await ethers.getContractFactory('CasimirUpkeep')
    const upkeepBeacon = await upgrades.deployBeacon(upkeepBeaconFactory)
    await upkeepBeacon.deployed()

    const viewsBeaconFactory = await ethers.getContractFactory('CasimirViews')
    const viewsBeacon = await upgrades.deployBeacon(viewsBeaconFactory)
    await viewsBeacon.deployed()

    const factoryFactory = await ethers.getContractFactory('CasimirFactory', {
        libraries: {
            CasimirBeacon: beaconLibrary.address
        }
    })
    const factory = await upgrades.deployProxy(factoryFactory, undefined, {
        constructorArgs: [
            managerBeacon.address,
            poolBeacon.address,
            registryBeacon.address,
            upkeepBeacon.address,
            viewsBeacon.address
        ],
        unsafeAllow: ['external-library-linking'] 
    }) as CasimirFactory
    await factory.deployed()

    const defaultStrategy = {
        minCollateral: ethers.utils.parseEther('1.0'),
        lockPeriod: 0,
        userFee: 5,
        compoundStake: true,
        eigenStake: false,
        liquidStake: false,
        privateOperators: false,
        verifiedOperators: false
    }
    const deployDefaultManager = await factory.deployManager(
        daoOracle.address,
        functionsOracle.address,
        defaultStrategy
    )
    await deployDefaultManager.wait()
    const [managerId] = await factory.getManagerIds()
    const [managerAddress, registryAddress, upkeepAddress, viewsAddress] = await factory.getManagerConfig(managerId)
    const manager = await ethers.getContractAt('CasimirManager', managerAddress) as CasimirManager
    const registry = await ethers.getContractAt('CasimirRegistry', registryAddress) as CasimirRegistry
    const upkeep = await ethers.getContractAt('CasimirUpkeep', upkeepAddress) as CasimirUpkeep
    const views = await ethers.getContractAt('CasimirViews', viewsAddress) as CasimirViews

    requestConfig.args[1] = viewsAddress
    const fulfillGasLimit = 300000
    const setRequest = await upkeep.setFunctionsRequest(requestConfig.source, requestConfig.args, fulfillGasLimit)
    await setRequest.wait()

    await functionsBillingRegistry.setAuthorizedSenders([donTransmitter.address, functionsOracle.address])
    await functionsOracle.setRegistry(functionsBillingRegistry.address)
    await functionsOracle.addAuthorizedSenders([donTransmitter.address, managerAddress])

    const ssvViews = await ethers.getContractAt(ISSVViewsAbi, process.env.SSV_VIEWS_ADDRESS as string) as ISSVViews
    const preregisteredOperatorIds = process.env.PREREGISTERED_OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [208, 209, 210, 211, 212, 213, 214, 215]
    if (preregisteredOperatorIds.length < 8) throw new Error('Not enough operator ids provided')
    const preregisteredBalance = ethers.utils.parseEther('10')
    for (const operatorId of preregisteredOperatorIds) {
        const [operatorOwnerAddress] = await ssvViews.getOperatorById(operatorId)
        const operatorOwnerSigner = ethers.provider.getSigner(operatorOwnerAddress)
        const currentBalance = await ethers.provider.getBalance(operatorOwnerAddress)
        const nextBalance = currentBalance.add(preregisteredBalance)
        await setBalance(operatorOwnerAddress, nextBalance)
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [operatorOwnerAddress]
        })
        const result = await registry.connect(operatorOwnerSigner).registerOperator(operatorId, { value: preregisteredBalance })
        await result.wait()
    }

    return { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter }
}

/** Fixture to stake 16 for the first user */
export async function firstUserDepositFixture() {
    const { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter } = await loadFixture(deploymentFixture)
    const [, , , firstUser] = await ethers.getSigners()

    const depositAmount = round(16 * ((100 + await manager.userFee()) / 100), 10)
    const deposit = await manager.connect(firstUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    return { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser }
}

/** Fixture to stake 24 for the second user */
export async function secondUserDepositFixture() {
    const { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser } = await loadFixture(firstUserDepositFixture)
    const [, , , , secondUser] = await ethers.getSigners()

    const depositAmount = round(24 * ((100 + await manager.userFee()) / 100), 10)
    const deposit = await manager.connect(secondUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    await depositFunctionsBalanceHandler({ manager, signer: daoOracle })
    await depositUpkeepBalanceHandler({ manager, signer: daoOracle })

    await initiatePoolHandler({ manager, signer: daoOracle })

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const reportValues = {
        beaconBalance: 32,
        sweptBalance: 0,
        activatedDeposits: 1,
        forcedExits: 0,
        completedExits: 0,
        compoundablePoolIds: [0, 0, 0, 0, 0]
    }

    await fulfillReport({
        donTransmitter,
        upkeep,
        functionsBillingRegistry,
        values: reportValues
    })

    await activatePoolsHandler({ manager, views, signer: daoOracle, args: { count: 1 } })

    await runUpkeep({ donTransmitter, upkeep })

    return { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser }
}

/** Fixture to report increase of 0.105 in total rewards before fees */
export async function rewardsPostSecondUserDepositFixture() {
    const { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser } = await loadFixture(secondUserDepositFixture)

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const reportValues = {
        beaconBalance: 32.105,
        sweptBalance: 0,
        activatedDeposits: 0,
        forcedExits: 0,
        completedExits: 0,
        compoundablePoolIds: [0, 0, 0, 0, 0]
    }

    await fulfillReport({
        donTransmitter,
        upkeep,
        functionsBillingRegistry,
        values: reportValues,
    })

    await runUpkeep({ donTransmitter, upkeep })

    return { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser }
}

/** Fixture to sweep 0.105 to the manager */
export async function sweepPostSecondUserDepositFixture() {
    const { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser } = await loadFixture(secondUserDepositFixture)

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const sweptRewards = 0.105
    const stakedPoolIds = await manager.getStakedPoolIds()
    for (const poolId of stakedPoolIds) {
        const poolAddress = await manager.getPoolAddress(poolId)
        const poolSweptRewards = sweptRewards / stakedPoolIds.length
        const currentBalance = await ethers.provider.getBalance(poolAddress)
        const nextBalance = currentBalance.add(ethers.utils.parseEther(poolSweptRewards.toString()))
        await setBalance(poolAddress, nextBalance)
    }
    const compoundablePoolIds = [1, 0, 0, 0, 0]
    const reportValues = {
        beaconBalance: 32,
        sweptBalance: sweptRewards,
        activatedDeposits: 0,
        forcedExits: 0,
        completedExits: 0,
        compoundablePoolIds
    }

    await fulfillReport({
        donTransmitter,
        upkeep,
        functionsBillingRegistry,
        values: reportValues,
    })

    await runUpkeep({ donTransmitter, upkeep })

    return { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser }
}

/** Fixture to stake 24 for the third user */
export async function thirdUserDepositFixture() {
    const { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser } = await loadFixture(sweepPostSecondUserDepositFixture)
    const [, , , , , thirdUser] = await ethers.getSigners()

    const depositAmount = round(24 * ((100 + await manager.userFee()) / 100), 10)
    const deposit = await manager.connect(thirdUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    await initiatePoolHandler({ manager, signer: daoOracle })

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const reportValues = {
        beaconBalance: 64,
        sweptBalance: 0,
        activatedDeposits: 1,
        forcedExits: 0,
        completedExits: 0,
        compoundablePoolIds: [0, 0, 0, 0, 0]
    }

    await fulfillReport({
        donTransmitter,
        upkeep,
        functionsBillingRegistry,
        values: reportValues
    })

    await activatePoolsHandler({ manager, views, signer: daoOracle, args: { count: 1 } })

    await runUpkeep({ donTransmitter, upkeep })

    return { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser, thirdUser }
}

/** Fixture to report increase of 0.21 in total rewards before fees */
export async function rewardsPostThirdUserDepositFixture() {
    const { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser, thirdUser } = await loadFixture(thirdUserDepositFixture)

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const reportValues = {
        beaconBalance: 64.21,
        sweptBalance: 0,
        activatedDeposits: 0,
        forcedExits: 0,
        completedExits: 0,
        compoundablePoolIds: [0, 0, 0, 0, 0]
    }

    await fulfillReport({
        donTransmitter,
        upkeep,
        functionsBillingRegistry,
        values: reportValues,
    })

    await runUpkeep({ donTransmitter, upkeep })

    return { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser, thirdUser }
}

/** Fixture to sweep 0.21 to the manager */
export async function sweepPostThirdUserDepositFixture() {
    const { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser, thirdUser } = await loadFixture(rewardsPostThirdUserDepositFixture)

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const sweptRewards = 0.21
    const stakedPoolIds = await manager.getStakedPoolIds()
    for (const poolId of stakedPoolIds) {
        const poolAddress = await manager.getPoolAddress(poolId)
        const poolSweptRewards = sweptRewards / stakedPoolIds.length
        const currentBalance = await ethers.provider.getBalance(poolAddress)
        const nextBalance = currentBalance.add(ethers.utils.parseEther(poolSweptRewards.toString()))
        await setBalance(poolAddress, nextBalance)
    }
    const compoundablePoolIds = [1, 2, 0, 0, 0]
    const reportValues = {
        beaconBalance: 64,
        sweptBalance: sweptRewards,
        activatedDeposits: 0,
        forcedExits: 0,
        completedExits: 0,
        compoundablePoolIds
    }

    await fulfillReport({
        donTransmitter,
        upkeep,
        functionsBillingRegistry,
        values: reportValues
    })

    await runUpkeep({ donTransmitter, upkeep })

    return { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser, thirdUser }
}

/** Fixture to partial withdraw 0.3 to the first user */
export async function firstUserPartialWithdrawalFixture() {
    const { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser, thirdUser } = await loadFixture(sweepPostThirdUserDepositFixture)
    const withdrawableBalance = await manager.getWithdrawableBalance()
    const withdraw = await manager.connect(firstUser).requestWithdrawal(withdrawableBalance)
    await withdraw.wait()

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const reportValues = {
        beaconBalance: 64,
        sweptBalance: 0,
        activatedDeposits: 0,
        forcedExits: 0,
        completedExits: 0,
        compoundablePoolIds: [0, 0, 0, 0, 0]
    }

    await fulfillReport({
        donTransmitter,
        upkeep,
        functionsBillingRegistry,
        values: reportValues
    })

    await runUpkeep({ donTransmitter, upkeep })

    return { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser, thirdUser }
}

/** Fixture to stake 72 for the fourth user */
export async function fourthUserDepositFixture() {
    const { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser, thirdUser } = await loadFixture(firstUserPartialWithdrawalFixture)
    const [, , , , , , fourthUser] = await ethers.getSigners()

    const depositAmount = round(72 * ((100 + await manager.userFee()) / 100), 10)
    const deposit = await manager.connect(fourthUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    for (let i = 0; i < 2; i++) {
        await initiatePoolHandler({ manager, signer: daoOracle })
    }

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const reportValues = {
        beaconBalance: 128,
        sweptBalance: 0,
        activatedDeposits: 2,
        forcedExits: 0,
        completedExits: 0,
        compoundablePoolIds: [0, 0, 0, 0, 0]
    }

    await fulfillReport({
        donTransmitter,
        upkeep,
        functionsBillingRegistry,
        values: reportValues
    })

    await activatePoolsHandler({ manager, views, signer: daoOracle, args: { count: 2 } })

    await runUpkeep({ donTransmitter, upkeep })

    return { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser, thirdUser, fourthUser }
}

/** Fixture to simulate a validator stake penalty that decreases the beacon chain balance */
export async function beaconBalanceLossFixture() {
    const { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser, thirdUser, fourthUser } = await loadFixture(fourthUserDepositFixture)

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const reportValues = {
        beaconBalance: 126,
        sweptBalance: 0,
        activatedDeposits: 0,
        forcedExits: 0,
        completedExits: 0,
        compoundablePoolIds: [0, 0, 0, 0, 0]
    }

    await fulfillReport({
        donTransmitter,
        upkeep,
        functionsBillingRegistry,
        values: reportValues
    })

    await runUpkeep({ donTransmitter, upkeep })

    return { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser, thirdUser, fourthUser }
}

/** Fixture to simulate a validator reward that brings the beacon chain balance back to expected */
export async function beaconBalanceRecoveryFixture() {
    const { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser, thirdUser, fourthUser } = await loadFixture(beaconBalanceLossFixture)

    let nextBeaconBalance = 127
    for (let i = 0; i < 2; i++) {
        await time.increase(time.duration.days(1))
        await runUpkeep({ donTransmitter, upkeep })

        const reportValues = {
            beaconBalance: nextBeaconBalance,
            sweptBalance: 0,
            activatedDeposits: 0,
            forcedExits: 0,
            completedExits: 0,
            compoundablePoolIds: [0, 0, 0, 0, 0]
        }

        await fulfillReport({
            donTransmitter,
            upkeep,
            functionsBillingRegistry,
            values: reportValues
        })

        await runUpkeep({ donTransmitter, upkeep })
        nextBeaconBalance += 1
    }

    return { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser, thirdUser, fourthUser }
}

/** Fixture to full withdraw ~24.07 */
export async function thirdUserFullWithdrawalFixture() {
    const { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser, thirdUser, fourthUser } = await loadFixture(beaconBalanceRecoveryFixture)

    const thirdStake = await manager.getUserStake(thirdUser.address)
    const withdraw = await manager.connect(thirdUser).requestWithdrawal(thirdStake)
    await withdraw.wait()

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const sweptExitedBalance = 32
    const reportValues = {
        beaconBalance: 96,
        sweptBalance: sweptExitedBalance,
        activatedDeposits: 0,
        forcedExits: 0,
        completedExits: 1,
        compoundablePoolIds: [0, 0, 0, 0, 0]
    }

    await fulfillReport({
        donTransmitter,
        upkeep,
        functionsBillingRegistry,
        values: reportValues
    })

    const exitedPoolId = (await manager.getStakedPoolIds())[0]
    const exitedPoolAddress = await manager.getPoolAddress(exitedPoolId)
    const currentBalance = await ethers.provider.getBalance(exitedPoolAddress)
    const nextBalance = currentBalance.add(ethers.utils.parseEther(sweptExitedBalance.toString()))
    await setBalance(exitedPoolAddress, nextBalance)

    await reportCompletedExitsHandler({ manager, views, signer: daoOracle, args: { count: 1 } })

    await runUpkeep({ donTransmitter, upkeep })

    return { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser, thirdUser, fourthUser }
}

/** Fixture to simulate rewards */
export async function simulationFixture() {
    const { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser, thirdUser, fourthUser } = await loadFixture(thirdUserFullWithdrawalFixture)

    const rewardsPerValidator = 0.105
    let nextBeaconBalance = 96
    let totalRewards = 0
    for (let i = 0; i < 5; i++) {
        await time.increase(time.duration.days(1))
        await runUpkeep({ donTransmitter, upkeep })

        const stakedPoolIds = await manager.getStakedPoolIds()
        const rewardsAmount = rewardsPerValidator * stakedPoolIds.length
        totalRewards += round(rewardsAmount, 10)
        nextBeaconBalance = round(nextBeaconBalance + rewardsAmount, 10)
        const reportValues = {
            beaconBalance: nextBeaconBalance,
            sweptBalance: 0,
            activatedDeposits: 0,
            forcedExits: 0,
            completedExits: 0,
            compoundablePoolIds: [0, 0, 0, 0, 0]
        }

        await fulfillReport({
            donTransmitter,
            upkeep,
            functionsBillingRegistry,
            values: reportValues
        })

        await runUpkeep({ donTransmitter, upkeep })
    }

    const sweptRewards = totalRewards
    const stakedPoolIds = await manager.getStakedPoolIds()

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    for (const poolId of stakedPoolIds) {
        const poolAddress = await manager.getPoolAddress(poolId)
        const poolSweptRewards = sweptRewards / stakedPoolIds.length
        const currentBalance = await ethers.provider.getBalance(poolAddress)
        const nextBalance = currentBalance.add(ethers.utils.parseEther(poolSweptRewards.toString()))
        await setBalance(poolAddress, nextBalance)
    }
    const compoundablePoolIds = [2, 3, 4, 0, 0]
    const reportValues = {
        beaconBalance: 96,
        sweptBalance: sweptRewards,
        activatedDeposits: 0,
        forcedExits: 0,
        completedExits: 0,
        compoundablePoolIds
    }

    await fulfillReport({
        donTransmitter,
        upkeep,
        functionsBillingRegistry,
        values: reportValues
    })

    await runUpkeep({ donTransmitter, upkeep })

    return { manager, registry, upkeep, views, functionsBillingRegistry, ssvViews, daoOracle, donTransmitter, firstUser, secondUser, thirdUser, fourthUser }
}