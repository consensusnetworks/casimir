import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirManager } from '../build/artifacts/types'
import { validatorStore } from '@casimir/data'
import { Validator } from '@casimir/types'
import { getCluster } from '@casimir/ssv'

const mockValidators: Validator[] = Object.values(validatorStore)

const mockFee = 0.1

export async function initiatePoolDepositHandler({ manager, signer, index }: { manager: CasimirManager, signer: SignerWithAddress, index: number }) {
    const {
        depositDataRoot,
        publicKey,
        operatorIds,
        shares,
        signature,
        withdrawalCredentials
    } = mockValidators[index]

    const networkAddress = await manager.getSSVNetworkAddress()
    const withdrawalAddress = manager.address
    const cluster = await getCluster({ provider: ethers.provider, networkAddress, operatorIds, withdrawalAddress })

    const initiatePool = await manager.connect(signer).initiatePoolDeposit(
        depositDataRoot,
        publicKey,
        operatorIds,
        shares,
        cluster,
        signature,
        withdrawalCredentials,
        ethers.utils.parseEther(mockFee.toString()) // Mock fee amount estimate ~ 10 SSV
    )
    await initiatePool.wait()
}