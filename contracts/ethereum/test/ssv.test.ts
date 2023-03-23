import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { addValidatorsFixture, firstUserDepositFixture, secondUserDepositFixture, thirdUserDepositFixture } from './fixtures/shared'

describe('SSV manager', async function () {

  it('Registration adds 2 validators with 4 operators each', async function () {
    const { validators } = await loadFixture(addValidatorsFixture)
    expect(validators.length).equal(2)
    
    const operators = validators.map((v) => v.operatorIds).flat()
    expect(operators.length).equal(4 * validators.length)
  })

  it('First user\'s 16 ETH stake opens the first pool with 16 ETH', async function () {
    const { ssvManager, owner } = await loadFixture(firstUserDepositFixture)
    const ssvOwnerAddress = await ssvManager.signer.getAddress()
    expect(ssvOwnerAddress).equal(owner.address)

    const openPools = await ssvManager.getOpenPoolIds()
    expect(openPools.length).equal(1)

    const firstPoolId = openPools[0]
    const pool = await ssvManager.getPool(firstPoolId)
    expect(ethers.utils.formatEther(pool.deposits)).equal('16.0')
    expect(pool.operatorIds.length).not.equal(4)
    expect(pool.validatorPublicKey).equal('0x')
  })

  it('First user\'s 16 ETH stake increases the total stake to 16 ETH', async function () {
    const { ssvManager } = await loadFixture(firstUserDepositFixture)
    const balance = await ssvManager.getBalance()
    const { stake } = ({ ...balance })
    expect(ethers.utils.formatEther(stake)).equal('16.0')
  })

  it('First user\'s 16 ETH stake increases their stake to 16 ETH', async function () {
    const { ssvManager, firstUser } = await loadFixture(firstUserDepositFixture)
    const balance = await ssvManager.getUserBalance(firstUser.address)
    const { stake } = ({ ...balance })
    expect(ethers.utils.formatEther(stake)).equal('16.0')
  })

  it('Second user\'s 24 ETH stake completes the first pool with 32 ETH', async function () {
    const { ssvManager } = await loadFixture(secondUserDepositFixture)
    const stakedPools = await ssvManager.getStakedPoolIds()
    expect(stakedPools.length).equal(1)
    
    const firstPoolId = stakedPools[0]
    const pool = await ssvManager.getPool(firstPoolId)
    expect(ethers.utils.formatEther(pool.deposits)).equal('32.0')
    expect(pool.operatorIds.length).equal(4)
    expect(pool.validatorPublicKey).not.equal('0x')
  })

  it('Second user\'s 24 ETH stake opens a second pool with 8 ETH', async function () {
    const { ssvManager } = await loadFixture(secondUserDepositFixture)
    const openPools = await ssvManager.getOpenPoolIds()
    expect(openPools.length).equal(1)
    
    const secondPoolId = openPools[0]
    const pool = await ssvManager.getPool(secondPoolId)
    expect(ethers.utils.formatEther(pool.deposits)).equal('8.0')
  })

  it('Second user\'s 24 ETH stake increases the total stake to 40 ETH', async function () {
    const { ssvManager } = await loadFixture(secondUserDepositFixture)
    const balance = await ssvManager.getBalance()
    const { stake } = ({ ...balance })
    expect(ethers.utils.formatEther(stake)).equal('40.0')
  })

  it('Second user\'s 24 ETH stake increases their stake to 24 ETH', async function () {
    const { ssvManager, secondUser } = await loadFixture(secondUserDepositFixture)
    const balance = await ssvManager.getUserBalance(secondUser.address)
    const { stake } = ({ ...balance })
    expect(ethers.utils.formatEther(stake)).equal('24.0')
  })

  it('First and second user\'s stake earns them 0.1 ETH total in rewards after some time', async function () {
    const { ssvManager } = await loadFixture(secondUserDepositFixture)
    const balance = await ssvManager.getBalance()
    const { rewards } = ({ ...balance })
    expect(ethers.utils.formatEther(rewards)).equal('0.1')
  })

  it('First and second user\'s stake earns them 0.04 and 0.06 ETH, respectively, in rewards after some time', async function () {
    const { ssvManager, firstUser, secondUser } = await loadFixture(secondUserDepositFixture)
    const firstBalance = await ssvManager.getUserBalance(firstUser.address)
    const secondBalance = await ssvManager.getUserBalance(secondUser.address)
    const { rewards: firstRewards } = ({ ...firstBalance })
    const { rewards: secondRewards } = ({ ...secondBalance })
    expect(ethers.utils.formatEther(firstRewards)).equal('0.04')
    expect(ethers.utils.formatEther(secondRewards)).equal('0.06')
  })

  it('Third user\'s 24 ETH stake completes the second pool with 32 ETH', async function () {
    const { ssvManager } = await loadFixture(thirdUserDepositFixture)
    const stakedPools = await ssvManager.getStakedPoolIds()
    expect(stakedPools.length).equal(2)
    
    const secondPoolId = stakedPools[1]
    const pool = await ssvManager.getPool(secondPoolId)
    expect(ethers.utils.formatEther(pool.deposits)).equal('32.0')
    expect(pool.operatorIds.length).equal(4)
    expect(pool.validatorPublicKey).not.equal('0x')
  })

  it('Third user\'s 24 ETH stake does not open a third pool', async function () {
    const { ssvManager } = await loadFixture(thirdUserDepositFixture)
    const openPools = await ssvManager.getOpenPoolIds()
    expect(openPools.length).equal(0)
  })

  it('Third user\'s 24 ETH stake increases the total stake to 64 ETH', async function () {
    const { ssvManager } = await loadFixture(thirdUserDepositFixture)
    const balance = await ssvManager.getBalance()
    const { stake } = ({ ...balance })
    expect(ethers.utils.formatEther(stake)).equal('64.0')
  })

  it('Third user\'s 24 ETH stake increases their stake to 24 ETH', async function () {
    const { ssvManager, thirdUser } = await loadFixture(thirdUserDepositFixture)
    const balance = await ssvManager.getUserBalance(thirdUser.address)
    const { stake } = ({ ...balance })
    expect(ethers.utils.formatEther(stake)).equal('24.0')
  })

  it('First, second, and third user\'s stake earns them 0.2 ETH total in rewards after some more time', async function () {
    const { ssvManager } = await loadFixture(thirdUserDepositFixture)
    const balance = await ssvManager.getBalance()
    const { rewards } = ({ ...balance })
    expect(ethers.utils.formatEther(rewards)).equal('0.2')
  })

  it('First, second, and third user\'s stake earns them 0.065, 0.0975 and 0.0375 ETH, respectively, in rewards after some time', async function () {
    const { ssvManager, firstUser, secondUser, thirdUser } = await loadFixture(thirdUserDepositFixture)
    const firstBalance = await ssvManager.getUserBalance(firstUser.address)
    const secondBalance = await ssvManager.getUserBalance(secondUser.address)
    const thirdBalance = await ssvManager.getUserBalance(thirdUser.address)
    const { rewards: firstRewards } = ({ ...firstBalance })
    const { rewards: secondRewards } = ({ ...secondBalance })
    const { rewards: thirdRewards } = ({ ...thirdBalance })
    expect(ethers.utils.formatEther(firstRewards)).equal('0.065')
    expect(ethers.utils.formatEther(secondRewards)).equal('0.0975')
    expect(ethers.utils.formatEther(thirdRewards)).equal('0.0375')
  })
})