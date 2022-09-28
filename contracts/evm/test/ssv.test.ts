import hre from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { SSVManager } from '@casimir/evm/build/artifacts/types'
const { ethers } = hre

describe('Test SSVManager contract', function () {

  async function deployContractFixture() {
    const [ owner ] = await ethers.getSigners()
    const factory = await ethers.getContractFactory('SSVManager')
    const contract = await factory.deploy() as SSVManager
    await contract.deployed()
    return { contract, factory, owner }
  }

  async function stakeUsersFixture() {
    const { contract } = await loadFixture(deployContractFixture)
    const amount = 16 // Amount to stake
    const count = 2 // Count of users
    const value = ethers.utils.parseEther(`${amount}`)
    let [ , ...users ] = await ethers.getSigners()
    users = users.slice(0, count)
    for (const user of users) {
      const stake = await contract.connect(user).stake({ value: value })
      await stake.wait()
    }
    return { amount, contract, count, users }
  }

  describe('Check balance handling', async function () {

    it('Should start with a pool balance of 0', async function () {
      const { contract } = await loadFixture(deployContractFixture)
      expect(await ethers.provider.getBalance(contract.address)).to.equal('0')
    })

    it('Should increase user balances accordingly on multiple stake events', async function () {
      const { amount, contract, users } = await loadFixture(stakeUsersFixture)
      const value = ethers.utils.parseEther(`${amount}`)
      for (const user of users) {
        expect(await contract.userBalances(user.address)).to.equal(value)
      }
    })

    it('Should increase pool balance accordingly on multiple stake events', async function () {
      const { amount, contract, count } = await loadFixture(stakeUsersFixture)
      const total = ethers.utils.parseEther(`${amount * count}`)
      expect(await ethers.provider.getBalance(contract.address)).to.equal(total)
    })

  })
  
})