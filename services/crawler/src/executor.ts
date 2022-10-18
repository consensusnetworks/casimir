import {Chain, CrawlerConfig} from './index'
import {EthereumService, newEthereumService} from './providers/Ethereum'
import {EventTableSchema} from '@casimir/data'
import {queryAthena, uploadToS3} from '@casimir/helpers'

export type IPCMessage = {
	type: 'setup' | 'start' | 'stop' | 'ping' | 'pong' | 'error' | 'events'
	payload?: Record<string, any>
}

const eventOutputBucket = 'casimir-etl-event-bucket-dev'


let counter = 1

class Executor {
	status: 'idle' | 'ready'
	process: NodeJS.Process
	crawlerConfig: CrawlerConfig | null = null
	service: EthereumService | null = null
	constructor(process: NodeJS.Process) {
		this.status = 'idle'
		this.process = process
		this.crawlerConfig = null
		this.service = null
		this.process.on('message', async (message: IPCMessage) => {
			await this.interceptIPCMessage(message)
		})
	}
	async interceptIPCMessage(msg: IPCMessage): Promise<void> {
		switch (msg.type) {
			case 'ping':
				await this.setup(msg).then(() => this.pong())
				break
			case 'start':
				await this.start()
				break
			default:
				break
		}
		return
	}

	pong() {
		this.status = 'ready'
		if (this.process.send) {
			this.process.send({
				type: 'pong'
			})
		}
	}

	async setup(msg: IPCMessage): Promise<void> {
		this.crawlerConfig = msg.payload as CrawlerConfig
		const service = newEthereumService({ url: this.crawlerConfig.options?.url || process.env.PUBLIC_ETHEREUM_RPC_URL || 'http://localhost:8545' })
		this.service = service
	}

	async start(): Promise<void> {
		if (!this.service) {
			throw new Error('service not initialized')
		}

		if (this.crawlerConfig?.verbose) {
			console.log(`chain: ${this.crawlerConfig.chain}`)
		}

		const lastEvent = await this.getLastProcessedEvent()
		const start = lastEvent !== null ? lastEvent.height : 0

		if (this.crawlerConfig?.verbose) {
			console.log('start from block: ', start)
		}

		for (let i = 0; i < 5; i++) {
			const { events, blockHash } = await this.service.getEvents(i)
			const ndjson = events.map((e: Partial<EventTableSchema>) => JSON.stringify(e)).join('\n')
			console.log('ndjson: ', ndjson)
			// await uploadToS3({
			// 	bucket: eventOutputBucket,
			// 	key: `${blockHash}-event.json`,
			// 	data: ndjson
			// }).finally(() => {
			// 	if (this.crawlerConfig?.verbose) {
			// 		console.log(`uploaded events for block ${blockHash}`)
			// 	}
			// })
		}
		process.exit(0)
	}

	async getLastProcessedEvent(): Promise<EventTableSchema | null> {
		const event = await queryAthena(`SELECT * FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" where chain = '${this.crawlerConfig?.chain}' ORDER BY height DESC limit 1`)

		if (event !== null && event.length === 1) {
			return event[0]
		}
		return null
	}
}

const executor = new Executor(process)