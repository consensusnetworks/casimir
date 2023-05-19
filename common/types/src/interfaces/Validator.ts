import { Cluster } from './Cluster'

export interface Validator {
    depositDataRoot: string
    publicKey: string
    operatorIds: number[]
    shares: string
    cluster: Cluster
    signature: string
    withdrawalCredentials: string
}