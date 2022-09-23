import { S3Client } from '@aws-sdk/client-s3'
import { EventTableColumn } from '@casimir/data'
import { AthenaClient } from '@aws-sdk/client-athena'
import { IotexNetworkType, IotexService, newIotexService } from './providers/Iotex'
import { EthereumService, newEthereumService } from './providers/Ethereum'
import { Chain } from './providers/Base'
import { queryAthena, uploadToS3 } from '@casimir/helpers'
import { ethers } from 'ethers'

export const defaultEventBucket = 'casimir-etl-event-bucket-dev'

enum CasimirEventType {
    Block = 'block',
    Transaction = 'transaction',
}

export const s3: S3Client | null = null
export const athena: AthenaClient | null = null

export interface CrawlerConfig {
  chain: Chain
  output?: `s3://${string}`
  verbose: boolean
}

class Crawler {
  config: CrawlerConfig
  service: IotexService | EthereumService | null
  constructor (config: CrawlerConfig) {
    this.config = config
    this.service = null
  }
  async prepare (): Promise<void> {
    switch (this.config.chain) {
      case Chain.Iotex:
        this.service = newIotexService({
            network: IotexNetworkType.Mainnet,
        })
        break
      case Chain.Ethereum:
        this.service = await newEthereumService({ url: 'http://localhost:8545' })
        break
      default:
        throw new Error('InvalidChain: chain is not supported')
      }
  }

  async getLastProcessedEvent(): Promise<EventTableColumn | null> {
    const event = await queryAthena(`SELECT * FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" where chain = '${this.config.chain}' ORDER BY height DESC limit 1`)

    if (event !== null && event.length === 1) {
      return event[0]
    }
    return null
  }


  async convertToGlueSchema(event: { block: ethers.providers.Block, tx:  Record<string, any> | null }): Promise<EventTableColumn[]> {
      const events: EventTableColumn[] = []

      events.push({
          chain: this.config.chain,
          network: this.service?.network || 'mainnet',
          provider: 'casimir',
          type: CasimirEventType.Block,
          created_at: new Date(event.block.timestamp * 1000).toISOString(),
          address: event.block.miner,
          height: event.block.number,
          to_address: '',
          candidate: '',
          duration: 0,
          candidate_list: [],
          amount: '0',
          auto_stake: false
      })

      if (event.tx !== null) {
          events.push({
              chain: this.config.chain,
              network: this.service?.network || 'mainnet',
              provider: 'casimir',
              type: CasimirEventType.Transaction,
              created_at: new Date(event.block.timestamp * 1000).toISOString(),
              address: event.tx.from,
              height: event.tx.blockNumber,
              to_address: event.tx.to,
              candidate: '',
              duration: 0,
              candidate_list: [],
              amount: event.tx.value,
              auto_stake: false,
          })
      }
      return events
  }

  async start (): Promise<void> {
      if (this.service instanceof EthereumService) {
          const lastEvent = await this.getLastProcessedEvent()
          const current = await this.service.getCurrentBlock()

          const start = lastEvent !== null ? lastEvent.height + 1 : 0
          console.log(`starting from block ${start}`)

          const allEvents: EventTableColumn[] = []

          for (let i = start; i < current.number; i++) {
              const block = await this.service.getBlock(i)

              const ndjson = allEvents.map((e: EventTableColumn) => JSON.stringify(e)).join('\n')
          }
      }

      if (this.service instanceof IotexService) {
        const lastEvent = await this.getLastProcessedEvent()

        const current = await this.service.getCurrentBlock()

        const start = lastEvent !== null ? lastEvent.height + 1 : 0

        console.log(`starting from block: ${start}`)

        const allEvents: EventTableColumn[] = []

        for (let i = start; i < current.number; i++) {
            const block = await this.service.getBlockWithTransactions(i)

            if (i % 3000 === 0 && i !== 0) {
                const ndjson = allEvents.map((e: EventTableColumn) => JSON.stringify(e)).join('\n')
                await uploadToS3({
                    bucket: defaultEventBucket,
                    key: `${block.hash}-event.json`,
                    data: ndjson
                }).finally(() => {
                    console.log('uploaded events batch to s3')
                })
                allEvents.length = 0
            }
            console.log(block)
        }
      return
    }
      throw new Error('ServiceNotSupported: service is not recognized')
  }
}

export async function crawler (config: CrawlerConfig): Promise<Crawler> {
  const c = new Crawler({
    chain: config?.chain ?? Chain.Iotex,
    output: config?.output ?? `s3://${defaultEventBucket}`,
    verbose: config?.verbose ?? false
  })

  await c.prepare()
  return c
}