import { ethers } from 'ethers'
import { EventTableColumn } from '@casimir/data'
import { Chain, Provider } from '../index'

const BeaconDepositContract = {
	'0x00000000219ab540356cBB839Cbe05303d7705Fa': {
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
		const abi = BeaconDepositContract[log.address as keyof typeof BeaconDepositContract].abi
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

		if (block.transactions.length === 0) {
			return { blockHash: block.hash, events }
		}

		for await (const tx of block.transactions) {
			const receipts = await this.provider.getTransactionReceipt(tx.hash)

			if (receipts.logs.length === 0) {
				continue
			}

			// check if its a regualr transfer

			for (const log of receipts.logs) {
				if (log.address in BeaconDepositContract) {
					// const contractInterface = new ethers.utils.Interface(BeaconDepositContract[log.address as keyof typeof BeaconDepositContract].abi)
					const parsedLog = this.parseLog(log)
					console.log(parsedLog)
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

	async ping(rpcUrl: string): Promise<boolean> {
		const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
		try {
			const block = await provider.getBlockNumber()
			return true
		} catch (e) {
			return false
		}
	}
}

export function newEthereumService (opt: EthereumServiceOptions): EthereumService {
	return new EthereumService(opt)
}