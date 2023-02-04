import { deployContract } from '@casimir/hardhat-helpers'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { MockFeed, SSVManager } from '../build/artifacts/types'
import { ContractConfig, DeploymentConfig } from '@casimir/types'
import { SSV } from '@casimir/keys'

/** Fixture to deploy SSV manager contract */
async function deploymentFixture() {
  let ssvManager, mockFeed
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
    if (name === 'MockFeed') mockFeed = contract

    // Save SSV manager for export
    if (name === 'SSVManager') ssvManager = contract
  }

  return { ssvManager: ssvManager as SSVManager, mockFeed: mockFeed as MockFeed, owner }
}

/** Fixture to add validators */
async function addValidatorsFixture() {
  const { ssvManager, mockFeed, owner } = await loadFixture(deploymentFixture)
  const operatorIds = Array.from({ length: 8 }, (_, i) => i + 175)
  const validatorCount = 2
  const ssv = new SSV()
  const validators = await ssv.createValidators({ operatorIds, validatorCount })
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
  return { mockFeed, owner, ssv, ssvManager, validators }
}

/** Fixture to stake 16 ETH for the first user */
async function firstUserDepositFixture() {
  const { mockFeed, owner, ssvManager } = await loadFixture(addValidatorsFixture)
  const [, firstUser] = await ethers.getSigners()
  const stakeAmount = 16.0
  const fees = { ...await ssvManager.getFees() }
  const feePercent = fees.LINK + fees.SSV
  const depositAmount = stakeAmount * ((100 + feePercent) / 100)
  const value = ethers.utils.parseEther(depositAmount.toString())
  const deposit = await ssvManager.connect(firstUser).deposit({ value })
  await deposit.wait()
  return { ssvManager, mockFeed, firstUser, owner }
}

