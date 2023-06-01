import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirManager } from '../build/artifacts/types'
import { validatorStore } from '@casimir/data'
import { Validator } from '@casimir/types'
import { getClusterDetails } from '@casimir/ssv'

const mockValidators: Validator[] = Object.values(validatorStore)

export async function initiatePoolDepositHandler({ manager, signer, args }: { manager: CasimirManager, signer: SignerWithAddress, args: Record<string, any> }) {
    const { poolId } = args

    const {
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
    } = mockValidators[poolId - 1]

    const withdrawalAddress = manager.address
    const clusterDetails = await getClusterDetails({ 
        provider: ethers.provider,
        operatorIds,
        withdrawalAddress 
    })

    const { cluster, requiredFees } = clusterDetails

    const initiatePoolDeposit = await manager.connect(signer).initiatePoolDeposit(
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
        cluster,
        requiredFees // Mock fee amount estimate ~ 10 SSV
    )
    await initiatePoolDeposit.wait()
}

export async function completePoolExitHandler({ manager, signer }: { manager: CasimirManager, signer: SignerWithAddress }) {
    const stakedPoolIds = await manager.getStakedPoolIds()
    const exitedPoolId = stakedPoolIds[0]
    const exitedPool = await manager.getPool(exitedPoolId)
    const poolIndex = stakedPoolIds.findIndex((poolId: number) => poolId === exitedPoolId)
    const operatorIds = exitedPool.operatorIds.map((operatorId) => operatorId.toNumber())
    const finalEffectiveBalance = ethers.utils.parseEther('32')
    const blamePercents = [0, 0, 0, 0]

    const withdrawalAddress = manager.address
    const clusterDetails = await getClusterDetails({ 
        provider: ethers.provider,
        operatorIds,
        withdrawalAddress 
    })
    const { cluster } = clusterDetails

    const completePoolExit = await manager.connect(signer).completePoolExit(
        poolIndex,
        finalEffectiveBalance,
        blamePercents,
        cluster
    )
    await completePoolExit.wait()
}