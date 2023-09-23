import { expect } from 'chai'
import { secondUserDepositFixture } from './fixtures/shared'
import { round } from '../helpers/math'
import { depositFunctionsBalanceHandler, depositUpkeepBalanceHandler, initiateDepositHandler, reportCompletedExitsHandler } from '../helpers/oracle'
import { fulfillReport, runUpkeep } from '../helpers/upkeep'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'

describe('Upkeep', async function () {
    it('Fails to peform upkeep if it is not needed', async function () {
        const { upkeep, keeper } = await loadFixture(secondUserDepositFixture)
        const performData = ethers.utils.toUtf8Bytes('')
        const performUpkeep = upkeep.connect(keeper).performUpkeep(performData)
        await expect(performUpkeep).to.be.revertedWith('Upkeep not needed')
    })
})