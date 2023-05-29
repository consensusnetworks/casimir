import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirManager } from '../build/artifacts/types'
import { validatorStore } from '@casimir/data'
import { Validator } from '@casimir/types'
import { getCluster } from '@casimir/ssv'

const mockValidators: Validator[] = Object.values(validatorStore)

const mockFee = 0.1

export async function initiatePoolDepositHandler({ manager, signer, args }: { manager: CasimirManager, signer: SignerWithAddress, args: Record<string, any> }) {
    const { poolId } = args

    const {
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
        cluster: _cluster
    } = mockValidators[poolId - 1]

    let cluster

    if (poolId === 1) {
        cluster = _cluster
    } else {
        const networkAddress = await manager.getSSVNetworkAddress()
        const withdrawalAddress = manager.address
        cluster = await getCluster({ provider: ethers.provider, networkAddress, operatorIds, withdrawalAddress })
    }

    const initiatePoolDeposit = await manager.connect(signer).initiatePoolDeposit(
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
        cluster,
        ethers.utils.parseEther(mockFee.toString()) // Mock fee amount estimate ~ 10 SSV
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

    const networkAddress = await manager.getSSVNetworkAddress()
    const withdrawalAddress = manager.address
    const cluster = await getCluster({ provider: ethers.provider, networkAddress, operatorIds, withdrawalAddress })

    const completePoolExit = await manager.connect(signer).completePoolExit(
        poolIndex,
        finalEffectiveBalance,
        blamePercents,
        cluster
    )
    await completePoolExit.wait()
}