import { EventTableColumn } from '@casimir/data'
import {EventEmitter} from 'events'

export enum Chain {
	Iotex = 'iotex',
	Ethereum = 'ethereum'
}

export interface BaseService {
	chain: Chain
	provider: any
	eventEmitter: EventEmitter | null
	getChainMetadata(): Promise<any>
	getBlock(hash: string): Promise<any>
	getTransaction(tx: string): Promise<any>
	on<T>(event: T, cb: () => void): void
	getCurrentBlockHeight(): Promise<number>
	getLastProcessedBlockHeight(): Promise<number>
	convertToGlueSchema(obj: Record<string,any>): EventTableColumn
}
