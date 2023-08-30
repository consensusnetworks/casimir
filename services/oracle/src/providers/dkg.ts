import fs from 'fs'
import { StartKeygenInput } from '../interfaces/StartKeygenInput'
import { DepositData } from '../interfaces/DepositData'
import { DkgOptions } from '../interfaces/DkgOptions'
import { StartReshareInput } from '../interfaces/StartReshareInput'
import { run, runRetry } from '@casimir/shell'
import { CreateValidatorInput } from '../interfaces/CreateValidatorInput'
import { Validator } from '@casimir/types'
import { ReshareValidatorInput } from '../interfaces/ReshareValidatorInput'
import { getOperatorUrls } from './registry'
import { GetSharesInput } from '../interfaces/GetSharesInput'
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
    async createValidator(input: CreateValidatorInput): Promise<Validator> {
        const operators = getOperatorUrls(input.operatorIds)
        const requestId = await this.startKeygen({ 
            operators, 
            withdrawalAddress: input.withdrawalAddress 
        })
        
        console.log(`Started request ${requestId} for pool ${input.poolId}`)

        await new Promise(resolve => setTimeout(resolve, 2500))

        const shares = await this.getShares({ 
            requestId,
            operators,
            ownerAddress: input.ownerAddress,
            ownerNonce: input.ownerNonce
        })

        const depositData = await this.getDepositData({ 
            requestId, 
            withdrawalAddress: input.withdrawalAddress
        })

        const validator: Validator = {
            depositDataRoot: depositData.depositDataRoot,
            publicKey: depositData.publicKey,
            operatorIds: input.operatorIds,
            shares,
            signature: depositData.signature,
            withdrawalCredentials: depositData.withdrawalCredentials
        }

        return validator
    }

    /** 
     * Reshare validator for new operator key shares and deposit data
     * @param {ReshareValidatorInput} input - Input for resharing a validator
     * @returns {Promise<Validator>} Validator with operator key shares and deposit data
     */
    async reshareValidator(input: ReshareValidatorInput): Promise<Validator> {
        const operators = getOperatorUrls(input.operatorIds)
        const oldOperators = getOperatorUrls(input.oldOperatorIds)
        const requestId = await this.startReshare({ 
            operators,
            publicKey: input.publicKey,
            oldOperators
        })
        
        console.log(`Started request ${requestId} for pool ${input.poolId}`)

        await new Promise(resolve => setTimeout(resolve, 2500))

        const shares = await this.getShares({
            requestId,
            operators,
            ownerAddress: input.ownerAddress,
            ownerNonce: input.ownerNonce
        })

        const depositData = await this.getDepositData({ 
            requestId, 
            withdrawalAddress: input.withdrawalAddress
        })

        const validator: Validator = {
            depositDataRoot: depositData.depositDataRoot,
            publicKey: input.publicKey,
            operatorIds: input.operatorIds,
            shares,
            signature: depositData.signature,
            withdrawalCredentials: depositData.withdrawalCredentials
        }

        return validator
    }

    /**
     * Start a keygen request
     * @param {StartKeygenInput} input - Keygen input
     * @param {number} retries - Number of retries
     * @returns {Promise<string>} Ceremony ID
     */
    async startKeygen(input: StartKeygenInput, retries: number | undefined = 25): Promise<string> {
        try {
            const operatorFlags = Object.entries(input.operators).map(([id, url]) => `--operator ${id}=${url}`).join(' ')
            const thresholdFlag = `--threshold ${Object.keys(input.operators).length - 1}`
            const withdrawalCredentialsFlag = `--withdrawal-credentials ${'01' + '0'.repeat(22) + input.withdrawalAddress.split('0x')[1]}`
            const forkVersionFlag = '--fork-version prater'
            const command = `${this.cliPath} keygen ${operatorFlags} ${thresholdFlag} ${withdrawalCredentialsFlag} ${forkVersionFlag}`
            const request = await run(`${command}`) as string
            return request.trim().split(' ').pop() as string
        } catch (error) {
            if (retries === 0) {
                throw error
            }
            await new Promise(resolve => setTimeout(resolve, 2500))
            console.log(`Retrying keygen request ${retries} more times`)
            return await this.startKeygen(input, retries - 1)
        }
    }

    /**
     * Start a reshare request
     * @param {StartReshareInput} input - Operator IDs, public key, and old operator IDs
     * @param {number} retries - Number of retries
     * @returns {Promise<string>} Ceremony ID
     */
    async startReshare(input: StartReshareInput, retries: number | undefined = 25): Promise<string> {
        try {
            const operatorFlags = Object.entries(input.operators).map(([id, url]) => `--operator ${id}=${url}`).join(' ')
            const thresholdFlag = `--threshold ${Object.keys(input.operators).length - 1}`
            const publicKeyFlag = `--validator-public-key ${input.publicKey}`
            const oldOperatorFlags = Object.entries(input.oldOperators).map(([id, url]) => `--old-operator ${id}=${url}`).join(' ')
            const command = `${this.cliPath} reshare ${operatorFlags} ${thresholdFlag} ${publicKeyFlag} ${oldOperatorFlags}`
            const request = await runRetry(`${command}`) as string
            return request.trim().split(' ').pop() as string
        } catch (error) {
            if (retries === 0) {
                throw error
            }
            await new Promise(resolve => setTimeout(resolve, 2500))
            console.log(`Retrying reshare request ${retries} more times`)
            return await this.startReshare(input, retries - 1)
        }
    }

    /**
     * Get combined shares
     * @param {GetSharesInput} input - Request ID, operator IDs, owner address, and owner nonce
     * @returns {Promise<string>} Combined shares
     */
    async getShares(input: GetSharesInput, retries: number | undefined = 25): Promise<string> {
        try {
            const requestIdFlag = `--request-id ${input.requestId}`
            const operatorFlags = Object.entries(input.operators).map(([id, url]) => `--operator ${id}=${url}`).join(' ')
            const ownerAddressFlag = `--owner-address ${input.ownerAddress}`
            const ownerNonceFlag = `--owner-nonce ${input.ownerNonce}`
            const command = `${this.cliPath} get-keyshares ${requestIdFlag} ${operatorFlags} ${ownerAddressFlag} ${ownerNonceFlag}`
            const download = await runRetry(`${command}`) as string
            const file = download.trim().split(' ').pop() as string
            const json = JSON.parse(fs.readFileSync(`${file}`, 'utf8'))
            fs.rmSync(file)
            return json.payload.readable.shares
        } catch (error) {
            if (retries === 0) {
                throw error
            }
            await new Promise(resolve => setTimeout(resolve, 2500))
            console.log(`Retrying get shares request ${retries} more times`)
            return await this.getShares(input, retries - 1)
        }
    }

    /**
     * Get deposit data
     * @param {GetDepositDataInput} input - Ceremony ID and withdrawal address
     * @returns {Promise<DepositData>} Deposit data
     */
    async getDepositData(input: GetDepositDataInput, retries: number | undefined = 25): Promise<DepositData> {
        try {
            const requestIdFlag = `--request-id ${input.requestId}`
            const withdrawalCredentialsFlag = `--withdrawal-credentials 01${'0'.repeat(22)}${input.withdrawalAddress.split('0x')[1]}`
            const forkVersionFlag = '--fork-version prater'
            const command = `${this.cliPath} generate-deposit-data ${requestIdFlag} ${withdrawalCredentialsFlag} ${forkVersionFlag}`
            const download = await runRetry(`${command}`) as string
            const file = download.trim().split(' ').pop() as string
            const jsonArray = JSON.parse(fs.readFileSync(file, 'utf8'))
            fs.rmSync(file)
            const {
                deposit_data_root: depositDataRoot,
                pubkey: publicKey,
                signature,
                withdrawal_credentials: withdrawalCredentials
            } = jsonArray[0]
            return {
                depositDataRoot: `0x${depositDataRoot}`,
                publicKey: `0x${publicKey}`,
                signature: `0x${signature}`,
                withdrawalCredentials: `0x${withdrawalCredentials}`
            }
        } catch (error) {
            if (retries === 0) {
                throw error
            }
            await new Promise(resolve => setTimeout(resolve, 2500))
            console.log(`Retrying get deposit data request ${retries} more times`)
            return await this.getDepositData(input, retries - 1)
        }
    }
}
