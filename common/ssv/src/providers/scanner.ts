import { ethers } from 'ethers'
import { ISSVNetwork, ISSVNetworkViews } from '@casimir/ethereum/build/artifacts/types'
import ISSVNetworkJson from '@casimir/ethereum/build/artifacts/scripts/resources/ssv-network/contracts/ISSVNetwork.sol/ISSVNetwork.json'
import ISSVNetworkViewsJson from '@casimir/ethereum/build/artifacts/scripts/resources/ssv-network/contracts/ISSVNetworkViews.sol/ISSVNetworkViews.json'
import { ClusterDetailsInput } from '../interfaces/ClusterDetailsInput'
import { ClusterDetails } from '../interfaces/ClusterDetails'
import { Cluster } from '@casimir/types'
import { ScannerOptions } from '../interfaces/ScannerOptions'

export class Scanner {
    DAY = 5400
    WEEK = this.DAY * 7
    MONTH = this.DAY * 30
    eventList = [
        'ClusterDeposited',
        'ClusterWithdrawn',
        'ValidatorAdded',
        'ValidatorRemoved',
        'ClusterLiquidated',
        'ClusterReactivated'
    ]
    provider: ethers.providers.JsonRpcProvider
    ssvNetwork: ISSVNetwork & ethers.Contract
    ssvNetworkViews: ISSVNetworkViews & ethers.Contract

    constructor(options: ScannerOptions) {
        this.provider = new ethers.providers.JsonRpcProvider(options.ethereumUrl)
        this.ssvNetwork = new ethers.Contract(options.ssvNetworkAddress, ISSVNetworkJson.abi, this.provider) as ISSVNetwork & ethers.Contract
        this.ssvNetworkViews = new ethers.Contract(options.ssvNetworkViewsAddress, ISSVNetworkViewsJson.abi, this.provider) as ISSVNetworkViews & ethers.Contract
    }

    /** 
     * Get cluster details 
     * @param {ClusterInput} input - Operator IDs and withdrawal address
     * @returns {Promise<ClusterDetails>} Cluster snapshot and required balance per validator
     */
    async getClusterDetails(input: ClusterDetailsInput): Promise<ClusterDetails> {
        const { ownerAddress, operatorIds } = input
        const eventFilters = this.eventList.map(event => this.ssvNetwork.filters[event](ownerAddress))
    
        let step = this.MONTH
        const latestBlockNumber = await this.provider.getBlockNumber()
        let fromBlock = latestBlockNumber - step
        let toBlock = latestBlockNumber
        let biggestBlockNumber = 0
        let cluster: Cluster | undefined
        while (!cluster && fromBlock > 0) {
            try {
                const items = (await Promise.all(
                    eventFilters.map(async eventFilter => {
                        return await this.ssvNetwork.queryFilter(eventFilter, fromBlock, toBlock)
                    })
                )).flat()
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
                console.error(error)
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
    
        const feeSum = await this.ssvNetworkViews.getNetworkFee()
        for (const operatorId of operatorIds) {
            const operatorFee = await this.ssvNetworkViews.getOperatorFee(operatorId)
            feeSum.add(operatorFee)
        }
        const liquidationThresholdPeriod = await this.ssvNetworkViews.getLiquidationThresholdPeriod()
        const requiredBalancePerValidator = feeSum.mul(liquidationThresholdPeriod).mul(12)
    
        return { cluster, requiredBalancePerValidator }
    }

}