import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { addValidatorsFixture, firstUserDepositFixture, rewardPostSecondUserDepositFixture, secondUserDepositFixture, thirdUserDepositFixture, rewardPostThirdUserDepositFixture, simulationFixture, firstUserPartialWithdrawalFixture } from './fixtures/shared'

describe('Casimir manager', async function () {

  it('Registration adds 2 validators with 4 operators each', async function () {
    const { validators } = await loadFixture(addValidatorsFixture)
    expect(validators.length).equal(2)
    
    const operators = validators.map((v) => v.operatorIds).flat()
    expect(operators.length).equal(4 * validators.length)
  })

  it('First user\'s 16.0 stake opens the first pool with 16.0', async function () {
    const { casimirManager, owner } = await loadFixture(firstUserDepositFixture)
    const ssvOwnerAddress = await casimirManager.signer.getAddress()
    expect(ssvOwnerAddress).equal(owner.address)

    const openPools = await casimirManager.getReadyPoolIds()
    expect(openPools.length).equal(1)

    const firstPoolId = openPools[0]
    const pool = await casimirManager.getPool(firstPoolId)
    expect(ethers.utils.formatEther(pool.deposits)).equal('16.0')
    expect(pool.operatorIds.length).not.equal(4)
    expect(pool.validatorPublicKey).equal('0x')
  })

  it('First user\'s 16.0 stake increases the total stake to 16.0', async function () {
    const { casimirManager } = await loadFixture(firstUserDepositFixture)
    const stake = await casimirManager.getStake()
    expect(ethers.utils.formatEther(stake)).equal('16.0')
  })

  it('First user\'s 16.0 stake increases their stake to 16.0', async function () {
    const { casimirManager, firstUser } = await loadFixture(firstUserDepositFixture)
    const stake = await casimirManager.getUserStake(firstUser.address)
    expect(ethers.utils.formatEther(stake)).equal('16.0')
  })

  it('Second user\'s 24.0 stake completes the first pool with 32.0', async function () {
    const { casimirManager } = await loadFixture(secondUserDepositFixture)
    const stakedPools = await casimirManager.getStakedPoolIds()
    expect(stakedPools.length).equal(1)
    
    const firstPoolId = stakedPools[0]
    const pool = await casimirManager.getPool(firstPoolId)
    expect(ethers.utils.formatEther(pool.deposits)).equal('32.0')
    expect(pool.operatorIds.length).equal(4)
    expect(pool.validatorPublicKey).not.equal('0x')
  })

  it('Second user\'s 24.0 stake opens a second pool with 8.0', async function () {
    const { casimirManager } = await loadFixture(secondUserDepositFixture)
    const openPools = await casimirManager.getReadyPoolIds()
    expect(openPools.length).equal(1)
    
    const secondPoolId = openPools[0]
    const pool = await casimirManager.getPool(secondPoolId)
    expect(ethers.utils.formatEther(pool.deposits)).equal('8.0')
  })

  it('Second user\'s 24.0 stake increases the total stake to 40.0', async function () {
    const { casimirManager } = await loadFixture(secondUserDepositFixture)
    const stake = await casimirManager.getStake()
    expect(ethers.utils.formatEther(stake)).equal('40.0')
  })

  it('Second user\'s 24.0 stake increases their stake to 24.0', async function () {
    const { casimirManager, secondUser } = await loadFixture(secondUserDepositFixture)
    const stake = await casimirManager.getUserStake(secondUser.address)
    expect(ethers.utils.formatEther(stake)).equal('24.0')
  })

  it('First and second user\'s stake earns 0.1 total after some time', async function () {
    const { casimirManager } = await loadFixture(rewardPostSecondUserDepositFixture)
    const stake = await casimirManager.getStake()
    expect(ethers.utils.formatEther(stake)).equal('40.1')
  })

  it('First and second user\'s stake earns them 0.04 and 0.06, respectively, in rewards after some time', async function () {
    const { casimirManager, firstUser, secondUser } = await loadFixture(rewardPostSecondUserDepositFixture)
    const firstStake = await casimirManager.getUserStake(firstUser.address)
    const secondStake = await casimirManager.getUserStake(secondUser.address)
    expect(ethers.utils.formatEther(firstStake)).equal('16.04')
    expect(ethers.utils.formatEther(secondStake)).equal('24.06')
  })

  it('Third user\'s 24.0 stake completes the second pool with 32.0', async function () {
    const { casimirManager } = await loadFixture(thirdUserDepositFixture)
    const stakedPools = await casimirManager.getStakedPoolIds()
    expect(stakedPools.length).equal(2)
    
    const secondPoolId = stakedPools[1]
    const pool = await casimirManager.getPool(secondPoolId)
    expect(ethers.utils.formatEther(pool.deposits)).equal('32.0')
    expect(pool.operatorIds.length).equal(4)
    expect(pool.validatorPublicKey).not.equal('0x')
  })

  it('Third user\'s 24.0 stake opens a third pool', async function () {
    const { casimirManager } = await loadFixture(thirdUserDepositFixture)
    const openPools = await casimirManager.getReadyPoolIds()
    expect(openPools.length).equal(1)
  })

  it('Third user\'s 24.0 stake increases the total stake to 64.1', async function () {
    const { casimirManager } = await loadFixture(thirdUserDepositFixture)
    const stake = await casimirManager.getStake()
    expect(ethers.utils.formatEther(stake)).equal('64.1')
  })

  it('Third user\'s 24.0 stake increases their stake to 24.0', async function () {
    const { casimirManager, thirdUser } = await loadFixture(thirdUserDepositFixture)
    const stake = await casimirManager.getUserStake(thirdUser.address)
    expect(ethers.utils.formatEther(stake)).equal('24.0')
  })

  it('First, second, and third user\'s stake earns them 0.3 total in rewards after some more time (or 0.0 with compound)', async function () {
    const { casimirManager } = await loadFixture(rewardPostThirdUserDepositFixture)
    const stake = await casimirManager.getStake()
    expect(ethers.utils.formatEther(stake)).equal('64.3')
  })

  it('First, second, and third user\'s stake earns them ~0.09, ~0.135 and ~0.075, respectively, after some time', async function () {
    const { casimirManager, firstUser, secondUser, thirdUser } = await loadFixture(rewardPostThirdUserDepositFixture)
    const firstStake = await casimirManager.getUserStake(firstUser.address)
    const secondStake = await casimirManager.getUserStake(secondUser.address)
    const thirdStake = await casimirManager.getUserStake(thirdUser.address)

    expect(ethers.utils.formatEther(firstStake)).equal('16.090046801872074882')
    expect(ethers.utils.formatEther(secondStake)).equal('24.135070202808112324')
    expect(ethers.utils.formatEther(thirdStake)).equal('24.074882995319812792')
  })

  it('First user\'s 0.3 withdrawal decreases their stake to ~15.79', async function () {
    const { casimirManager, firstUser, secondUser, thirdUser } = await loadFixture(firstUserPartialWithdrawalFixture)
    const firstStake = await casimirManager.getUserStake(firstUser.address)
    const secondStake = await casimirManager.getUserStake(secondUser.address)
    const thirdStake = await casimirManager.getUserStake(thirdUser.address)

    expect(ethers.utils.formatEther(firstStake)).equal('15.790046801872074882')
    expect(ethers.utils.formatEther(secondStake)).equal('24.135070202808112324')
    expect(ethers.utils.formatEther(thirdStake)).equal('24.074882995319812792')
  })

  it('Check more rewards and dust', async function () {
    const { casimirManager, firstUser, secondUser, thirdUser } = await loadFixture(simulationFixture)
    const stake = await casimirManager.getStake()
    const firstStake = await casimirManager.getUserStake(firstUser.address)
    const secondStake = await casimirManager.getUserStake(secondUser.address)
    const thirdStake = await casimirManager.getUserStake(thirdUser.address)
    const dust = stake.sub(firstStake.add(secondStake).add(thirdStake))
    
    const line = '----------------------------------------'
    console.log(`${line}\n💿 Post testing simulation results\n${line}`)
    if (dust !== ethers.utils.parseEther('0.0')) {
        console.log('🙊 Dust count', ethers.utils.formatEther(dust))
    }
    console.log('🏦 Manager updated balance', ethers.utils.formatEther(stake))
    console.log('👤 First user updated balance', ethers.utils.formatEther(firstStake))
    console.log('👤 Second user updated balance', ethers.utils.formatEther(secondStake))
    console.log('👤 Third user updated balance', ethers.utils.formatEther(thirdStake))
    
    const readyDeposits = await casimirManager.getReadyDeposits()
    console.log('📦 Ready deposits', ethers.utils.formatEther(readyDeposits))
    console.log(line)
  })
})