
import { S3Client, S3ClientConfig, } from '@aws-sdk/client-s3'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { IotexBlock, IotexService, newIotexService } from './providers/Iotex'
import EventEmitter from 'events'
import signal from 'signal-exit'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { EventTableColumn } from '@casimir/data'

const defaultEventBucket = 'casimir-etl-event-bucket-dev'

const EE = new EventEmitter()

let s3: S3Client | null = null

export enum Chain {
  Iotex = 'iotex',
}

export interface CrawlerConfig {
  chain: Chain
  output?: `s3://${string}`
  verbose: boolean
}

class Crawler {
  config: CrawlerConfig
  service: IotexService | null
  EE: EventEmitter
  constructor (config: CrawlerConfig) {
    this.config = config
    this.service = null
    this.EE = EE
    this.signalOnExit()
  }

  async prepare (): Promise<void> {
    if (this.config.chain === Chain.Iotex) {
      const service = await newIotexService()

      this.service = service

      if (this.config.verbose) {
        this.EE.on('init', () => {
          console.log(`Initialized crawler for: ${this.config.chain}`)
        })
      }

      this.EE.emit('init')
      return
    }
    throw new Error('UnknownChain: chain is not supported')
  }

  signalOnExit(): void {
    signal((code, signal) => {
      console.log(signal)
    })
  }                      

  async start (): Promise<void> {
    if (this.service == null) {
      throw new Error('NullService: service is not initialized')
    }

    if (s3 === null) s3 = await newS3Client()

    if (this.service instanceof IotexService) {
      const { chainMeta } = await this.service.getChainMetadata()
      const height = parseInt(chainMeta.height)
      const trips = Math.ceil(height / 1000)

      for (let i = 0; i < trips; i++) {
        console.log(`Starting trip ${i + 1} of ${trips}`)
        const { blkMetas: blocks } = await this.service.getBlocks(12000000 , 1000)
        if (blocks.length === 0) continue


        for await (const block of blocks) {

          let events: EventTableColumn[] = []
          const actions =  await this.service.getBlockActions(block.height, block.numActions)

          if (actions.length === 0 || actions[0].action.core === undefined) continue

            for await (const action of actions) {
              const core = action.action.core

              if (core === undefined) continue
              const type = Object.keys(core).filter(k => k !== undefined)[Object.keys(core).length - 2]

              const event = this.service.convertToGlueSchema({type: type, block, action})
              events.push(event)
              console.log(event)
              // const { blkMetas: meta } = await this.service.getBlockMeta(action.blkHash)
              // const converted = this.service.convertToGlueSchema({type: type, action: action, block: block})
              events = []
            }
          const ndjson = events.map((a: any) => JSON.stringify(a)).join('\n')
          // const key = `${b.id}-events.json`
          // await uploadToS3('casimir-etl-event-bucket-dev', key, ndjson)
        }
      }
      return
    }
    throw new Error('not implemented yet')
  }
  
  async stop(): Promise<void> {
    if (this.service === null) throw new Error('NullService: service is not initialized')

    if (this.service instanceof IotexService) {
      // cleanup
      return
    }
    throw new Error('not implemented yet')
  }

  on(event: 'block', cb: (b: IotexBlock) => void): void {
    if (event !== 'block') throw new Error('InvalidEvent: event is not supported')

    if (typeof cb !== 'function') throw new Error('InvalidCallback: callback is not a function')

    if (this.service === null) throw new Error('NullService: service is not initialized')

    if (this.service instanceof IotexService) {
      this.service.readableBlockStream().then((s: any) => {
        s.on('data', (b: IotexBlock) => {
          cb(b)
        })

        s.on('error', (e: Error) => {
          throw e
        })
      })
      return
    }
    throw new Error('not implemented yet')
  }
}

async function newS3Client (opt?: S3ClientConfig): Promise<S3Client> {
  if (opt?.region === undefined) {
    opt = {
      region: 'us-east-2'
    }
  }

  if (opt.credentials === undefined) {
    opt = {
      credentials: await defaultProvider()
    }
  }

  const client = new S3Client(opt)
  return client
}

async function uploadToS3(bucket: string, key: string, body: string): Promise<void> {
  if (s3 === null) s3 = await newS3Client()

  const upload = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body
  })

  const { $metadata } = await s3.send(upload).catch((e: Error) => {
    throw e
  })

  if ($metadata.httpStatusCode !== 200) throw new Error('FailedUploadBlock: unable to upload block')
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