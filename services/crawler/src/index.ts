import { EventTableSchema } from '@casimir/data'
import { IotexNetworkType, IotexService, IotexServiceOptions, newIotexService } from './providers/Iotex'
import { EthereumService, EthereumServiceOptions } from './providers/Ethereum'
import { queryAthena, uploadToS3 } from '@casimir/helpers'

export enum Chain {
    Ethereum = 'ethereum',
    Iotex = 'iotex'
}

export enum Event {
    Block = 'block',
    Transaction = 'transaction',
    Deposit = 'deposit',
}

export enum Provider {
    Alchemy = 'alchemy',
}

export enum Network {
    Mainnet = 'mainnet',
    Testnet = 'testnet',
}

export const eventOutputBucket = 'casimir-etl-event-bucket-dev'

export interface CrawlerConfig {
    chain: Chain
    network: Network
    provider: Provider
    serviceOptions?: IotexServiceOptions | EthereumServiceOptions
    output?: `s3://${string}`
    verbose?: boolean
    stream?: boolean
}

class Crawler {
    options: CrawlerConfig
    service: EthereumService | IotexService | null
    _start: number
    last: number
    head: number
    constructor(opt: CrawlerConfig) {
        this.options = opt
        this.service = null
        this.last = 0
        this.head = 0
        this._start = 0
    }

    verbose(msg: string): void {
        if (this.options.verbose) {
            console.log(msg)
        }
    }

    async setup(): Promise<void> {
        this.verbose(`chain: ${this.options.chain}`)
        this.verbose(`network: ${this.options.network}`)
        this.verbose(`provider: ${this.options.provider}`)
        
        if (this.options.chain === Chain.Ethereum) {
            const service = new EthereumService({ url: this.options.serviceOptions?.url || process.env.PUBLIC_ETHEREUM_RPC_URL || 'http://localhost:8545' })
            this.service = service

            const lastEvent = await this.getLastProcessedEvent()

            const last = lastEvent ? parseInt(lastEvent.height.toString()) : 0

            const current = await this.service.getCurrentBlock()

            this._start = last === 0 ? 0 : this.last + 1
            this.last = last
            this.head = current.number
            return
        }

        if (this.options.chain === Chain.Iotex) {
            this.service = await newIotexService({ url: this.options.serviceOptions?.url || 'https://api.iotex.one:443', network: IotexNetworkType.Mainnet })

            const lastEvent = await this.getLastProcessedEvent()

            const currentBlock = await this.service.getCurrentBlock()
            const currentHeight = currentBlock.blkMetas[0].height

            const last = lastEvent !== null ? lastEvent.height : 0

            this._start = last === 0 ? 0 : this.last + 1
            this.head = currentHeight
            this.last = last
            return
        }

        throw new Error('Unsupported chain')
    }
    async stream(): Promise<void> {
        if (this.service instanceof EthereumService) {
            this.verbose('streaming etheruem blocks')

            this.service.provider.on('block', async (b: number) => {
                if (this.service instanceof EthereumService) {
                    const block = await this.service.getBlock(b)
                    const event = this.service.toEvent(block)
                    
                    this.verbose(`block: ${b}`)
                    
                    const ndjson = JSON.stringify(event)
                    
                    // await uploadToS3({
                    //     bucket: eventOutputBucket,
                    //     key: `${block.hash}-events.json`,
                    //     data: ndjson
                    // }).finally(() => {
                    //     this.verbose(`uploaded ${block.hash} - height: ${block.number}`)
                    // })
                    }
                })

                this.service.provider.on('error' , (err: Error) => {
                   throw new Error(err.message)
                })
                return
        }
        throw new Error('Unsupported chain')
    }

    async start(): Promise<void> {
        this.verbose(`crawling blocjchain from ${this.start} - ${this.head}`)

        if (this.service instanceof EthereumService) {
            for (let i = this._start; i <= this.head; i++) {
                const { block, events } = await this.service.getEvents(i)
                const ndjson = events.map((e) => JSON.stringify(e)).join('\n')
                
                await uploadToS3({
                    bucket: eventOutputBucket,
                    key: `${block}-events.json`,
                    data: ndjson
                }).finally(() => {
                    this.verbose(`uploaded ${block}-events.json`)
                })
            }
        }

        if (this.service instanceof IotexService) {
            for (let i = this._start; i < this.head; i++) {
                const { hash, events } = await this.service.getEvents(i)
                const ndjson = events.map((e: Partial<EventTableSchema>) => JSON.stringify(e)).join('\n')

                await uploadToS3({
                    bucket: eventOutputBucket,
                    key: `${hash}-event.json`,
                    data: ndjson
                }).finally(() => {
                    if (this.options.verbose) {
                        console.log(`uploaded events for block ${hash}`)
                    }
                })
            }
            return
        }
        throw new Error('Unsupported chain')
    }
    async getLastProcessedEvent(): Promise<EventTableSchema | null> {
        if (this.options.chain === undefined) {
            throw new Error('chain is undefined')
        }

        const event = await queryAthena(`SELECT * FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" where chain = '${this.options.chain}' ORDER BY height DESC limit 1`)

        if (event === null) return null

        this.verbose(`last processed event: ${JSON.stringify(event, null, 2)}`)
        return event[0]
    }
}

export async function crawler (config: CrawlerConfig): Promise<Crawler> {
  const crawler = new Crawler({
      chain: config.chain,
      network: config.network,
      provider: config.provider,
      serviceOptions: config.serviceOptions,
      output: config?.output ?? `s3://${eventOutputBucket}`,
      verbose: config?.verbose ?? false,
      stream: config?.stream ?? false
  })
  await crawler.setup()
  return crawler
}

async function run() {
    const cc: CrawlerConfig = {
        network: Network.Mainnet,
        provider: Provider.Alchemy,
        chain: Chain.Ethereum,
        // serviceOptions: config.serviceOptions,
         output:`s3://${eventOutputBucket}`
    }

    const args = process.argv.slice(2)

    if (args.length === 0) {
        // set defaults
        console.log('noop')
    }

    console.log(args)

    // const eth = await crawler({
    //     chain: Chain.Ethereum,
    //     network: Network.Mainnet,
    //     provider: Provider.Alchemy,
    //     serviceOptions: {
    //         url: 'https://eth-mainnet.g.alchemy.com/v2/RxFGV7vLIDJ--_DWPRWIyiyukklef6pf'
    //     },
    //     verbose: true,
    // })
    // eth.start()
}
run()
