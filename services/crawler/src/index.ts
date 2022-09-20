
import {GetObjectCommand, S3Client, S3ClientConfig,} from '@aws-sdk/client-s3'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import EventEmitter from 'events'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { EventTableColumn } from '@casimir/data'
import { IStreamBlocksResponse } from 'iotex-antenna/lib/rpc-method/types'
import {
  AthenaClient,
  AthenaClientConfig,
  GetQueryExecutionCommand,
  StartQueryExecutionCommand
} from '@aws-sdk/client-athena'

import { IotexService, newIotexService } from './providers/Iotex'
import {EthereumService, newEthereumService} from './providers/Ethereum'
import { Chain } from './providers/Base'
const defaultEventBucket = 'casimir-etl-event-bucket-dev'
const queryOutputLocation = 's3://cms-lds-agg/cms_hcf_aggregates'

const EE = new EventEmitter()

let s3: S3Client | null = null
let athena: AthenaClient | null = null

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

    if (this.config.chain === Chain.Ethereum) {
      this.service = newEthereumService()

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
        const height  = await this.service.currentBlock()
        for (let i = 0; i < height; i++) {
          const block = await this.service.client.getBlock(i)
          // const key = `${block.hash}-events.json`
          console.log(JSON.stringify(block, null, 2))
        }
      return
    }
    throw new Error('not implemented yet')
  }

  async retrieveLastBlock(): Promise<number> {
    if (this.athenaClient === null) this.athenaClient = await newAthenaClient()

    const execCmd = new StartQueryExecutionCommand({
      QueryString: 'SELECT height FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" ORDER BY height DESC LIMIT 1',
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

    if (s3 === null) s3 = await newS3Client()

    const getCmd = new GetQueryExecutionCommand({
      QueryExecutionId: res.QueryExecutionId,
    })

    const getRes = await this.athenaClient.send(getCmd)

    if (getRes.$metadata.httpStatusCode !== 200) {
      throw new Error('FailedQuery: unable to query Athena')
    }

    if (getRes.QueryExecution === undefined) {
      throw new Error('InvalidQueryExecution: query execution is undefined')
    }

    let retry = 0
    let backoff  = 1000

    const queryState = async (): Promise<void> => {
      const getStateCmd = new GetQueryExecutionCommand({
        QueryExecutionId: res.QueryExecutionId,
      })

      if (this.athenaClient === null) throw new Error('NullAthenaClient: athena client is not initialized')

      const getStateRes = await this.athenaClient.send(getStateCmd)

      if (getStateRes.$metadata.httpStatusCode !== 200) throw new Error('FailedQuery: unable to query Athena')
      if (getStateRes.QueryExecution === undefined)  throw new Error('InvalidQueryExecution: query execution is undefined')
      if (getStateRes.QueryExecution.Status === undefined) throw new Error('InvalidQueryExecutionStatus: query execution status is undefined')

      if (getStateRes.QueryExecution.Status.State === 'QUEUED' || getStateRes.QueryExecution.Status.State === 'RUNNING') {
        setTimeout(() => {
          queryState()
          retry++
          backoff = backoff + 500
        }, backoff)
      }
      if (getStateRes.QueryExecution.Status.State === 'FAILED') throw new Error('QueryFailed: query failed')
      if (getStateRes.QueryExecution.Status.State === 'SUCCEEDED') return
    }

    const getResultFromS3 = async (): Promise<string> => {
      if (s3 === null) throw new Error('NullS3Client: s3 client is not initialized')

      const {$metadata, Body} = await s3.send(new GetObjectCommand({
        Bucket: 'cms-lds-agg',
        Key: `cms_hcf_aggregates/${res.QueryExecutionId}.csv`
      }))

      if ($metadata.httpStatusCode !== 200) throw new Error('FailedQuery: unable retrieve result from S3')
      if (Body === undefined) throw new Error('InvalidQueryResult: query result is undefined')

      let chunk = ''

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      for await (const data of Body) {
        chunk += data.toString()
      }
      return chunk
    }

    await queryState()

    // wait for athena to write to s3
    await new Promise(resolve => setTimeout(resolve, 2000))

    const raw = await getResultFromS3()

    const height = raw.split('\n').filter(l => l !== '')[1].replace(/"/g, '')

    return parseInt(height)
  }

  async stop(): Promise<void> {
    if (this.service === null) throw new Error('NullService: service is not initialized')

    if (this.service instanceof IotexService) {
      return
    }
    throw new Error('not implemented yet')
  }

  on(event: EventStreamType, cb: (b: IStreamBlocksResponse) => void): void {
    if (this.service === null) throw new Error('NullService: service is not initialized')

    if (event == EventStreamType.IOTEX_BLOCK) {
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
    }

    if (event === EventStreamType.ETH_BLOCK) {
        if (this.service instanceof EthereumService) {
          // stream it
        }
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
      credentials: defaultProvider()
    }
  }

  if (athena === null) {
    athena = new AthenaClient(opt)
    return athena
  }
  const client = new AthenaClient(opt)
  athena = client

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
      credentials: defaultProvider()
    }
  }

  if (s3 === null) {
    s3 = new S3Client(opt)
    return s3
  }

  const client = new S3Client(opt)
  s3 = client

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