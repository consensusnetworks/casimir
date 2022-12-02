import { deployContract } from '@casimir/hardhat-helpers'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { SSVManager } from '../build/artifacts/types'

/** Fixture to deploy SSV manager contract */
async function deploymentFixture() {
  const [owner] = await ethers.getSigners()
  const name = 'SSVManager'
  const args = {
    swapRouterAddress: process.env.SWAP_ROUTER_ADDRESS,
    linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
    ssvTokenAddress: process.env.SSV_TOKEN_ADDRESS,
    wethTokenAddress: process.env.WETH_TOKEN_ADDRESS
  }
  const options = {}
  const proxy = false
  const contract = await deployContract(name, proxy, args, options) as SSVManager
  return { contract, owner }
}

/** Fixture to stake 16 ETH for the first user */
async function firstUserDepositFixture() {
  const { contract, owner } = await loadFixture(deploymentFixture)
  const [, firstUser] = await ethers.getSigners()
  const stakeAmount = 16.0
  const fees = { ...await contract.getFees() }
  const feesTotalPercent = fees.LINK.toNumber() + fees.SSV.toNumber()
  const depositAmount = stakeAmount * ((100 + feesTotalPercent) / 100)
  const value = ethers.utils.parseEther(depositAmount.toString())
  const deposit = await contract.connect(firstUser).deposit({ value })
  await deposit.wait()
  return { contract, firstUser, owner }
}

/** Fixture to stake 24 ETH for the second user */
async function secondUserDepositFixture() {
  const { contract, firstUser, owner } = await loadFixture(firstUserDepositFixture)
  const [, , secondUser] = await ethers.getSigners()
  const stakeAmount = 24.0
  const fees = { ...await contract.getFees() }
  const feesTotalPercent = fees.LINK.toNumber() + fees.SSV.toNumber()
  const depositAmount = stakeAmount * ((100 + feesTotalPercent) / 100)
  const value = ethers.utils.parseEther(depositAmount.toString())
  const deposit = await contract.connect(secondUser).deposit({ value })
  await deposit.wait()
  return { contract, firstUser, owner, secondUser }
}

/** Fixture to stake 24 ETH for the third user */
async function thirdUserDepositFixture() {
  const { contract, firstUser, owner, secondUser } = await loadFixture(secondUserDepositFixture)
  const [, , , thirdUser] = await ethers.getSigners()
  const stakeAmount = 24.0
  const fees = { ...await contract.getFees() }
  const feesTotalPercent = fees.LINK.toNumber() + fees.SSV.toNumber()
  const depositAmount = stakeAmount * ((100 + feesTotalPercent) / 100)
  const value = ethers.utils.parseEther(depositAmount.toString())
  const deposit = await contract.connect(thirdUser).deposit({ value })
  await deposit.wait()
  return { contract, firstUser, owner, secondUser, thirdUser }
}

