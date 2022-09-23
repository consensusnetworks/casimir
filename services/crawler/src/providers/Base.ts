import { EventTableColumn } from '@casimir/data'
import { ethers } from 'ethers'
import Antenna from 'iotex-antenna'

export enum Chain {
	Iotex = 'iotex',
	Ethereum = 'ethereum'
}

export interface BaseService {
	chain: Chain
	network: string
	provider: ethers.providers.JsonRpcProvider | Antenna
	getChainMetadata(): Promise<any>
	getBlock(num: number): Promise<ethers.providers.Block>
	getCurrentBlock(): Promise<ethers.providers.Block>
	getTransaction(tx: string): Promise<any>
	getLastProcessedEvent(): Promise<EventTableColumn | null>
	// convertToGlueSchema(obj: Record<string,any>): EventTableColumn
	on(event: string, cb: (block: any) => void): void
}
