
import { S3Client, S3ClientConfig, } from '@aws-sdk/client-s3'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { IotexBlock, Iotex, newIotexService } from './providers/Iotex'
import EventEmitter from 'events'
import signal from "signal-exit"
import { PutObjectCommand } from '@aws-sdk/client-s3'

const defaultEventBucket = "casimir-etl-event-bucket-dev"

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
  service: Iotex | null
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

    if (this.service instanceof Iotex) {
      const { chainMeta } = await this.service.getChainMetadata()
      const height = parseInt(chainMeta.height)
      const trips = Math.ceil(height / 1000)

      for (let i = 0; i < trips; i++) {
        console.log(`Starting trip ${i + 1} of ${trips}`)
        const blocks = await this.service.getBlockMetasByIndex(i * 1000, 1000)
        if (blocks.length === 0) continue

        for (const b of blocks) {
          const actions =  await this.service.getActionsByIndex(b.height, b.num_of_actions)        
          if (actions.length === 0) continue

          const ndjson = actions.map((a: any) => JSON.stringify(a)).join('\n')
          const key = `${b.id}-events.json`

          const upload = new PutObjectCommand({
            Bucket: "casimir-etl-event-bucket-dev",
            Key: key,
            Body: ndjson
          })

          const { $metadata } = await s3.send(upload).catch((e: Error) => {
            throw e
          })

          if ($metadata.httpStatusCode !== 200) throw new Error('FailedUploadBlock: unable to upload block')
          console.log(key)
        }
      }
      return
    }
    throw new Error('not implemented yet')
  }
  
  async stop(): Promise<void> {
    if (this.service === null) throw new Error('NullService: service is not initialized')

    if (this.service instanceof Iotex) {
      // cleanup
      return
    }
    throw new Error('not implemented yet')
  }

  on(event: 'block', cb: (b: IotexBlock) => void): void {
    if (event !== 'block') throw new Error('InvalidEvent: event is not supported')

    if (typeof cb !== 'function') throw new Error('InvalidCallback: callback is not a function')

    if (this.service === null) throw new Error('NullService: service is not initialized')

    if (this.service instanceof Iotex) {
      this.service.readableBlockStream().then((s: any) => {
        s.on("data", (b: IotexBlock) => {
          cb(b)
        })

        s.on("error", (e: Error) => {
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

export async function crawler (config: CrawlerConfig): Promise<Crawler> {
  const c = new Crawler({
    chain: config?.chain ?? Chain.Iotex,
    output: config?.output ?? `s3://${defaultEventBucket}`,
    verbose: config?.verbose ?? false
  })

  await c.prepare()
  return c
}