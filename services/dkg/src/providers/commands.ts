import { ethers } from 'ethers'
import { CasimirManager } from '@casimir/ethereum/build/artifacts/types'
import { DKG } from './dkg'

export async function initiatePoolDepositCommand({
    manager,
    signer,
    messengerUrl
}: {
    manager: CasimirManager,
    signer: ethers.Signer,
    messengerUrl: string
}) {
    const group = [1, 2, 3, 4]
    const ssv = new DKG({ messengerUrl })
    const validator = await ssv.createValidator({ operatorIds: group })
    const {
        depositDataRoot,
        publicKey,
        operatorIds,
        sharesEncrypted,
        sharesPublicKeys,
        signature,
        withdrawalCredentials
    } = validator
    const initiatePoolDeposit = await manager.connect(signer).initiatePoolDeposit(
        depositDataRoot,
        publicKey,
        operatorIds,
        sharesEncrypted,
        sharesPublicKeys,
        signature,
        withdrawalCredentials,
        ethers.utils.parseEther('0.1') // Mock fee amount estimate ~ 10 SSV
    )
    await initiatePoolDeposit.wait()
}

export async function initiatePoolExitCommand({ manager, messengerUrl, id }: { manager: CasimirManager, messengerUrl: string, id: number }) {
    // Get pool to exit
    const pool = await manager.getPool(id)
    const { publicKey, operatorIds } = pool

    // Get operators to sign exit
    const ssv = new DKG({ messengerUrl })

    // Broadcast exit signature

}