import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirManager } from '../build/artifacts/types'
import { validatorStore } from '@casimir/data'
import { Validator } from '@casimir/types'
import { getClusterDetails } from '@casimir/ssv'

const mockValidators: Validator[] = Object.values(validatorStore)

export async function initiateDepositHandler({ manager, signer, args }: { manager: CasimirManager, signer: SignerWithAddress, args: Record<string, any> }) {
    const { poolId } = args
    const {
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
    } = mockValidators[poolId - 1]
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
        requiredBalancePerValidator // Mock fee amount estimate ~ 10 SSV
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