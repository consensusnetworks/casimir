import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { EtlStack } from '../lib/etl'
import { eventSchema, aggSchema, schemaToGlueColumns } from '@casimir/data'

test('ETL stack created', () => {

  const defaultEnv = { account: '257202027633', region: 'us-east-2' }
  const project = 'Casimir'
  const stage = 'Test'

  const app = new cdk.App()
  const etlStack = new EtlStack(app, `${project}EtlStack${stage}`, { env: defaultEnv, project, stage })

  const etlTemplate = Template.fromStack(etlStack)

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