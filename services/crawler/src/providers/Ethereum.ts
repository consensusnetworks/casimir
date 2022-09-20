import { ethers } from 'ethers'
import { EventTableColumn } from '@casimir/data'
import { BaseService, Chain } from './Base'
import EventEmitter from 'events'
import {GetObjectCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3'
import {defaultEventBucket, newAthenaClient, newS3Client, queryOutputLocation, s3} from '../index'
import {AthenaClient, GetQueryExecutionCommand, StartQueryExecutionCommand} from '@aws-sdk/client-athena'
import {defaultProvider} from '@aws-sdk/credential-provider-node'

export type EthereumServiceOptions = {
	provider: string
}

export class EthereumService implements BaseService {
	chain: Chain
	athenaClient: AthenaClient
	s3Client: S3Client
    provider: ethers.providers.JsonRpcProvider
	eventEmitter: EventEmitter | null = null

	constructor(opt: EthereumServiceOptions) {
		this.chain = Chain.Ethereum
		this.provider = new ethers.providers.JsonRpcProvider({
			url: opt.provider || 'http://localhost:8545',
		})
		this.athenaClient = new AthenaClient({
			region: 'us-east-1',
			credentials: defaultProvider()
		})
		this.s3Client = new S3Client({
			region: 'us-east-2',
			credentials: defaultProvider()
		})
		this.eventEmitter = null
	}

    async getChainMetadata() {
		const meta = await this.provider.getNetwork()
		return meta
	}

    async getBlock(hash: string): Promise<ethers.providers.Block> {
		const block = await this.provider.getBlock(hash)
		return block
    }

	// todo: get last processed block from athena

    async getLastProcessedBlock(chain: Chain): Promise<number> {
		const selectQuery= new StartQueryExecutionCommand({
			QueryString: `SELECT height FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" WHERE chain = '${chain}' ORDER BY height DESC LIMIT 1`,
			WorkGroup: 'primary',
			ResultConfiguration: {
				OutputLocation: queryOutputLocation,
			}
		})

		const { $metadata, QueryExecutionId } = await this.athenaClient.send(selectQuery)

		if ($metadata.httpStatusCode !== 200) {
			throw new Error('FailedQuery: unable to query Athena')
		}

		if (QueryExecutionId === undefined) {
			throw new Error('InvalidQueryExecutionId: query execution id is undefined')
		}

		const getCmd = new GetQueryExecutionCommand({ QueryExecutionId })

		const execRes = await this.athenaClient.send(getCmd)

		if (execRes.$metadata.httpStatusCode !== 200) {
			throw new Error('FailedQuery: unable to query Athena')
		}

		if (execRes.QueryExecution === undefined) {
			throw new Error('InvalidQueryExecution: query execution is undefined')
		}

		let retry = 0
		let backoff  = 1000

		const poll = async (): Promise<void> => {
			const getStateCmd = new GetQueryExecutionCommand({ QueryExecutionId })

			const getStateRes = await this.athenaClient.send(getStateCmd)

			if (getStateRes.$metadata.httpStatusCode !== 200) throw new Error('FailedQuery: unable to query Athena')
			if (getStateRes.QueryExecution === undefined)  throw new Error('InvalidQueryExecution: query execution is undefined')
			if (getStateRes.QueryExecution.Status === undefined) throw new Error('InvalidQueryExecutionStatus: query execution status is undefined')

			if (getStateRes.QueryExecution.Status.State === 'QUEUED' || getStateRes.QueryExecution.Status.State === 'RUNNING') {
				setTimeout(() => {
					poll()
					retry++
					backoff = backoff + 500
				}, backoff)
			}
			if (getStateRes.QueryExecution.Status.State === 'FAILED') throw new Error('QueryFailed: query failed')
			if (getStateRes.QueryExecution.Status.State === 'SUCCEEDED') return
		}

		const getResult = async (): Promise<string> => {
			if (s3 === null) throw new Error('NullS3Client: s3 client is not initialized')

			const {$metadata, Body} = await s3.send(new GetObjectCommand({
				Bucket: 'cms-lds-agg',
				Key: `cms_hcf_aggregates/${QueryExecutionId}.csv`
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

		await poll()

		// wait for athena writing to s3
		await new Promise(resolve => setTimeout(resolve, 2000))

		const raw = await getResult()

		const height = raw.split('\n').filter(l => l !== '')[1].replace(/"/g, '')
		return parseInt(height)
	}


	async getTransaction(tx: string): Promise<ethers.providers.TransactionResponse> {
		const txData = await this.provider.getTransaction(tx)
		return txData
    }

	// todo: better interface and cleanup
    on<T>(event: T, cb: () => void): void {
		this.provider.on(event, cb)
    }

	async getCurrentBlockHeight(): Promise<number> {
		const h = await this.provider.getBlockNumber()
		console.log('current block height', h)
		return h
	}

	// todo: get last processed block from athena
	getLastProcessedBlockHeight(): Promise<number> {
		return Promise.resolve(0)
	}

	convertToGlueSchema(event: { type: string, block: ethers.providers.Block, tx: ethers.providers.TransactionResponse }): EventTableColumn {
		const record: EventTableColumn = {
			chain: Chain.Ethereum,
			network: 'mainnet',
			provider: 'casimir',
			type: event.type,
			created_at: new Date().toISOString().split('T')[0],
			address: event.tx.from,
			height: event.block.number,
			to_address: event.tx.to || '',
			candidate: '',
			candidate_list: [],
			amount: parseInt(event.tx.value.toString()),
			duration: 0,
			auto_stake: false,
		}
		return record
	}

	async save(key: string, data: string): Promise<void> {
		if (key === undefined || key === null) throw new Error('InvalidKey: key is not defined')
		if (data === undefined || data === null) throw new Error('InvalidData: data is not defined')

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
}

export function newEthereumService (opt: EthereumServiceOptions): EthereumService {
	return new EthereumService(opt)
}