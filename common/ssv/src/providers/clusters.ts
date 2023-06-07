import { ethers } from 'ethers'
import { ISSVNetwork, ISSVNetworkViews } from '@casimir/ethereum/build/artifacts/types'
import ISSVNetworkJson from '@casimir/ethereum/build/artifacts/scripts/resources/ssv-network/contracts/ISSVNetwork.sol/ISSVNetwork.json'
import ISSVNetworkViewsJson from '@casimir/ethereum/build/artifacts/scripts/resources/ssv-network/contracts/ISSVNetworkViews.sol/ISSVNetworkViews.json'
import { ClusterDetailsInput } from '../interfaces/ClusterDetailsInput'
import { ClusterDetails } from '../interfaces/ClusterDetails'
import { Cluster } from '@casimir/types'
import { getPrice } from '@casimir/uniswap'

const networkAddress = '0xAfdb141Dd99b5a101065f40e3D7636262dce65b3'
const networkViewsAddress = '0x8dB45282d7C4559fd093C26f677B3837a5598914'
const networkTokenAddress = '0x3a9f01091C446bdE031E39ea8354647AFef091E7'
const wethTokenAddress = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'

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
    const { provider, ownerAddress, operatorIds } = input

    const ssvNetwork = new ethers.Contract(networkAddress, ISSVNetworkJson.abi, provider) as ISSVNetwork & ethers.Contract
    const ssvNetworkViews = new ethers.Contract(networkViewsAddress, ISSVNetworkViewsJson.abi, provider) as ISSVNetworkViews & ethers.Contract

    const eventFilters = eventList.map(event => ssvNetwork.filters[event](ownerAddress))
    
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
                    return await ssvNetwork.queryFilter(eventFilter, fromBlock, toBlock)
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

    const price = await getPrice({ 
        provider,
        tokenIn: wethTokenAddress,
        tokenOut: networkTokenAddress,
        uniswapFeeTier: 3000 
    })

    const feeSum = await ssvNetworkViews.getNetworkFee()
    for (const operatorId of operatorIds) {
        const operatorFee = await ssvNetworkViews.getOperatorFee(operatorId)
        feeSum.add(operatorFee)
    }
    const liquidationThresholdPeriod = await ssvNetworkViews.getLiquidationThresholdPeriod()
    const ssvBalanceRequiredPerValidator = ethers.utils.formatEther(feeSum.mul(liquidationThresholdPeriod).mul(12))
    const ethBalanceRequiredPerValidator = (Number(ssvBalanceRequiredPerValidator) * price).toPrecision(9)
    const requiredBalancePerValidator = ethers.utils.parseEther(ethBalanceRequiredPerValidator)

    return { cluster, requiredBalancePerValidator }
}