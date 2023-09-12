import { ethers, network, upgrades } from 'hardhat'
import { loadFixture, time, setBalance } from '@nomicfoundation/hardhat-network-helpers'
import { CasimirManager, CasimirRegistry, CasimirUpkeep, CasimirViews, FunctionsBillingRegistry, FunctionsOracleFactory, ISSVViews } from '../../build/@types'
import { fulfillReport, runUpkeep } from '../../helpers/upkeep'
import { depositFunctionsBalanceHandler, depositUpkeepBalanceHandler, initiateDepositHandler, reportCompletedExitsHandler } from '../../helpers/oracle'
import { round } from '../../helpers/math'
import ISSVNetworkAbi from '../../build/abi/ISSVNetwork.json'
import ISSVViewsAbi from '../../build/abi/ISSVViews.json'
import requestConfig from '@casimir/functions/Functions-request-config'


/** Fixture to deploy SSV manager contract */
export async function deploymentFixture() {
    const [owner, , , , , donTransmitter, daoOracle] = await ethers.getSigners()

    const functionsOracleFactoryFactory = await ethers.getContractFactory('FunctionsOracleFactory')
    const functionsOracleFactory = await functionsOracleFactoryFactory.deploy() as FunctionsOracleFactory
    await functionsOracleFactory.deployed()
    console.log(`FunctionsOracleFactory contract deployed to ${functionsOracleFactory.address}`)

    const deployNewOracle = await functionsOracleFactory.deployNewOracle()
    const deployNewOracleReceipt = await deployNewOracle.wait()
    if (!deployNewOracleReceipt.events) throw new Error('Functions oracle deployment failed')
    const functionsOracleAddress = deployNewOracleReceipt.events[1].args?.don as string
    const functionsOracle = await ethers.getContractAt('FunctionsOracle', functionsOracleAddress)
    const acceptOwnership = await functionsOracle.acceptOwnership()
    await acceptOwnership.wait()
    console.log(`FunctionsOracle contract deployed to ${functionsOracle.address}`)

    const functionsBillingRegistryArgs = {
        linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
        linkEthFeedAddress: process.env.LINK_ETH_FEED_ADDRESS,
        functionsOracleAddress: functionsOracle.address
    }
    const functionsBillingRegistryFactory = await ethers.getContractFactory('FunctionsBillingRegistry')
    const functionsBillingRegistry = await functionsBillingRegistryFactory.deploy(...Object.values(functionsBillingRegistryArgs)) as FunctionsBillingRegistry
    await functionsBillingRegistry.deployed()
    console.log(`FunctionsBillingRegistry contract deployed to ${functionsBillingRegistry.address}`)

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

    const poolFactory = await ethers.getContractFactory('CasimirPool')
    const poolBeacon = await upgrades.deployBeacon(poolFactory, { unsafeAllow: ['constructor'] })
    await poolBeacon.deployed()
    console.log(`CasimirPool beacon deployed to ${poolBeacon.address}`)

    const registryFactory = await ethers.getContractFactory('CasimirRegistry')
    const registryBeacon = await upgrades.deployBeacon(registryFactory, { unsafeAllow: ['constructor'] })
    await registryBeacon.deployed()
    console.log(`CasimirRegistry beacon deployed to ${registryBeacon.address}`)

    const upkeepFactory = await ethers.getContractFactory('CasimirUpkeep')
    const upkeepBeacon = await upgrades.deployBeacon(upkeepFactory, { unsafeAllow: ['constructor'] })
    await upkeepBeacon.deployed()
    console.log(`CasimirUpkeep beacon deployed to ${upkeepBeacon.address}`)

    const managerArgs = {
        daoOracleAddress: daoOracle.address,
        beaconDepositAddress: process.env.BEACON_DEPOSIT_ADDRESS,
        functionsBillingRegistryAddress: functionsBillingRegistry.address,
        functionsOracleAddress: functionsOracle.address,
        keeperRegistrarAddress: process.env.KEEPER_REGISTRAR_ADDRESS,
        keeperRegistryAddress: process.env.KEEPER_REGISTRY_ADDRESS,
        linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
        poolBeaconAddress: poolBeacon.address,
        registryBeaconAddress: registryBeacon.address,
        ssvNetworkAddress: process.env.SSV_NETWORK_ADDRESS,
        ssvViewsAddress: process.env.SSV_VIEWS_ADDRESS,
        ssvTokenAddress: process.env.SSV_TOKEN_ADDRESS,
        swapFactoryAddress: process.env.SWAP_FACTORY_ADDRESS,
        swapRouterAddress: process.env.SWAP_ROUTER_ADDRESS,
        upkeepBeaconAddress: upkeepBeacon.address,
        wethTokenAddress: process.env.WETH_TOKEN_ADDRESS
    }
    const managerFactory = await ethers.getContractFactory('CasimirManager')
    const manager = await upgrades.deployProxy(managerFactory, Object.values(managerArgs), { unsafeAllow: ['constructor'] }) as CasimirManager
    await manager.deployed()
    console.log(`CasimirManager contract deployed to ${manager.address}`)

    const registryAddress = await manager.getRegistryAddress()
    console.log(`CasimirRegistry contract deployed to ${registryAddress}`)

    const upkeepAddress = await manager.getUpkeepAddress()
    console.log(`CasimirUpkeep contract deployed to ${upkeepAddress}`)

    const viewsArgs = {
        managerAddress: manager.address,
        registryAddress
    }
    const viewsFactory = await ethers.getContractFactory('CasimirViews')
    const views = await upgrades.deployProxy(viewsFactory, Object.values(viewsArgs), { unsafeAllow: ['constructor'] }) as CasimirViews
    await views.deployed()
    console.log(`CasimirViews contract deployed to ${views.address}`)

    const registry = await ethers.getContractAt('CasimirRegistry', registryAddress) as CasimirRegistry
    const upkeep = await ethers.getContractAt('CasimirUpkeep', upkeepAddress) as CasimirUpkeep
    const ssvNetwork = await ethers.getContractAt(ISSVNetworkAbi, process.env.SSV_NETWORK_ADDRESS as string)
    const ssvViews = await ethers.getContractAt(ISSVViewsAbi, process.env.SSV_VIEWS_ADDRESS as string) as ISSVViews

    const preregisteredOperatorIds = process.env.PREREGISTERED_OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [156, 157, 158, 159]
    if (preregisteredOperatorIds.length < 4) throw new Error('Not enough operator ids provided')
    const preregisteredBalance = ethers.utils.parseEther('10')
    for (const operatorId of preregisteredOperatorIds) {
        const [operatorOwnerAddress] = await ssvViews.getOperatorById(operatorId)
        const currentBalance = await ethers.provider.getBalance(operatorOwnerAddress)
        const nextBalance = currentBalance.add(preregisteredBalance)
        await setBalance(operatorOwnerAddress, nextBalance)
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [operatorOwnerAddress]
        })
        const operatorSigner = ethers.provider.getSigner(operatorOwnerAddress)
        const result = await registry.connect(operatorSigner).registerOperator(operatorId, { value: preregisteredBalance })
        await result.wait()
    }

    const requestSource = requestConfig.source
    const requestArgs = requestConfig.args
    const fulfillGasLimit = 300000
    const setRequest = await manager.setFunctionsRequest(requestSource, requestArgs, fulfillGasLimit)
    await setRequest.wait()

    await functionsBillingRegistry.setAuthorizedSenders([donTransmitter.address, manager.address, upkeep.address, functionsOracle.address])
    await functionsOracle.setRegistry(functionsBillingRegistry.address)
    await functionsOracle.addAuthorizedSenders([donTransmitter.address, manager.address])

    return { manager, registry, upkeep, views, ssvNetwork, ssvViews, owner, donTransmitter, daoOracle, functionsBillingRegistry }
}

