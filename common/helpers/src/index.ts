import { S3Client, S3ClientConfig, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { AthenaClient, AthenaClientConfig } from '@aws-sdk/client-athena'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import {queryOutputLocation} from '@casimir/crawler/src'
import { StartQueryExecutionCommand, GetQueryExecutionCommand, StartQueryExecutionCommandInput }  from '@aws-sdk/client-athena'

/**
 * Converts any string to PascalCase.
 *
 * @param str - The input string
 * @returns A PascalCase string from the input string
 *
 */
export function pascalCase(str: string): string {
  return str.replace(/\w+/g, (word) => {
    return word[0].toUpperCase() + word.slice(1).toLowerCase()
  })
}

let athena: AthenaClient | null = null
let s3: S3Client | null = null

export async function newAthenaClient(opt?: AthenaClientConfig): Promise<AthenaClient> {
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
  const client = new AthenaClient(opt)
  athena = client

  return client
}

export async function newS3Client (opt?: S3ClientConfig): Promise<S3Client> {
  if (s3) {
    return s3
  }

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

  const client = new S3Client(opt)
  s3 = client

  return client
}

export async function uploadToS3( input: { bucket: string, key: string,data: string }): Promise<void> {
  if (!s3) {
    s3 = await newS3Client()
  }

  const upload = new PutObjectCommand({
    Bucket: input.bucket,
    Key: input.key,
  })
  const { $metadata } = await s3.send(upload)
  if ($metadata.httpStatusCode !== 200) throw new Error('Error uploading to s3')
}

export async function getFromS3(bucket: string, key: string): Promise<string> {
  if (!s3) {
    s3 = await newS3Client()
  }

  const { $metadata, Body } = await s3.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key
    // Bucket: 'cms-lds-agg',
    // Key: `cms_hcf_aggregates/${res.QueryExecutionId}.csv`
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


let retry = 0
let backoff = 300

async function pollAthenaQueryOutput(queryId: string): Promise<void> {
  if (!athena) {
    athena = await newAthenaClient()
  }

  const getStateCmd = new GetQueryExecutionCommand({
    QueryExecutionId: queryId
  })

  const { $metadata, QueryExecution } = await athena.send(getStateCmd)

  if ($metadata.httpStatusCode !== 200) throw new Error('FailedQuery: unable to query Athena')
  if (QueryExecution === undefined)  throw new Error('InvalidQueryExecution: query execution is undefined')
  if (QueryExecution.Status === undefined) throw new Error('InvalidQueryExecutionStatus: query execution status is undefined')

  if (QueryExecution.Status.State === 'QUEUED' || QueryExecution.Status.State === 'RUNNING') {
    setTimeout(() => {
      pollAthenaQueryOutput(queryId)
      retry++
      backoff = backoff + 500
    }, backoff)
  }

  if (QueryExecution.Status.State === 'FAILED') throw new Error('QueryFailed: query failed')
  if (QueryExecution.Status.State === 'SUCCEEDED')
  return
}

export async function queryAthena(query: string): Promise<string> {

  if (!athena) {
    athena = await newAthenaClient()
  }

  const execCmd = new StartQueryExecutionCommand({
    QueryString: query,
    // QueryString: `SELECT height FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" WHERE chain = '${chain}' ORDER BY height DESC LIMIT 1`,
    WorkGroup: 'primary',
    ResultConfiguration: {
      OutputLocation: queryOutputLocation,
    }
  })

  const { $metadata, QueryExecutionId } = await athena.send(execCmd)

  if ($metadata.httpStatusCode !== 200) {
    throw new Error('FailedQuery: unable to query Athena')
  }

  if (QueryExecutionId === undefined) {
    throw new Error('InvalidQueryExecutionId: query execution id is undefined')
  }

  await pollAthenaQueryOutput(QueryExecutionId)

  // wait for athena to finish writing to s3
  await new Promise(resolve => setTimeout(resolve, 2000))

  const result = await getFromS3('cms-lds-agg', `cms_hcf_aggregates/${QueryExecutionId}.csv`)

  // const height = raw.split('\n').filter(l => l !== '')[1].replace(/"/g, '')
  return result
}