import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { deployContract } from '@casimir/hardhat'
import { SSVManager } from '../../build/artifacts/types'
import { ContractConfig, DeploymentConfig, Validator } from '@casimir/types'
import { validatorStore } from '@casimir/data'

/** Fixture to deploy SSV manager contract */
export async function deploymentFixture() {
    let ssvManager: SSVManager | undefined
    const [owner, , , , distributor] = await ethers.getSigners()
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
                wethTokenAddress: process.env.WETH_TOKEN_ADDRESS,
                compound: process.env.COMPOUND !== 'false'
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
        if (name === 'SSVManager') ssvManager = contract as SSVManager
    }

    return { ssvManager: ssvManager as SSVManager, owner, distributor }
}

/** Fixture to add validators */
export async function addValidatorsFixture() {
    const { ssvManager, owner, distributor } = await loadFixture(deploymentFixture)
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
    return { ssvManager, owner, distributor, validators }
}

/** Fixture to stake 16 ETH for the first user */
export async function firstUserDepositFixture() {
    const { ssvManager, owner, distributor } = await loadFixture(addValidatorsFixture)
    const [, firstUser] = await ethers.getSigners()
    const stakeAmount = 16.0
    const fees = { ...await ssvManager.getFees() }
    const feePercent = fees.LINK + fees.SSV
    const depositAmount = stakeAmount * ((100 + feePercent) / 100)
    const value = ethers.utils.parseEther(depositAmount.toString())
    const deposit = await ssvManager.connect(firstUser).deposit({ value })
    await deposit.wait()
    return { ssvManager, owner, distributor, firstUser}
}

/** Fixture to stake 24 ETH for the second user */
export async function secondUserDepositFixture() {
    const { ssvManager, owner, distributor, firstUser } = await loadFixture(firstUserDepositFixture)
    const [, , secondUser] = await ethers.getSigners()
    const stakeAmount = 24.0
    const fees = { ...await ssvManager.getFees() }
    const feePercent = fees.LINK + fees.SSV
    const depositAmount = stakeAmount * ((100 + feePercent) / 100)
    const value = ethers.utils.parseEther(depositAmount.toString())
    const deposit = await ssvManager.connect(secondUser).deposit({ value })
    await deposit.wait()
    return { ssvManager, owner, distributor, firstUser, secondUser }
}

/** Fixture to reward 0.1 * validator count to the first and second user */
export async function rewardPostSecondUserDepositFixture() {
    const { ssvManager, owner, distributor, firstUser, secondUser } = await loadFixture(secondUserDepositFixture)
    const stakedValidatorPublicKeys = await ssvManager?.getStakedValidatorPublicKeys()
    if (stakedValidatorPublicKeys?.length) {
        const rewardAmount = (0.1 * stakedValidatorPublicKeys.length).toString()
        const reward = await distributor.sendTransaction({ to: ssvManager?.address, value: ethers.utils.parseEther(rewardAmount) })
        await reward.wait()
    }
    return { ssvManager, owner, distributor, firstUser, secondUser }
}

/** Fixture to stake 24 ETH for the third user */
export async function thirdUserDepositFixture() {
    const { ssvManager, owner, distributor, firstUser, secondUser } = await loadFixture(rewardPostSecondUserDepositFixture)
    const [, , , thirdUser] = await ethers.getSigners()
    const stakeAmount = 24.0
    const fees = { ...await ssvManager.getFees() }
    const feePercent = fees.LINK + fees.SSV
    const depositAmount = stakeAmount * ((100 + feePercent) / 100)
    const value = ethers.utils.parseEther(depositAmount.toString())
    const deposit = await ssvManager.connect(thirdUser).deposit({ value })
    await deposit.wait()
    return { ssvManager, owner, distributor, firstUser, secondUser, thirdUser }
}

