import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as glue from '@aws-cdk/aws-glue-alpha'

export interface EtlStackProps extends StackProps {
    project: string;
    stage: string;
}

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
            columns: [
                {
                    name: 'type',
                    type: glue.Schema.STRING,
                    comment: 'The type of event'
                },
                {
                    name: 'datestring',
                    type: glue.Schema.DATE,
                    comment: 'The datestring (MM-DD-YYYY) of the event'
                },
                {
                    name: 'address',
                    type: glue.Schema.STRING,
                    comment: 'The address that initiated the event'
                },
                {
                    name: 'staked_candidate',
                    type: glue.Schema.STRING,
                    comment: 'The name of the candidate that received the stake action event'
                },
                {
                    name: 'staked_amount',
                    type: glue.Schema.BIG_INT,
                    comment: 'The amount staked or unstaked in the stake action event'
                },
                {
                    name: 'staked_duration',
                    type: glue.Schema.INTEGER,
                    comment: 'The duration of the stake action event'
                },
                {
                    name: 'auto_stake',
                    type: glue.Schema.BOOLEAN,
                    comment: 'The compounding selection of the stake action event'
                },
            ],
            dataFormat: glue.DataFormat.JSON,
        })

        const aggTableName = `${project}_${this.service}_Agg_Table_${stage}`
        new glue.Table(this, `${project}${this.service}AggTable${stage}`, {
            database: database,
            tableName: aggTableName.toLowerCase(),
            bucket: aggBucket,
            columns: [
                {
                    name: 'type',
                    type: glue.Schema.STRING,
                    comment: 'The type of aggregate (e.g. wallet, contract, etc.)'
                },
                {
                    name: 'address',
                    type: glue.Schema.STRING,
                    comment: 'The address of the aggregate'
                },
                {
                    name: 'first_staked_at',
                    type: glue.Schema.DATE,
                    comment: 'The first datestring (MM-DD-YYYY) that a wallet staked'
                },
                {
                    name: 'total_staked_amount',
                    type: glue.Schema.BIG_INT,
                    comment: 'The total amount that a wallet has staked'
                },
                {
                    name: 'total_staked_duration',
                    type: glue.Schema.INTEGER,
                    comment: 'The total duration that a wallet has staked'
                },
                {
                    name: 'auto_staking',
                    type: glue.Schema.BOOLEAN,
                    comment: 'The most recent stake reward compounding selection of a wallet'
                },
            ],
            dataFormat: glue.DataFormat.JSON,
        })
    }
}