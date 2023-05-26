import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirManager } from '../build/artifacts/types'
import { validatorStore } from '@casimir/data'
import { Validator } from '@casimir/types'
import { getCluster } from '@casimir/ssv'

const mockValidators: Validator[] = Object.values(validatorStore)

const mockFee = 0.1

export async function initiatePoolDepositHandler({ manager, signer, id }: { manager: CasimirManager, signer: SignerWithAddress, id: number }) {
    const {
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
        cluster: _cluster
    } = mockValidators[id]

    let cluster

    if (id === 1) {
        cluster = _cluster
    } else {
        const networkAddress = await manager.getSSVNetworkAddress()
        const withdrawalAddress = manager.address
        cluster = await getCluster({ provider: ethers.provider, networkAddress, operatorIds, withdrawalAddress })
    }

    const initiatePool = await manager.connect(signer).initiatePoolDeposit(
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
        cluster,
        ethers.utils.parseEther(mockFee.toString()) // Mock fee amount estimate ~ 10 SSV
    )
    await initiatePool.wait()
}

export async function completePoolExitHandler({ manager, signer, id }: { manager: CasimirManager, signer: SignerWithAddress, id: number }) {
    const stakedPoolIds = await manager.getStakedPoolIds()
    const poolIndex = stakedPoolIds.findIndex((poolId: number) => poolId === id)
    const pool = await manager.getPool(id)
    const operatorIds = pool.operatorIds.map((operatorId) => operatorId.toNumber())

    // Todo unhardcode
    const finalEffectiveBalance = ethers.utils.parseEther('32')
    const blamePercents = [0, 0, 0, 0]

    const networkAddress = await manager.getSSVNetworkAddress()
    const withdrawalAddress = manager.address
    const cluster = await getCluster({ provider: ethers.provider, networkAddress, operatorIds, withdrawalAddress })

    const initiatePool = await manager.connect(signer).completePoolExit(
        poolIndex,
        finalEffectiveBalance,
        blamePercents,
        cluster
    )
    await initiatePool.wait()
}