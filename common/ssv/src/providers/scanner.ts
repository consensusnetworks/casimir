import { ethers } from "ethers"
import { ISSVClusters, ISSVOperators, ISSVViews } from "@casimir/ethereum/build/@types"
import ISSVClustersAbi from "@casimir/ethereum/build/abi/ISSVClusters.json"
import ISSVOperatorsAbi from "@casimir/ethereum/build/abi/ISSVOperators.json"
import ISSVViewsAbi from "@casimir/ethereum/build/abi/ISSVViews.json"
import { GetClusterInput } from "../interfaces/GetClusterInput"
import { Cluster } from "../interfaces/Cluster"
import { Operator } from "../interfaces/Operator"
import { ScannerOptions } from "../interfaces/ScannerOptions"

export class Scanner {
    DAY = 5400
    WEEK = this.DAY * 7
    MONTH = this.DAY * 30
    provider: ethers.providers.JsonRpcProvider
    ssvClusters: ISSVClusters & ethers.Contract
    ssvOperators: ISSVOperators & ethers.Contract
    ssvViews: ISSVViews & ethers.Contract

    constructor(options: ScannerOptions) {
        if (options.provider) {
            this.provider = options.provider
        } else {
            this.provider = new ethers.providers.JsonRpcProvider(options.ethereumUrl)
        }
        this.ssvClusters = new ethers.Contract(
            options.ssvNetworkAddress, ISSVClustersAbi, this.provider
        ) as ISSVClusters & ethers.Contract
        this.ssvOperators = new ethers.Contract(
            options.ssvNetworkAddress, ISSVOperatorsAbi, this.provider
        ) as ISSVOperators & ethers.Contract
        this.ssvViews = new ethers.Contract(
            options.ssvViewsAddress, ISSVViewsAbi, this.provider
        ) as ISSVViews & ethers.Contract
    }

    /** 
     * Get cluster details 
     * @param {ClusterInput} input - Operator IDs and withdrawal address
     * @returns {Promise<Cluster>} Cluster snapshot and required balance per validator
     */
    async getCluster(input: GetClusterInput): Promise<Cluster> {
        const { ownerAddress, operatorIds } = input
        const contractFilters = [
            this.ssvClusters.filters.ClusterDeposited(ownerAddress),
            this.ssvClusters.filters.ClusterWithdrawn(ownerAddress),
            this.ssvClusters.filters.ValidatorAdded(ownerAddress),
            this.ssvClusters.filters.ValidatorRemoved(ownerAddress),
            this.ssvClusters.filters.ClusterLiquidated(ownerAddress),
            this.ssvClusters.filters.ClusterReactivated(ownerAddress)
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
                for (const filter of contractFilters) {
                    const filteredItems = await this.ssvClusters.queryFilter(filter, fromBlock, toBlock)
                    items.push(...filteredItems)
                }
                for (const item of items) {
                    const { args, blockNumber } = item
                    const clusterMatch = args?.cluster !== undefined
                    const operatorsMatch = 
                        JSON.stringify(args?.operatorIds.map(id => id.toNumber())) === JSON.stringify(operatorIds)
                    if (!clusterMatch || !operatorsMatch) continue
                    if (blockNumber > biggestBlockNumber) {
                        biggestBlockNumber = blockNumber
                        const [
                            validatorCount,
                            networkFeeIndex,
                            index,
                            active,
                            balance
                        ] = args.cluster
                        cluster = {
                            validatorCount,
                            networkFeeIndex,
                            index,
                            active,
                            balance
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
            active: true,
            balance: 0
        }
        return cluster
    }

    /**
     * Get validator owner nonce
     * @param {string} ownerAddress - Owner address
     * @returns {Promise<number>} Owner validator nonce
     */
    async getNonce(ownerAddress: string): Promise<number> {
        const eventFilter = this.ssvClusters.filters.ValidatorAdded(ownerAddress)
        const fromBlock = 0
        const toBlock = "latest"
        const items = await this.ssvClusters.queryFilter(eventFilter, fromBlock, toBlock)
        return items.length
    }

    /**
     * Get minimum required validator fee
     * @param {number[]} operatorIds - Operator IDs
     * @returns {Promise<ethers.BigNumber>} Validator fee
     */
    async getRequiredFee(operatorIds: number[]): Promise<ethers.BigNumber> {
        let feeSum = await this.ssvViews.getNetworkFee()
        for (const operatorId of operatorIds) {
            const operatorFee = await this.ssvViews.getOperatorFee(operatorId)
            feeSum = feeSum.add(operatorFee)
        }
        const liquidationThresholdPeriod = await this.ssvViews.getLiquidationThresholdPeriod()
        return feeSum.mul(liquidationThresholdPeriod).mul(6)
    }

    /**
     * Get operators by owner address
     * @param {string} ownerAddress - Owner address
     * @returns {Promise<Operator[]>} The owner's operators
     */
    async getOperators(ownerAddress: string): Promise<Operator[]> {
        const eventFilter = this.ssvOperators.filters.OperatorAdded(null, ownerAddress)
        const operators: Operator[] = []
        const items = await this.ssvOperators.queryFilter(eventFilter, 0, "latest")
        for (const item of items) {
            const { args } = item
            const { operatorId } = args
            const { fee, validatorCount, isPrivate } = await this.ssvViews.getOperatorById(operatorId)
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