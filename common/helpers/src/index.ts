import { S3Client, S3ClientConfig, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { AthenaClient, AthenaClientConfig } from '@aws-sdk/client-athena'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { StartQueryExecutionCommand, GetQueryExecutionCommand, GetQueryResultsCommand }  from '@aws-sdk/client-athena'
import { EventTableSchema } from '@casimir/data'


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
export async function upload( input: { bucket: string, key: string, data: string }): Promise<void> {
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

// let backoff = 1000

/**
 * Poll for Athena query's result
 *
 * @param queryId - Athena query id
 */
// async function pollAthenaQueryOutput(queryId: string): Promise<void> {
//   if (!athena) {
//     athena = await newAthenaClient()
//   }

//   const getStateCmd = new GetQueryExecutionCommand({
//     QueryExecutionId: queryId
//   })

//   const { $metadata, QueryExecution } = await athena.send(getStateCmd)

//   if ($metadata.httpStatusCode !== 200) throw new Error('FailedQuery: unable to query Athena')
//   if (QueryExecution === undefined)  throw new Error('InvalidQueryExecution: query execution is undefined')
//   if (QueryExecution.Status === undefined) throw new Error('InvalidQueryExecutionStatus: query execution status is undefined')

//   if (QueryExecution.Status.State === 'QUEUED' || QueryExecution.Status.State === 'RUNNING') {
//     setTimeout(() => {
//       pollAthenaQueryOutput(queryId)
//       retry++
//       backoff = backoff * 2
//     }, backoff)
//   }

//   if (QueryExecution.Status.State === 'FAILED') {
//     const reason = QueryExecution.Status.StateChangeReason
//     if (reason && reason.includes('HIVE_BAD_DATA')) {
//       throw new Error('FailedQuery: Check the table for bad data')
//     } else {
//       throw new Error('QueryFailed: query failed')
//     }
//   }
//   if (QueryExecution.Status.State === 'SUCCEEDED')
//   return
// }

/**
 * Runs a SQL query on Athena table
 *
 * @param query - SQL query to run (make sure the correct permissions are set)
 * @return string - Query result
 */
export async function queryAthena(query: string): Promise<Partial<EventTableSchema>[] | null> {
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

  let backoff = 1000

  const poll = async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const get = new GetQueryExecutionCommand({
          QueryExecutionId: QueryExecutionId
        })
        
        if (athena) {
          athena.send(get).then(({ $metadata, QueryExecution }) => {
            if ($metadata.httpStatusCode !== 200) {
              return reject('FailedQuery: unable to query Athena')
            }

            if (QueryExecution === undefined) {
              return reject('InvalidQueryExecution: query execution is undefined')
            }

            if (QueryExecution.Status === undefined) {
              return reject('InvalidQueryExecutionStatus: query execution status is undefined')
            }

            if (QueryExecution.Status.State === 'SUCCEEDED') {
              return resolve(get)
            }

            if (QueryExecution.Status.State === 'FAILED') {
              return reject('QueryFailed: query failed')
            }

            if (QueryExecution.Status.State === 'QUEUED' || QueryExecution.Status.State === 'RUNNING') {
              backoff = backoff * 2
              return poll().then(resolve).catch(reject)
            }
            return reject('InvalidQueryExecutionState: query execution state is invalid')
          })
        }
    }, backoff)
  })
}

  await poll()

  const resultCmd = new GetQueryResultsCommand({
    QueryExecutionId: QueryExecutionId
  })

  const output = await athena.send(resultCmd)


  if (output.$metadata.httpStatusCode !== 200) {
    throw new Error('FailedQuery: unable to query Athena')
  }

  if (output.ResultSet === undefined) {
    throw new Error('InvalidQueryResult: query result is undefined')
  }

  const columns = output.ResultSet.ResultSetMetadata?.ColumnInfo?.map((c) => {
    return {
      name: c.Name,
      type: c.Type
    }
  })

  output.ResultSet.Rows?.shift()

  if (output.ResultSet.Rows === undefined) {
    return null
  }

  const rows = output.ResultSet.Rows.map((row) => {
    if (row.Data === undefined) {
      return null
    }

    const record = {}

    columns?.forEach((column, i) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const value = row.Data[i].VarCharValue

      if (value === undefined) {
        return null
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      record[column.name] = value
    })

    return record
  })
  return rows as Partial<EventTableSchema>[]
}

export function toAthenaTz(ts: number): string {
	return new Date(ts * 1000).toISOString().replace('T', ' ').replace('Z', '')
}