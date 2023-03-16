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
  await deposit.wait()
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

// /** Fixture to report rewards (mini feed test) */
// async function rewardsFixture() {
//   const { ssvManager } = await loadFixture(thirdUserDepositFixture)
//   const activeValidatorPublicKeys = await ssvManager.getActiveValidatorPublicKeys()
//   const response = await fetch(`https://prater.beaconcha.in/api/v1/validator/${activeValidatorPublicKeys.join(',')}`)
//   const { data } = await response.json()
//   data.forEach((v: { balance: any; effectiveBalance: any; status: any }) => {
//     const { balance, effectiveBalance, status } = v
//     console.log(balance, effectiveBalance, status)
//   })
//   // Todo write to contract for mini feed test
// }

describe('SSV manager', async function () {

  it ('Has valid deposit data', async function () {
    await loadFixture(addValidatorsFixture)
    expect(true).equal(true)
  })

  it('Registration adds 2 validators', async function () {
    const { validators } = await loadFixture(addValidatorsFixture)
    expect(validators.length).equal(2)
  })

  it('First user\'s 16 ETH stake opens the first pool', async function () {
    const { ssvManager, owner } = await loadFixture(firstUserDepositFixture)
    const ssvOwnerAddress = await ssvManager.signer.getAddress()
    expect(ssvOwnerAddress).equal(owner.address)
    const openPools = await ssvManager.getOpenPoolIds()
    expect(openPools.length).equal(1)
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

  it('Second user\'s 24 ETH stake completes the first pool', async function () {
    const { ssvManager } = await loadFixture(secondUserDepositFixture)
    const stakedPools = await ssvManager.getStakedPoolIds()
    expect(stakedPools.length).equal(1)
  })

  it('Second user\'s 24 ETH stake opens a second pool', async function () {
    const { ssvManager } = await loadFixture(secondUserDepositFixture)
    const openPools = await ssvManager.getOpenPoolIds()
    expect(openPools.length).equal(1)
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

  it('Third user\'s 24 ETH stake completes the second pool', async function () {
    const { ssvManager } = await loadFixture(thirdUserDepositFixture)
    const stakedPools = await ssvManager.getStakedPoolIds()
    expect(stakedPools.length).equal(2)
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