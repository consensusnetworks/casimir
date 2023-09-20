import { expect } from 'chai'
import { ethers, network } from 'hardhat'
import { loadFixture, setBalance } from '@nomicfoundation/hardhat-network-helpers'
import { deploymentFixture, secondUserDepositFixture, thirdUserDepositFixture, thirdUserWithdrawalCompletedFixture } from './fixtures/shared'
import { CasimirPool } from '../build/@types'

describe('Pools', async function () {
    it('Allows setting of operator IDs and reshares from owner', async function () {
        const { manager } = await loadFixture(secondUserDepositFixture)
        const [firstPoolId] = await manager.getStakedPoolIds()
        const firstPoolAddress = await manager.getPoolAddress(firstPoolId)
        const poolOwnerSigner = ethers.provider.getSigner(manager.address)
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [manager.address]
        })
        const pool = await ethers.getContractAt('CasimirPool', firstPoolAddress) as CasimirPool
        const operatorIds = [1, 2, 3, 4]
        const setOperatorIds = await pool.connect(poolOwnerSigner).setOperatorIds(operatorIds)
        await setOperatorIds.wait()
        const reshares = 2
        const setReshares = await pool.connect(poolOwnerSigner).setReshares(reshares)
        await setReshares.wait()
        const updatedPoolDetails = await pool.getDetails()

        expect(updatedPoolDetails.operatorIds.map(id => id.toNumber()).toString()).equal(operatorIds.toString())
        expect(updatedPoolDetails.reshares.toNumber()).equal(reshares)
    })

    it('Fails to deposit zero rewards', async function () {
        const { manager } = await loadFixture(secondUserDepositFixture)
        const [firstPoolId] = await manager.getStakedPoolIds()
        const firstPoolAddress = await manager.getPoolAddress(firstPoolId)

        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [manager.address]
        })
        
        const pool = await ethers.getContractAt('CasimirPool', firstPoolAddress) as CasimirPool
        const depositRewards = pool.connect(ethers.provider.getSigner(manager.address)).depositRewards()
        
        await expect(depositRewards).to.be.revertedWith('No rewards to deposit')
    })

    it('Fails to deposit to manager not as pool', async function () {
        const { manager } = await loadFixture(thirdUserDepositFixture)

        const [firstPoolId] = await manager.getStakedPoolIds()
        const depositRewards = manager.depositRewards(firstPoolId, { value: ethers.utils.parseEther('1.0') } )
        
        await expect(depositRewards).to.be.revertedWith('Not pool')
    })

    it('Fails to initiate deposit without ready pools', async function () {
        const { daoOracle, manager } = await loadFixture(deploymentFixture)

        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [daoOracle.address]
        })

        const initiateDeposit = manager.connect(ethers.provider.getSigner(daoOracle.address)).initiateDeposit(
            ethers.utils.formatBytes32String('0x'),
            ethers.utils.toUtf8Bytes('0x'),
            ethers.utils.toUtf8Bytes('0x'),
            ethers.utils.toUtf8Bytes('0x'),
            process.env.PREREGISTERED_OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [654, 655, 656, 657],
            ethers.utils.toUtf8Bytes('0x'),
            {
                validatorCount: 0,
                networkFeeIndex: 0,
                index: 0,
                balance: 0,
                active: false
            },
            0,
            0,
            false
        )

        await expect(initiateDeposit).to.be.revertedWith('No ready pools')
    })

    it('Fails to activate deposits with invalid count', async function () {
        const { manager, upkeep } = await loadFixture(secondUserDepositFixture)

        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [upkeep.address]
        })
        setBalance(upkeep.address, ethers.utils.parseEther('1.0'))

        const activateDeposits = manager.connect(ethers.provider.getSigner(upkeep.address)).activateDeposits(5)

        await expect(activateDeposits).to.be.revertedWith('Not enough pending pools')
    })

    it('Fails to report completed exit on pool not exiting', async function () {
        const { daoOracle, manager } = await loadFixture(thirdUserDepositFixture)

        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [daoOracle.address]
        })

        const [poolId] = await manager.getStakedPoolIds()
        const reportCompletedExit = manager.connect(ethers.provider.getSigner(daoOracle.address)).reportCompletedExit(
            poolId,
            process.env.PREREGISTERED_OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [654, 655, 656, 657],
            {
                validatorCount: 0,
                networkFeeIndex: 0,
                index: 0,
                balance: 0,
                active: false
            }
        )

        await expect(reportCompletedExit).to.be.revertedWith('Pool not exiting')
    })
})