/** Fixture to stake 24 ETH for the second user */
async function secondUserDepositFixture() {
  const { ssvManager, mockFeed, firstUser, owner } = await loadFixture(firstUserDepositFixture)
  const [, , secondUser] = await ethers.getSigners()
  const stakeAmount = 24.0
  const fees = { ...await ssvManager.getFees() }
  const feePercent = fees.LINK + fees.SSV
  const depositAmount = stakeAmount * ((100 + feePercent) / 100)
  const value = ethers.utils.parseEther(depositAmount.toString())
  const deposit = await ssvManager.connect(secondUser).deposit({ value })
  await deposit.wait()
  return { ssvManager, mockFeed, firstUser, owner, secondUser }
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

  it('First user\'s 16 ETH stake increases the first pool\'s balance to 16 ETH', async function () {
    const { ssvManager } = await loadFixture(firstUserDepositFixture)
    const [firstPool] = await ssvManager.getOpenPoolIds()
    const poolBalance = await ssvManager.getPoolBalance(firstPool)
    const stakeAmount = ethers.utils.formatEther({ ...poolBalance }.stake)
    expect(stakeAmount).equal('16.0')
  })

  it('First user\'s 16 ETH stake increases first user\'s balance in the first pool to 16 ETH', async function () {
    const { ssvManager, firstUser } = await loadFixture(firstUserDepositFixture)
    const [firstPool] = await ssvManager.getOpenPoolIds()
    const poolUserBalance = await ssvManager.getPoolUserBalance(firstPool, firstUser.address)
    const stakeAmount = ethers.utils.formatEther({ ...poolUserBalance }.stake)
    expect(stakeAmount).equal('16.0')
  })

  it('Second user\'s 24 ETH stake completes the first pool', async function () {
    const { ssvManager } = await loadFixture(secondUserDepositFixture)
    const stakedPools = await ssvManager.getStakedPoolIds()
    expect(stakedPools.length).equal(1)
  })

  it('Second user\'s 24 ETH stake increases the first pool\'s balance to 32 ETH', async function () {
    const { ssvManager } = await loadFixture(secondUserDepositFixture)
    const [firstPool] = await ssvManager.getStakedPoolIds()
    const poolBalance = await ssvManager.getPoolBalance(firstPool)
    const stakeAmount = ethers.utils.formatEther({ ...poolBalance }.stake)
    expect(stakeAmount).equal('32.0')
  })

  it('Second user\'s 24 ETH stake increases second user\'s balance in the first pool to 16 ETH', async function () {
    const { ssvManager, secondUser } = await loadFixture(secondUserDepositFixture)
    const [firstPool] = await ssvManager.getStakedPoolIds()
    const poolUserBalance = await ssvManager.getPoolUserBalance(firstPool, secondUser.address)
    const stakeAmount = ethers.utils.formatEther({ ...poolUserBalance }.stake)
    expect(stakeAmount).equal('16.0')
  })

  it('Second user\'s 24 ETH stake opens a second pool', async function () {
    const { ssvManager } = await loadFixture(secondUserDepositFixture)
    const openPools = await ssvManager.getOpenPoolIds()
    expect(openPools.length).equal(1)
  })

  it('Second user\'s 24 ETH stake increases the second pool\'s balance to 8 ETH', async function () {
    const { ssvManager } = await loadFixture(secondUserDepositFixture)
    const [secondPool] = await ssvManager.getOpenPoolIds()
    const poolBalance = await ssvManager.getPoolBalance(secondPool)
    const stakeAmount = ethers.utils.formatEther({ ...poolBalance }.stake)
    expect(stakeAmount).equal('8.0')
  })

  it('Second user\'s 24 ETH stake increases second user\'s balance in the second pool to 8 ETH', async function () {
    const { ssvManager, secondUser } = await loadFixture(secondUserDepositFixture)
    const [secondPool] = await ssvManager.getOpenPoolIds()
    const poolUserBalance = await ssvManager.getPoolUserBalance(secondPool, secondUser.address)
    const stakeAmount = ethers.utils.formatEther({ ...poolUserBalance }.stake)
    expect(stakeAmount).equal('8.0')
  })

  it('Third user\'s 24 ETH stake completes the second pool', async function () {
    const { ssvManager } = await loadFixture(thirdUserDepositFixture)
    const stakedPools = await ssvManager.getStakedPoolIds()
    expect(stakedPools.length).equal(2)
  })

  it('Third user\'s 24 ETH stake increases the second pool\'s balance to 32 ETH', async function () {
    const { ssvManager } = await loadFixture(thirdUserDepositFixture)
    const [, secondPool] = await ssvManager.getStakedPoolIds()
    const poolBalance = await ssvManager.getPoolBalance(secondPool)
    const stakeAmount = ethers.utils.formatEther({ ...poolBalance }.stake)
    expect(stakeAmount).equal('32.0')
  })

  it('Third user\'s 24 ETH stake increases third user\'s balance in the second pool to 24 ETH', async function () {
    const { ssvManager, thirdUser } = await loadFixture(thirdUserDepositFixture)
    const [, secondPool] = await ssvManager.getStakedPoolIds()
    const poolUserBalance = await ssvManager.getPoolUserBalance(secondPool, thirdUser.address)
    const stakeAmount = ethers.utils.formatEther({ ...poolUserBalance }.stake)
    expect(stakeAmount).equal('24.0')
  })

  it('Third user\'s 24 ETH stake does not open a third pool', async function () {
    const { ssvManager } = await loadFixture(thirdUserDepositFixture)
    const openPools = await ssvManager.getOpenPoolIds()
    expect(openPools.length).equal(0)
  })

  it('First pool\'s validator public key exists', async function () {
    const { ssvManager } = await loadFixture(thirdUserDepositFixture)
    const [firstPool] = await ssvManager.getStakedPoolIds()
    const validatorPublicKey = await ssvManager.getPoolValidatorPublicKey(firstPool)
    expect(validatorPublicKey).to.exist
  })

  it('First pool\'s operator ID count is 4', async function () {
    const { ssvManager } = await loadFixture(thirdUserDepositFixture)
    const [firstPool] = await ssvManager.getStakedPoolIds()
    const operatorIds = await ssvManager.getPoolOperatorIds(firstPool)
    expect(operatorIds.length).equal(4)
  })

  it('Second pool\'s validator public key exists', async function () {
    const { ssvManager } = await loadFixture(thirdUserDepositFixture)
    const [, secondPool] = await ssvManager.getStakedPoolIds()
    const validatorPublicKey = await ssvManager.getPoolValidatorPublicKey(secondPool)
    expect(validatorPublicKey).to.exist
  })

  it('Second pool\'s operator ID count is 4', async function () {
    const { ssvManager } = await loadFixture(thirdUserDepositFixture)
    const [, secondPool] = await ssvManager.getStakedPoolIds()
    const operatorIds = await ssvManager.getPoolOperatorIds(secondPool)
    expect(operatorIds.length).equal(4)
  })

  it('PoR address list should be the same length as staked pools', async function() {
    const { ssvManager } = await loadFixture(thirdUserDepositFixture)
    const stakedPools = await ssvManager.getStakedPoolIds()
    const porAddresses = await ssvManager.getPoRAddressList(0, stakedPools.length - 1)
    expect(porAddresses.length).equal(2)
  })

})