
import {GetObjectCommand, S3Client, S3ClientConfig,} from '@aws-sdk/client-s3'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import EventEmitter from 'events'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { EventTableColumn } from '@casimir/data'
import {
  AthenaClient,
  AthenaClientConfig,
  GetQueryExecutionCommand,
  StartQueryExecutionCommand
} from '@aws-sdk/client-athena'

import { IotexService, newIotexService } from './providers/Iotex'
import {EthereumService, newEthereumService} from './providers/Ethereum'
import { Chain } from './providers/Base'
import {uploadToS3} from '@casimir/helpers'
import {ethers} from 'ethers'

export const defaultEventBucket = 'casimir-etl-event-bucket-dev'
export const queryOutputLocation = 's3://cms-lds-agg/cms_hcf_aggregates'

const EE = new EventEmitter()

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
  EE: EventEmitter
  constructor (config: CrawlerConfig) {
    this.config = config
    this.service = null
    this.EE = EE
  }
  async prepare (): Promise<void> {
    switch (this.config.chain) {
      case Chain.Iotex:
        this.service = await newIotexService({ })
        break
      case Chain.Ethereum:
        this.service = await newEthereumService({ url: 'http://localhost:8545' })
        break
      default:
        throw new Error('InvalidChain: chain is not supported')
      }
  }
  async start (): Promise<void> {
    if (this.service instanceof EthereumService) {
      let events: EventTableColumn[] = []

      const count = 0

      const block = await this.service.getCurrentBlock()
      for (let i = 0; i < block.number; i++) {
        const blocksWithTransaction = await this.service.getBlock(i)

        const blockEvent: EventTableColumn = {
            chain: Chain.Ethereum,
            network: 'mainnet',
            provider: 'casimir',
            type: 'block',
            created_at: new Date().toISOString(),
            address: '',
            height: blocksWithTransaction.number,
            to_address: '',
            candidate: '',
            duration: 0,
            candidate_list: [],
            amount: 0,
            auto_stake: false,
        }

        const txEvents = blocksWithTransaction.transactions.map((tx: any): EventTableColumn => {
            return {
                chain: Chain.Ethereum,
                network: 'mainnet',
                provider: 'casimir',
                type: 'transaction',
                created_at: new Date().toISOString(),
                address: tx.from,
                height: tx.height,
                to_address: tx.to || '',
                candidate: '',
                duration: 0,
                candidate_list: [],
                amount: parseInt(tx.value.toString()),
                auto_stake: false,
            }
        })

        events = [blockEvent, ...txEvents]

        if (i+1 % 1000 === 0) {
          const key = `${block.hash}-events.json`
          const ndjson = events.map((e: EventTableColumn) => JSON.stringify(e)).join('\n')

          // await uploadToS3({
          //   bucket: 'some-bucket',
          //   key: `events/${key}`,
          //   data: ndjson
          // })
          console.log(`uploading ${key} to s3 done`)
          events = []
          continue
        }
        console.log(`event: ${i}`)
      }
      return
    }
    if (this.service instanceof IotexService) {
      // const { chainMeta } = await this.service.getChainMetadata()
      // const height = parseInt(chainMeta.height)
      // const blocksPerRequest = 1000

      // const lastBlock = await this.service.getLastProcessedBlockHeight()

      // const start = lastBlock === 0 ? 0 : lastBlock + 1
      // const trips = Math.ceil(height / blocksPerRequest)

      // for (let i = start; i < trips; i++) {
      //   const { blkMetas: blocks } = await this.service.getBlocks(i, blocksPerRequest)
      //
      //   if (blocks.length === 0) continue
      //
      //   for await (const block of blocks) {
      //     let events: EventTableColumn[] = []
      //     const actions = await this.service.getBlockActions(block.height, block.numActions)
      //
      //     if (actions.length === 0 || actions[0].action.core === undefined) continue
      //       for await (const action of actions) {
      //         const core = action.action.core
      //         if (core === undefined) continue
      //
      //         const type = Object.keys(core).filter(k => k !== undefined)[Object.keys(core).length - 2]
      //
      //         const event = this.service.convertToGlueSchema({ type, block, action})
      //         events.push(event)
      //       }
      //
      //       const ndjson = events.map(a => JSON.stringify(a)).join('\n')
      //       events.forEach(e => console.log(e.height +  ' ' + e.address + ' ' + e.type))
      //       const key = `${block.hash}-events.json`
      //       await uploadToS3({
      //           bucket: defaultEventBucket,
      //           key,
      //           data: ndjson
      //       })
      //       events = []
      //   }
      // }
      const gensis = await this.service.getBlock(100000532)
      console.log(gensis)
      return
    }
    throw new Error('not implemented yet')
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