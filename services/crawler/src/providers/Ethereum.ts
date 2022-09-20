import { ethers } from 'ethers'
import { EventTableColumn } from '@casimir/data'
import { BaseService, Chain } from './Base'
import EventEmitter from 'events'

export type EthereumServiceOptions = {
	provider: string
}

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

    async getBlock(hash: string): Promise<ethers.providers.Block> {
		const block = await this.provider.getBlock(hash)
		return block
    }

    async getCurrentBlock(): Promise<number> {
		const current = await this.provider.getBlockNumber()
		return current
    }

	// todo: get last proceesed block from athena
    async getLastProcessedBlock(): Promise<number> {
        throw new Error('Method not implemented.')
    }

    async getTransaction(tx: string): Promise<ethers.providers.TransactionResponse> {
		const txData = await this.provider.getTransaction(tx)
		return txData
    }

	// todo: better interface and cleanup
    on<T>(event: T, cb: () => void): void {
		this.provider.on(event, cb)
    }

	getCurrentBlockHeight(): Promise<number> {
		return Promise.resolve(0)
	}

	// todo: get last proceesed block from athena
	getLastProcessedBlockHeight(): Promise<number> {
		return Promise.resolve(0)
	}

	convertToGlueSchema(event: { type: string, block: ethers.providers.Block, tx: ethers.providers.TransactionResponse }): EventTableColumn {
		const record: EventTableColumn = {
			chain: Chain.Ethereum,
			network: 'mainnet',
			provider: 'casimir',
			type: event.type,
			created_at: new Date().toISOString().split('T')[0],
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
}

export function newEthereumService (opt: EthereumServiceOptions): EthereumService {
	return new EthereumService(opt)
}