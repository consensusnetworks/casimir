import fs from 'fs'
import { StartKeygenInput } from '../interfaces/StartKeygenInput'
import { DepositData } from '../interfaces/DepositData'
import { StartReshareInput } from '../interfaces/StartReshareInput'
import { run } from '@casimir/shell'
import { CreateValidatorInput } from '../interfaces/CreateValidatorInput'
import { Reshare, Validator } from '@casimir/types'
import { ReshareValidatorInput } from '../interfaces/ReshareValidatorInput'

export class Dkg {
    cliPath: string

    constructor(cliPath: string) {
        this.cliPath = cliPath
    }

    /** 
     * Create a new validator
     * @param {CreateValidatorInput} input - Create validator input
     * @param {number} retries - Number of retries
     * @returns {Promise<Validator>} New validator
     */
    async createValidator(input: CreateValidatorInput, retries: number | undefined = 25): Promise<Validator> {
        try {
            const requestId = await this.startKeygen({ 
                operatorIds: input.operatorIds,
                ownerAddress: input.ownerAddress,
                ownerNonce: input.ownerNonce,
                poolId: input.poolId,
                withdrawalAddress: input.withdrawalAddress 
            })
            
            console.log(`Started request ${requestId} for pool ${input.poolId}`)
    
            await new Promise(resolve => setTimeout(resolve, 5000))
    
            const shares = await this.getShares(requestId)
    
            const depositData = await this.getDepositData(requestId)

            const validator: Validator = {
                depositDataRoot: depositData.depositDataRoot,
                publicKey: depositData.publicKey,
                operatorIds: input.operatorIds,
                shares,
                signature: depositData.signature,
                withdrawalCredentials: depositData.withdrawalCredentials
            }

            return validator
        } catch (error) {
            if (retries === 0) {
                throw error
            }
            await new Promise(resolve => setTimeout(resolve, 2500))
            console.log(`Retrying create validator request ${retries} more times`)
            return await this.createValidator(input, retries - 1)
        }
    }

    /** 
     * Reshare a validator
     * @param {ReshareValidatorInput} input - Reshare validator input
     * @param {number} retries - Number of retries
     * @returns {Promise<Reshare>} Reshared validator
     */
    async reshareValidator(input: ReshareValidatorInput, retries: number | undefined = 25): Promise<Reshare> {
        try {
            const requestId = await this.startReshare({ 
                oldOperatorIds: input.oldOperatorIds,
                operatorIds: input.operatorIds,
                poolId: input.poolId,
                publicKey: input.publicKey
            })
            
            console.log(`Started request ${requestId} for pool ${input.poolId}`)
    
            await new Promise(resolve => setTimeout(resolve, 2500))
    
            const shares = await this.getShares(requestId)
    
            return {
                oldOperatorIds: input.oldOperatorIds,
                operatorIds: input.operatorIds,
                poolId: input.poolId,
                publicKey: input.publicKey,
                shares
            }    
        } catch (error) {
            if (retries === 0) {
                throw error
            }
            await new Promise(resolve => setTimeout(resolve, 2500))
            console.log(`Retrying reshare validator request ${retries} more times`)
            return await this.reshareValidator(input, retries - 1)
        }
    }

    /**
     * Start a keygen request
     * @param {StartKeygenInput} input - Start keygen input
     * @returns {Promise<string>} Request ID
     */
    async startKeygen(input: StartKeygenInput): Promise<string> {
        const requestId = `keygen-${input.poolId}-${Date.now()}`
        const flags = [
            `--operatorIDs ${input.operatorIds.join(',')}`,
            '--operatorsInfoPath ./config/operators.info.json',
            `--owner ${input.ownerAddress}`,
            `--nonce ${input.ownerNonce}`,
            `--withdrawAddress ${input.withdrawalAddress.split('0x')[1]}`,
            '--fork 00001020',
            `--depositResultsPath ./data/${requestId}-deposit.json`,
            `--ssvPayloadResultsPath ./data/${requestId}-payload.json`
        ]

        const command = `${this.cliPath} init-dkg ${flags.join(' ')}`
        const response = await run(`${command}`) as string
        console.log(response)

        return requestId
    }

    /**
     * Start a reshare request
     * @param {StartReshareInput} input - Start reshare input
     * @returns {Promise<string>} Request ID
     */
    async startReshare(input: StartReshareInput): Promise<string> {
        const requestId = `reshare-${input.poolId}-${Date.now()}`
        const flags = [
            `--oldOperatorIDs ${input.oldOperatorIds.join(',')}`,
            `--operatorIDs ${input.operatorIds.join(',')}`,
            '--operatorsInfoPath ./config/operators.info.json',
            '--fork 00001020',
            `--ssvPayloadResultsPath ./data/${requestId}-payload.json`
        ]

        const command = `${this.cliPath} init-reshare ${flags.join(' ')}`
        const response = await run(`${command}`) as string
        console.log(response)

        return requestId
    }

    /**
     * Get combined shares
     * @param {string} requestId - Request ID
     * @returns {Promise<string>} Combined shares
     */
    async getShares(requestId: string): Promise<string> {
        const filename = `./data/${requestId}-payload.json`
        const { payload } = JSON.parse(fs.readFileSync(`${filename}`, 'utf8'))

        return payload.readable.shares
    }

    /**
     * Get deposit data
     * @param {string} requestId - Request ID
     * @returns {Promise<DepositData>} Deposit data
     */
    async getDepositData(requestId: string): Promise<DepositData> {
        const filename = `./data/${requestId}-deposit.json`
        const deposit = JSON.parse(fs.readFileSync(filename, 'utf8'))

        const {
            deposit_data_root: depositDataRoot,
            pubkey: publicKey,
            signature,
            withdrawal_credentials: withdrawalCredentials
        } = deposit[0]

        return {
            depositDataRoot: `0x${depositDataRoot}`,
            publicKey: `0x${publicKey}`,
            signature: `0x${signature}`,
            withdrawalCredentials: `0x${withdrawalCredentials}`
        }
    }
}
