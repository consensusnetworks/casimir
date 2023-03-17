import { deployContract } from '@casimir/hardhat'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { SSVManager } from '../build/artifacts/types'
import { ContractConfig, DeploymentConfig, Validator } from '@casimir/types'
import { validatorStore } from '@casimir/data'

/** Fixture to deploy SSV manager contract */
async function deploymentFixture() {
  let ssvManager
  const [owner] = await ethers.getSigners()
  const config: DeploymentConfig = {
    SSVManager: {
      address: '',
      args: {
        beaconDepositAddress: process.env.BEACON_DEPOSIT_ADDRESS,
        linkFeedAddress: process.env.LINK_FEED_ADDRESS,
        linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
        ssvNetworkAddress: process.env.SSV_NETWORK_ADDRESS,
        ssvTokenAddress: process.env.SSV_TOKEN_ADDRESS,
        swapRouterAddress: process.env.SWAP_ROUTER_ADDRESS,
        wethTokenAddress: process.env.WETH_TOKEN_ADDRESS
      },
      options: {},
      proxy: false
    }
  }

  for (const name in config) {
    console.log(`Deploying ${name} contract...`)
    const { args, options, proxy } = config[name as keyof typeof config] as ContractConfig

    const contract = await deployContract(name, proxy, args, options)
    const { address } = contract

    // Semi-colon needed
    console.log(`${name} contract deployed to ${address}`);

    // Save contract address for next loop
    (config[name as keyof DeploymentConfig] as ContractConfig).address = address

    // Save SSV manager for export
    if (name === 'SSVManager') ssvManager = contract
  }

  return { ssvManager: ssvManager as SSVManager, owner }
}

/** Fixture to add validators */
async function addValidatorsFixture() {
  const { ssvManager, owner } = await loadFixture(deploymentFixture)
  const validators = Object.keys(validatorStore).map((key) => validatorStore[key]).slice(0, 2) as Validator[]
  for (const validator of validators) {
      const {
          depositDataRoot,
          publicKey,
          operatorIds,
          sharesEncrypted,
          sharesPublicKeys,
          signature,
          withdrawalCredentials
      } = validator
      const registration = await ssvManager.addValidator(
          depositDataRoot,
          publicKey,
          operatorIds,
          sharesEncrypted,
          sharesPublicKeys,
          signature,
          withdrawalCredentials
      )
      await registration.wait()
  }
  return { owner, ssvManager, validators }
}

/** Fixture to stake 16 ETH for the first user */
async function firstUserDepositFixture() {
  const { owner, ssvManager } = await loadFixture(addValidatorsFixture)
  const [, firstUser] = await ethers.getSigners()
  const stakeAmount = 16.0
  const fees = { ...await ssvManager.getFees() }
  const feePercent = fees.LINK + fees.SSV
  const depositAmount = stakeAmount * ((100 + feePercent) / 100)
  const value = ethers.utils.parseEther(depositAmount.toString())
  const deposit = await ssvManager.connect(firstUser).deposit({ value })
  await deposit.wait()
  return { ssvManager, firstUser, owner }
}

/** Fixture to stake 24 ETH for the second user */
async function secondUserDepositFixture() {
  const { ssvManager, firstUser, owner } = await loadFixture(firstUserDepositFixture)
  const [, , secondUser] = await ethers.getSigners()
  const stakeAmount = 24.0
  const fees = { ...await ssvManager.getFees() }
  const feePercent = fees.LINK + fees.SSV
  const depositAmount = stakeAmount * ((100 + feePercent) / 100)
  const value = ethers.utils.parseEther(depositAmount.toString())
  const deposit = await ssvManager.connect(secondUser).deposit({ value })
  await deposit.wait(0)
  return { ssvManager, firstUser, owner, secondUser }
}

/** Fixture to stake 24 ETH for the third user */
async function thirdUserDepositFixture() {
  const { ssvManager, firstUser, owner, secondUser } = await loadFixture(secondUserDepositFixture)
  const [, , , thirdUser] = await ethers.getSigners()
  const stakeAmount = 24.0
  const fees = { ...await ssvManager.getFees() }
  const feePercent = fees.LINK + fees.SSV
  const depositAmount = stakeAmount * ((100 + feePercent) / 100)
  const value = ethers.utils.parseEther(depositAmount.toString())
  const deposit = await ssvManager.connect(thirdUser).deposit({ value })
  await deposit.wait()
  return { ssvManager, firstUser, owner, secondUser, thirdUser }
}

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
    const stake = { ...balance }.stake
    expect(ethers.utils.formatEther(stake)).equal('16.0')
  })

  it('First user\'s 16 ETH stake increases their stake to 16 ETH', async function () {
    const { ssvManager, firstUser } = await loadFixture(firstUserDepositFixture)
    const balance = await ssvManager.getUserBalance(firstUser.address)
    const stake = { ...balance }.stake
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
    const stake = { ...balance }.stake
    const stakeAmount = ethers.utils.formatEther(stake)
    expect(stakeAmount).equal('40.0')
  })

  it('Second user\'s 24 ETH stake increases their stake to 24 ETH', async function () {
    const { ssvManager, secondUser } = await loadFixture(secondUserDepositFixture)
    const balance = await ssvManager.getUserBalance(secondUser.address)
    const stake = { ...balance }.stake
    expect(ethers.utils.formatEther(stake)).equal('24.0')
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
    const stake = { ...balance }.stake
    expect(ethers.utils.formatEther(stake)).equal('64.0')
  })

  it('Third user\'s 24 ETH stake increases their stake to 24 ETH', async function () {
    const { ssvManager, thirdUser } = await loadFixture(thirdUserDepositFixture)
    const balance = await ssvManager.getUserBalance(thirdUser.address)
    const stake = { ...balance }.stake
    expect(ethers.utils.formatEther(stake)).equal('24.0')
  })
})