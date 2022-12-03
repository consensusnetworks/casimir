import { deployContract } from '@casimir/hardhat-helpers'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { MockOracle, SSVManager } from '../build/artifacts/types'
import { ContractConfig, SSVDeploymentConfig } from '@casimir/types'

/** Fixture to deploy SSV manager contract */
async function deploymentFixture() {
  let ssv, oracle
  const [owner] = await ethers.getSigners()
  const mockChainlink = process.env.MOCK_CHAINLINK === 'true'
  let deploymentConfig: SSVDeploymentConfig = {
    SSVManager: {
      address: '',
      args: {
        linkOracleAddress: process.env.LINK_ORACLE_ADDRESS,
        swapRouterAddress: process.env.SWAP_ROUTER_ADDRESS,
        linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
        ssvTokenAddress: process.env.SSV_TOKEN_ADDRESS,
        wethTokenAddress: process.env.WETH_TOKEN_ADDRESS
      },
      options: {},
      proxy: false
    }
  }

  const chainlinkDeploymentConfig = {
    MockOracle: {
      address: '',
      args: {
        linkTokenAddress: process.env.LINK_TOKEN_ADDRESS
      },
      options: {},
      proxy: false
    }
  }

  if (mockChainlink) {
    deploymentConfig = {
      // Deploy Chainlink contracts first
      ...chainlinkDeploymentConfig,
      ...deploymentConfig
    }
  }

  for (const name in deploymentConfig) {
    console.log(`Deploying ${name} contract...`)
    const { args, options, proxy } = deploymentConfig[name as keyof typeof deploymentConfig] as ContractConfig

    // Update SSVManager args with MockOracle address
    if (name === 'SSVManager') {
      args.linkOracleAddress = deploymentConfig.MockOracle?.address
    }

    const contract = await deployContract(name, proxy, args, options)
    const { address } = contract

    // Semi-colon needed
    console.log(`${name} contract deployed to ${address}`);

    // Save contract address for next loop
    (deploymentConfig[name as keyof SSVDeploymentConfig] as ContractConfig).address = address
    
    // Save mock oracle for export
    if (name === 'MockOracle') oracle = contract

    // Save SSV manager for export
    if (name === 'SSVManager') ssv = contract
  }
  return { ssv: ssv as SSVManager, oracle: oracle as MockOracle, owner }
}

/** Fixture to stake 16 ETH for the first user */
async function firstUserDepositFixture() {
  const { ssv, oracle, owner } = await loadFixture(deploymentFixture)
  const [, firstUser] = await ethers.getSigners()
  const stakeAmount = 16.0
  const fees = { ...await ssv.getFees() }
  const feesTotalPercent = fees.LINK + fees.SSV
  const depositAmount = stakeAmount * ((100 + feesTotalPercent) / 100)
  const value = ethers.utils.parseEther(depositAmount.toString())
  const deposit = await ssv.connect(firstUser).deposit({ value })
  await deposit.wait()
  return { ssv, oracle, firstUser, owner }
}

