import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as glue from '@aws-cdk/aws-glue-alpha'
import { Schema, eventSchema, walletSchema, stakingActionSchema } from '@casimir/data'
import { kebabCase, pascalCase, snakeCase } from '@casimir/helpers'
import { Config } from '../providers/config'
import { EtlStackProps } from '../interfaces/StackProps'

/**
 * Chain analytics ETL stack
 */
export class EtlStack extends cdk.Stack {
    /** Stack name */
    public readonly name = pascalCase('etl')

    constructor(scope: Construct, id: string, props: EtlStackProps) {
        super(scope, id, props)

        const config = new Config()

        /** Get Glue Columns from JSON Schema for each table */
        const eventColumns = new Schema(eventSchema).getGlueColumns()
        const walletColumns = new Schema(walletSchema).getGlueColumns()
        const stakingActionColumns = new Schema(stakingActionSchema).getGlueColumns()

        /** Create Glue DB */
        const database = new glue.Database(this, config.getFullStackResourceName(this.name, 'database'), {
            databaseName: snakeCase(config.getFullStackResourceName(this.name, 'database'))
        })

        /** Create S3 buckets */
        const eventBucket = new s3.Bucket(this, config.getFullStackResourceName(this.name, 'event-bucket', config.dataVersion), {
            bucketName: kebabCase(config.getFullStackResourceName(this.name, 'event-bucket', config.dataVersion)),
        })

        const walletBucket = new s3.Bucket(this, config.getFullStackResourceName(this.name, 'wallet-bucket', config.dataVersion), {
            bucketName: kebabCase(config.getFullStackResourceName(this.name, 'wallet-bucket', config.dataVersion)),
        })

        const stakingActionBucket = new s3.Bucket(this, config.getFullStackResourceName(this.name, 'staking-action-bucket', config.dataVersion), {
            bucketName: kebabCase(config.getFullStackResourceName(this.name, 'staking-action-bucket', config.dataVersion)),
        })

        new s3.Bucket(this, config.getFullStackResourceName(this.name, 'output-bucket'), {
            bucketName: kebabCase(config.getFullStackResourceName(this.name, 'output-bucket')),
        })

        /** Create Glue tables */
        new glue.Table(this, config.getFullStackResourceName(this.name, 'event-table'), {
            database: database,
            tableName: snakeCase(config.getFullStackResourceName(this.name, 'event-table')),
            bucket: eventBucket,
            columns: eventColumns,
            dataFormat: glue.DataFormat.JSON,
        })

        new glue.Table(this, config.getFullStackResourceName(this.name, 'wallet-table'), {
            database: database,
            tableName: snakeCase(config.getFullStackResourceName(this.name, 'wallet-table')),
            bucket: walletBucket,
            columns: walletColumns,
            dataFormat: glue.DataFormat.JSON,
        })

        new glue.Table(this, config.getFullStackResourceName(this.name, 'staking-action-table'), {
            database: database,
            tableName: snakeCase(config.getFullStackResourceName(this.name, 'staking-action-table')),
            bucket: stakingActionBucket,
            columns: stakingActionColumns,
            dataFormat: glue.DataFormat.JSON,
        })
    }
}