/** Fixture to stake 16 for the first user */
export async function firstUserDepositFixture() {
    const { manager, registry, upkeep, views, owner, donTransmitter, daoOracle, functionsBillingRegistry } = await loadFixture(deploymentFixture)
    const [, firstUser] = await ethers.getSigners()

    const depositAmount = round(16 * ((100 + await manager.FEE_PERCENT()) / 100), 10)
    const deposit = await manager.connect(firstUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    return { manager, registry, upkeep, views, owner, firstUser, donTransmitter, daoOracle, functionsBillingRegistry }
}

/** Fixture to stake 24 for the second user */
export async function secondUserDepositFixture() {
    const { manager, registry, upkeep, views, owner, firstUser, donTransmitter, daoOracle, functionsBillingRegistry } = await loadFixture(firstUserDepositFixture)
    const [, , secondUser] = await ethers.getSigners()

    const depositAmount = round(24 * ((100 + await manager.FEE_PERCENT()) / 100), 10)
    const deposit = await manager.connect(secondUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()
    
    await depositFunctionsBalanceHandler({ manager, signer: daoOracle })
    await depositUpkeepBalanceHandler({ manager, signer: daoOracle })
    await initiateDepositHandler({ manager, signer: daoOracle })

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const reportValues = {
        activeBalance: 32,
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

    await runUpkeep({ donTransmitter, upkeep })

    return { manager, registry, upkeep, views, owner, firstUser, secondUser, donTransmitter, daoOracle, functionsBillingRegistry }
}

/** Fixture to report increase of 0.105 in total rewards before fees */
export async function rewardsPostSecondUserDepositFixture() {
    const { manager, registry, upkeep, views, owner, firstUser, secondUser, donTransmitter, daoOracle, functionsBillingRegistry } = await loadFixture(secondUserDepositFixture)

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const reportValues = {
        activeBalance: 32.105,
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

    return { manager, registry, upkeep, views, owner, firstUser, secondUser, donTransmitter, daoOracle, functionsBillingRegistry }
}

/** Fixture to sweep 0.105 to the manager */
export async function sweepPostSecondUserDepositFixture() {
    const { manager, registry, upkeep, views, owner, firstUser, secondUser, donTransmitter, daoOracle, functionsBillingRegistry } = await loadFixture(secondUserDepositFixture)

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
        activeBalance: 32,
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

    return { manager, registry, upkeep, views, owner, firstUser, secondUser, donTransmitter, daoOracle, functionsBillingRegistry }
}

/** Fixture to stake 24 for the third user */
export async function thirdUserDepositFixture() {
    const { manager, registry, upkeep, views, owner, firstUser, secondUser, donTransmitter, daoOracle, functionsBillingRegistry } = await loadFixture(sweepPostSecondUserDepositFixture)
    const [, , , thirdUser] = await ethers.getSigners()

    const depositAmount = round(24 * ((100 + await manager.FEE_PERCENT()) / 100), 10)
    const deposit = await manager.connect(thirdUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    await initiateDepositHandler({ manager, signer: daoOracle })

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const reportValues = {
        activeBalance: 64,
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
    
    await runUpkeep({ donTransmitter, upkeep })

    return { manager, registry, upkeep, views, owner, firstUser, secondUser, thirdUser, donTransmitter, daoOracle, functionsBillingRegistry }
}

/** Fixture to report increase of 0.21 in total rewards before fees */
export async function rewardsPostThirdUserDepositFixture() {
    const { manager, registry, upkeep, views, owner, firstUser, secondUser, thirdUser, donTransmitter, daoOracle, functionsBillingRegistry } = await loadFixture(thirdUserDepositFixture)

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const reportValues = {
        activeBalance: 64.21,
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

    return { manager, registry, upkeep, views, owner, firstUser, secondUser, thirdUser, donTransmitter, daoOracle, functionsBillingRegistry }
}

/** Fixture to sweep 0.21 to the manager */
export async function sweepPostThirdUserDepositFixture() {
    const { manager, registry, upkeep, views, owner, firstUser, secondUser, thirdUser, donTransmitter, daoOracle, functionsBillingRegistry } = await loadFixture(rewardsPostThirdUserDepositFixture)

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
        activeBalance: 64,
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

    return { manager, registry, upkeep, views, owner, firstUser, secondUser, thirdUser, donTransmitter, daoOracle, functionsBillingRegistry }
}

/** Fixture to partial withdraw 0.3 to the first user */
export async function firstUserPartialWithdrawalFixture() {
    const { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, donTransmitter, daoOracle, functionsBillingRegistry } = await loadFixture(sweepPostThirdUserDepositFixture)
    const withdrawableBalance = await manager.getWithdrawableBalance()
    const withdraw = await manager.connect(firstUser).requestWithdrawal(withdrawableBalance)
    await withdraw.wait()

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const reportValues = {
        activeBalance: 64,
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

    return { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, donTransmitter, daoOracle, functionsBillingRegistry }
}

/** Fixture to stake 72 for the fourth user */
export async function fourthUserDepositFixture() {
    const { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, donTransmitter, daoOracle, functionsBillingRegistry } = await loadFixture(firstUserPartialWithdrawalFixture)
    const [, , , , fourthUser] = await ethers.getSigners()

    const depositAmount = round(72 * ((100 + await manager.FEE_PERCENT()) / 100), 10)
    const deposit = await manager.connect(fourthUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    for (let i = 0; i < 2; i++) {
        await initiateDepositHandler({ manager, signer: daoOracle })
    }

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const reportValues = {
        activeBalance: 128,
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

    await runUpkeep({ donTransmitter, upkeep })

    return { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, donTransmitter, daoOracle, functionsBillingRegistry }
}

/** Fixture to simulate a validator stake penalty that decreases the active balance */
export async function activeBalanceLossFixture() {
    const { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, donTransmitter, daoOracle, functionsBillingRegistry } = await loadFixture(fourthUserDepositFixture)

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const reportValues = {
        activeBalance: 126,
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

    return { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, donTransmitter, daoOracle, functionsBillingRegistry }
}

/** Fixture to simulate a validator reward that brings the active balance back to expected */
export async function activeBalanceRecoveryFixture() {
    const { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, donTransmitter, daoOracle, functionsBillingRegistry } = await loadFixture(activeBalanceLossFixture)

    let nextActiveBalance = 127
    for (let i = 0; i < 2; i++) {
        await time.increase(time.duration.days(1))
        await runUpkeep({ donTransmitter, upkeep })

        const reportValues = {
            activeBalance: nextActiveBalance,
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
        nextActiveBalance += 1
    }

    return { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, donTransmitter, daoOracle, functionsBillingRegistry }
}

/** Fixture to full withdraw ~24.07 */
export async function thirdUserFullWithdrawalFixture() {
    const { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, donTransmitter, daoOracle, functionsBillingRegistry } = await loadFixture(activeBalanceRecoveryFixture)

    const thirdStake = await manager.getUserStake(thirdUser.address)
    const withdraw = await manager.connect(thirdUser).requestWithdrawal(thirdStake)
    await withdraw.wait()

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const sweptExitedBalance = 32
    const reportValues = {
        activeBalance: 96,
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

    return { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, donTransmitter, daoOracle, functionsBillingRegistry }
}

/** Fixture to simulate rewards */
export async function simulationFixture() {
    const { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, donTransmitter, daoOracle, functionsBillingRegistry } = await loadFixture(thirdUserFullWithdrawalFixture)

    const rewardsPerValidator = 0.105
    let nextActiveBalance = 96
    let totalRewards = 0
    for (let i = 0; i < 5; i++) {
        await time.increase(time.duration.days(1))
        await runUpkeep({ donTransmitter, upkeep })

        const stakedPoolIds = await manager.getStakedPoolIds()
        const rewardsAmount = rewardsPerValidator * stakedPoolIds.length
        totalRewards += round(rewardsAmount, 10)
        nextActiveBalance = round(nextActiveBalance + rewardsAmount, 10)
        const reportValues = {
            activeBalance: nextActiveBalance,
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
        activeBalance: 96,
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

    return { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, donTransmitter, daoOracle, functionsBillingRegistry }
}