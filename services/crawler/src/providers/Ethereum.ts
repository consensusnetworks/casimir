import { ethers } from 'ethers'
import { EventTableSchema } from '@casimir/data'
import { Chain, Event, Provider } from '../index'

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
	contractsOfInterest: Record<string, {hash: string, abi: string[]}>
	constructor(opt: EthereumServiceOptions) {
		this.chain = Chain.Ethereum
		this.network = opt.network || 'mainnet'
		this.provider = new ethers.providers.JsonRpcProvider({
			url: opt.url,
		})
		this.contractsOfInterest = ContractsOfInterest
	}

	parseLog(log: ethers.providers.Log): Record<any, string> {
		const abi = ContractsOfInterest.BeaconDepositContract.abi
		const contractInterface = new ethers.utils.Interface(abi)
		const parsedLog = contractInterface.parseLog(log)
		const args = parsedLog.args.slice(-1 * parsedLog.eventFragment.inputs.length)

		const output: Record<string, string> = {}

		parsedLog.eventFragment.inputs.forEach((key, index) => {
			output[key.name] = args[index]
		})
		return output
	}

	async getBlock(s: number): Promise<ethers.providers.Block> {
		const block = await this.provider.getBlock(s)
		return block
	}

	toEvent(b: ethers.providers.Block): Partial<EventTableSchema> {
		const event: Partial<EventTableSchema> = {
			chain: this.chain,
			network: this.network,
			provider: Provider.Alchemy,
			type: Event.Block,
			height: b.number,
			block: b.hash,
			created_at: new Date(b.timestamp * 1000).toISOString().replace('T', ' ').replace('Z', ''),
			address: b.miner,
			gasUsed: b.gasUsed.toString(),
			gasLimit: b.gasLimit.toString()

			// amount: "",
			// auto_stake: false,
			// duration: 0,
			// to_address: "",
			// transaction: "",
			// validator: "",
			// validator_list: [],
		}

		if (b.baseFeePerGas) {
			event.baseFee = ethers.BigNumber.from(b.baseFeePerGas).toString()
			const burntFee = ethers.BigNumber.from(b.gasUsed).mul(ethers.BigNumber.from(b.baseFeePerGas))
			event.burntFee = burntFee.toString()
		}

		return event
	}

	async getEvents(height: number): Promise<{ block: string, events: Partial<EventTableSchema>[] }> {
		const events: Partial<EventTableSchema>[] = []

		const block = await this.provider.getBlockWithTransactions(height)

		const blockEvent: Partial<EventTableSchema> = {
			chain: this.chain,
			network: this.network,
			provider: Provider.Alchemy,
			type: Event.Block,
			height: block.number,
			block: block.hash,
			created_at: new Date(block.timestamp * 1000).toISOString().replace('T', ' ').replace('Z', ''),
			address: block.miner,
			gasUsed: block.gasUsed.toString(),
			gasLimit: block.gasLimit.toString()

			// amount: "",
			// auto_stake: false,
			// duration: 0,
			// to_address: "",
			// transaction: "",
			// validator: "",
			// validator_list: [],
		}

		if (block.baseFeePerGas) {
			blockEvent.baseFee = ethers.BigNumber.from(block.baseFeePerGas).toString()
			const burntFee = ethers.BigNumber.from(block.gasUsed).mul(ethers.BigNumber.from(block.baseFeePerGas))
			blockEvent.burntFee = burntFee.toString()
		}

		events.push(blockEvent)

		if (block.transactions.length === 0) {
			return {
				block: block.hash,
				events: events
			}
		}

		for await (const tx of block.transactions) {
			const txEvent: Partial<EventTableSchema> = {
				chain: this.chain,
				network: this.network,
				provider: Provider.Alchemy,
				type: Event.Transaction,
				height: block.number,
				block: block.hash,
				transaction: tx.hash,
				address: tx.from,
				created_at: new Date(block.timestamp * 1000).toISOString().replace('T', ' ').replace('Z', ''),
				amount: ethers.utils.formatEther(tx.value.toString()),
				gasUsed: block.gasUsed.toString()

				// auto_stake: false,
				// baseFee: "",
				// burntFee: "",
				// duration: 0,
				// to_address: "",
				// validator: "",
				// validator_list: [],
			}

			if (tx.to) {
				txEvent.to_address = tx.to
			}

			if (tx.gasLimit) {
				txEvent.gasLimit = tx.gasLimit.toString()
			}

			events.push(txEvent)

			const receipts = await this.provider.getTransactionReceipt(tx.hash)

			if (receipts.logs.length === 0) {
				continue
			}

			for (const log of receipts.logs) {
				if (log.address === ContractsOfInterest.BeaconDepositContract.hash) {
					const parsedLog = this.parseLog(log)
					const deposit: Partial<EventTableSchema> = {
						chain: this.chain,
						network: this.network,
						provider: Provider.Alchemy,
						type: Event.Deposit,
						block: block.hash,
						transaction: log.transactionHash,
						// created_at: new Date(block.timestamp * 1000).toISOString().replace('T', ' ').replace('Z', ''),
						address: log.address,
						height: block.number,
						amount: parsedLog.amount,
						gasLimit: block.gasLimit.toString()

						// auto_stake: false,
						// baseFee: "",
						// burntFee: "",
						// duration: 0,
						// gasUsed: "",
						// to_address: "",
						// validator: "",
						// validator_list: [],
					}

					if (tx.to) {
						deposit.to_address = tx.to
					}
					events.push(deposit)
				}
			}
		}
		return {
			block: block.hash,
			events: events,
		}
	}


	async getCurrentBlock(): Promise<ethers.providers.Block> {
		const height = await this.provider.getBlockNumber()
		return await this.provider.getBlock(height)
	}
}