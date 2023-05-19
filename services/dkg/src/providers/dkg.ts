import fs from 'fs'
import { KeygenInput } from '../interfaces/KeygenInput'
import { DepositData } from '../interfaces/DepositData'
import { DKGOptions } from '../interfaces/DKGOptions'
import { ReshareInput } from '../interfaces/ReshareInput'
import { getWithdrawalCredentials, runRetry } from '@casimir/helpers'
import { CreateValidatorInput } from '../interfaces/CreateValidatorInput'
import { Validator, Cluster } from '@casimir/types'
import { ReshareValidatorInput } from '../interfaces/ReshareValidatorInput'
import { operatorStore } from '@casimir/data'
import { ClusterInput } from '../interfaces/ClusterInput'
import { DepositDataInput } from '../interfaces/DepositDataInput'
import { ethers } from 'ethers'

const lastPoolId = 0

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
    async createValidator(input: CreateValidatorInput): Promise<Validator> {
        const { provider, ssv, operatorIds, withdrawalAddress } = input

        const operators = this.getOperatorUrls(operatorIds)

        /** Start a key generation ceremony with the given operators */
        const ceremonyId = await this.startKeygen({ operators, withdrawalAddress })
        console.log(`Started ceremony with ID ${ceremonyId}`)

        /** Wait for ceremony to complete */
        await new Promise(resolve => setTimeout(resolve, 2000))

        /** Get operator key shares */
        const shares = await this.getShares(ceremonyId)

        /** Get validator deposit data */
        const { depositDataRoot, publicKey, signature, withdrawalCredentials } = await this.getDepositData({ ceremonyId, withdrawalAddress })

        /** Get SSV cluster snapshot */
        const cluster = await this.getCluster({ ssv, operatorIds, provider, withdrawalAddress })

        /** Create validator */
        const validator: Validator = {
            depositDataRoot,
            publicKey,
            operatorIds,
            shares,
            cluster,
            signature,
            withdrawalCredentials
        }

        return validator
    }

    /** 
     * Reshare validator for new operator key shares and deposit data
     * @param {ReshareValidatorInput} input - Input for resharing a validator
     * @returns {Promise<Validator>} Validator with operator key shares and deposit data
     */
    async reshareValidator(input: ReshareValidatorInput): Promise<Validator> {
        const { ssv, provider, operatorIds, publicKey, oldOperatorIds, withdrawalAddress } = input
        const operators = this.getOperatorUrls(operatorIds)
        const oldOperators = this.getOperatorUrls(oldOperatorIds)

        /** Start a key generation ceremony with the given operators */
        const ceremonyId = await this.startReshare({ operators, publicKey, oldOperators })
        console.log(`Started ceremony with ID ${ceremonyId}`)

        /** Get operator key shares */
        const shares = await this.getShares(ceremonyId)

        /** Get validator deposit data */
        const { depositDataRoot, signature, withdrawalCredentials } = await this.getDepositData({ ceremonyId, withdrawalAddress })

        /** Get SSV cluster snapshot */
        const cluster = await this.getCluster({ ssv, operatorIds, provider, withdrawalAddress })

        /** Create validator */
        const validator: Validator = {
            depositDataRoot,
            publicKey,
            operatorIds,
            shares,
            cluster,
            signature,
            withdrawalCredentials
        }

        return validator
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

        console.log('Running command', command)
        const ceremony = await runRetry(`${command}`) as string
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

    /**
     * Get cluster snapshot
     * @param {ClusterInput} input - Operator IDs and withdrawal address
     * @returns {Promise<Cluster>} Cluster snapshot
     */
    async getCluster(input: ClusterInput): Promise<Cluster> {
        const { ssv, provider, operatorIds, withdrawalAddress } = input
        
        const DAY = 5400
        const WEEK = DAY * 7
        const MONTH = DAY * 30
        const latestBlockNumber = await provider.getBlockNumber()
        let step = MONTH
        let cluster
        let biggestBlockNumber = 0

        const eventList = [
            'ClusterDeposited', 
            'ClusterWithdrawn', 
            'ValidatorAdded', 
            'ValidatorRemoved', 
            'ClusterLiquidated', 
            'ClusterReactivated' 
        ]
        
        const topicFilter: ethers.TopicFilter = []
        for (const event of eventList) {
            const topic = await ssv.filters[event](withdrawalAddress).getTopicFilter()
            topicFilter.concat(topic)
        }

        let fromBlock = latestBlockNumber - step
        let toBlock = latestBlockNumber

        while (!cluster && fromBlock > 0) {
            try {
                const result = await provider.getLogs({
                    address: await ssv.getAddress(),
                    fromBlock,
                    toBlock,
                    topics: topicFilter
                })

                for (const item of result) {
                    const { blockNumber, data, topics } = item
                    const log = ssv.interface.parseLog({ data, topics: topics as string[] })
                    
                    const checkClusterEvent = eventList.includes(log.name)
                    const checkOwner = log.args.owner === withdrawalAddress
                    const checkOperators = JSON.stringify(log.args.operatorIds.map((value: string) => Number(value))) === JSON.stringify(operatorIds)

                    if (checkClusterEvent && checkOwner && checkOperators) {
                        if (blockNumber > biggestBlockNumber) {
                            biggestBlockNumber = blockNumber
                            cluster = log.args.cluster
                            console.log('CLUSTER SNAPSHOT', cluster)
                        }
                    }
                }
                toBlock = fromBlock
            } catch (e) {
                console.error(e)
                if (step === MONTH) {
                    step = WEEK
                } else if (step === WEEK) {
                    step = DAY
                }
            }
            fromBlock = toBlock - step
        }

        return cluster || {
            validatorCount: 0,
            networkFeeIndex: 0,
            index: 0,
            balance: 0,
            active: true
        }
    }
}