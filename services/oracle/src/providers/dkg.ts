import fs from 'fs'
import { StartKeygenInput } from '../interfaces/StartKeygenInput'
import { DepositData } from '../interfaces/DepositData'
import { DkgOptions } from '../interfaces/DkgOptions'
import { StartReshareInput } from '../interfaces/StartReshareInput'
import { getWithdrawalCredentials, run, runRetry } from '@casimir/helpers'
import { CreateValidatorInput } from '../interfaces/CreateValidatorInput'
import { Validator } from '@casimir/types'
import { ReshareValidatorInput } from '../interfaces/ReshareValidatorInput'
import { getOperatorUrls } from './registry'
import { GetDepositDataInput } from '../interfaces/GetDepositDataInput'

export class Dkg {
    cliPath: string
    messengerUrl: string

    constructor(options: DkgOptions) {
        this.cliPath = options.cliPath
        if (!options.messengerUrl) {
            throw new Error('No messenger url provided')
        }
        this.messengerUrl = options.messengerUrl
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
            const ceremonyId = await this.startKeygen({ operators, withdrawalAddress })
            
            console.log(`Started ceremony ${ceremonyId} for pool ${poolId}`)
    
            await new Promise(resolve => setTimeout(resolve, 2500))
    
            const shares = await this.getShares(ceremonyId)
            const { depositDataRoot, publicKey, signature, withdrawalCredentials } = await this.getDepositData({ ceremonyId, withdrawalAddress })
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

    /** 
     * Reshare validator for new operator key shares and deposit data
     * @param {ReshareValidatorInput} input - Input for resharing a validator
     * @returns {Promise<Validator>} Validator with operator key shares and deposit data
     */
    async reshareValidator(input: ReshareValidatorInput, retriesLeft: number | undefined = 25): Promise<Validator> {
        try {
            const { poolId, operatorIds, publicKey, oldOperatorIds, withdrawalAddress } = input
            const operators = getOperatorUrls(operatorIds)
            const oldOperators = getOperatorUrls(oldOperatorIds)
            const ceremonyId = await this.startReshare({ operators, publicKey, oldOperators })
            
            console.log(`Started ceremony ${ceremonyId} for pool ${poolId}`)
    
            await new Promise(resolve => setTimeout(resolve, 2500))
    
            const shares = await this.getShares(ceremonyId)
            const { depositDataRoot, signature, withdrawalCredentials } = await this.getDepositData({ ceremonyId, withdrawalAddress })
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
            console.log('Retrying reshare validator request')
            return await this.reshareValidator(input, retriesLeft - 1)
        }
    }

    /**
     * Start a keygen ceremony
     * @param {StartKeygenInput} input - Keygen input
     * @returns {Promise<string>} Ceremony ID
     */
    async startKeygen(input: StartKeygenInput): Promise<string> {
        const { operators, withdrawalAddress } = input
        const operatorFlags = Object.entries(operators).map(([id, url]) => `--operator ${id}=${url}`).join(' ')
        const thresholdFlag = `--threshold ${Object.keys(operators).length - 1}`
        const withdrawalCredentialsFlag = `--withdrawal-credentials ${getWithdrawalCredentials(withdrawalAddress)}`
        const forkVersionFlag = '--fork-version prater'
        const command = `${this.cliPath} keygen ${operatorFlags} ${thresholdFlag} ${withdrawalCredentialsFlag} ${forkVersionFlag}`
        const ceremony = await run(`${command}`) as string
        return ceremony.trim().split(' ').pop() as string
    }

    /**
     * Start a reshare ceremony
     * @param {StartReshareInput} input - Operator IDs, public key, and old operator IDs
     * @returns {Promise<string>} Ceremony ID
     */
    async startReshare(input: StartReshareInput): Promise<string> {
        const { operators, publicKey, oldOperators } = input
        const operatorFlags = Object.entries(operators).map(([id, url]) => `--operator ${id}=${url}`).join(' ')
        const thresholdFlag = `--threshold ${Object.keys(operators).length - 1}`
        const publicKeyFlag = `--validator-public-key ${publicKey}`
        const oldOperatorFlags = Object.entries(oldOperators).map(([id, url]) => `--old-operator ${id}=${url}`).join(' ')
        const command = `${this.cliPath} reshare ${operatorFlags} ${thresholdFlag} ${publicKeyFlag} ${oldOperatorFlags}`
        const ceremony = await runRetry(`${command}`) as string
        return ceremony.trim().split(' ').pop() as string
    }

    /**
     * Get combined shares
     * @param {string} ceremonyId - Ceremony ID
     * @returns {Promise<string>} Combined shares
     */
    async getShares(ceremonyId: string): Promise<string> {
        const requestIdFlag = `--request-id ${ceremonyId}`
        const command = `${this.cliPath} get-keyshares ${requestIdFlag}`
        const download = await runRetry(`${command}`) as string
        const file = download.trim().split(' ').pop() as string
        const json = JSON.parse(fs.readFileSync(`${file}`, 'utf8'))
        fs.rmSync(file)
        return json.payload.readable.shares
    }

    /**
     * Get deposit data
     * @param {GetDepositDataInput} input - Ceremony ID and withdrawal address
     * @returns {Promise<DepositData>} Deposit data
     */
    async getDepositData(input: GetDepositDataInput): Promise<DepositData> {
        const { ceremonyId, withdrawalAddress } = input
        const requestIdFlag = `--request-id ${ceremonyId}`
        const withdrawalCredentialsFlag = `--withdrawal-credentials 01${'0'.repeat(22)}${withdrawalAddress.split('0x')[1]}`
        const forkVersionFlag = '--fork-version prater'
        const command = `${this.cliPath} generate-deposit-data ${requestIdFlag} ${withdrawalCredentialsFlag} ${forkVersionFlag}`
        const download = await runRetry(`${command}`) as string
        const file = download.trim().split(' ').pop() as string
        const json = JSON.parse(fs.readFileSync(file, 'utf8'))
        fs.rmSync(file)
        const {
            deposit_data_root: depositDataRoot,
            pubkey: publicKey,
            signature,
            withdrawal_credentials: withdrawalCredentials
        } = json
        return {
            depositDataRoot: `0x${depositDataRoot}`,
            publicKey: `0x${publicKey}`,
            signature: `0x${signature}`,
            withdrawalCredentials: `0x${withdrawalCredentials}`
        }
    }
}