/** Fixture to stake 24 ETH for the second user */
async function secondUserDepositFixture() {
  const { ssv, oracle, firstUser, owner } = await loadFixture(firstUserDepositFixture)
  const [, , secondUser] = await ethers.getSigners()
  const stakeAmount = 24.0
  const fees = { ...await ssv.getFees() }
  const feesTotalPercent = fees.LINK + fees.SSV
  const depositAmount = stakeAmount * ((100 + feesTotalPercent) / 100)
  const value = ethers.utils.parseEther(depositAmount.toString())
  const deposit = await ssv.connect(secondUser).deposit({ value })
  await deposit.wait()
  return { ssv, oracle, firstUser, owner, secondUser }
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

describe('Mock oracle', async function () {
  it('Request should fulfill with provided value', async function () {
    const { ssv, oracle, owner } = await loadFixture(firstUserDepositFixture)
    const transaction = await ssv.connect(owner).requestValidatorInit()
    const transactionReceipt = await transaction.wait(1)
    const requestId = transactionReceipt.events?.[0].topics[1]
    const callbackValue = 777
    await oracle.fulfillOracleRequest(requestId as string, ethers.utils.hexZeroPad(ethers.utils.hexlify(callbackValue), 32))
    const data = await ssv.data()
    expect(data.toString()).equal(callbackValue.toString())
  })
})

describe('SSV manager', async function () {

  it('First user\'s 16 ETH stake should open the first pool', async function () {
    const { ssv, owner } = await loadFixture(firstUserDepositFixture)
    const ssvOwnerAddress = await ssv.signer.getAddress()
    expect(ssvOwnerAddress).equal(owner.address)
    const openPools = await ssv.getOpenPoolIds()
    expect(openPools.length).equal(1)
  })

  it('First user\'s 16 ETH stake should increase the first pool\'s balance to 16 ETH', async function () {
    const { ssv } = await loadFixture(firstUserDepositFixture)
    const [firstPool] = await ssv.getOpenPoolIds()
    const poolBalance = await ssv.getPoolBalance(firstPool)
    const stakeAmount = ethers.utils.formatEther({ ...poolBalance }.stake)
    expect(stakeAmount).equal('16.0')
  })

  it('First user\'s 16 ETH stake should increase first user\'s balance in the first pool to 16 ETH', async function () {
    const { ssv, firstUser } = await loadFixture(firstUserDepositFixture)
    const [firstPool] = await ssv.getOpenPoolIds()
    const poolUserBalance = await ssv.getPoolUserBalance(firstPool, firstUser.address)
    const stakeAmount = ethers.utils.formatEther({ ...poolUserBalance }.stake)
    expect(stakeAmount).equal('16.0')
  })

  it('Second user\'s 24 ETH stake should complete the first pool', async function () {
    const { ssv } = await loadFixture(secondUserDepositFixture)
    const stakedPools = await ssv.getStakedPoolIds()
    expect(stakedPools.length).equal(1)
  })

  it('Second user\'s 24 ETH stake should increase the first pool\'s balance to 32 ETH', async function () {
    const { ssv } = await loadFixture(secondUserDepositFixture)
    const [firstPool] = await ssv.getStakedPoolIds()
    const poolBalance = await ssv.getPoolBalance(firstPool)
    const stakeAmount = ethers.utils.formatEther({ ...poolBalance }.stake)
    expect(stakeAmount).equal('32.0')
  })

  it('Second user\'s 24 ETH stake should increase second user\'s balance in the first pool to 16 ETH', async function () {
    const { ssv, secondUser } = await loadFixture(secondUserDepositFixture)
    const [firstPool] = await ssv.getStakedPoolIds()
    const poolUserBalance = await ssv.getPoolUserBalance(firstPool, secondUser.address)
    const stakeAmount = ethers.utils.formatEther({ ...poolUserBalance }.stake)
    expect(stakeAmount).equal('16.0')
  })

  it('Second user\'s 24 ETH stake should open a second pool', async function () {
    const { ssv } = await loadFixture(secondUserDepositFixture)
    const openPools = await ssv.getOpenPoolIds()
    expect(openPools.length).equal(1)
  })

  it('Second user\'s 24 ETH stake should increase the second pool\'s balance to 8 ETH', async function () {
    const { ssv } = await loadFixture(secondUserDepositFixture)
    const [secondPool] = await ssv.getOpenPoolIds()
    const poolBalance = await ssv.getPoolBalance(secondPool)
    const stakeAmount = ethers.utils.formatEther({ ...poolBalance }.stake)
    expect(stakeAmount).equal('8.0')
  })

  it('Second user\'s 24 ETH stake should increase second user\'s balance in the second pool to 8 ETH', async function () {
    const { ssv, secondUser } = await loadFixture(secondUserDepositFixture)
    const [secondPool] = await ssv.getOpenPoolIds()
    const poolUserBalance = await ssv.getPoolUserBalance(secondPool, secondUser.address)
    const stakeAmount = ethers.utils.formatEther({ ...poolUserBalance }.stake)
    expect(stakeAmount).equal('8.0')
  })

  it('Third user\'s 24 ETH stake should complete the second pool', async function () {
    const { ssv } = await loadFixture(thirdUserDepositFixture)
    const stakedPools = await ssv.getStakedPoolIds()
    expect(stakedPools.length).equal(2)
  })

  it('Third user\'s 24 ETH stake should increase the second pool\'s balance to 32 ETH', async function () {
    const { ssv } = await loadFixture(thirdUserDepositFixture)
    const [, secondPool] = await ssv.getStakedPoolIds()
    const poolBalance = await ssv.getPoolBalance(secondPool)
    const stakeAmount = ethers.utils.formatEther({ ...poolBalance }.stake)
    expect(stakeAmount).equal('32.0')
  })

  it('Third user\'s 24 ETH stake should increase third user\'s balance in the second pool to 24 ETH', async function () {
    const { ssv, thirdUser } = await loadFixture(thirdUserDepositFixture)
    const [, secondPool] = await ssv.getStakedPoolIds()
    const poolUserBalance = await ssv.getPoolUserBalance(secondPool, thirdUser.address)
    const stakeAmount = ethers.utils.formatEther({ ...poolUserBalance }.stake)
    expect(stakeAmount).equal('24.0')
  })

  it('Third user\'s 24 ETH stake should not open a third pool', async function () {
    const { ssv } = await loadFixture(thirdUserDepositFixture)
    const openPools = await ssv.getOpenPoolIds()
    expect(openPools.length).equal(0)
  })

})