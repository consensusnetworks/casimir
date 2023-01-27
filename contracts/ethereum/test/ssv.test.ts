import { deployContract } from '@casimir/hardhat-helpers'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { MockFeed, SSVManager } from '../build/artifacts/types'
import { ContractConfig, DeploymentConfig } from '@casimir/types'
import KeyGen from '@casimir/keygen'

/** Fixture to deploy SSV manager contract */
async function deploymentFixture() {
  let ssv, feed
  const [owner] = await ethers.getSigners()
  const mockChainlink = process.env.MOCK_CHAINLINK === 'true'
  let config: DeploymentConfig = {
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

  if (mockChainlink) {
    const mockChainlinkConfig = {
      MockFeed: {
        address: '',
        args: {
          linkTokenAddress: process.env.LINK_TOKEN_ADDRESS
        },
        options: {},
        proxy: false
      }
    }
    config = {
      // Deploy Chainlink contracts first
      ...mockChainlinkConfig,
      ...config
    }
  }

  for (const name in config) {
    console.log(`Deploying ${name} contract...`)
    const { args, options, proxy } = config[name as keyof typeof config] as ContractConfig

    // Update SSVManager args with MockFeed address
    if (name === 'SSVManager' && config.MockFeed) {
      args.linkFeedAddress = config.MockFeed.address
    }

    const contract = await deployContract(name, proxy, args, options)
    const { address } = contract

    // Semi-colon needed
    console.log(`${name} contract deployed to ${address}`);

    // Save contract address for next loop
    (config[name as keyof DeploymentConfig] as ContractConfig).address = address
    
    // Save mock feed for export
    if (name === 'MockFeed') feed = contract

    // Save SSV manager for export
    if (name === 'SSVManager') ssv = contract
  }

  return { ssv: ssv as SSVManager, feed: feed as MockFeed, owner }
}

/** Fixture to add validators */
async function addValidatorsFixture() {
  const { ssv, feed, owner } = await loadFixture(deploymentFixture)
  const keyCount = 2
  const operatorIds = Array.from({ length: 8 }, (_, i) => i + 175)
  const kg = new KeyGen()
  const keys = await kg.createKeys({ keyCount, operatorIds })
  for (const key of keys) {
    const { 
      depositDataRoot, 
      operatorIds, 
      operatorPublicKeys, 
      sharesEncrypted, 
      sharesPublicKeys, 
      signature, 
      validatorPublicKey 
    } = key

    const registration = await ssv.addValidator(
      depositDataRoot, 
      operatorIds, 
      operatorPublicKeys, 
      sharesEncrypted, 
      sharesPublicKeys, 
      signature, 
      validatorPublicKey 
    )
    await registration.wait()
  }
  return { feed, keys, owner, ssv }
}

/** Fixture to stake 16 ETH for the first user */
async function firstUserDepositFixture() {
  const { ssv, feed, owner } = await loadFixture(addValidatorsFixture)
  const [, firstUser] = await ethers.getSigners()
  const stakeAmount = 16.0
  const fees = { ...await ssv.getFees() }
  const feesTotalPercent = fees.LINK + fees.SSV
  const depositAmount = stakeAmount * ((100 + feesTotalPercent) / 100)
  const value = ethers.utils.parseEther(depositAmount.toString())
  const deposit = await ssv.connect(firstUser).deposit({ value })
  await deposit.wait()
  return { ssv, feed, firstUser, owner }
}

/** Fixture to stake 24 ETH for the second user */
async function secondUserDepositFixture() {
  const { ssv, feed, firstUser, owner } = await loadFixture(firstUserDepositFixture)
  const [, , secondUser] = await ethers.getSigners()
  const stakeAmount = 24.0
  const fees = { ...await ssv.getFees() }
  const feesTotalPercent = fees.LINK + fees.SSV
  const depositAmount = stakeAmount * ((100 + feesTotalPercent) / 100)
  const value = ethers.utils.parseEther(depositAmount.toString())
  const deposit = await ssv.connect(secondUser).deposit({ value })
  await deposit.wait()
  return { ssv, feed, firstUser, owner, secondUser }
}

/** Fixture to stake 24 ETH for the third user */
async function thirdUserDepositFixture() {
  const { ssv, firstUser, owner, secondUser } = await loadFixture(secondUserDepositFixture)
  const [, , , thirdUser] = await ethers.getSigners()
  const stakeAmount = 24.0
  const fees = { ...await ssv.getFees() }
  const feesTotalPercent = fees.LINK + fees.SSV
  const depositAmount = stakeAmount * ((100 + feesTotalPercent) / 100)
  const value = ethers.utils.parseEther(depositAmount.toString())
  const deposit = await ssv.connect(thirdUser).deposit({ value })
  await deposit.wait()
  return { ssv, firstUser, owner, secondUser, thirdUser }
}

// /** Fixture to report rewards (mini feed test) */
// async function rewardsFixture() {
//   const { ssv } = await loadFixture(thirdUserDepositFixture)
//   const activeValidatorPublicKeys = await ssv.getActiveValidatorPublicKeys()
//   const response = await fetch(`https://prater.beaconcha.in/api/v1/validator/${activeValidatorPublicKeys.join(',')}`)
//   const { data } = await response.json()
//   data.forEach((v: { balance: any; effectiveBalance: any; status: any }) => {
//     const { balance, effectiveBalance, status } = v
//     console.log(balance, effectiveBalance, status)
//   })
//   // Todo write to contract for mini feed test
// }

describe('SSV manager', async function () {

  it('Registration adds 2 validators', async function () {
    const { keys } = await loadFixture(addValidatorsFixture)
    console.log(keys)
    expect(keys.length).equal(2)
  })

  // it('First user\'s 16 ETH stake opens the first pool', async function () {
  //   const { ssv, owner } = await loadFixture(firstUserDepositFixture)
  //   const ssvOwnerAddress = await ssv.signer.getAddress()
  //   expect(ssvOwnerAddress).equal(owner.address)
  //   const openPools = await ssv.getOpenPoolIds()
  //   expect(openPools.length).equal(1)
  // })

  // it('First user\'s 16 ETH stake increases the first pool\'s balance to 16 ETH', async function () {
  //   const { ssv } = await loadFixture(firstUserDepositFixture)
  //   const [firstPool] = await ssv.getOpenPoolIds()
  //   const poolBalance = await ssv.getPoolBalance(firstPool)
  //   const stakeAmount = ethers.utils.formatEther({ ...poolBalance }.stake)
  //   expect(stakeAmount).equal('16.0')
  // })

  // it('First user\'s 16 ETH stake increases first user\'s balance in the first pool to 16 ETH', async function () {
  //   const { ssv, firstUser } = await loadFixture(firstUserDepositFixture)
  //   const [firstPool] = await ssv.getOpenPoolIds()
  //   const poolUserBalance = await ssv.getPoolUserBalance(firstPool, firstUser.address)
  //   const stakeAmount = ethers.utils.formatEther({ ...poolUserBalance }.stake)
  //   expect(stakeAmount).equal('16.0')
  // })

  // it('Second user\'s 24 ETH stake completes the first pool', async function () {
  //   const { ssv } = await loadFixture(secondUserDepositFixture)
  //   const stakedPools = await ssv.getStakedPoolIds()
  //   expect(stakedPools.length).equal(1)
  // })

  // it('Second user\'s 24 ETH stake increases the first pool\'s balance to 32 ETH', async function () {
  //   const { ssv } = await loadFixture(secondUserDepositFixture)
  //   const [firstPool] = await ssv.getStakedPoolIds()
  //   const poolBalance = await ssv.getPoolBalance(firstPool)
  //   const stakeAmount = ethers.utils.formatEther({ ...poolBalance }.stake)
  //   expect(stakeAmount).equal('32.0')
  // })

  // it('Second user\'s 24 ETH stake increases second user\'s balance in the first pool to 16 ETH', async function () {
  //   const { ssv, secondUser } = await loadFixture(secondUserDepositFixture)
  //   const [firstPool] = await ssv.getStakedPoolIds()
  //   const poolUserBalance = await ssv.getPoolUserBalance(firstPool, secondUser.address)
  //   const stakeAmount = ethers.utils.formatEther({ ...poolUserBalance }.stake)
  //   expect(stakeAmount).equal('16.0')
  // })

  // it('Second user\'s 24 ETH stake opens a second pool', async function () {
  //   const { ssv } = await loadFixture(secondUserDepositFixture)
  //   const openPools = await ssv.getOpenPoolIds()
  //   expect(openPools.length).equal(1)
  // })

  // it('Second user\'s 24 ETH stake increases the second pool\'s balance to 8 ETH', async function () {
  //   const { ssv } = await loadFixture(secondUserDepositFixture)
  //   const [secondPool] = await ssv.getOpenPoolIds()
  //   const poolBalance = await ssv.getPoolBalance(secondPool)
  //   const stakeAmount = ethers.utils.formatEther({ ...poolBalance }.stake)
  //   expect(stakeAmount).equal('8.0')
  // })

  // it('Second user\'s 24 ETH stake increases second user\'s balance in the second pool to 8 ETH', async function () {
  //   const { ssv, secondUser } = await loadFixture(secondUserDepositFixture)
  //   const [secondPool] = await ssv.getOpenPoolIds()
  //   const poolUserBalance = await ssv.getPoolUserBalance(secondPool, secondUser.address)
  //   const stakeAmount = ethers.utils.formatEther({ ...poolUserBalance }.stake)
  //   expect(stakeAmount).equal('8.0')
  // })

  // it('Third user\'s 24 ETH stake completes the second pool', async function () {
  //   const { ssv } = await loadFixture(thirdUserDepositFixture)
  //   const stakedPools = await ssv.getStakedPoolIds()
  //   expect(stakedPools.length).equal(2)
  // })

  // it('Third user\'s 24 ETH stake increases the second pool\'s balance to 32 ETH', async function () {
  //   const { ssv } = await loadFixture(thirdUserDepositFixture)
  //   const [, secondPool] = await ssv.getStakedPoolIds()
  //   const poolBalance = await ssv.getPoolBalance(secondPool)
  //   const stakeAmount = ethers.utils.formatEther({ ...poolBalance }.stake)
  //   expect(stakeAmount).equal('32.0')
  // })

  // it('Third user\'s 24 ETH stake increases third user\'s balance in the second pool to 24 ETH', async function () {
  //   const { ssv, thirdUser } = await loadFixture(thirdUserDepositFixture)
  //   const [, secondPool] = await ssv.getStakedPoolIds()
  //   const poolUserBalance = await ssv.getPoolUserBalance(secondPool, thirdUser.address)
  //   const stakeAmount = ethers.utils.formatEther({ ...poolUserBalance }.stake)
  //   expect(stakeAmount).equal('24.0')
  // })

  // it('Third user\'s 24 ETH stake does not open a third pool', async function () {
  //   const { ssv } = await loadFixture(thirdUserDepositFixture)
  //   const openPools = await ssv.getOpenPoolIds()
  //   expect(openPools.length).equal(0)
  // })

  // it('First pool\'s validator public key exists', async function () {
  //   const { ssv } = await loadFixture(thirdUserDepositFixture)
  //   const [firstPool] = await ssv.getStakedPoolIds()
  //   const validatorPublicKey = await ssv.getPoolValidatorPublicKey(firstPool)
  //   expect(validatorPublicKey).to.exist
  // })

  // it('First pool\'s operator ID count is 4', async function () {
  //   const { ssv } = await loadFixture(thirdUserDepositFixture)
  //   const [firstPool] = await ssv.getStakedPoolIds()
  //   const operatorIds = await ssv.getPoolOperatorIds(firstPool)
  //   expect(operatorIds.length).equal(4)
  // })

  // it('Second pool\'s validator public key exists', async function () {
  //   const { ssv } = await loadFixture(thirdUserDepositFixture)
  //   const [, secondPool] = await ssv.getStakedPoolIds()
  //   const validatorPublicKey = await ssv.getPoolValidatorPublicKey(secondPool)
  //   expect(validatorPublicKey).to.exist
  // })

  // it('Second pool\'s operator ID count is 4', async function () {
  //   const { ssv } = await loadFixture(thirdUserDepositFixture)
  //   const [, secondPool] = await ssv.getStakedPoolIds()
  //   const operatorIds = await ssv.getPoolOperatorIds(secondPool)
  //   expect(operatorIds.length).equal(4)
  // })

})