import hre from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { SSVManager } from '@casimir/evm/build/artifacts/types'
const { ethers } = hre

const deposits = [
  {
    amount: 8,
    userIndex: 1
  },
  {
    amount: 16,
    userIndex: 0
  },
  {
    amount: 8,
    userIndex: 1
  }
]

describe('Test SSVManager contract', function () {

  async function deploymentFixture() {
    const [ owner ] = await ethers.getSigners()
    const factory = await ethers.getContractFactory('SSVManager')
    const contract = await factory.deploy() as SSVManager
    await contract.deployed()
    return { contract, factory, owner }
  }

  // Todo get rid of deposit fixture loop and just use 2 users in scenarios
  async function depositsFixture() {
    const { contract } = await loadFixture(deploymentFixture)
    const [ , ...users ] = await ethers.getSigners()
    for (const { amount, userIndex } of deposits) {
      const value = ethers.utils.parseEther(`${amount}`)
      const user = users[userIndex]
      const deposit = await contract.connect(user).deposit({ value: value })
      await deposit.wait() // const receipt = await deposit.wait()
      // console.log('User at', user.address, 'paid', ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice)), 'ETH in gas for deposit')
    }
    return { contract }
  }

  describe(`Check balance handling for ${deposits.length} deposits`, async function () {

    it('Should increase active user balances accordingly', async function () {
      const { contract } = await loadFixture(depositsFixture)
      const [ , ...users ] = await ethers.getSigners()
      const userBalances = deposits.reduce((balances, { amount, userIndex }) => {
        balances[userIndex] = isNaN(balances[userIndex]) ? amount : balances[userIndex] += amount
        return balances
      }, [] as Array<number>)
      for (const [index, user] of users.splice(0, userBalances.length).entries()) {
        const pools = await contract.getPoolsForUser(user.address)
        // Todo check user expected pool balance distribution
        // Might be hard to do with ordering
        expect(await contract.getUserBalanceForPool(user.address, pools[0])).to.equal(ethers.utils.parseEther(`${userBalances[index]}`))
      }
    })

    // it('Should increase pool balance accordingly', async function () {
    //   const { contract } = await loadFixture(depositsFixture)

      // Todo get total deposited amount from deposits
      // Check total expected pool count and pool balance distribution

      // const poolBalance = ethers.utils.parseEther(`${amount * count}`)
      // for (const user of users) {
      //   const pools = await contract.getPoolsForUser(user.address)
      //   expect(await ethers.provider.getBalance(pools[0])).to.equal(poolBalance)
      // }
    // })

  })
  
})