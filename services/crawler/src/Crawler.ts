
import { S3Client, S3ClientConfig, GetObjectCommand, PutObjectCommand, ListBucketsCommand, CreateBucketCommand } from '@aws-sdk/client-s3'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { Upload } from '@aws-sdk/lib-storage'
import { IotexBlock, IotexService, newIotexService } from './services/IotexService'
import EventEmitter from 'events'
import signal from "signal-exit"

const defaultOutputLocation = "s3://casimir-etl-event-bucket-dev"

const EE = new EventEmitter()
let s3: S3Client | null = null

export enum Chain {
  Iotex = 'iotex',
  Accumulate = 'accumulate'
}

export interface CrawlerConfig {
  chain: Chain
  output?: `s3://${string}`
  verbose: boolean
}

export interface CrawlerManifest {
  init: Date
  stopped: Date
  lastBlock: IotexBlock
  chain: Chain
  service: IotexService
}

class Crawler {
  config: CrawlerConfig
  service: IotexService | null
  EE: EventEmitter
  manifest: Partial<CrawlerManifest>
  constructor (config: CrawlerConfig) {
    this.config = config
    this.service = null
    this.EE = EE
    this.manifest = {
      init: new Date()
    }
  }

  async prepare (): Promise<void> {
    if (this.config.chain === Chain.Iotex) {
      const service = await newIotexService()

      this.service = service
      this.manifest.service = service
      this.manifest.chain = Chain.Iotex

      if (this.config.verbose) {
        this.EE.on('init', () => {
          console.log(`Initialized crawler for: ${this.config.chain}`)
        })
      }

      this.EE.emit('init')

      const manifest = await this.getCrawlerManifest()

      if (manifest !== undefined) {
        if (this.config.verbose) {
        console.log("Retrieved crawler manifest")
        this.manifest = manifest
      }
    }
      return
    }
    throw new Error('UnknownChain: chain is not supported')
  }

  private async getCrawlerManifest (): Promise<CrawlerManifest | undefined> {
    const b = "casimir-crawler-manifest"

    if (s3 === null) s3 = await newS3Client()

    try {
      const get = new GetObjectCommand({
        Bucket: b,
        Key: 'manifest.json'
      })
  
      const { $metadata, Body } = await s3.send(get)
  
      if ($metadata.httpStatusCode === 200 && Body !== undefined) {
        const data = await JSON.parse(Body.toString())
        return data as CrawlerManifest
      }
      return
    } catch (e: any) {
      if (e.Code === "NoSuchBucket") {
        return
      }
    }
  }

  private async setCrawlerManifest(manifest: CrawlerManifest): Promise<void> {
    if (s3 === null) s3 = await newS3Client()

    const b = "casimir-crawler-manifest"

    const bucketList = new ListBucketsCommand({})

    const { Buckets, $metadata } = await s3.send(bucketList)

    if ($metadata.httpStatusCode !== 200 || Buckets === undefined) throw new Error('FailedGetBucketList: unable to get bucket list')

    const bucketExists = Buckets.find(b => b.Name === b)

    if (bucketExists === undefined) {
      const newBucket = new CreateBucketCommand({
        Bucket: b
      })

      const { $metadata } = await s3.send(newBucket)

      if ($metadata.httpStatusCode !== 200) throw new Error('FailedCreateBucket: unable to create bucket')
    }

    const upload = new PutObjectCommand({
      Bucket: b,
      Key: `manifest.json`,
      Body: JSON.stringify(manifest)
    })

    const data = await s3.send(upload)
    if (data.$metadata.httpStatusCode !== 200) throw new Error('FailedUploadManifest: unable to upload manifest')
    return
  }

  signalOnExit(): void {
    signal((code, signal) => {
      this.manifest.stopped = new Date()
      // console.log(this.manifest)
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
        const blocks = await this.service.getBlockMetasByIndex(i * 1000, 1000)
        if (blocks.length === 0) continue

        for (const b of blocks) {
          const actions =  await this.service.getActionsByIndex(b.height, b.num_of_actions)        
          if (actions.length === 0) continue

          const ndjson = actions.map((a: any) => JSON.stringify(a)).join('\n')
          const key = `${this.config.output}/${b.id}-events.json`
          console.log(`   ${key}`)

          this.manifest.lastBlock = b
          // uploadToS3(key, ndjson).then(() => {
          //   lastIndex = block.height
          // })
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
    throw new Error('InvalidDestination: output destination must be an s3 bucket')
  }

  const [bucket, ...keys] = destination.split(':/')[1].split('/').splice(1)

  if (bucket === '') throw new Error('EmptyBucketName: bucket name cannot be empty')

  if (keys.length === 0) {
    throw new Error('EmptyKey: key cannot be empty')
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

  await c.prepare()
  c.signalOnExit()
  return c
}

