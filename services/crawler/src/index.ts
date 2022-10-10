import { EventTableSchema } from '@casimir/data'
import {IotexNetworkType, IotexService, IotexServiceOptions, newIotexService} from './providers/Iotex'
import {EthereumService, EthereumServiceOptions, newEthereumService} from './providers/Ethereum'
import { queryAthena, uploadToS3 } from '@casimir/helpers'
import fs from 'fs'

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
}

class Crawler {
    config: CrawlerConfig
    service: EthereumService | IotexService | null
    constructor(config: CrawlerConfig) {
        this.config = config
        this.service = null
    }

    async setup(): Promise<void> {
        if (this.config.chain === Chain.Ethereum) {
            this.service = await newEthereumService({ url: this.config?.options?.url || process.env.PUBLIC_ETHEREUM_RPC_URL || 'http://localhost:8545' })
            return
        }

        if (this.config.chain === Chain.Iotex) {
            this.service = await newIotexService({ url: 'https://api.iotex.one:443', network: IotexNetworkType.Mainnet })
            return
        }
        throw new Error('InvalidChain: chain is not supported')
    }

    async getLastProcessedEvent(): Promise<EventTableSchema | null> {
        const event = await queryAthena(`SELECT * FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" where chain = '${this.config.chain}' ORDER BY height DESC limit 1`)

        if (event !== null && event.length === 1) {
            return event[0]
        }
        return null
    }

    async start(): Promise<void> {
        if (this.service instanceof EthereumService) {
            // const lastEvent = await this.getLastProcessedEvent()
            // const last = lastEvent !== null ? lastEvent.height : 0
            // const start = parseInt(last.toString()) + 1
            //
            // if (this.config.verbose) {
            //     console.log(`crawling ${this.config.chain} from block ${start}`)
            // }
            //
            // const current = await this.service.getCurrentBlock()

            const { events, blockHash } = await this.service.getEvents(15697244)
            const ndjson = events.map((e: Partial<EventTableSchema>) => JSON.stringify(e)).join('\n')
            // for (let i = start; i < current.number; i++) {
                // const { events, blockHash } = await this.service.getEvents(15697244   + i)
                // const ndjson = events.map((e: Partial<EventTableSchema>) => JSON.stringify(e)).join('\n')
                // await uploadToS3({
                //     bucket: eventOutputBucket,
                //     key: `${blockHash}-event.json`,
                //     data: ndjson
                // }).finally(() => {
                //     if (this.config.verbose) {
                //         console.log(`uploaded events for block ${blockHash}`)
                //     }
                // })
            // }
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
  const chainCrawler = new Crawler({
      chain: config.chain,
      options: config.options,
      output: config?.output ?? `s3://${eventOutputBucket}`,
      verbose: config?.verbose ?? false
  })

  await chainCrawler.setup()
  return chainCrawler
}
