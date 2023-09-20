import { expect } from 'chai'
import { ethers, network } from 'hardhat'
import { loadFixture, setBalance, time } from '@nomicfoundation/hardhat-network-helpers'
import { secondUserDepositFixture } from './fixtures/shared'
import { Scanner } from '@casimir/ssv'
import { Factory } from '@casimir/uniswap'
import { fulfillReport, runUpkeep } from '../helpers/upkeep'
import { reportCompletedExitsHandler } from '../helpers/oracle'

describe('Oracle', async function () {
    it('Deposits reserved fees to cluster balance on oracle request', async function () {
        const { manager, ssvNetwork, ssvNetworkViews, daoOracle } = await loadFixture(secondUserDepositFixture)

        const ssvTokenAddress = process.env.SSV_TOKEN_ADDRESS as string
        const swapFactoryAddress = process.env.SWAP_FACTORY_ADDRESS as string
        const wethTokenAddress = process.env.WETH_TOKEN_ADDRESS as string
        const operatorIds = process.env.PREREGISTERED_OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [654, 655, 656, 657]

        const reservedFeeBalance = await manager.reservedFeeBalance()
        const scanner = new Scanner({
            provider: ethers.provider,
            ssvNetworkAddress: ssvNetwork.address,
            ssvNetworkViewsAddress: ssvNetworkViews.address
        })
    
        const cluster = await scanner.getCluster({ 
            ownerAddress: manager.address,
            operatorIds
        })
    
        const requiredFee = await scanner.getRequiredFee(operatorIds)
    
        const uniswapFactory = new Factory({
            provider: ethers.provider,
            uniswapV3FactoryAddress: swapFactoryAddress
        })
    
        const price = await uniswapFactory.getSwapPrice({ 
            tokenIn: wethTokenAddress,
            tokenOut: ssvTokenAddress,
            uniswapFeeTier: 3000
        })
    
        const feeAmount = ethers.utils.parseEther((Number(ethers.utils.formatEther(requiredFee)) * price).toPrecision(9))
        const minimumTokenAmount = ethers.utils.parseEther((Number(ethers.utils.formatEther(requiredFee)) * 0.99).toPrecision(9))

        const depositClusterBalance = await manager.connect(daoOracle).depositClusterBalance(
            operatorIds,
            cluster,
            feeAmount,
            minimumTokenAmount,
            false
        )
        await depositClusterBalance.wait()

        const updatedReservedFeeBalance = await manager.reservedFeeBalance()

        expect(updatedReservedFeeBalance).equal(reservedFeeBalance.sub(feeAmount))
    })

    it('Allows cluster balance withdrawal from oracle and fund withdrawal from owner', async function () {
        const { manager, upkeep, views, ssvNetwork, ssvNetworkViews, functionsBillingRegistry, daoOracle, keeper, firstUser, secondUser } = await loadFixture(secondUserDepositFixture)

        console.log('Setting up')

        const ssvTokenAddress = process.env.SSV_TOKEN_ADDRESS as string
        const ssvToken = await ethers.getContractAt('IERC20', ssvTokenAddress)

        const secondStake = await manager.getUserStake(secondUser.address)
        const secondRequestWithdrawal = await manager.connect(secondUser).requestWithdrawal(secondStake)
        await secondRequestWithdrawal.wait()

        await time.increase(time.duration.days(1))
        await runUpkeep({ upkeep, keeper })

        const sweptExitedBalance = 32
        const reportValues = {
            activeBalance: 0,
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
            values: reportValues
        })

        const exitedPoolId = (await manager.getStakedPoolIds())[0]
        const exitedPoolAddress = await manager.getPoolAddress(exitedPoolId)
        const currentBalance = await ethers.provider.getBalance(exitedPoolAddress)
        const nextBalance = currentBalance.add(ethers.utils.parseEther(sweptExitedBalance.toString()))
        await setBalance(exitedPoolAddress, nextBalance)

        await reportCompletedExitsHandler({ manager, views, signer: daoOracle, args: { count: 1 } })

        await runUpkeep({ upkeep, keeper })

        const operatorIds = process.env.PREREGISTERED_OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [654, 655, 656, 657]

        const scanner = new Scanner({
            provider: ethers.provider,
            ssvNetworkAddress: ssvNetwork.address,
            ssvNetworkViewsAddress: ssvNetworkViews.address
        })

        const cluster = await scanner.getCluster({ 
            ownerAddress: manager.address,
            operatorIds
        })

        const withdrawAmount = ethers.utils.parseEther('0.000000001') // await ssvNetworkViews.getBalance(manager.address, operatorIds, cluster)

        const withdrawClusterBalance = await manager.connect(daoOracle).withdrawClusterBalance(
            operatorIds,
            cluster,
            withdrawAmount
        )
        await withdrawClusterBalance.wait()
        const ssvBalance = await ssvToken.balanceOf(manager.address)
        
        expect(ssvBalance).equal(withdrawAmount)

        const withdrawSSVBalance = await manager.withdrawSSVBalance(ssvBalance)
        await withdrawSSVBalance.wait()
        const updatedSSVBalance = await ssvToken.balanceOf(manager.address)

        expect(updatedSSVBalance).equal(0)
    })

    it('Allows functions cancellation from oracle and fund withdrawal from owner', async function () {
        const { manager, daoOracle } = await loadFixture(secondUserDepositFixture)

        const linkTokenAddress = process.env.LINK_TOKEN_ADDRESS as string
        const linkToken = await ethers.getContractAt('IERC20', linkTokenAddress)

        const cancelFunctions = await manager.connect(daoOracle).cancelFunctions()
        await cancelFunctions.wait()

        const linkBalance = await linkToken.balanceOf(manager.address)

        const withdrawLink = await manager.withdrawLINKBalance(linkBalance)
        await withdrawLink.wait()

        const updatedLinkBalance = await linkToken.balanceOf(manager.address)

        expect(updatedLinkBalance).equal(0)
    })

    it('Allows upkeep cancellation from oracle and fund withdrawal from owner', async function () {
        const { manager, daoOracle } = await loadFixture(secondUserDepositFixture)

        const linkTokenAddress = process.env.LINK_TOKEN_ADDRESS as string
        const linkToken = await ethers.getContractAt('IERC20', linkTokenAddress)

        const cancelUpkeep = await manager.connect(daoOracle).cancelUpkeep()
        await cancelUpkeep.wait()

        const linkBalance = await linkToken.balanceOf(manager.address)

        const withdrawLink = await manager.withdrawLINKBalance(linkBalance)
        await withdrawLink.wait()

        const updatedLinkBalance = await linkToken.balanceOf(manager.address)

        expect(updatedLinkBalance).equal(0)
    })
})