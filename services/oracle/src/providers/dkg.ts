import fs from 'fs'
import { KeygenInput } from '../interfaces/KeygenInput'
import { DepositData } from '../interfaces/DepositData'
import { DKGOptions } from '../interfaces/DKGOptions'
import { ReshareInput } from '../interfaces/ReshareInput'
import { getWithdrawalCredentials, run, runRetry } from '@casimir/helpers'
import { CreateValidatorInput } from '../interfaces/CreateValidatorInput'
import { Validator } from '@casimir/types'
import { ReshareValidatorInput } from '../interfaces/ReshareValidatorInput'
import { operatorStore } from '@casimir/data'
import { DepositDataInput } from '../interfaces/DepositDataInput'

export class DKG {
    /** DKG CLI path */
    cliPath: string
    /** DKG messenger service URL */
    messengerUrl: string

    constructor(options: DKGOptions) {
        this.cliPath = options.cliPath
        this.messengerUrl = options.messengerUrl
    }

    /** 
     * Create validator with operator key shares and deposit data
     * @param {CreateValidatorInput} input - Input for creating a validator
     * @returns {Promise<Validator>} Validator with operator key shares and deposit data
     */
    async createValidator(input: CreateValidatorInput, retriesLeft: number | undefined = 25): Promise<Validator> {
        try {
            const { operatorIds, withdrawalAddress } = input
    
            const operators = this.getOperatorUrls(operatorIds)
    
            /** Start a key generation ceremony with the given operators */
            const ceremonyId = await this.startKeygen({ operators, withdrawalAddress })
            console.log(`Started ceremony with ID ${ceremonyId}`)
    
            /** Wait for ceremony to complete */
            await new Promise(resolve => setTimeout(resolve, 2500))
    
            /** Get operator key shares */
            const shares = await this.getShares(ceremonyId)
    
            /** Get validator deposit data */
            const { depositDataRoot, publicKey, signature, withdrawalCredentials } = await this.getDepositData({ ceremonyId, withdrawalAddress })
    
            /** Create validator */
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
            const { operatorIds, publicKey, oldOperatorIds, withdrawalAddress } = input
            const operators = this.getOperatorUrls(operatorIds)
            const oldOperators = this.getOperatorUrls(oldOperatorIds)
    
            /** Start a key generation ceremony with the given operators */
            const ceremonyId = await this.startReshare({ operators, publicKey, oldOperators })
            console.log(`Started ceremony with ID ${ceremonyId}`)
    
            /** Wait for ceremony to complete */
            await new Promise(resolve => setTimeout(resolve, 2500))
    
            /** Get operator key shares */
            const shares = await this.getShares(ceremonyId)
    
            /** Get validator deposit data */
            const { depositDataRoot, signature, withdrawalCredentials } = await this.getDepositData({ ceremonyId, withdrawalAddress })
    
            /** Create validator */
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
     * @param {KeygenInput} input - Keygen input
     * @returns {Promise<string>} Ceremony ID
     */
    async startKeygen(input: KeygenInput): Promise<string> {
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
     * @param {ReshareInput} input - Operator IDs, public key, and old operator IDs
     * @returns {Promise<string>} Ceremony ID
     */
    async startReshare(input: ReshareInput): Promise<string> {
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
     * @param {DepositDataInput} input - Ceremony ID and withdrawal address
     * @returns {Promise<DepositData>} Deposit data
     */
    async getDepositData(input: DepositDataInput): Promise<DepositData> {
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

    /**
     * Get operator URLs
     * @param {number[]} operatorIds - Operator IDs
     * @returns {<Record<string, string>} Operator group
     */
    getOperatorUrls(operatorIds: number[]): Record<string, string> {
        return operatorIds.reduce((group: Record<string, string>, id: number) => {
            const key = id.toString() as keyof typeof operatorStore
            group[key] = operatorStore[key]
            return group
        }, {})
    }
}