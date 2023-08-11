import { ethers } from 'ethers'
import { ISSVNetwork, ISSVNetworkViews } from '@casimir/ethereum/build/@types'
import ISSVNetworkAbi from '@casimir/ethereum/build/abi/ISSVNetwork.json'
import ISSVNetworkViewsAbi from '@casimir/ethereum/build/abi/ISSVNetworkViews.json'
import { GetClusterInput } from '../interfaces/GetClusterInput'
import { Cluster } from '../interfaces/Cluster'
import { Operator } from '../interfaces/Operator'
import { ScannerOptions } from '../interfaces/ScannerOptions'

export class Scanner {
    DAY = 5400
    WEEK = this.DAY * 7
    MONTH = this.DAY * 30
    provider: ethers.providers.JsonRpcProvider
    ssvNetwork: ISSVNetwork & ethers.Contract
    ssvNetworkViews: ISSVNetworkViews & ethers.Contract

    constructor(options: ScannerOptions) {
        if (options.provider) {
            this.provider = options.provider
        } else {
            this.provider = new ethers.providers.JsonRpcProvider(options.ethereumUrl)
        }
        this.ssvNetwork = new ethers.Contract(options.ssvNetworkAddress, ISSVNetworkAbi, this.provider) as ISSVNetwork & ethers.Contract
        this.ssvNetworkViews = new ethers.Contract(options.ssvNetworkViewsAddress, ISSVNetworkViewsAbi, this.provider) as ISSVNetworkViews & ethers.Contract
    }

    /** 
     * Get cluster details 
     * @param {ClusterInput} input - Operator IDs and withdrawal address
     * @returns {Promise<Cluster>} Cluster snapshot and required balance per validator
     */
    async getCluster(input: GetClusterInput): Promise<Cluster> {
        const { ownerAddress, operatorIds } = input
        const eventFilters = [
            this.ssvNetwork.filters.ClusterDeposited(ownerAddress),
            this.ssvNetwork.filters.ClusterWithdrawn(ownerAddress),
            this.ssvNetwork.filters.ValidatorAdded(ownerAddress),
            this.ssvNetwork.filters.ValidatorRemoved(ownerAddress),
            this.ssvNetwork.filters.ClusterLiquidated(ownerAddress),
            this.ssvNetwork.filters.ClusterReactivated(ownerAddress)
        ]
        let step = this.MONTH
        const latestBlockNumber = await this.provider.getBlockNumber()
        let fromBlock = latestBlockNumber - step
        let toBlock = latestBlockNumber
        let biggestBlockNumber = 0
        let cluster: Cluster | undefined
        while (!cluster && fromBlock > 0) {
            try {
                const items = []
                for (const filter of eventFilters) {
                    const filteredItems = await this.ssvNetwork.queryFilter(filter, fromBlock, toBlock)
                    items.push(...filteredItems)
                }
                for (const item of items) {
                    const { args, blockNumber } = item
                    const clusterMatch = args?.cluster !== undefined
                    const operatorsMatch = JSON.stringify(args?.operatorIds.map((value: string) => Number(value))) === JSON.stringify(operatorIds)
                    if (!clusterMatch || !operatorsMatch) continue
                    if (blockNumber > biggestBlockNumber) {
                        biggestBlockNumber = blockNumber
                        const [
                            validatorCount,
                            networkFeeIndex,
                            index,
                            balance,
                            active
                        ] = args.cluster
                        cluster = {
                            validatorCount,
                            networkFeeIndex,
                            index,
                            balance,
                            active
                        }
                    }
                }
                toBlock = fromBlock
            } catch (error) {
                if (step === this.MONTH) {
                    step = this.WEEK
                } else if (step === this.WEEK) {
                    step = this.DAY
                }
            }
            fromBlock = toBlock - step
        }
        cluster = cluster || {
            validatorCount: 0,
            networkFeeIndex: 0,
            index: 0,
            balance: 0,
            active: true
        }
        return cluster
    }

    /**
     * Get validator owner nonce
     * @param {string} ownerAddress - Owner address
     * @returns {Promise<number>} Owner validator nonce
     */
    async getNonce(ownerAddress: string): Promise<number> {
        const eventFilter = this.ssvNetwork.filters.ValidatorAdded(ownerAddress)
        const fromBlock = 0
        const toBlock = 'latest'
        const items = await this.ssvNetwork.queryFilter(eventFilter, fromBlock, toBlock)
        return items.length
    }

    /**
     * Get minimum required validator fee
     * @param {number[]} operatorIds - Operator IDs
     * @returns {Promise<ethers.BigNumber>} Validator fee
     */
    async getRequiredFee(operatorIds: number[]): Promise<ethers.BigNumber> {
        const feeSum = await this.ssvNetworkViews.getNetworkFee()
        for (const operatorId of operatorIds) {
            const operatorFee = await this.ssvNetworkViews.getOperatorFee(operatorId)
            feeSum.add(operatorFee)
        }
        const liquidationThresholdPeriod = await this.ssvNetworkViews.getLiquidationThresholdPeriod()
        return feeSum.mul(liquidationThresholdPeriod).mul(12)
    }

    /**
     * Get operators by owner address
     * @param {string} ownerAddress - Owner address
     * @returns {Promise<Operator[]>} The owner's operators
     */
    async getOperators(ownerAddress: string): Promise<Operator[]> {
        const eventFilter = this.ssvNetwork.filters.OperatorAdded(null, ownerAddress)
        const operators: Operator[] = []
        const items = await this.ssvNetwork.queryFilter(eventFilter, 0, 'latest')
        for (const item of items) {
            const { args } = item
            const { operatorId } = args
            const { fee, validatorCount, isPrivate } = await this.ssvNetworkViews.getOperatorById(operatorId)
            operators.push({
                id: operatorId.toNumber(),
                fee,
                ownerAddress,
                validatorCount,
                isPrivate
            })
        }
        return operators
    }
}