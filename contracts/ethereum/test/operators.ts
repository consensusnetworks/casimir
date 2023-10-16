import { ethers, network } from "hardhat"
import { loadFixture, setBalance, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { deploymentFixture, secondUserDepositFixture } from "./fixtures/shared"
import { ICasimirRegistry } from "../build/@types"
import { round } from "../helpers/math"
import { initiateDepositHandler, reportCompletedExitsHandler } from "../helpers/oracle"
import { fulfillReport, runUpkeep } from "../helpers/upkeep"

describe("Operators", async function () {
  it("Registration of operators 1 through 4 creates 4 eligible operators", async function () {
    const { registry, views } = await loadFixture(deploymentFixture)
    const operatorIds = await registry.getOperatorIds()
    const startIndex = 0
    const endIndex = operatorIds.length
    const operators = await views.getOperators(startIndex, endIndex)
    expect(operators.length).equal(4)
    expect(operators).to.satisfy((operators: ICasimirRegistry.OperatorStruct[]) => {
      const expectedActive = operators.every(operator => operator.active === true)
      const expectedCollateral = operators.every(operator => operator.collateral.toString() === ethers.utils.parseEther("10.0").toString())
      const expectedResharing = operators.every(operator => operator.resharing === false)
      return expectedActive && expectedCollateral && expectedResharing
    })
  })

  it("First initiated deposit uses 4 eligible operators", async function () {
    const { manager, registry, views, daoOracle } = await loadFixture(deploymentFixture)
    const [firstUser] = await ethers.getSigners()

    const depositAmount = round(32 * ((100 + await manager.FEE_PERCENT()) / 100), 10)
    const deposit = await manager
      .connect(firstUser)
      .depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    await initiateDepositHandler({ manager, signer: daoOracle })

    const operatorIds = await registry.getOperatorIds()
    const startIndex = 0
    const endIndex = operatorIds.length
    const operators = await views.getOperators(startIndex, endIndex)

    expect(operators).to.satisfy((operators: ICasimirRegistry.OperatorStruct[]) => {
      const operatorsWithPools = operators.filter(operator => Number(operator.poolCount.toString()) === 1)
      return operatorsWithPools.length === 4
    })
  })

  it("Operator deregistration with 1 pool emits 1 reshare request", async function () {
    const { manager, registry, ssvViews, daoOracle } = await loadFixture(deploymentFixture)
    const [firstUser] = await ethers.getSigners()

    const depositAmount = round(32 * ((100 + await manager.FEE_PERCENT()) / 100), 10)
    const deposit = await manager
      .connect(firstUser)
      .depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    await initiateDepositHandler({ manager, signer: daoOracle })

    const operatorIds = await registry.getOperatorIds()
    const deregisteringOperatorId = operatorIds[0]
    const operatorOwnerAddress = (await ssvViews.getOperatorById(deregisteringOperatorId)).owner
    const operatorOwnerSigner = ethers.provider.getSigner(operatorOwnerAddress)
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [operatorOwnerAddress]
    })
    const requestDeactivation = await registry.connect(operatorOwnerSigner).requestDeactivation(deregisteringOperatorId)
    await requestDeactivation.wait()
    const deregisteringOperator = await registry.getOperator(deregisteringOperatorId)
    const resharesRequestedEvents = await manager.queryFilter(manager.filters.ResharesRequested(), -1)
    const resharesRequestedEvent = resharesRequestedEvents[0]

    expect(deregisteringOperator.resharing).equal(true)
    expect(resharesRequestedEvents.length).equal(1)
    expect(resharesRequestedEvent.args?.operatorId.toNumber()).equal(deregisteringOperatorId.toNumber())
  })

  it("Operator deregistration with 0 pools allows immediate collateral withdrawal", async function () {
    const { manager, registry, ssvViews } = await loadFixture(deploymentFixture)

    const operatorIds = await registry.getOperatorIds()
    const deregisteringOperatorId = operatorIds[0]
    const [operatorOwnerAddress] = await ssvViews.getOperatorById(deregisteringOperatorId)
    const operatorOwnerSigner = ethers.provider.getSigner(operatorOwnerAddress)
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [operatorOwnerAddress]
    })
    const requestDeactivation = await registry.connect(operatorOwnerSigner).requestDeactivation(deregisteringOperatorId)
    await requestDeactivation.wait()
    const deregisteringOperator = await registry.getOperator(deregisteringOperatorId)
    const resharesRequestedEvents = await manager.queryFilter(manager.filters.ResharesRequested(), -1)

    expect(deregisteringOperator.active).equal(false)
    expect(deregisteringOperator.resharing).equal(false)
    expect(resharesRequestedEvents.length).equal(0)

    const operatorOwnerBalanceBefore = await ethers.provider.getBalance(operatorOwnerAddress)
    const requestWithdrawal = await registry
      .connect(operatorOwnerSigner)
      .requestWithdrawal(deregisteringOperatorId, ethers.utils.parseEther("10"))
    await requestWithdrawal.wait()
    const operatorOwnerBalanceAfter = await ethers.provider.getBalance(operatorOwnerAddress)
    const deregisteredOperator = await registry.getOperator(deregisteringOperatorId)

    expect(deregisteredOperator.collateral.toString()).equal("0")
    expect(ethers.utils.formatEther(operatorOwnerBalanceAfter.sub(operatorOwnerBalanceBefore).toString())).contains("9.9")
  })

  it("Pool exits with 31.0 and recovers from the blamed operator", async function () {
    const { 
      manager, registry, upkeep, views, secondUser, donTransmitter, daoOracle, functionsBillingRegistry
    } = await loadFixture(secondUserDepositFixture)

    const secondStake = await manager.getUserStake(secondUser.address)
    const withdraw = await manager
      .connect(secondUser)
      .requestWithdrawal(secondStake)
    await withdraw.wait()

    const sweptExitedBalance = 31
    const withdrawnPoolId = (await manager.getStakedPoolIds())[0]
    const withdrawnPoolAddress = await manager.getPoolAddress(withdrawnPoolId)
    const currentBalance = await ethers.provider.getBalance(withdrawnPoolAddress)
    const nextBalance = currentBalance.add(ethers.utils.parseEther(sweptExitedBalance.toString()))
    await setBalance(withdrawnPoolAddress, nextBalance)

    await time.increase(time.duration.days(1))
    await runUpkeep({ donTransmitter, upkeep })

    const reportValues = {
      beaconBalance: 0,
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

    await reportCompletedExitsHandler({ manager, views, signer: daoOracle, args: { count: 1 } })
    await runUpkeep({ donTransmitter, upkeep })

    const stake = await manager.getTotalStake()
    const userStake = await manager.getUserStake(secondUser.address)
    const blamedOperatorId = 156 // Hardcoded the first operator
    const blamedOperator = await registry.getOperator(blamedOperatorId)

    expect(ethers.utils.formatEther(stake)).equal("16.0")
    expect(ethers.utils.formatEther(userStake)).equal("0.0")
    expect(blamedOperator.collateral.toString()).equal(ethers.utils.parseEther("9.0").toString())
  })
})