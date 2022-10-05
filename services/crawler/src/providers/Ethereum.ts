import { ethers } from 'ethers'
import { EventTableColumn } from '@casimir/data'
import {Chain, Provider} from '../index'

export type EthereumServiceOptions = {
	url: string
	network?: string
}

export class EthereumService {
	chain: Chain
	network: string
    provider: ethers.providers.JsonRpcProvider
	constructor(opt: EthereumServiceOptions) {
		this.chain = Chain.Ethereum
		this.network = opt.network || 'mainnet'
		this.provider = new ethers.providers.JsonRpcProvider({
			url: opt.url || 'http://localhost:8545',
		})
	}

	async getEvents(height: number): Promise<{ blockHash: string, events: EventTableColumn[] }> {
		const events: EventTableColumn[] = []

		const block = await this.provider.getBlockWithTransactions(height)

		events.push({
			chain: this.chain,
			network: this.network,
			provider: Provider.Casimir,
			type: 'block',
			created_at: new Date(block.timestamp * 1000).toISOString().replace('T', ' ').replace('Z', ''),
			address: block.miner,
			height: block.number,
			to_address: '',
			candidate: '',
			duration: 0,
			candidate_list: [],
			amount: '0',
			auto_stake: false,
		})

		if (block.transactions.length > 0) {
			for (const tx of block.transactions) {
				events.push({
					chain: this.chain,
					network: this.network,
					provider: Provider.Casimir,
					type: tx.type === 0 ? 'transfer' : 'contract',
					created_at: new Date(block.timestamp * 1000).toISOString(),
					address: tx.from,
					height: block.number,
					to_address: tx.to || '',
					candidate: '',
					candidate_list: [],
					duration: 0,
					amount: tx.value.toString(),
					auto_stake: false,
				})
			}
		}
		return {
			blockHash: block.hash,
			events,
		}
	}
	async getCurrentBlock(): Promise<ethers.providers.Block> {
		const height = await this.provider.getBlockNumber()
		return await this.provider.getBlock(height)
	}

    async getBlock(num: number): Promise<any> {
		return await this.provider.getBlockWithTransactions(num)
    }

	async getTransaction(tx: string): Promise<ethers.providers.TransactionResponse> {
		return await this.provider.getTransaction(tx)
    }

	on(event:string, cb: (block: ethers.providers.Block) => void): void {
		this.provider.on('block', async (blockNumber: number) => {
			const block = await this.getBlock(blockNumber)
			cb(block)
		})
    }
}

export function newEthereumService (opt: EthereumServiceOptions): EthereumService {
	return new EthereumService(opt)
}