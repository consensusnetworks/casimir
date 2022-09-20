import { EventTableColumn } from '@casimir/data'
import { EventEmitter } from 'events'
import { AthenaClient } from '@aws-sdk/client-athena'
import { S3Client } from '@aws-sdk/client-s3'

export enum Chain {
	Iotex = 'iotex',
	Ethereum = 'ethereum'
}

export interface BaseService {
	chain: Chain
	provider: any
	athenaClient: AthenaClient
	s3Client: S3Client
	eventEmitter: EventEmitter | null
	getChainMetadata(): Promise<any>
	getBlock(hash: string): Promise<any>
	getTransaction(tx: string): Promise<any>
	on<T>(event: T, cb: () => void): void
	getCurrentBlockHeight(): Promise<number>
	getLastProcessedBlockHeight(): Promise<number>
	convertToGlueSchema(obj: Record<string,any>): EventTableColumn
	save(key: string, data: string): void
}
