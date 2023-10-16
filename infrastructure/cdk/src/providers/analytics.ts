import { Construct } from "constructs"
import * as cdk from "aws-cdk-lib"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as glue from "@aws-cdk/aws-glue-alpha"
import { Schema, eventSchema, actionSchema } from "@casimir/data"
import { kebabCase, pascalCase, snakeCase } from "@casimir/format"
import { Config } from "./config"
import { AnalyticsStackProps } from "../interfaces/StackProps"

/**
 * Data analytics stack
 */
export class AnalyticsStack extends cdk.Stack {
  public readonly name = pascalCase("analytics")

  constructor(scope: Construct, id: string, props: AnalyticsStackProps) {
    super(scope, id, props)

    const config = new Config()

    const eventColumns = new Schema(eventSchema).getGlueColumns()
    const actionColumns = new Schema(actionSchema).getGlueColumns()

    const database = new glue.Database(this, config.getFullStackResourceName(this.name, "database"), {
      databaseName: snakeCase(config.getFullStackResourceName(this.name, "database"))
    })

    const eventBucket = new s3.Bucket(this, config.getFullStackResourceName(this.name, "event-bucket", config.dataVersion), {
      bucketName: kebabCase(config.getFullStackResourceName(this.name, "event-bucket", config.dataVersion))
    })

    const actionBucket = new s3.Bucket(this, config.getFullStackResourceName(this.name, "action-bucket", config.dataVersion), {
      bucketName: kebabCase(config.getFullStackResourceName(this.name, "action-bucket", config.dataVersion))
    })
        
    new s3.Bucket(this, config.getFullStackResourceName(this.name, "output-bucket", config.dataVersion), {
      bucketName: kebabCase(config.getFullStackResourceName(this.name, "output-bucket", config.dataVersion))
    })

    new glue.Table(this, config.getFullStackResourceName(this.name, "event-table", config.dataVersion), {
      database: database,
      tableName: snakeCase(config.getFullStackResourceName(this.name, "event-table", config.dataVersion)),
      bucket: eventBucket,
      columns: eventColumns,
      dataFormat: glue.DataFormat.JSON,
    })
        
    new glue.Table(this, config.getFullStackResourceName(this.name, "action-table", config.dataVersion), {
      database: database,
      tableName: snakeCase(config.getFullStackResourceName(this.name, "action-table", config.dataVersion)),
      bucket: actionBucket,
      columns: actionColumns,
      dataFormat: glue.DataFormat.JSON,
    })
  }
}