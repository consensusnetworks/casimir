import { EventTableSchema } from '@casimir/data'
import { IotexNetworkType, IotexService, IotexServiceOptions } from './providers/Iotex'
import { EthereumService, EthereumServiceOptions } from './providers/Ethereum'
import { queryAthena, uploadToS3 } from '@casimir/helpers'
import { fork, ChildProcess } from 'child_process'

export const eventOutputBucket = 'casimir-etl-event-bucket-dev'

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

export type CrawlerConfig = {
    chain: Chain
    network: Network
    provider: Provider
    serviceOptions?: IotexServiceOptions | EthereumServiceOptions
    output?: `s3://${string}`
    verbose?: boolean
    stream?: boolean
}

export interface IpcMessage {
    action: 'stream' | 'subscribe' | 'start'
    options: CrawlerConfig
    service: EthereumService | IotexService
    start: number
    current: number
    blocks?: Array<number>
}

class Crawler {
    options: CrawlerConfig
    _start: number
    current: number
    service: EthereumService | IotexService | null
    streamer: ChildProcess | null
    crawler: ChildProcess | null
    constructor(opt: CrawlerConfig) {
        this.options = opt
        this._start = 0
        this.current = 0
        this.service = null
        this.streamer = null
        this.crawler = null
    }

    private verbose(msg: string): void {
        if (this.options.verbose) {
            console.log(msg)
        }
    }

    private async crawlerHandler(msg: Record<any, any>): Promise<void> {
        return
    }

    private async streamerHandler(msg: Record<any, any>): Promise<void> {
        return
    }

    async setup(): Promise<void> {
        this.verbose(`chain: ${this.options.chain}`)
        this.verbose(`network: ${this.options.network}`)
        this.verbose(`provider: ${this.options.provider}`)
        
        if (this.options.chain === Chain.Ethereum) {
            const service = new EthereumService({ url: this.options.serviceOptions?.url || process.env.PUBLIC_ETHEREUM_RPC || 'http://localhost:8545' })
            this.service = service

            const lastEvent = await this.getLastProcessedEvent()

            const last = lastEvent ? parseInt(lastEvent.height.toString()) : 0

            const current = await this.service.getCurrentBlock()

            this.current = current.number
            this._start = last == 0 ? 0 : last + 1
            return
        }

        if (this.options.chain === Chain.Iotex) {
            this.service = new IotexService({ url: this.options.serviceOptions?.url || 'https://api.iotex.one:443', network: Network.Mainnet })

            const lastEvent = await this.getLastProcessedEvent()

            const currentBlock = await this.service.getCurrentBlock()
            const currentHeight = currentBlock.blkMetas[0].height

            const last = lastEvent !== null ? lastEvent.height : 0

            this.current = currentHeight
            this._start = last == 0 ? 0 : last + 1
            return
        }

        throw new Error(`UnsupportedChain: the provided ${this.options.chain} is not supported`)
    }

    private async processStreamBlocks(blocks: Array<number>): Promise<void> {
        if (this.service instanceof EthereumService) {
            this.verbose('processing streamed blocks')
            for (const b of blocks) {
                const { events, block } = await this.service.getEvents(b)
                if (process.env.UPLOAD === 'enabled') {
                    await uploadToS3({
                        bucket: eventOutputBucket,
                        key: `${events[0].height}-events.json`,
                        data: JSON.stringify(event)
                    }).finally(() => {
                        this.verbose(`uploaded ${events[0].height}-events.json`)
                    })
                }
                return
            }
        }
    }
    async start(): Promise<void> {
        this.verbose('initializing child processes')

        this.crawler = fork('./src/Crawler.ts')
        this.crawler.on('message', this.crawlerHandler.bind(this))

        if (this.options.stream) {
            this.streamer = fork('./src/Streamer.ts')

            this.streamer.on('message', this.streamerHandler.bind(this))

            this.streamer.on('exit', (code: number) => {
                console.log(`child process exited with code ${code}`)
            })
        }

        if (this.options.stream) {
            if (this.streamer) {
                this.verbose(`subscribing to ${this.options.chain} block stream`)
                this.streamer.send({
                    action: 'subscribe',
                    options: this.options,
                    service: this.service,
                    current: this.current,
                    start: this._start
                })
            }
        }

        if (this.crawler) {
            this.verbose(`crawling ${this.options.chain} by block`)
            this.crawler.send({
                action: 'start',
                options: this.options,
                service: this.service,
                current: this.current,
                start: this._start
            })
            return
        }

        this.verbose('shutting down all child processes')

        if (this.streamer) {
            this.streamer.kill()
        }

        // if (this.crawler) {
        //     this.crawler.kill()
        // }

        throw new Error(`UnsupportedChain: the provided chain ${this.options.chain} is not supported`)
    }
    async getLastProcessedEvent(): Promise<EventTableSchema | null> {
        if (this.options.chain === undefined) {
            throw new Error('chain is undefined')
        }

        const event = await queryAthena(`SELECT * FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" where chain = '${this.options.chain}' ORDER BY height DESC limit 1`)

        if (event === null) return null

        this.verbose(`last processed block: ${JSON.stringify(parseInt(event[0].height.toString()), null, 2)}`)
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

if (process.argv[0].endsWith('ts-node')) {
    runDev().catch((err) => {
        console.error(err)
        process.exit(1)
    })
}

async function runDev() {
    let chain = Chain.Ethereum

    if (process.env.CHAINS) {
        chain = process.env.CHAINS.split(',')[0] as Chain
    }

    const config: CrawlerConfig = {
        chain,
        network: Network.Mainnet || process.env.NETWORK,
        provider: Provider.Alchemy,
        output: `s3://${eventOutputBucket}`,
        verbose: true,
        stream: true
     }

    const cc = await crawler(config)
    await cc.start()
}