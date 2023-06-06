import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirManager } from '../build/artifacts/types'
import { validatorStore } from '@casimir/data'
import { Validator } from '@casimir/types'
import { getClusterDetails } from '@casimir/ssv'
import { getWithdrawalCredentials } from '@casimir/helpers'

const mockValidators: Validator[] = Object.values(validatorStore)

export async function initiateDepositHandler({ manager, signer }: { manager: CasimirManager, signer: SignerWithAddress }) {
    const nonce = await ethers.provider.getTransactionCount(manager.address)
    const poolAddress = ethers.utils.getContractAddress({
      from: manager.address,
      nonce
    })
    const poolWithdrawalCredentials = `0x${getWithdrawalCredentials(poolAddress)}`
    const validator = mockValidators.find((validator) => validator.withdrawalCredentials === poolWithdrawalCredentials)
    if (!validator) throw new Error(`No validator found for withdrawal credentials ${poolWithdrawalCredentials}`)
    const {
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
    } = validator
    const clusterDetails = await getClusterDetails({ 
        provider: ethers.provider,
        ownerAddress: manager.address,
        operatorIds
    })
    const { cluster, requiredBalancePerValidator } = clusterDetails
    const initiateDeposit = await manager.connect(signer).initiateDeposit(
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
        cluster,
        requiredBalancePerValidator,
        false
    )
    await initiateDeposit.wait()
}

export async function reportCompletedExitsHandler({ manager, signer, args }: { manager: CasimirManager, signer: SignerWithAddress, args: Record<string, any> }) {
    const { count } = args

    // In production, we get the withdrawn exit order from the Beacon API (sorting by withdrawal epoch)
    // Here, we're just reporting them in the order they were exited
    let remaining = count
    let poolIndex = 0
    const stakedPoolIds = await manager.getStakedPoolIds()
    while (remaining > 0) {
        const poolId = stakedPoolIds[poolIndex]
        const poolDetails = await manager.getPoolDetails(poolId)
        if (poolDetails.status === 2 || poolDetails.status === 3) {
            remaining--
            const operatorIds = poolDetails.operatorIds.map((operatorId) => operatorId.toNumber())
            const blamePercents = [0, 0, 0, 0]
            const clusterDetails = await getClusterDetails({ 
                provider: ethers.provider,
                ownerAddress: manager.address,
                operatorIds
            })
            const { cluster } = clusterDetails
            const reportCompletedExit = await manager.connect(signer).reportCompletedExit(
                poolIndex,
                blamePercents,
                cluster
            )
            await reportCompletedExit.wait()
        }
        poolIndex++
    }
}