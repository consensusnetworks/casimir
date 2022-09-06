
import { S3Client, S3ClientConfig, } from '@aws-sdk/client-s3'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { IotexService, newIotexService } from './providers/Iotex'
import EventEmitter from 'events'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { EventTableColumn } from '@casimir/data'
import { IStreamBlocksResponse } from 'iotex-antenna/lib/rpc-method/types'
import {
  AthenaClient,
  AthenaClientConfig,
  GetNamedQueryCommand, GetQueryExecutionCommand,
  StartQueryExecutionCommand
} from '@aws-sdk/client-athena'

const defaultEventBucket = 'casimir-etl-event-bucket-dev'
const queryOutputLocation = 's3://cms-lds-agg/cms_hcf_aggregates/'

const EE = new EventEmitter()

let s3: S3Client | null = null
const athena: AthenaClient | null = null

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
    console.log(`Uploaded ${key}`)
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

              const event = this.service.convertToGlueSchema({ type, block, action})
              events.push(event)
            }
          const ndjson = events.map(a => JSON.stringify(a)).join('\n')
          const key = `${block.hash}-events.json`
          await this.upload(key, ndjson)
          events = []
        }
      }
      return
    }
    throw new Error('not implemented yet')
  }

  async retrieveLastBlock(): Promise<void> {
    if (this.athenaClient === null) this.athenaClient = await newAthenaClient()

    const execCmd = new StartQueryExecutionCommand({
      QueryString: 'SELECT * FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" LIMIT 1',
      WorkGroup: 'primary',
      ResultConfiguration: {
        OutputLocation: queryOutputLocation,
      }
    })

    const res = await this.athenaClient.send(execCmd)
    if (res.$metadata.httpStatusCode !== 200) {
      throw new Error('FailedQuery: unable to query Athena')
    }

    if (res.QueryExecutionId === undefined) {
        throw new Error('InvalidQueryExecutionId: query execution id is undefined')
    }

    const queryCmd = new GetQueryExecutionCommand({
        QueryExecutionId: res.QueryExecutionId
    })

    const query = await this.athenaClient.send(queryCmd)

    if (query.$metadata.httpStatusCode !== 200) {
      throw new Error('FailedQuery: unable to query Athena')
    }
  }

  async stop(): Promise<void> {
    if (this.service === null) throw new Error('NullService: service is not initialized')

    if (this.service instanceof IotexService) {
      return
    }
    throw new Error('not implemented yet')
  }

  on(event: 'block', cb: (b: IStreamBlocksResponse) => void): void {
    if (event !== 'block') throw new Error('InvalidEvent: event is not supported')

    if (typeof cb !== 'function') throw new Error('InvalidCallback: callback is not a function')

    if (this.service === null) throw new Error('NullService: service is not initialized')

    if (this.service instanceof IotexService) {
      this.service.readableBlockStream().then((s: any) => {
        s.on('data', (b: IStreamBlocksResponse) => {
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

async function newAthenaClient(opt?: AthenaClientConfig): Promise<AthenaClient> {
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

  const client = new AthenaClient(opt)
  return client
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