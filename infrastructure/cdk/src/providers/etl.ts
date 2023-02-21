import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as glue from '@aws-cdk/aws-glue-alpha'
import { schemaToGlueColumns, eventSchema, aggSchema } from '@casimir/data'
import { EtlStackProps } from '../interfaces/StackProps'
import { pascalCase } from '@casimir/string-helpers'

/**
 * Chain analytics ETL stack
 */
export class EtlStack extends cdk.Stack {
    /** Stack name */
    public readonly name = pascalCase('etl')

    constructor(scope: Construct, id: string, props: EtlStackProps) {
        super(scope, id, props)

        const { project, stage } = props

        /** Get Glue Columns from JSON Schema for each table */
        const eventColumns = schemaToGlueColumns(eventSchema)
        const aggColumns = schemaToGlueColumns(aggSchema)

        /** Create Glue DB */
        const database = new glue.Database(this, `${project}${this.name}Database${stage}`, {
            databaseName: `${project}_${this.name}_Database_${stage}`.toLowerCase()
        })

        /** Create S3 buckets */
        const eventBucket = new s3.Bucket(this, `${project}${this.name}EventBucket${stage}`, {
            bucketName: `${project}-${this.name}-event-bucket-${stage}`.toLowerCase(),
        })
        const aggBucket = new s3.Bucket(this, `${project}${this.name}AggBucket${stage}`, {
            bucketName: `${project}-${this.name}-agg-bucket-${stage}`.toLowerCase(),
        })
        new s3.Bucket(this, `${project}${this.name}OutputBucket${stage}`, {
            bucketName: `${project}-${this.name}-output-bucket-${stage}`.toLowerCase(),
        })

        /** Create Glue tables */
        const eventTableName = `${project}_${this.name}_Event_Table_${stage}`
        new glue.Table(this, `${project}${this.name}EventTable${stage}`, {
            database: database,
            tableName: eventTableName.toLowerCase(),
            bucket: eventBucket,
            columns: eventColumns,
            dataFormat: glue.DataFormat.JSON,
        })
        const aggTableName = `${project}_${this.name}_Agg_Table_${stage}`
        new glue.Table(this, `${project}${this.name}AggTable${stage}`, {
            database: database,
            tableName: aggTableName.toLowerCase(),
            bucket: aggBucket,
            columns: aggColumns,
            dataFormat: glue.DataFormat.JSON,
        })
    }
}