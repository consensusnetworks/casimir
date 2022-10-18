import { EventTableSchema } from '@casimir/data'
import { IotexNetworkType, IotexService, IotexServiceOptions, newIotexService } from './providers/Iotex'
import { EthereumService, EthereumServiceOptions, newEthereumService } from './providers/Ethereum'
import { queryAthena, uploadToS3 } from '@casimir/helpers'
import { fork, ChildProcess } from 'child_process'
import { IPCMessage } from './executor'

export enum Chain {
    Ethereum = 'ethereum',
    Iotex = 'iotex'
}

export enum Provider {
    Casimir = 'casimir',
}

export const eventOutputBucket = 'casimir-etl-event-bucket-dev'

export interface CrawlerConfig {
    chain: Chain
    options?: IotexServiceOptions | EthereumServiceOptions
    output?: `s3://${string}`
    verbose?: boolean
    stream?: boolean
}

class Crawler {
    config: CrawlerConfig
    service: EthereumService | IotexService | null
    executor: ChildProcess | null = null
    controller: AbortController
    constructor(config: CrawlerConfig) {
        this.config = config
        this.service = null
        this.executor = null
        this.controller = new AbortController()
    }

    async interceptIPCMessage(msg: IPCMessage): Promise<void> {
        switch (msg.type) {
            case 'pong':
                await this.start()
                break
            case 'events':
                break
            default:
                break
        }
    }

    async setup(): Promise<void> {
        if (this.config.chain === 'ethereum') {
            const subprocess = fork(process.cwd() + '/src/executor.ts', [], {
                execArgv: ['-r', 'ts-node/register'],
                signal: this.controller.signal,
            })

            this.executor = subprocess

            this.executor.on('message', async (message: IPCMessage) => {
                await this.interceptIPCMessage(message)
            })

            // subprocess.on('exit', (code, signal) => {
            //     console.log('executor exited with code: ', code, signal)
            // })

            this.pingExecutor()
            return
        }
        throw new Error('InvalidChain: chain is not supported')
    }

    pingExecutor(): void {
        if (this.executor === null) {
            throw new Error('ExecutorNotReady: executor is not ready')
        }

        this.executor.send({
            type: 'ping',
            payload: {
                ...this.config
            }
        })
    }

    async getLastProcessedEvent(): Promise<EventTableSchema | null> {
        const event = await queryAthena(`SELECT * FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" where chain = '${this.config.chain}' ORDER BY height DESC limit 1`)

        if (event !== null && event.length === 1) {
            return event[0]
        }
        return null
    }

    async start(): Promise<void> {
		if (this.config.chain === Chain.Ethereum) {
			if (this.executor !== null) {
				this.executor.send({
					type: 'start'
				})
			}
            return
		}

        if (this.service instanceof IotexService) {
            const lastEvent = await this.getLastProcessedEvent()

            const currentBlock = await this.service.getCurrentBlock()
            const currentHeight = currentBlock.blkMetas[0].height

            const last = lastEvent !== null ? lastEvent.height : 0
            const start = parseInt(last.toString()) + 1

            if (this.config.verbose) {
                console.log(`crawling ${this.config.chain} from block ${start}`)
            }

            for (let i = start; i < currentHeight; i++) {
                const { hash, events } = await this.service.getEvents(i)
                const ndjson = events.map((e: Partial<EventTableSchema>) => JSON.stringify(e)).join('\n')

                await uploadToS3({
                    bucket: eventOutputBucket,
                    key: `${hash}-event.json`,
                    data: ndjson
                }).finally(() => {
                    if (this.config.verbose) {
                        console.log(`uploaded events for block ${hash}`)
                    }
                })
            }
            return
        }
    }
}

export async function crawler (config: CrawlerConfig): Promise<Crawler> {
  const crawler = new Crawler({
      chain: config.chain,
      options: config.options,
      output: config?.output ?? `s3://${eventOutputBucket}`,
      verbose: config?.verbose ?? false,
      stream: config?.stream ?? false
  })

  await crawler.setup()
  return crawler
}
