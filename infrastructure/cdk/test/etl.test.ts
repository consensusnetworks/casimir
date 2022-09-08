import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { EtlStack } from '../lib/etl/etl-stack'
import { eventSchema, aggSchema } from '@casimir/data'

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

  for (const column of eventColumns) {
    const { Name: name } = column
    const columnName = Object.keys(eventSchema.properties).filter(key => key === name)[0]
    expect(columnName).toEqual(name)
  }

  const aggTable = Object.keys(resource).filter(key => key.includes('AggTable'))[0]
  const aggColumns = resource[aggTable].Properties.TableInput.StorageDescriptor.Columns

  for (const column of aggColumns) {
    const { Name: name } = column
    const columnName = Object.keys(aggSchema.properties).filter(key => key === name)[0]
    expect(columnName).toEqual(name)
  }

  Object.keys(etlTemplate.findOutputs('*')).forEach(output => {
    expect(output).toBeDefined()
  })
})