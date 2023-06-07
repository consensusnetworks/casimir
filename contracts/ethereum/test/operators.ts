import { ethers } from 'hardhat'
import { loadFixture, setBalance, time } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { deploymentFixture } from './fixtures/shared'
import { round } from '../helpers/math'
import { initiateDepositHandler, reportCompletedExitsHandler } from '../helpers/oracle'
import { fulfillReport, runUpkeep } from '../helpers/upkeep'

describe('Operators', async function () {
    it('Register operator 1, 2, 3, and 4', async function () {
        const { manager } = await loadFixture(deploymentFixture)
        console.log('Operators test')
    })
})