import { ethers } from 'hardhat'
import { loadFixture, setBalance, time } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { deploymentFixture } from './fixtures/shared'
import { round } from '../helpers/math'
import { depositFunctionsBalanceHandler, depositUpkeepBalanceHandler, initiateDepositHandler, reportCompletedExitsHandler } from '../helpers/oracle'
import { fulfillReport, runUpkeep } from '../helpers/upkeep'

describe('Users', async function () {
    it('User\'s 16.0 stake and half withdrawal updates total and user stake, and user balance', async function () {
        const { manager } = await loadFixture(deploymentFixture)
        const [, user] = await ethers.getSigners()

        const depositAmount = round(16 * ((100 + await manager.FEE_PERCENT()) / 100), 10)
        const deposit = await manager.connect(user).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
        await deposit.wait()

        let stake = await manager.getTotalStake()
        let userStake = await manager.getUserStake(user.address)

        expect(ethers.utils.formatEther(stake)).equal('16.0')
        expect(ethers.utils.formatEther(userStake)).equal('16.0')

        const userBalanceBefore = await ethers.provider.getBalance(user.address)
        const userWithdrawalRequest = await manager.connect(user).requestWithdrawal(ethers.utils.parseEther('8.0'))
        await userWithdrawalRequest.wait()
        const userBalanceAfter = await ethers.provider.getBalance(user.address)

        stake = await manager.getTotalStake()
        userStake = await manager.getUserStake(user.address)

        expect(ethers.utils.formatEther(stake)).equal('8.0')
        expect(ethers.utils.formatEther(userStake)).equal('8.0')
        expect(ethers.utils.formatEther(userBalanceAfter.sub(userBalanceBefore))).contains('7.9')
    })

    it('User\'s 64.0 stake and half withdrawal updates total and user stake, and user balance', async function () {
        const { manager, upkeep, views, keeper, daoOracle, functionsBillingRegistry } = await loadFixture(deploymentFixture)
        const [, user] = await ethers.getSigners()

        const depositAmount = round(64 * ((100 + await manager.FEE_PERCENT()) / 100), 10)
        const deposit = await manager.connect(user).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
        await deposit.wait()

        if ((await manager.functionsId()).toNumber() === 0) {
            await depositFunctionsBalanceHandler({ manager, signer: daoOracle })
        }
        if ((await manager.upkeepId()).toNumber() === 0) {
            await depositUpkeepBalanceHandler({ manager, signer: daoOracle })
        }

        await initiateDepositHandler({ manager, signer: daoOracle })
        await initiateDepositHandler({ manager, signer: daoOracle })

        const pendingPoolIds = await manager.getPendingPoolIds()
        
        expect(pendingPoolIds.length).equal(2)

        await time.increase(time.duration.days(1))   
        await runUpkeep({ upkeep, keeper })

        const firstReportValues = {
            activeBalance: 64,
            sweptBalance: 0,
            activatedDeposits: 2,
            forcedExits: 0,
            completedExits: 0,
            compoundablePoolIds: [0, 0, 0, 0, 0]
        }

        await fulfillReport({
            keeper,
            upkeep,
            functionsBillingRegistry,
            values: firstReportValues
        })

        await runUpkeep({ upkeep, keeper })

        const stakedPoolIds = await manager.getStakedPoolIds()
        
        expect(stakedPoolIds.length).equal(2)

        let stake = await manager.getTotalStake()
        let userStake = await manager.getUserStake(user.address)

        expect(ethers.utils.formatEther(stake)).equal('64.0')
        expect(ethers.utils.formatEther(userStake)).equal('64.0')

        const userBalanceBefore = await ethers.provider.getBalance(user.address)
        const userWithdrawalRequest = await manager.connect(user).requestWithdrawal(ethers.utils.parseEther('32.0'))
        await userWithdrawalRequest.wait()

        stake = await manager.getTotalStake()
        userStake = await manager.getUserStake(user.address)

        expect(ethers.utils.formatEther(stake)).equal('32.0')
        expect(ethers.utils.formatEther(userStake)).equal('32.0')

        await time.increase(time.duration.days(1))   
        await runUpkeep({ upkeep, keeper })

        const sweptExitedBalance = 32
        const secondReportValues = {
            activeBalance: 32,
            sweptBalance: sweptExitedBalance,
            activatedDeposits: 0,
            forcedExits: 0,
            completedExits: 1,
            compoundablePoolIds: [0, 0, 0, 0, 0]
        }

        await fulfillReport({
            keeper,
            upkeep,
            functionsBillingRegistry,
            values: secondReportValues
        })

        const exitedPoolId = (await manager.getStakedPoolIds())[0]
        const exitedPoolAddress = await manager.getPoolAddress(exitedPoolId)
        const currentBalance = await ethers.provider.getBalance(exitedPoolAddress)
        const nextBalance = currentBalance.add(ethers.utils.parseEther(sweptExitedBalance.toString()))
        await setBalance(exitedPoolAddress, nextBalance)
        await reportCompletedExitsHandler({ manager, views, signer: daoOracle, args: { count: 1 } })
        const finalizableCompletedExits = await manager.finalizableCompletedExits()
        expect(finalizableCompletedExits.toNumber()).equal(1)
        await runUpkeep({ upkeep, keeper })

        stake = await manager.getTotalStake()
        userStake = await manager.getUserStake(user.address)

        const userBalanceAfter = await ethers.provider.getBalance(user.address)

        expect(ethers.utils.formatEther(stake)).equal('32.0')
        expect(ethers.utils.formatEther(userStake)).equal('32.0')
        expect(ethers.utils.formatEther(userBalanceAfter.sub(userBalanceBefore))).contains('31.9')
    })

    it('User\'s 16.0 stake and five withdrawal requests fails on the 6th daily action', async function () {
        const { manager } = await loadFixture(deploymentFixture)
        const [, user] = await ethers.getSigners()

        const depositAmount = round(16 * ((100 + await manager.FEE_PERCENT()) / 100), 10)
        const deposit = await manager.connect(user).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
        await deposit.wait()

        for (let i = 0; i < 4; i++) {
            const withdrawalRequest = await manager.connect(user).requestWithdrawal(ethers.utils.parseEther('2.0'))
            await withdrawalRequest.wait()
        }

        const failedWithdrawalRequest = manager.connect(user).requestWithdrawal(ethers.utils.parseEther('2.0'))
        await expect(failedWithdrawalRequest).to.be.rejectedWith('Action period maximum reached')
    })
})