import * as cdk from 'aws-cdk-lib'
import * as assertions from 'aws-cdk-lib/assertions'
import { Config } from '../src/providers/config'
import { EtlStack } from '../src/providers/etl'
import { eventSchema, aggSchema, schemaToGlueColumns } from '@casimir/data'

test('ETL stack created', () => {
  const { project, stage, env } = new Config()
  const app = new cdk.App()
  const etlStack = new EtlStack(app, `${project}EtlStack${stage}`, { env, project, stage })

  const etlTemplate = assertions.Template.fromStack(etlStack)

  const resource = etlTemplate.findResources('AWS::Glue::Table')

  const eventTable = Object.keys(resource).filter(key => key.includes('EventTable'))
  const eventColumns = resource[eventTable[0]].Properties.TableInput.StorageDescriptor.Columns

  const eventGlueSchema = schemaToGlueColumns(eventSchema)
  const aggGlueSchema = schemaToGlueColumns(aggSchema)

  for (const column of eventColumns) {
    const { Name: name, Type: type } = column
    const columnName = Object.keys(eventSchema.properties).filter(key => key === name)[0]
    const columnType = eventGlueSchema.filter(key => key.name === name)[0].type.inputString

    expect(columnType).toEqual(type)
    expect(columnName).toEqual(name)
  }

  const aggTable = Object.keys(resource).filter(key => key.includes('AggTable'))[0]
  const aggColumns = resource[aggTable].Properties.TableInput.StorageDescriptor.Columns

  for (const column of aggColumns) {
    const { Name: name, Type: type } = column
    const columnName = Object.keys(aggSchema.properties).filter(key => key === name)[0]
    const columnType = aggGlueSchema.filter(key => key.name === name)[0].type.inputString

    expect(columnType).toEqual(type)
    expect(columnName).toEqual(name)
  }

  Object.keys(etlTemplate.findOutputs('*')).forEach(output => {
    expect(output).toBeDefined()
  })
})