import { Cluster } from '@casimir/types'
import { BigNumber } from 'ethers'

export interface ClusterDetails {
    cluster: Cluster,
    requiredFees: BigNumber
}