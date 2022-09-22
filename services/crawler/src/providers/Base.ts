import { EventTableColumn } from '@casimir/data'
import { EventEmitter } from 'events'
import { ethers } from 'ethers'
import Antenna from 'iotex-antenna'
import {Block} from 'iotex-antenna/protogen/proto/types/blockchain_pb'

export enum Chain {
	Iotex = 'iotex',
	Ethereum = 'ethereum'
}

export interface BaseService {
	chain: Chain
	provider: ethers.providers.JsonRpcProvider | Antenna
	eventEmitter: EventEmitter | null
	getChainMetadata(): Promise<any>
	getBlock(num: number): Promise<any>
	getTransaction(tx: string): Promise<any>
	getCurrentBlock(): Promise<any>
	getLastProcessedEvent(chain: Chain): Promise<EventTableColumn | null>
	convertToGlueSchema(obj: Record<string,any>): EventTableColumn
	on(event: string, cb: (block: any) => void): void
	save(key: string, data: string): Promise<void>
}
