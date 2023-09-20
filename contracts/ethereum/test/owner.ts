import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { simulationFixture } from './fixtures/shared'

describe('Owner', async function () {
    it('Accepts reserved fees deposited from owner', async function () {
        const { manager } = await loadFixture(simulationFixture)

        const reservedFeeBalance = await manager.reservedFeeBalance()
        const depositAmount = ethers.utils.parseEther('5')
        const depositReservedFees = await manager.depositReservedFees({ value: depositAmount })
        await depositReservedFees.wait()
        const updatedReservedFeeBalance = await manager.reservedFeeBalance()

        expect(reservedFeeBalance.add(depositAmount)).equal(updatedReservedFeeBalance)
    })

    it('Allows reserved fee withdrawal from owner', async function () {
        const { manager } = await loadFixture(simulationFixture)

        const reservedFeeBalance = await manager.reservedFeeBalance()
        const withdrawReservedFees = await manager.withdrawReservedFees(reservedFeeBalance)
        await withdrawReservedFees.wait()
        const updatedReservedFeeBalance = await manager.reservedFeeBalance()

        expect(updatedReservedFeeBalance).equal(0)
    })
})