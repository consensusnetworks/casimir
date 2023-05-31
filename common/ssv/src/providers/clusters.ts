import { ethers } from 'ethers'
import SSVNetworkJson from '@casimir/ethereum/build/artifacts/scripts/resources/ssv-network/contracts/SSVNetwork.sol/SSVNetwork.json'
import { ClusterDetailsInput } from '../interfaces/ClusterDetailsInput'
import { ClusterDetails } from '../interfaces/ClusterDetails'
import { Cluster } from '@casimir/types'

const DAY = 5400
const WEEK = DAY * 7
const MONTH = DAY * 30
const eventList = [
    'ClusterDeposited',
    'ClusterWithdrawn',
    'ValidatorAdded',
    'ValidatorRemoved',
    'ClusterLiquidated',
    'ClusterReactivated'
]

/**
 * Get cluster snapshot
 * @param {ClusterInput} input - Operator IDs and withdrawal address
 * @returns {Promise<Cluster>} Cluster snapshot
 */
export async function getClusterDetails(input: ClusterDetailsInput): Promise<ClusterDetails> {
    const { provider, networkAddress, operatorIds, withdrawalAddress } = input

    const ssv = new ethers.Contract(networkAddress, SSVNetworkJson.abi, provider)
    const eventFilters = eventList.map(event => ssv.filters[event](withdrawalAddress))
    
    let step = MONTH
    const latestBlockNumber = await provider.getBlockNumber()
    let fromBlock = latestBlockNumber - step
    let toBlock = latestBlockNumber
    let biggestBlockNumber = 0
    let cluster: Cluster | undefined

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

    cluster = cluster || {
        validatorCount: 0,
        networkFeeIndex: 0,
        index: 0,
        balance: 0,
        active: true
    }
    const requiredFees = ethers.utils.parseEther('0.1')
    
    return { cluster, requiredFees }
}