describe('SSV manager', async function () {

  it('First user\'s 16 ETH stake should open the first pool', async function () {
    const { contract, owner } = await loadFixture(firstUserDepositFixture)
    const contractOwnerAddress = await contract.signer.getAddress()
    expect(contractOwnerAddress).equal(owner.address)
    const openPools = await contract.getOpenPoolIds()
    expect(openPools.length).equal(1)
  })

  it('First user\'s 16 ETH stake should increase the first pool\'s balance to 16 ETH', async function () {
    const { contract } = await loadFixture(firstUserDepositFixture)
    const [firstPool] = await contract.getOpenPoolIds()
    const poolBalance = await contract.getPoolBalance(firstPool)
    const stakeAmount = ethers.utils.formatEther({ ...poolBalance }.stake)
    expect(stakeAmount).equal('16.0')
  })

  it('First user\'s 16 ETH stake should increase first user\'s balance in the first pool to 16 ETH', async function () {
    const { contract, firstUser } = await loadFixture(firstUserDepositFixture)
    const [firstPool] = await contract.getOpenPoolIds()
    const poolUserBalance = await contract.getPoolUserBalance(firstPool, firstUser.address)
    const stakeAmount = ethers.utils.formatEther({ ...poolUserBalance }.stake)
    expect(stakeAmount).equal('16.0')
  })

  it('Second user\'s 24 ETH stake should complete the first pool', async function () {
    const { contract } = await loadFixture(secondUserDepositFixture)
    const stakedPools = await contract.getStakedPoolIds()
    expect(stakedPools.length).equal(1)
  })

  it('Second user\'s 24 ETH stake should increase the first pool\'s balance to 32 ETH', async function () {
    const { contract } = await loadFixture(secondUserDepositFixture)
    const [firstPool] = await contract.getStakedPoolIds()
    const poolBalance = await contract.getPoolBalance(firstPool)
    const stakeAmount = ethers.utils.formatEther({ ...poolBalance }.stake)
    expect(stakeAmount).equal('32.0')
  })

  it('Second user\'s 24 ETH stake should increase second user\'s balance in the first pool to 16 ETH', async function () {
    const { contract, secondUser } = await loadFixture(secondUserDepositFixture)
    const [firstPool] = await contract.getStakedPoolIds()
    const poolUserBalance = await contract.getPoolUserBalance(firstPool, secondUser.address)
    const stakeAmount = ethers.utils.formatEther({ ...poolUserBalance }.stake)
    expect(stakeAmount).equal('16.0')
  })

  it('Second user\'s 24 ETH stake should open a second pool', async function () {
    const { contract } = await loadFixture(secondUserDepositFixture)
    const openPools = await contract.getOpenPoolIds()
    expect(openPools.length).equal(1)
  })

  it('Second user\'s 24 ETH stake should increase the second pool\'s balance to 8 ETH', async function () {
    const { contract } = await loadFixture(secondUserDepositFixture)
    const [secondPool] = await contract.getOpenPoolIds()
    const poolBalance = await contract.getPoolBalance(secondPool)
    const stakeAmount = ethers.utils.formatEther({ ...poolBalance }.stake)
    expect(stakeAmount).equal('8.0')
  })

  it('Second user\'s 24 ETH stake should increase second user\'s balance in the second pool to 8 ETH', async function () {
    const { contract, secondUser } = await loadFixture(secondUserDepositFixture)
    const [secondPool] = await contract.getOpenPoolIds()
    const poolUserBalance = await contract.getPoolUserBalance(secondPool, secondUser.address)
    const stakeAmount = ethers.utils.formatEther({ ...poolUserBalance }.stake)
    expect(stakeAmount).equal('8.0')
  })

  it('Third user\'s 24 ETH stake should complete the second pool', async function () {
    const { contract } = await loadFixture(thirdUserDepositFixture)
    const stakedPools = await contract.getStakedPoolIds()
    expect(stakedPools.length).equal(2)
  })

  it('Third user\'s 24 ETH stake should increase the second pool\'s balance to 32 ETH', async function () {
    const { contract } = await loadFixture(thirdUserDepositFixture)
    const [, secondPool] = await contract.getStakedPoolIds()
    const poolBalance = await contract.getPoolBalance(secondPool)
    const stakeAmount = ethers.utils.formatEther({ ...poolBalance }.stake)
    expect(stakeAmount).equal('32.0')
  })

  it('Third user\'s 24 ETH stake should increase third user\'s balance in the second pool to 24 ETH', async function () {
    const { contract, thirdUser } = await loadFixture(thirdUserDepositFixture)
    const [, secondPool] = await contract.getStakedPoolIds()
    const poolUserBalance = await contract.getPoolUserBalance(secondPool, thirdUser.address)
    const stakeAmount = ethers.utils.formatEther({ ...poolUserBalance }.stake)
    expect(stakeAmount).equal('24.0')
  })

  it('Third user\'s 24 ETH stake should not open a third pool', async function () {
    const { contract } = await loadFixture(thirdUserDepositFixture)
    const openPools = await contract.getOpenPoolIds()
    expect(openPools.length).equal(0)
  })

})