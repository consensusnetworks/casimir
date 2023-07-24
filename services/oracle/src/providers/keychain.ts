import { Validator } from '@casimir/types'
import { CreateValidatorInput } from '../interfaces/CreateValidatorInput'
import { KeychainOptions } from '../interfaces/KeychainOptions'
import { Dkg } from './dkg'
// import { Ethdo } from './ethdo'
import { getOperatorUrls } from './registry'

export class Keychain {
    bridge: Dkg // | Ethdo

    constructor(options: KeychainOptions) {
        /*if (options.strategy === 'dkg') {*/
            if (!options.messengerUrl) {
                throw new Error('No messenger url provided')
            }
            this.bridge = new Dkg({
                cliPath: options.cliPath,
                messengerUrl: options.messengerUrl
            })
        /*} else {
            this.bridge = new Ethdo({
                cliPath: options.cliPath
            })
        }*/
    }

    /** 
     * Create validator with operator key shares and deposit data
     * @param {CreateValidatorInput} input - Input for creating a validator
     * @returns {Promise<Validator>} Validator with operator key shares and deposit data
     */
    async createValidator(input: CreateValidatorInput, retriesLeft: number | undefined = 25): Promise<Validator> {
        try {
            const { poolId, operatorIds, withdrawalAddress } = input
            const operators = getOperatorUrls(operatorIds)
            const ceremonyId = await this.bridge.startKeygen({ operators, withdrawalAddress })
            
            console.log(`Started ceremony ${ceremonyId} for pool ${poolId}`)
    
            await new Promise(resolve => setTimeout(resolve, 2500))
    
            const shares = await this.bridge.getShares(ceremonyId)
            const { depositDataRoot, publicKey, signature, withdrawalCredentials } = await this.bridge.getDepositData({ ceremonyId, withdrawalAddress })
            const validator: Validator = {
                depositDataRoot,
                publicKey,
                operatorIds,
                shares,
                signature,
                withdrawalCredentials
            }
            return validator
        } catch (error) {
            console.log(error)
            await new Promise(resolve => setTimeout(resolve, 2500))
            console.log('Retrying create validator request')
            return await this.createValidator(input, retriesLeft - 1)
        }
    }        
}