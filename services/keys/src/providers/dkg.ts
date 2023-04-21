import { KeyGenerationInput } from '../interfaces/KeyGenerationInput'
import { DepositData } from '../interfaces/DepositData'
import { Shares } from '../interfaces/Shares'
import { DKGOptions } from '../interfaces/DKGOptions'
import { ReshareInput } from '../interfaces/ReshareInput'
import { retry, run, getWithdrawalCredentials } from '@casimir/helpers'
import fs from 'fs'

export class DKG {
    /** Key generation service URL */
    serviceUrl: string

    constructor(options: DKGOptions) {
        this.serviceUrl = options.serviceUrl
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
        const startKeyGeneration = await run(`rockx-dkg-cli keygen ${operatorFlags} ${thresholdFlag} ${withdrawalCredentialsFlag} ${forkVersionFlag}`) as string
        return startKeyGeneration.split(':')[1].trim()
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
     *   validatorPublicKey: '0x8eb0f05adc697cdcbdf8848f7f1e8c2277f4fc7b0efc97ceb87ce75286e4328db7259fc0c1b39ced0c594855a30d415c',
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
        const { operators, validatorPublicKey, oldOperators } = input
        const operatorFlags = Object.entries(operators).map(([id, url]) => `--operator ${id}=${url}`).join(' ')
        const thresholdFlag = `--threshold ${Object.keys(operators).length - 1}`
        const validatorPublicKeyFlag = `--validator-public-key ${validatorPublicKey}`
        const oldOperatorFlags = Object.entries(oldOperators).map(([id, url]) => `--old-operator ${id}=${url}`).join(' ')
        const startReshare = await run(`rockx-dkg-cli reshare ${operatorFlags} ${thresholdFlag} ${validatorPublicKeyFlag} ${oldOperatorFlags}`) as string
        return startReshare.split(':')[1].trim()
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
        const getShares = await run(`rockx-dkg-cli get-keyshares ${requestIdFlag}`) as string
        const sharesFile = getShares.split(':')[1].trim()
        const sharesJSON = JSON.parse(fs.readFileSync(sharesFile, 'utf8'))
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
        const getDepositData = await run(`rockx-dkg-cli generate-deposit-data ${requestIdFlag} ${withdrawalCredentialsFlag} ${forkVersionFlag}`) as string
        const depositDataFile = getDepositData.split('file ')[1].trim()
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

    /**
     * Start the local key generation API service
     * @returns {Promise<boolean>}
     */
    async start(): Promise<void> {

        await run('docker compose -f scripts/resources/rockx-dkg-cli/docker-compose.yaml up -d')

        /** Wait for the success */
        let pong = false
        while (!pong) {
            pong = await this.ping()
            await new Promise(resolve => setTimeout(resolve, 500))
        }
    }

    /**
     * Stop the local key generation API service
     * @returns {Promise<void>}
     */
    async stop(): Promise<void> {
        await run('docker compose -f scripts/resources/rockx-dkg-cli/docker-compose.yaml down')
    }

    /**
     * Ping the key generation service for a pong
     * @returns {Promise<boolean>}
     */
    async ping(): Promise<boolean> {
        try {
            const ping = await retry(`${this.serviceUrl}/ping`)
            const { message } = await ping.json()
            return message === 'pong'
        } catch (error) {
            return false
        }
    }
}