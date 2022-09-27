import { EventTableColumn } from '@casimir/data'
import {IotexNetworkType, IotexService, IotexActionType, newIotexService} from './providers/Iotex'
import { EthereumService, newEthereumService } from './providers/Ethereum'
import { queryAthena, uploadToS3 } from '@casimir/helpers'

export enum Chain {
    Iotex = 'iotex',
    Ethereum = 'ethereum'
}

export enum Provider {
    Casimir = 'casimir',
}

export const defaultEventBucket = 'casimir-etl-event-bucket-dev'

export interface CrawlerConfig {
    chain: Chain
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
            this.service = await newEthereumService({ url: 'http://localhost:8545'})
            return
        }

        if (this.config.chain === Chain.Iotex) {
            this.service = await newIotexService({ url: 'https://api.iotex.one:443', network: IotexNetworkType.Mainnet })
            return
        }
        throw new Error('InvalidChain: chain is not supported')
    }

    async getLastProcessedEvent(): Promise<EventTableColumn | null> {
        const event = await queryAthena(`SELECT * FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" where chain = '${this.config.chain}' ORDER BY height DESC limit 1`)

        if (event !== null && event.length === 1) {
            return event[0]
        }
        return null
    }

    async start(): Promise<void> {
        if (this.service instanceof EthereumService) {
            const lastEvent = await this.getLastProcessedEvent()
            const current = await this.service.getCurrentBlock()

            const last = lastEvent !== null ? lastEvent.height : 0
            const start = parseInt(last.toString()+ 1)

            for (let i = start as number; i < current.number; i++) {
                const { events, blockHash } = await this.service.getEvents(30021005 + i)
                const ndjson = events.map((e: EventTableColumn) => JSON.stringify(e)).join('\n')
                // await uploadToS3({
                //     bucket: defaultEventBucket,
                //     key: `${blockHash}-event.json`,
                //     data: ndjson
                // }).finally(() => {
                //     console.log(`block: ${i}, num of tx: ${events.length}`)
                // })
            }
            return
        }

        if (this.service instanceof IotexService) {
            const lastEvent = await this.getLastProcessedEvent()
            const current = await this.service.getCurrentHeight()

            const start = lastEvent !== null ? lastEvent.height + 1 : 0
            console.log(`starting from block: ${start}`)

            for (let i = start; i < current; i++) {
                const events = await this.service.getEvents(10000004 + i)

                console.log(events.length)
                // await uploadToS3({
                //     bucket: defaultEventBucket,
                //     key: `${block.hash}-event.json`,
                //     data: ndjson
                // }).finally(() => {
                //     console.log('uploaded events batch to s3')
                // })
            }
            return
        }
    }
}

export async function crawler (config: CrawlerConfig): Promise<Crawler> {
  const chainCrawler = new Crawler({
    chain: config.chain,
    output: config?.output ?? `s3://${defaultEventBucket}`,
    verbose: config?.verbose ?? false
  })

  await chainCrawler.setup()
  return chainCrawler
}

async function ee() {
    const iotex = await crawler({
        chain: Chain.Iotex,
        verbose: true,
    })
    await iotex.start()
}
ee()