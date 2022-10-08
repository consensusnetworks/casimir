import { ethers } from 'ethers'
import { EventTableSchema } from '@casimir/data'
import { Chain, Provider } from '../index'

const ContractsOfInterest = {
	BeaconDepositContract: {
		hash: '0x00000000219ab540356cBB839Cbe05303d7705Fa',
		abi: ['event DepositEvent (bytes pubkey, bytes withdrawal_credentials, bytes amount, bytes signature, bytes index)']
	}
}

export type EthereumServiceOptions = {
	url: string
	network?: string
	chainId?: number
}

export class EthereumService {
	chain: Chain
	network: string
    provider: ethers.providers.JsonRpcProvider
	constructor(opt: EthereumServiceOptions) {
		this.chain = Chain.Ethereum
		this.network = opt.network || 'mainnet'
		this.provider = new ethers.providers.JsonRpcProvider({
			url: opt.url,
		})
	}

	parseLog(log: ethers.providers.Log): Record<any, string> {
		const abi = ContractsOfInterest[log.address as keyof typeof ContractsOfInterest].abi
		const contractInterface = new ethers.utils.Interface(abi)
		const parsedLog = contractInterface.parseLog(log)
		const args = parsedLog.args.slice(-1 * parsedLog.eventFragment.inputs.length)

		const input: Record<string, string> = {}

		parsedLog.eventFragment.inputs.forEach((key, index) => {
			console.log('Key', key.name)
			input[key.name] = args[index]
		})
		return input
	}

	async getEvents(height: number): Promise<{ blockHash: string, events: Partial<EventTableSchema>[] }> {
		const events: Partial<EventTableSchema>[] = []

		const block = await this.provider.getBlockWithTransactions(height)

		const blockEvent = {
			chain: this.chain,
			network: this.network,
			provider: Provider.Casimir,
			type: 'block',
			block: block.hash,
			created_at: new Date(block.timestamp * 1000).toISOString().replace('T', ' ').replace('Z', ''),
			address: block.miner,
			height: block.number,
			gasFee: block.gasUsed.toString(),
			gasLimit: block.gasLimit.toString(),
			gasUsed: block.gasUsed.toNumber(),

		}

		console.log("blockEvent", blockEvent)

		events.push(blockEvent)

		if (block.transactions.length === 0) {
			return { blockHash: block.hash, events }
		}

		for await (const tx of block.transactions) {
			const txEvent = {
				chain: this.chain,
				network: this.network,
				provider: Provider.Casimir,
				type: 'transaction',
				block: block.hash,
				transaction: tx.hash,
				created_at: new Date(block.timestamp * 1000).toISOString().replace('T', ' ').replace('Z', ''),
				address: tx.from,
				to_address: tx.to,
				height: block.number,
				amount: tx.value.toString(),
			}

			events.push(txEvent)

			const receipts = await this.provider.getTransactionReceipt(tx.hash)

			if (receipts.logs.length === 0) {
				continue
			}

			for await (const log of receipts.logs) {
				if (log.address in ContractsOfInterest) {
					const parsedLog = this.parseLog(log)
					const value = Buffer.from(parsedLog.amount.slice(2), 'hex').readBigUInt64BE(0).toString()

					console.log('Parsed Log', parsedLog)
					const logEvent = {
						chain: this.chain,
						network: this.network,
						provider: Provider.Casimir,
						type: 'deposit',
						block: block.hash,
						transaction: log.transactionHash,
						created_at: new Date(block.timestamp * 1000).toISOString().replace('T', ' ').replace('Z', ''),
						address: log.address,
						height: block.number,
						to_address: tx.to || '',
						amount: value,
					}
					events.push(logEvent)
				}
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

    async getBlockWithTx(num: number): Promise<any> {
		return await this.provider.getBlockWithTransactions(num)
    }

	on(event:string, cb: (block: ethers.providers.Block) => void): void {
		this.provider.on('block', async (blockNumber: number) => {
			const block = await this.getBlockWithTx(blockNumber)
			cb(block)
		})
    }
}

export function newEthereumService (opt: EthereumServiceOptions): EthereumService {
	return new EthereumService(opt)
}