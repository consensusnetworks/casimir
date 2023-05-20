import { ethers } from 'ethers'
import { Cluster } from '@casimir/types'
import ISSVNetworkJson from '@casimir/ethereum/build/artifacts/src/vendor/interfaces/ISSVNetwork.sol/ISSVNetwork.json'
import { ClusterInput } from '../interfaces/ClusterInput'

/**
 * Get cluster snapshot
 * @param {ClusterInput} input - Operator IDs and withdrawal address
 * @returns {Promise<Cluster>} Cluster snapshot
 */
export async function getCluster(input: ClusterInput): Promise<Cluster> {
    const { provider, networkAddress, operatorIds, withdrawalAddress } = input

    const ssv = new ethers.Contract(networkAddress, ISSVNetworkJson.abi, provider)

    const DAY = 5400
    const WEEK = DAY * 7
    const MONTH = DAY * 30
    const latestBlockNumber = await provider.getBlockNumber()
    let step = MONTH
    let cluster: Cluster | undefined
    let biggestBlockNumber = 0

    const eventList = [
        'ClusterDeposited',
        'ClusterWithdrawn',
        'ValidatorAdded',
        'ValidatorRemoved',
        'ClusterLiquidated',
        'ClusterReactivated'
    ]

    const eventFilters = eventList.map(event => ssv.filters[event](withdrawalAddress))
    let fromBlock = latestBlockNumber - step
    let toBlock = latestBlockNumber

    while (!cluster && fromBlock > 0) {
        try {
            const items = (await Promise.all(
                eventFilters.map(async eventFilter => {
                    return await ssv.queryFilter(eventFilter, fromBlock, toBlock)
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