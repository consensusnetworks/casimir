import hre from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { SSVManager } from '@casimir/evm/build/artifacts/types'
const { ethers } = hre

// Todo handle range of amounts and test for multiple pools
// Currently test only works with even count of 16 ETH
// Also clean up function naming

// Global testing variables
const amount = 16 // Amount to deposit per user
const count = 2 // Count of users

describe('Test SSVManager contract', function () {

  async function deployFixture() {
    const [ owner ] = await ethers.getSigners()
    const factory = await ethers.getContractFactory('SSVManager')
    const contract = await factory.deploy() as SSVManager
    await contract.deployed()
    return { contract, factory, owner }
  }

  async function depositsFixture() {
    const { contract } = await loadFixture(deployFixture)
    const value = ethers.utils.parseEther(`${amount}`)
    let [ , ...users ] = await ethers.getSigners()
    users = users.slice(0, count)
    for (const user of users) {
      const deposit = await contract.connect(user).deposit({ value: value })
      await deposit.wait()
    }
    return { contract, users }
  }

  describe(`Check balance handling for ${count} individual deposits of ${amount} ETH`, async function () {

    it(`Should increase user balances to ${amount} ETH`, async function () {
      const { contract, users } = await loadFixture(depositsFixture)
      const userBalance = ethers.utils.parseEther(`${amount}`)
      for (const user of users) {
        const pools = await contract.getPoolsForUser(user.address)
        expect(await contract.getPoolUserBalance(user.address, pools[0])).to.equal(userBalance)
      }
    })

    it(`Should increase pool balance to ${amount * count} ETH`, async function () {
      const { contract, users } = await loadFixture(depositsFixture)
      const poolBalance = ethers.utils.parseEther(`${amount * count}`)
      for (const user of users) {
        const pools = await contract.getPoolsForUser(user.address)
        expect(await ethers.provider.getBalance(pools[0])).to.equal(poolBalance)
      }
    })

  })
  
})