/** Fixture to reward 0.1 * validator count to the first, second, and third user */
export async function rewardPostThirdUserDepositFixture() {
    const { ssvManager, distributor, firstUser, secondUser, thirdUser } = await loadFixture(thirdUserDepositFixture)
    const stakedValidatorPublicKeys = await ssvManager?.getStakedValidatorPublicKeys()
    if (stakedValidatorPublicKeys?.length) {
        const rewardAmount = (0.1 * stakedValidatorPublicKeys.length).toString()
        const reward = await distributor.sendTransaction({ to: ssvManager?.address, value: ethers.utils.parseEther(rewardAmount) })
        await reward.wait()
    }
    return { ssvManager, distributor, firstUser, secondUser, thirdUser }
}

/** Fixture to reward users a few more times */
export async function simulationFixture() {
    const { ssvManager, distributor, firstUser, secondUser, thirdUser } = await loadFixture(rewardPostThirdUserDepositFixture)
    const stakedValidatorPublicKeys1 = await ssvManager?.getStakedValidatorPublicKeys()
    if (stakedValidatorPublicKeys1?.length) {
        const rewardAmount = (0.1 * stakedValidatorPublicKeys1.length).toString()
        const reward = await distributor.sendTransaction({ to: ssvManager?.address, value: ethers.utils.parseEther(rewardAmount) })
        await reward.wait()

        const balance = await ssvManager.getBalance()
        const firstBalance = await ssvManager.getUserBalance(firstUser.address)
        const secondBalance = await ssvManager.getUserBalance(secondUser.address)
        const thirdBalance = await ssvManager.getUserBalance(thirdUser.address)
        const { stake } = ({ ...balance })
        const { stake: firstStake } = ({ ...firstBalance })
        const { stake: secondStake } = ({ ...secondBalance })
        const { stake: thirdStake } = ({ ...thirdBalance })
        console.log('DUST', ethers.utils.formatEther(stake.sub(firstStake.add(secondStake).add(thirdStake))))
    }

    const stakedValidatorPublicKeys2 = await ssvManager?.getStakedValidatorPublicKeys()
    if (stakedValidatorPublicKeys2?.length) {
        const rewardAmount = (0.1 * stakedValidatorPublicKeys2.length).toString()
        const reward = await distributor.sendTransaction({ to: ssvManager?.address, value: ethers.utils.parseEther(rewardAmount) })
        await reward.wait()

        const balance = await ssvManager.getBalance()
        const firstBalance = await ssvManager.getUserBalance(firstUser.address)
        const secondBalance = await ssvManager.getUserBalance(secondUser.address)
        const thirdBalance = await ssvManager.getUserBalance(thirdUser.address)
        const { stake } = ({ ...balance })
        const { stake: firstStake } = ({ ...firstBalance })
        const { stake: secondStake } = ({ ...secondBalance })
        const { stake: thirdStake } = ({ ...thirdBalance })
        console.log('DUST', ethers.utils.formatEther(stake.sub(firstStake.add(secondStake).add(thirdStake))))
    }

    const stakedValidatorPublicKeys3 = await ssvManager?.getStakedValidatorPublicKeys()
    if (stakedValidatorPublicKeys3?.length) {
        const rewardAmount = (0.1 * stakedValidatorPublicKeys3.length).toString()
        const reward = await distributor.sendTransaction({ to: ssvManager?.address, value: ethers.utils.parseEther(rewardAmount) })
        await reward.wait()

        const balance = await ssvManager.getBalance()
        const firstBalance = await ssvManager.getUserBalance(firstUser.address)
        const secondBalance = await ssvManager.getUserBalance(secondUser.address)
        const thirdBalance = await ssvManager.getUserBalance(thirdUser.address)
        const { stake } = ({ ...balance })
        const { stake: firstStake } = ({ ...firstBalance })
        const { stake: secondStake } = ({ ...secondBalance })
        const { stake: thirdStake } = ({ ...thirdBalance })
        console.log('DUST', ethers.utils.formatEther(stake.sub(firstStake.add(secondStake).add(thirdStake))))
    }

    return { ssvManager, distributor, firstUser, secondUser, thirdUser }
}