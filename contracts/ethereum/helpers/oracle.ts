import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirManager } from '../build/artifacts/types'
import { validatorStore } from '@casimir/data'
import { Validator } from '@casimir/types'

const mockValidators: Validator[] = Object.values(validatorStore)

export async function initiatePool({ manager, oracle, index }: { manager: CasimirManager, oracle: SignerWithAddress, index: number }) {
    const {
        depositDataRoot,
        publicKey,
        operatorIds,
        sharesEncrypted,
        sharesPublicKeys,
        signature,
        withdrawalCredentials
    } = mockValidators[index]
    const initiatePool = await manager.connect(oracle).initiateNextReadyPool(
        depositDataRoot,
        publicKey,
        operatorIds,
        sharesEncrypted,
        sharesPublicKeys,
        signature,
        withdrawalCredentials
    )
    await initiatePool.wait()
}