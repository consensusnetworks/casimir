import { KeyGenerationInput } from '../interfaces/KeyGenerationInput'
import { Share } from '../interfaces/Share'
import { DepositData } from '../interfaces/DepositData'
import { DKGOptions } from '../interfaces/DKGOptions'
import { spawn } from 'child_process'

export class DKG {
    /** Key generation service URL */
    serviceUrl: string

    constructor(options: DKGOptions) {
        this.serviceUrl = options.serviceUrl
    }

    /**
     * Start a new key generation ceremony
     * @param {KeyGenerationInput} input - Key generation input
     * @returns {Promise<string>} Key generation ID
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
        const withdrawalCredentials = `01${'0'.repeat(22)}${withdrawalAddress.split('0x')[1]}`
        const startKeyGeneration = await this.retry(`${this.serviceUrl}/keygen`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operators,
                threshold: Object.keys(operators).length - 1,
                withdrawal_credentials: withdrawalCredentials,
                fork_version: 'prater'
            })
        })
        const { request_id: keyGenerationId } = await startKeyGeneration.json()
        return keyGenerationId
    }

    /**
     * Get key generation shares and public keys
     * @param {string} keyGenerationId - Key generation ID
     * @returns {Promise<KeyShares[]>} Array of shares and public keys
     * @example
     * const shares = await getShares('b7e8b0e0-5c1a-4b1e-9b1e-8c1c1c1c1c1c')
     * console.log(shares)
     * // => [
     * //     {
     * //         encryptedShare: "0x000000...",
     * //         publicKey: "0x000000..."
     * //     },
     * //     ...
     * // ]
     */
    async getShares(keyGenerationId: string): Promise<Share[]> {
        const getKeyData = await this.retry(`${this.serviceUrl}/data/${keyGenerationId}`)
        const { output: keyData } = await getKeyData.json()
        const shares = []
        for (const id in keyData) {
            const { Data: shareData } = keyData[id]
            const { EncryptedShare: encryptedShare, SharePubKey: sharePublicKey } = shareData
            
            // What format is this data?
            // 0x18dafffa73c4ab42db13cd672467ea7cd0efea152c67f63417f2262f12e77304ee07cd545e22bb8a45d3676b2e2d1f6291236950ce6dd415e4e89f861ac2e51feea95cdd92e9b3f255d46623d354630e31906229ac80fea040b1d66f616086327127fd93c9949bd5d0bbe8dd2ca06cacd17e6f0a6a6b74c29f1512f27e71c643ad2a5ce261bb0f553d03a3df7853209eb047c1a4d8a056ca666d38a3cf5a453f61fae1547eb09920ae4a3b530bc74055eb050a0569e9bee8644afdc45a298c5fe700d18747d19c69bde6a2a9896440bfff4fdaae2f9345f8893a57a1b0576476ae97d76934a0030c81845db56860ee1705fce67d945398495b7d534f40fa6879
            // Do we need to convert it to a string or format before sending it to the registry?
            // Also update SSV to v3 contracts

            shares.push({
                encryptedShare: `0x${encryptedShare}`,
                publicKey: `0x${sharePublicKey}`
            })
        }
        return shares
    }

    /**
     * Get key generation deposit data
     * @param {string} keyGenerationId - Key generation ID
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
    async getDepositData(keyGenerationId: string): Promise<DepositData> {
        const getDepositData = await this.retry(`${this.serviceUrl}/deposit_data/${keyGenerationId}`)
        const [depositData] = await getDepositData.json()
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

        spawn('docker', ['compose', '-f', 'scripts/resources/dkg/docker-compose.yaml', 'up', '-d'])

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

        spawn('docker', ['compose', '-f', 'scripts/resources/dkg/docker-compose.yaml', 'down'])

        /** Wait for the failure */
        let pong = true
        while (pong) {
            pong = await this.ping()
            await new Promise(resolve => setTimeout(resolve, 500))
        }
    }

    /**
     * Ping the key generation service for a pong
     * @returns {Promise<boolean>}
     */
    async ping(): Promise<boolean> {
        try {
            const ping = await this.retry(`${this.serviceUrl}/ping`)
            const { message } = await ping.json()
            return message === 'pong'
        } catch (error) {
            return false
        }
    }

    /**
     * Retry a fetch request
     * @param {RequestInfo} info - URL string or request object
     * @param {RequestInit} init - Request init options
     * @param {number} retriesLeft - Number of retries left (default: 5)
     * @returns {Promise<Response>} Response
     * @example
     * const response = await retry('https://example.com')
     */
    async retry(info: RequestInfo, init?: RequestInit, retriesLeft = 25): Promise<Response> {
        const response = await fetch(info, init)
        if (response.status !== 200) {
            if (retriesLeft === 0) {
                throw new Error('API request failed after maximum retries')
            }
            console.log('Retrying fetch request to', info)
            await new Promise(resolve => setTimeout(resolve, 5000))
            return await this.retry(info, init || {}, retriesLeft - 1)
        }
        return response
    }
}