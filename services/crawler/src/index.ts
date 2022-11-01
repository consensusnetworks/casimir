import { EventTableSchema } from '@casimir/data'
import { IotexNetworkType, IotexService, IotexServiceOptions } from './providers/Iotex'
import { EthereumService, EthereumServiceOptions } from './providers/Ethereum'
import { getCoinPrice, queryAthena, uploadToS3 } from '@casimir/helpers'
import { fork, ChildProcess } from 'child_process'

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

export type IpcMessage = {
    action: 'subscribe' | 'stop' | 'error' | 'pull_blocks' | 'push_blocks' | 'stream'
    options: CrawlerConfig
    service: EthereumService | IotexService | null
    last: number
    current: number
    _start: number
    blocks?: Array<number>
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
    current: number
    _pid: number
    child: ChildProcess | null
    constructor(opt: CrawlerConfig) {
        this.options = opt
        this.service = null
        this._start = 0
        this.last = 0
        this.current = 0
        this._pid = 0
        this.child = null
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

        if (this.options.stream) {
            const child = fork('./src/stream.ts')

            this.child = child

            if (child.pid) {
                this._pid = child.pid
            }

            child.on('message', this.processIPC.bind(this))

            child.on('exit', (code: number) => {
                console.log(`child process exited with code ${code}`)
            })
        }
        
        if (this.options.chain === Chain.Ethereum) {
            const service = new EthereumService({ url: this.options.serviceOptions?.url || process.env.PUBLIC_ETHEREUM_RPC || 'http://localhost:8545' })
            this.service = service

            const lastEvent = await this.getLastProcessedEvent()

            const last = lastEvent ? parseInt(lastEvent.height.toString()) : 0

            const current = await this.service.getCurrentBlock()

            this.last = last
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

            this.last = last            
            this.current = currentHeight
            this._start = last == 0 ? 0 : last + 1
            return
        }

        throw new Error(`UnsupportedChain: the provided ${this.options.chain} is not supported`)
    }

    async processStreamBlocks(blocks: Array<number>): Promise<void> {
        if (this.service instanceof EthereumService) {
            this.verbose('processing streamed blocks')
            for (const b of blocks) {
                const block = await this.service.getBlock(b)
                const event = await this.service.toEvent(block)
                if (process.env.UPLOAD === 'enabled') {
                    await uploadToS3({
                        bucket: eventOutputBucket,
                        key: `${block}-events.json`,
                        data: JSON.stringify(event)
                    }).finally(() => {
                        this.verbose(`uploaded ${block}-events.json`)
                    })
                }
                return
            }
        }
    }

    async processIPC(msg: IpcMessage): Promise<void> {
        switch (msg.action) {
            case 'stop':
                if (this._pid !== 0) {
                    console.log(this._pid)
                    process.kill(this._pid)
                }
                return

            case 'push_blocks':
                if (msg.blocks && msg.blocks.length > 0) {
                    this.verbose(`received ${msg.blocks.length} blocks from child process stream`)
                    await this.processStreamBlocks(msg.blocks).finally(() => {
                        if (this.child) {
                            this.child.send({
                                action: 'stream',
                                options: this.options,
                                service: this.service,
                                last: this.last,
                                current: this.current,
                                start: this._start
                            })
                        }
                    })
                }
        }
    }

    async start(): Promise<void> {
        if (this.options.stream) {
            if (this.child && this.child.send) {
                this.verbose(`subscribing to ${this.options.chain} block stream`)
                this.child.send({
                    action: 'subscribe',
                    options: this.options,
                    service: this.service,
                    last: this.last,
                    current: this.current,
                    start: this._start
                })
            }
        }

        this.verbose(`start: ${this._start} end: ${this.current}`)

        if (this.service instanceof EthereumService) {
            for (let i = this._start; i <= 30; i++) {
                const { block, events } = await this.service.getEvents(i)
                const ndjson = events.map((e) => JSON.stringify(e)).join('\n')
                if (process.env.UPLOAD === 'enabled') {
                    await uploadToS3({
                        bucket: eventOutputBucket,
                        key: `${block}-events.json`,
                        data: ndjson
                    }).finally(() => {
                        this.verbose(`uploaded events for block ${events[0].height}`)
                    })
                } else {
                    this.verbose(`block: ${events[0].height} - events: ${events.length}`)
                }
            }

            if (this.options.stream) {
                if (this.child && this.child.send) {
                    const pull: Partial<IpcMessage> = { action: 'pull_blocks', options: this.options }
                    this.verbose('requesting blocks from child process stream')
                    this.child.send(pull)
                }
            }
            return
        }

        if (this.service instanceof IotexService) {
            for (let i = this._start; i < this.current; i++) {
                const { hash, events } = await this.service.getEvents(i)
                const ndjson = events.map((e: Partial<EventTableSchema>) => JSON.stringify(e)).join('\n')

                if (process.env.UPLOAD === 'enabled') {
                    await uploadToS3({
                        bucket: eventOutputBucket,
                        key: `${hash}-events.json`,
                        data: ndjson
                    }).finally(() => {
                        if (this.options.verbose) {
                            this.verbose(`uploaded ${events[0].height}-events.json`)
                        }
                    })
                }
                this.verbose(ndjson)
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
        // take the first chain for now
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
