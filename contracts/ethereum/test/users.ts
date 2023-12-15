import { ethers } from "hardhat"
import { loadFixture, setBalance, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { preregistrationFixture } from "./fixtures/shared"
import { round } from "../helpers/math"
import { updateValidatorsHandler, fundAccountsHandler, initiateValidatorHandler, withdrawValidatorsHandler } from "../helpers/oracle"
import { fulfillReport, runUpkeep } from "../helpers/upkeep"

describe("Users", async function () {
    it("User's 16.0 stake and half withdrawal updates total and user stake, and user balance", async function () {
        const { manager } = await loadFixture(preregistrationFixture)
        const [firstUser] = await ethers.getSigners()

        const depositAmount = round(16 * ((100 + await manager.userFee()) / 100), 10)
        const value = ethers.utils.parseEther(depositAmount.toString())
        const deposit = await manager.connect(firstUser).depositStake({ value })
        await deposit.wait()

        let stake = await manager.getTotalStake()
        let userStake = await manager.getUserStake(firstUser.address)

        expect(ethers.utils.formatEther(stake)).equal("16.0")
        expect(ethers.utils.formatEther(userStake)).equal("16.0")

        const userBalanceBefore = await ethers.provider.getBalance(firstUser.address)
        const userWithdrawalRequest = await manager.connect(firstUser).requestWithdrawal(ethers.utils.parseEther("8.0"))
        await userWithdrawalRequest.wait()
        const userBalanceAfter = await ethers.provider.getBalance(firstUser.address)

        stake = await manager.getTotalStake()
        userStake = await manager.getUserStake(firstUser.address)

        expect(ethers.utils.formatEther(stake)).equal("8.0")
        expect(ethers.utils.formatEther(userStake)).equal("8.0")
        expect(ethers.utils.formatEther(userBalanceAfter.sub(userBalanceBefore))).contains("7.9")
    })

    it("User's 64.0 stake and half withdrawal updates total and user stake, and user balance", async function () {
        const { manager, upkeep, views, functionsBillingRegistry, daoOracle, donTransmitter } = 
            await loadFixture(preregistrationFixture)
        const [firstUser] = await ethers.getSigners()

        const depositAmount = round(64 * ((100 + await manager.userFee()) / 100), 10)
        const value = ethers.utils.parseEther(depositAmount.toString())
        const deposit = await manager.connect(firstUser).depositStake({ value })
        await deposit.wait()

        await fundAccountsHandler({
            manager,
            functionsBillingRegistry,
            provider: ethers.provider,
            signer: daoOracle
        })

        await initiateValidatorHandler({ 
            manager, 
            provider: ethers.provider,
            signer: daoOracle 
        })

        await initiateValidatorHandler({ 
            manager, 
            provider: ethers.provider,
            signer: daoOracle 
        })

        
        await time.increase(time.duration.days(1))

        const pendingPoolIds = await manager.getPendingPoolIds()
        expect(pendingPoolIds.length).equal(2)

        const activatableValidators = pendingPoolIds.length
        if (activatableValidators) {
            await updateValidatorsHandler({ 
                manager, 
                provider: ethers.provider,
                signer: daoOracle, 
                activatableValidators
            })
        }

        await runUpkeep({ donTransmitter, upkeep })

        const firstReportValues = {
            beaconBalance: 64,
            sweptBalance: 0,
            compoundablePoolIds: [0, 0, 0, 0, 0],
            withdrawnValidators: 0
        }

        await fulfillReport({
            donTransmitter,
            upkeep,
            functionsBillingRegistry,
            values: firstReportValues
        })

        await runUpkeep({ donTransmitter, upkeep })

        const stakedPoolIds = await manager.getStakedPoolIds()
        expect(stakedPoolIds.length).equal(2)

        let stake = await manager.getTotalStake()
        let userStake = await manager.getUserStake(firstUser.address)
        expect(ethers.utils.formatEther(stake)).equal("64.0")
        expect(ethers.utils.formatEther(userStake)).equal("64.0")

        const userBalanceBefore = await ethers.provider.getBalance(firstUser.address)
        const userWithdrawalRequest = await manager.connect(firstUser).requestWithdrawal(ethers.utils.parseEther("32.0"))
        await userWithdrawalRequest.wait()

        stake = await manager.getTotalStake()
        userStake = await manager.getUserStake(firstUser.address)
        expect(ethers.utils.formatEther(stake)).equal("32.0")
        expect(ethers.utils.formatEther(userStake)).equal("32.0")

        await time.increase(time.duration.days(1))

        await runUpkeep({ donTransmitter, upkeep })

        const sweptExitedBalance = 32
        const secondReportValues = {
            beaconBalance: 32,
            sweptBalance: sweptExitedBalance,
            compoundablePoolIds: [0, 0, 0, 0, 0],
            withdrawnValidators: 1
        }

        await fulfillReport({
            donTransmitter,
            upkeep,
            functionsBillingRegistry,
            values: secondReportValues
        })

        const exitedPoolId = (await manager.getStakedPoolIds())[0]
        const exitedPoolAddress = await manager.getPoolAddress(exitedPoolId)
        const currentBalance = await ethers.provider.getBalance(exitedPoolAddress)
        const nextBalance = currentBalance.add(ethers.utils.parseEther(sweptExitedBalance.toString()))
        await setBalance(exitedPoolAddress, nextBalance)
        await withdrawValidatorsHandler({ 
            manager, 
            provider: ethers.provider,
            views, signer: daoOracle, 
            args: { count: 1 } 
        })
        const finalizableWithdrawnValidators = await manager.finalizableWithdrawnValidators()
        expect(finalizableWithdrawnValidators.toNumber()).equal(1)
        
        await runUpkeep({ donTransmitter, upkeep })

        stake = await manager.getTotalStake()
        userStake = await manager.getUserStake(firstUser.address)

        const userBalanceAfter = await ethers.provider.getBalance(firstUser.address)
        expect(ethers.utils.formatEther(stake)).equal("32.0")
        expect(ethers.utils.formatEther(userStake)).equal("32.0")
        expect(ethers.utils.formatEther(userBalanceAfter.sub(userBalanceBefore))).contains("31.9")
    })
})