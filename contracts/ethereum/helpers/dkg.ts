import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirManager } from '../build/artifacts/types'
import { validatorStore } from '@casimir/data'
import { Validator } from '@casimir/types'

const mockValidators: Validator[] = Object.values(validatorStore)
const mockFee = 0.1

export async function initiatePoolDeposit({ manager, signer, index }: { manager: CasimirManager, signer: SignerWithAddress, index: number }) {
    const {
        depositDataRoot,
        publicKey,
        operatorIds,
        sharesEncrypted,
        sharesPublicKeys,
        signature,
        withdrawalCredentials
    } = mockValidators[index]
    const initiatePool = await manager.connect(signer).initiatePoolDeposit(
        depositDataRoot,
        publicKey,
        operatorIds,
        sharesEncrypted,
        sharesPublicKeys,
        signature,
        withdrawalCredentials,
        ethers.utils.parseEther(mockFee.toString()) // Mock fee amount estimate ~ 10 SSV
    )
    await initiatePool.wait()
}