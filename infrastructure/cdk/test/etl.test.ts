import * as cdk from 'aws-cdk-lib'
import * as assertions from 'aws-cdk-lib/assertions'
import { Config } from '../src/providers/config'
import { EtlStack } from '../src/providers/etl'
import { Schema, eventSchema, walletSchema, stakingActionSchema } from '@casimir/data'

test('ETL stack created', () => {
  const config = new Config()
  const { env } = config
  const app = new cdk.App()
  const etlStack = new EtlStack(app, config.getFullStackName('etl'), { env })

  const etlTemplate = assertions.Template.fromStack(etlStack)

  const resource = etlTemplate.findResources('AWS::Glue::Table')

  const eventTable = Object.keys(resource).filter(key => key.includes('EventTable'))
  const eventColumns = resource[eventTable[0]].Properties.TableInput.StorageDescriptor.Columns
  const eventGlueSchema = new Schema(eventSchema).getGlueColumns()

  for (const column of eventColumns) {
    const { Name: name, Type: type } = column
    const columnName = Object.keys(eventSchema.properties).filter(key => key === name)[0]
    const columnType = eventGlueSchema.filter(key => key.name === name)[0].type.inputString

    expect(columnType).toEqual(type)
    expect(columnName).toEqual(name)
  }

  const walletTable = Object.keys(resource).filter(key => key.includes('WalletTable'))[0]
  const walletColumns = resource[walletTable].Properties.TableInput.StorageDescriptor.Columns
  const walletGlueSchema = new Schema(walletSchema).getGlueColumns()


  for (const column of walletColumns) {
    const { Name: name, Type: type } = column
    const columnName = Object.keys(walletSchema.properties).filter(key => key === name)[0]
    const columnType = walletGlueSchema.filter(key => key.name === name)[0].type.inputString

    expect(columnType).toEqual(type)
    expect(columnName).toEqual(name)
  }

  const stakingActionTable = Object.keys(resource).filter(key => key.includes('StakingActionTable'))[0]
  const stakingActionColumns = resource[stakingActionTable].Properties.TableInput.StorageDescriptor.Columns
  const stakingActionGlueSchema = new Schema(stakingActionSchema).getGlueColumns()

  for (const column of stakingActionColumns) {
    const { Name: name, Type: type } = column
    const columnName = Object.keys(stakingActionSchema.properties).filter(key => key === name)[0]
    const columnType = stakingActionGlueSchema.filter(key => key.name === name)[0].type.inputString

    expect(columnType).toEqual(type)
    expect(columnName).toEqual(name)
  }

  Object.keys(etlTemplate.findOutputs('*')).forEach(output => {
    expect(output).toBeDefined()
  })
})