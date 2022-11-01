import { S3Client, S3ClientConfig, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { AthenaClient, AthenaClientConfig } from '@aws-sdk/client-athena'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { StartQueryExecutionCommand, GetQueryExecutionCommand }  from '@aws-sdk/client-athena'
import { EventTableSchema } from '@casimir/data'
import https from 'node:https'

const defaultQueryOutputBucket = 'casimir-etl-output-bucket-dev'

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

/**
 * Creates a new Athena client
 *
 * @param opt - Athena client config
 * @returns Athena client
 *
 */
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

/**
 * Creates a new S3 client
 *
 * @param opt - S3 client config
 * @returns S3 client
 *
 */
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

/**
 * Uploads data to S3
 *
 * @param input.bucket - Bucket destination
 * @param input.key - Key destination
 * @param input.data - Data to be uploaded
 *
 */
export async function uploadToS3( input: { bucket: string, key: string, data: string }): Promise<void> {
  if (!s3) {
    s3 = await newS3Client()
  }

  const upload = new PutObjectCommand({
    Bucket: input.bucket,
    Key: input.key,
    Body: input.data
  })

  const { $metadata } = await s3.send(upload)
  if ($metadata.httpStatusCode !== 200) throw new Error('Error uploading to s3')
}

/**
 * Get data from S3
 *
 * @param bucket - Bucket destination
 * @param key - Key destination
 * @return data - Data from S3
 *
 */
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
let backoff = 500

/**
 * Poll for Athena query's result
 *
 * @param queryId - Athena query id
 */
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

  if (QueryExecution.Status.State === 'FAILED') {
    const reason = QueryExecution.Status.StateChangeReason
    if (reason && reason.includes('HIVE_BAD_DATA')) {
      throw new Error('FailedQuery: Check the table for bad data')
    } else {
      throw new Error('QueryFailed: query failed')
    }
  }
  if (QueryExecution.Status.State === 'SUCCEEDED')
  return
}

/**
 * Runs a SQL query on Athena table
 *
 * @param query - SQL query to run (make sure the correct permissions are set)
 * @return string - Query result
 */
export async function queryAthena(query: string): Promise<EventTableSchema[] | null> {
  if (!athena) {
    athena = await newAthenaClient()
  }

  const execCmd = new StartQueryExecutionCommand({
    QueryString: query,
    WorkGroup: 'primary',
    ResultConfiguration: {
      OutputLocation: `s3://${defaultQueryOutputBucket}/`
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

  const raw = await getFromS3(defaultQueryOutputBucket, `${QueryExecutionId}.csv`)

  const rows = raw.split('\n').filter(r => r !== '')

  if (rows.length <= 1) {
    return null
  }

  const header = rows.splice(0, 1)[0].split(',').map((h: string) => h.trim().replace(/"/g, ''))

  const events: EventTableSchema[] = []

  rows.forEach((curr) => {
    const row = curr.split(',')
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const event: EventTableColumn = {}
    row.forEach((r, i) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      event[header[i]] = r.trim().replace(/"/g, '')
    })

    if (event) {
      events.push(event)
    }
  })
  return events
}


/**
 * HTTP get reuest utility
 *
 * @param options
 * @param unit - The unit
 */
async function request(options: https.RequestOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (d) => {
        data += d
      })

      res.on('end', () => {
        resolve(JSON.parse(data))
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.end()
  })
}

/**
 * Get coin price at specified date from CoinGecko API
 *
 * @param date - Date to get price at
 * @param coin - The coin to get the price for
 * @param unit - The unit
 */
export async function getCoinPrice(date: Date, coin: 'ethereum' | 'bitcoin', unit: string): Promise<{value: string, unit: string}> {
  // date format: dd-mm-yyyy
  const formatted = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`

  const opt = {
    hostname: 'api.coingecko.com',
    port: 443,
    path: `/api/v3/coins/${coin}/history?date=${formatted}&localization=false`,
    method: 'GET'
  }

  const response = await request(opt)

  console.log(response)

  if (response.id !== coin) {
    throw new Error('coin not found')
  }

  const val = response.market_data.current_price[unit]

  if (val !== undefined) {
    return {value: response.market_data.current_price[unit].toString(), unit}
  }

  throw new Error('Failed request')
}