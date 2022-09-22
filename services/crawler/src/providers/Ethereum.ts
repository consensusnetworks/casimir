import EventEmitter from 'events'
import { ethers } from 'ethers'
import { EventTableColumn } from '@casimir/data'
import { BaseService, Chain } from './Base'
import { queryAthena, uploadToS3 } from '@casimir/helpers'
import Antenna from 'iotex-antenna'

export type EthereumServiceOptions = any

export class EthereumService implements BaseService {
	chain: Chain
    provider: ethers.providers.JsonRpcProvider
	eventEmitter: EventEmitter | null = null

	constructor(opt: EthereumServiceOptions) {
		this.chain = Chain.Ethereum
		this.provider = new ethers.providers.JsonRpcProvider({
			url: opt.provider || 'http://localhost:8545',
		})
		this.eventEmitter = null
	}

    async getChainMetadata() {
		const meta = await this.provider.getNetwork()
		return meta
	}

    async getBlock(num: number): Promise<any> {
		return await this.provider.getBlockWithTransactions(num)
    }

	async getLastProcessedEvent(chain: Chain): Promise<EventTableColumn | null> {
		const event = await queryAthena(`SELECT height FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" where chain = '${Chain.Ethereum}' ORDER BY height DESC limit 1`)

		if (event.length === 1) {
			return event[0]
		}
		console.log('More than one event found')
		return null
	}
	
	async getTransaction(tx: string): Promise<ethers.providers.TransactionResponse> {
		const txData = await this.provider.getTransaction(tx)
		return txData
    }

	// todo: better interface and cleanup
	on(event:string, cb: (block: ethers.providers.Block) => void): void {
		this.provider.on('block', async (blockNumber: number) => {
			const block = await this.getBlock(blockNumber)
			cb(block)
		})
    }

	async getCurrentBlock(): Promise<ethers.providers.Block> {
		const height = await this.provider.getBlockNumber()
		return await this.provider.getBlock(height)
	}

	convertToGlueSchema(event: { type: string, block: ethers.providers.Block, tx: ethers.providers.TransactionResponse }): EventTableColumn {
		const record: EventTableColumn = {
			chain: Chain.Ethereum,
			network: 'mainnet',
			provider: 'casimir',
			type: event.type,
			created_at: new Date().toISOString(),
			address: event.tx.from,
			height: event.block.number,
			to_address: event.tx.to || '',
			candidate: '',
			candidate_list: [],
			amount: parseInt(event.tx.value.toString()),
			duration: 0,
			auto_stake: false,
		}
		return record
	}

	async save(key: string, data: string): Promise<void> {
		await uploadToS3({ bucket: 'b',  key, data }).catch(e =>{ throw new Error(e) })
	}
}

export function newEthereumService (opt: EthereumServiceOptions): EthereumService {
	return new EthereumService(opt)
}