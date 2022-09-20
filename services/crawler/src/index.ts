
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

export const defaultEventBucket = 'casimir-etl-event-bucket-dev'
export const queryOutputLocation = 's3://cms-lds-agg/cms_hcf_aggregates'

const EE = new EventEmitter()

export let s3: S3Client | null = null
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
  s3Client: S3Client | null
  athenaClient: AthenaClient | null
  constructor (config: CrawlerConfig) {
    this.config = config
    this.service = null
    this.EE = EE
    this.s3Client = null
    this.athenaClient = null
  }

  async upload(key: string, data: string): Promise<void> {
    if (key === undefined || key === null) throw new Error('InvalidKey: key is not defined')
    if (this.service === null) throw new Error('NullService: service is not initialized')
    if (this.s3Client === null) this.s3Client = await newS3Client()

    const upload = new PutObjectCommand({
      Bucket: defaultEventBucket,
      Key: key,
      Body: data
    })

    const { $metadata } = await this.s3Client.send(upload).catch((e: Error) => {
      throw e
    })

    if ($metadata.httpStatusCode !== 200) throw new Error('FailedUploadBlock: unable to upload block')
  }

  async prepare (): Promise<void> {
    switch (this.config.chain) {
      case Chain.Iotex:
        this.service = await newIotexService()
        break
      case Chain.Ethereum:
        this.service = await newEthereumService()
        break
      default:
        throw new Error('InvalidChain: chain is not supported')
      }
  }
  async start (): Promise<void> {
    if (this.service == null) {
      throw new Error('NullService: service is not initialized')
    }

    if (s3 === null) s3 = await newS3Client()


    if (this.service instanceof IotexService) {
      const { chainMeta } = await this.service.getChainMetadata()
      const height = parseInt(chainMeta.height)
      const blocksPerRequest = 1000

      const lastBlock = await this.retrieveLastBlock()

      const start = lastBlock === 0 ? 0 : lastBlock + 1
      const trips = Math.ceil(height / blocksPerRequest)

      for (let i = start; i < trips; i++) {
        const { blkMetas: blocks } = await this.service.getBlocks(i, blocksPerRequest)

        if (blocks.length === 0) continue

        for await (const block of blocks) {
          let events: EventTableColumn[] = []
          const actions = await this.service.getBlockActions(block.height, block.numActions)

          if (actions.length === 0 || actions[0].action.core === undefined) continue
            for await (const action of actions) {
              const core = action.action.core
              if (core === undefined) continue

              const type = Object.keys(core).filter(k => k !== undefined)[Object.keys(core).length - 2]

              const event = this.service.convertToGlueSchema({ type, block, action})
              events.push(event)
            }

            const ndjson = events.map(a => JSON.stringify(a)).join('\n')
            events.forEach(e => console.log(e.height +  ' ' + e.address + ' ' + e.type))
            const key = `${block.hash}-events.json`
            await this.upload(key, ndjson)
            events = []
        }
      }
      return
    }

    if (this.service instanceof EthereumService) {
        const height = await this.service.getCurrentBlockHeight()
        for (let i = 0; i < height; i++) {
          const block = await this.service.getBlock('0')
          console.log(block)
          // const key = `${block.hash}-events.json`
          console.log(JSON.stringify(block, null, 2))
        }
      return
    }
    throw new Error('not implemented yet')
  }

  async stop(): Promise<void> {
    if (this.service === null) throw new Error('NullService: service is not initialized')

    if (this.service instanceof IotexService) {
      return
    }
    throw new Error('not implemented yet')
  }

  // on(event: any, cb: (b: IStreamBlocksResponse) => void): void {
  //   if (this.service === null) throw new Error('NullService: service is not initialized')
  //
  //   if (event == EventStreamType.IOTEX_BLOCK) {
  //     if (this.service instanceof IotexService) {
  //       this.service.readableBlockStream().then((s: any) => {
  //         s.on('data', (b: IStreamBlocksResponse) => {
  //           cb(b)
  //         })
  //
  //         s.on('error', (e: Error) => {
  //           throw e
  //         })
  //       })
  //       return
  //     }
  //   }
  //
  //   if (event === EventStreamType.ETH_BLOCK) {
  //       if (this.service instanceof EthereumService) {
  //         // stream it
  //       }
  //   }
  //   throw new Error('not implemented yet')
  // }
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