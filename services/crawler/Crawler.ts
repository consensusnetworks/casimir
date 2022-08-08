
import fs from 'fs'
import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { Upload } from '@aws-sdk/lib-storage'
import { IoTexService, newIotexService } from './services/IotexService'
import EventEmitter from 'events'


const EE = new EventEmitter()
const defaultOutputLocation = "s3://casimir-etl-event-bucket-dev"
let s3: S3Client | null = null


export enum Chain {
  Iotex = 'iotex',
  Accumulate = 'accumulate'
}

export interface CrawlerConfig {
  chain: Chain
  output: `s3://${string}` | `./${string}` | `../${string}`
  verbose: boolean
}

class Crawler {
  config: CrawlerConfig
  service: IoTexService | null
  running: boolean
  EE: EventEmitter
  init: Date
  constructor (config: CrawlerConfig) {
    this.config = config
    this.init = new Date()
    this.service = null
    this.running = false
    this.EE = EE
  }

  async _init (): Promise<void> {
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
    throw new Error('Unknown chain')
  }

  async start (): Promise<void> {
    if (this.running) {
      throw new Error('Crawler is already running')
    }

    if (this.service == null) {
      throw new Error('Service is not initialized')
    }

    this.running = true
    s3 = await newS3Client()

    if (this.service instanceof IoTexService) {
      const { chainMeta } = await this.service.getChainMetadata()
      const height = parseInt(chainMeta.height)
      const trips = Math.ceil(height / 1000)

      for (let i = 0; i < trips; i++) {
        const blocks = await this.service.getBlockMetasByIndex(8000000, 1000)
        if (blocks.length === 0) continue

        for (const block of blocks) {
          const actions =  await this.service.getActionsByIndex(block.height, block.num_of_actions)

          if (actions.length === 0) continue

          const ndjson = actions.filter(a => a.action.core !== undefined && a.action.core.stakeCreate !== undefined).map(a => this.service?.convertToGlueSchema("create_stake", a)).map(a => JSON.stringify(a)).join('\n')
          
          if (ndjson.length === 0) continue
          const destination = `${this.config.output}/${block.id}-events.json`
          uploadToS3(destination, ndjson)
        }
      }
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

async function uploadToS3 (destination: string, data: string | Buffer |  ReadableStream): Promise<void> {
  if (!destination.startsWith('s3://')) {
    throw new Error('Invalid destination')
  }

  const [bucket, ...keys] = destination.split(':/')[1].split('/').splice(1)

  if (bucket === '') throw new Error('bucket name cannot be empty')

  if (keys.length === 0) {
    throw new Error('path cannot be empty')
  }

  console.log(`Uploading to ${keys}`)

  try {
    if (s3 === null) {
      throw new Error('s3 client is not initialized')
    }
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: bucket,
        Key: keys.join('/'),
        Body: data
      },
      leavePartsOnError: true
    })

    upload.on('httpUploadProgress', (progess) => {
      // eslint-disable-next-line
      console.log(`Uploading ${progess.loaded}/${progess.total}`)
    })

    await upload.done()
  } catch (err) {
    throw new Error('Unable to upload to S3')
  }
}


export async function crawler (config: CrawlerConfig): Promise<Crawler> {
  const c = new Crawler({
    chain: config?.chain ?? Chain.Iotex,
    output: config?.output ?? defaultOutputLocation,
    verbose: config?.verbose ?? false
  })

  await c._init()
  return c
}
