import { Construct } from 'constructs'
import { Stack } from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as glue from '@aws-cdk/aws-glue-alpha'
import { schemaToGlueColumns, eventSchema, aggSchema } from '@casimir/data'
import { EtlStackProps } from '../interfaces/EtlStackProps'

// Get Glue Columns from JSON Schema for each table
const eventColumns = schemaToGlueColumns(eventSchema)
const aggColumns = schemaToGlueColumns(aggSchema)

export class EtlStack extends Stack {

    public readonly service: string = 'Etl'

    constructor(scope: Construct, id: string, props: EtlStackProps) {
        super(scope, id, props)

        const { project, stage } = props

        const databaseName = `${project}_${this.service}_Database_${stage}`
        const database = new glue.Database(this, `${project}${this.service}Database${stage}`, {
            databaseName: databaseName.toLowerCase()
        })

        const eventBucket = new s3.Bucket(this, `${project}${this.service}EventBucket${stage}`, {
            bucketName: `${project}-${this.service}-event-bucket-${stage}`.toLowerCase(),
        })

        const aggBucket = new s3.Bucket(this, `${project}${this.service}AggBucket${stage}`, {
            bucketName: `${project}-${this.service}-agg-bucket-${stage}`.toLowerCase(),
        })

        // Output bucket for Athena queries
        new s3.Bucket(this, `${project}${this.service}OutputBucket${stage}`, {
            bucketName: `${project}-${this.service}-output-bucket-${stage}`.toLowerCase(),
        })

        const eventTableName = `${project}_${this.service}_Event_Table_${stage}`
        new glue.Table(this, `${project}${this.service}EventTable${stage}`, {
            database: database,
            tableName: eventTableName.toLowerCase(),
            bucket: eventBucket,
            columns: eventColumns,
            dataFormat: glue.DataFormat.JSON,
        })

        const aggTableName = `${project}_${this.service}_Agg_Table_${stage}`
        new glue.Table(this, `${project}${this.service}AggTable${stage}`, {
            database: database,
            tableName: aggTableName.toLowerCase(),
            bucket: aggBucket,
            columns: aggColumns,
            dataFormat: glue.DataFormat.JSON,
        })
    }
}