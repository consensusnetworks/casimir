import fs from 'fs'
import { KeyGenerationInput } from '../interfaces/KeyGenerationInput'
import { DepositData } from '../interfaces/DepositData'
import { Shares } from '../interfaces/Shares'
import { DKGOptions } from '../interfaces/DKGOptions'
import { ReshareInput } from '../interfaces/ReshareInput'
import { getWithdrawalCredentials, runSync } from '@casimir/helpers'
import { CreateValidatorOptions } from '../interfaces/CreateValidatorOptions'
import { Validator } from '@casimir/types'
import { ReshareValidatorOptions } from '../interfaces/ReshareValidatorOptions'
import { operatorStore } from '@casimir/data'

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
     * @param {CreateValidatorOptions} options - Options for creating a validator
     * @returns {Promise<Validator>} Validator with operator key shares and deposit data
     * @example
     * const validator = await createValidator({
     *   operatorIds: [1, 2, 3, 4],
     *   withdrawalAddress: '0x07e05700cb4e946ba50244e27f01805354cd8ef0'
     * })
     */
    async createValidator(options: CreateValidatorOptions): Promise<Validator> {
        const { operatorIds, withdrawalAddress } = options
        const operators = this.getOperatorGroup(operatorIds)

        /** Start a key generation ceremony with the given operators */
        const ceremonyId = await this.startKeyGeneration({ operators, withdrawalAddress })
        console.log(`Started ceremony with ID ${ceremonyId}`)

        /** Wait for ceremony to complete */
        await new Promise(resolve => setTimeout(resolve, 2000))

        /** Get operator key shares */
        const { encryptedKeys, publicKeys } = await this.getShares(ceremonyId)

        /** Get validator deposit data */
        const { depositDataRoot, publicKey, signature, withdrawalCredentials } = await this.getDepositData(ceremonyId, withdrawalAddress)

        console.log('VALIDATOR PK', publicKey)

        /** Create validator */
        const validator: Validator = {
            depositDataRoot,
            publicKey,
            operatorIds, 
            sharesEncrypted: encryptedKeys,
            sharesPublicKeys: publicKeys,
            signature,
            withdrawalCredentials
        }

        return validator
    }

    /** 
     * Reshare validator for new operator key shares and deposit data
     * @param {ReshareValidatorOptions} options - Options for resharing a validator
     * @returns {Promise<Validator>} Validator with operator key shares and deposit data
     * @example
     * const validator = await reshareValidator({
     *   operatorIds: [1, 2, 3, 4],
     *   publicKey: '0x8eb0f05adc697cdcbdf8848f7f1e8c2277f4fc7b0efc97ceb87ce75286e4328db7259fc0c1b39ced0c594855a30d415c',
     *   oldOperators: {
     *     "2": "http://0.0.0.0:8082",
     *     "3": "http://0.0.0.0:8083",
     *     "4": "http://0.0.0.0:8084"
     *   }
     * })
     */
    async reshareValidator(options: ReshareValidatorOptions): Promise<Validator> {
        const { operatorIds, publicKey, oldOperatorIds, withdrawalAddress } = options
        const operators = this.getOperatorGroup(operatorIds)
        const oldOperators = this.getOperatorGroup(oldOperatorIds)

        /** Start a key generation ceremony with the given operators */
        const ceremonyId = await this.startReshare({ operators, publicKey, oldOperators })
        console.log(`Started ceremony with ID ${ceremonyId}`)

        /** Get operator key shares */
        const { encryptedKeys, publicKeys } = await this.getShares(ceremonyId)

        /** Get validator deposit data */
        const { depositDataRoot, signature, withdrawalCredentials } = await this.getDepositData(ceremonyId, withdrawalAddress)

        /** Create validator */
        const validator: Validator = {
            depositDataRoot,
            publicKey,
            operatorIds, 
            sharesEncrypted: encryptedKeys,
            sharesPublicKeys: publicKeys,
            signature,
            withdrawalCredentials
        }

        return validator
    }

    /**
     * Get operator group from operator IDs
     * @param {number[]} operatorIds - Array of operator IDs
     * @returns {<Record<string, string>} Operator group
     * @example
     * const group = getOperatorGroup([1, 2, 3, 4])
     * console.log(group) 
     * // => {
     * //     "1": "http://0.0.0.0:8081",
     * //     "2": "http://0.0.0.0:8082",
     * //     "3": "http://0.0.0.0:8083",
     * //     "4": "http://0.0.0.0:8084"
     * // }
     */
    getOperatorGroup(operatorIds: number[]): Record<string, string> {
        return operatorIds.reduce((group: Record<string, string>, id: number) => {
            const key = id.toString() as keyof typeof operatorStore
            group[key] = operatorStore[key]
            return group
        }, {})
    }

    /**
     * Start a new key generation ceremony
     * @param {KeyGenerationInput} input - Key generation input
     * @returns {Promise<string>} Ceremony ID
     * @example
     * const id = await startKeyGeneration({
     *    operators: {
     *       "1": "http://host.docker.internal:8081",
     *       "2": "http://host.docker.internal:8082",
     *       "3": "http://host.docker.internal:8083",
     *       "4": "http://host.docker.internal:8084"
     *    },
     *    withdrawalAddress: '0x07e05700cb4e946ba50244e27f01805354cd8ef0'
     * })
     * console.log(id) 
     * // => "b7e8b0e0-5c1a-4b1e-9b1e-8c1c1c1c1c1c"
     */
    async startKeyGeneration(input: KeyGenerationInput): Promise<string> {
        const { operators, withdrawalAddress } = input
        const operatorFlags = Object.entries(operators).map(([id, url]) => `--operator ${id}=${url}`).join(' ')
        const thresholdFlag = `--threshold ${Object.keys(operators).length - 1}`
        const withdrawalCredentialsFlag = `--withdrawal-credentials ${getWithdrawalCredentials(withdrawalAddress)}`
        const forkVersionFlag = '--fork-version prater'
        const command = `${this.cliPath} keygen ${operatorFlags} ${thresholdFlag} ${withdrawalCredentialsFlag} ${forkVersionFlag}`
        const startKeyGeneration = runSync(`${command}`).toString().trim() as string
        const ceremonyId = startKeyGeneration.split(' ').pop() as string
        return ceremonyId
    }

    /**
     * Start a resharing ceremony
     * @param {ReshareInput} input - Reshare input
     * @returns {Promise<string>} Ceremony ID
     * @example
     * const id = await startReshare({
     *   operators: {
     *      "2": "http://host.docker.internal:8082",
     *      "3": "http://host.docker.internal:8083",
     *      "4": "http://host.docker.internal:8084",
     *      "5": "http://host.docker.internal:8085"
     *   },
     *   publicKey: '0x8eb0f05adc697cdcbdf8848f7f1e8c2277f4fc7b0efc97ceb87ce75286e4328db7259fc0c1b39ced0c594855a30d415c',
     *   oldOperators: {
     *     "2": "http://host.docker.internal:8082",
     *     "3": "http://host.docker.internal:8083",
     *     "4": "http://host.docker.internal:8084"
     *   }
     * })
     * console.log(id)
     * // => "b7e8b0e0-5c1a-4b1e-9b1e-8c1c1c1c1c1c"
     */
    async startReshare(input: ReshareInput): Promise<string> {
        const { operators, publicKey, oldOperators } = input
        const operatorFlags = Object.entries(operators).map(([id, url]) => `--operator ${id}=${url}`).join(' ')
        const thresholdFlag = `--threshold ${Object.keys(operators).length - 1}`
        const publicKeyFlag = `--validator-public-key ${publicKey}`
        const oldOperatorFlags = Object.entries(oldOperators).map(([id, url]) => `--old-operator ${id}=${url}`).join(' ')
        const command = `${this.cliPath} reshare ${operatorFlags} ${thresholdFlag} ${publicKeyFlag} ${oldOperatorFlags}`
        const startReshare = runSync(`${command}`).toString().trim() as string
        const ceremonyId = startReshare.split(' ').pop() as string
        return ceremonyId
    }

    /**
     * Get key generation shares and public keys
     * @param {string} ceremonyId - Ceremony ID
     * @returns {Promise<Shares>} Arrays of shares and public keys
     * @example
     * const shares = await getShares('b7e8b0e0-5c1a-4b1e-9b1e-8c1c1c1c1c1c')
     * console.log(shares)
     * // => {
     * //     encryptedKeys: ["0x000000...", ...],
     * //     publicKeys: ["0x000000...", ...]
     * // }
     */
    async getShares(ceremonyId: string): Promise<Shares> {
        const requestIdFlag = `--request-id ${ceremonyId}`
        const command = `${this.cliPath} get-keyshares ${requestIdFlag}`
        const getShares = runSync(`${command}`).toString().trim() as string
        const sharesFile = getShares.split(' ').pop() as string
        const sharesJSON = JSON.parse(fs.readFileSync(`${sharesFile}`, 'utf8'))
        fs.rmSync(sharesFile)
        return {
            encryptedKeys: sharesJSON.data.shares.encryptedKeys.map((key: string) => '0x' + key),
            publicKeys: sharesJSON.data.shares.publicKeys
        }

    }

    /**
     * Get key generation deposit data
     * @param {string} ceremonyId - Ceremony ID
     * @returns {Promise<DepositData>} Deposit data
     * @example
     * const depositData = await getDepositData('b7e8b0e0-5c1a-4b1e-9b1e-8c1c1c1c1c1c')
     * console.log(depositData)
     * // => {
     * //     depositDataRoot: "0x000000...",
     * //     publicKey: "0x000000...",
     * //     signature: "0x000000...",
     * //     withdrawalCredentials: "0x000000..."
     * // }
     */
    async getDepositData(ceremonyId: string, withdrawalAddress: string): Promise<DepositData> {
        const requestIdFlag = `--request-id ${ceremonyId}`
        const withdrawalCredentialsFlag = `--withdrawal-credentials 01${'0'.repeat(22)}${withdrawalAddress.split('0x')[1]}`
        const forkVersionFlag = '--fork-version prater'
        const command = `${this.cliPath} generate-deposit-data ${requestIdFlag} ${withdrawalCredentialsFlag} ${forkVersionFlag}`
        const getDepositData = runSync(`${command}`).toString().trim() as string
        const depositDataFile = getDepositData.split(' ').pop() as string
        const depositData = JSON.parse(fs.readFileSync(depositDataFile, 'utf8'))
        fs.rmSync(depositDataFile)
        const {
            deposit_data_root: depositDataRoot,
            pubkey: publicKey,
            signature,
            withdrawal_credentials: withdrawalCredentials
        } = depositData
        return {
            depositDataRoot: `0x${depositDataRoot}`,
            publicKey: `0x${publicKey}`,
            signature: `0x${signature}`,
            withdrawalCredentials: `0x${withdrawalCredentials}`
        }
    }
}