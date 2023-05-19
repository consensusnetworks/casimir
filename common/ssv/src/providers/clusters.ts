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

    // Todo create query filter for events

    let fromBlock = latestBlockNumber - step
    let toBlock = latestBlockNumber

    while (!cluster && fromBlock > 0) {
        try {
            const result = await ssv.queryFilter('*', fromBlock, toBlock)

            for (const item of result) {
                const { args, blockNumber, event } = item

                try {
                    const checkClusterEvent = eventList.map(e => e.split('(')[0]).includes(event as string)
                    if (!checkClusterEvent) continue
                    const checkOwner = args?.owner === withdrawalAddress
                    if (!checkOwner) continue
                    const checkOperators = JSON.stringify(args?.operatorIds.map((value: string) => Number(value))) === JSON.stringify(operatorIds)
                    if (!checkOperators) continue
                    const checkCluster = args?.cluster !== undefined
                    if (!checkCluster) continue

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
                } catch (e) {
                    console.error('ERROR FILTERING CLUSTER EVENTS', e)
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