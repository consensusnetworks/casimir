import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { EtlStack } from '../lib/etl/etl-stack'

test('ETL stack created', () => {

  const defaultEnv = { account: '257202027633', region: 'us-east-2' }
  const project = 'Casimir'
  const stage = 'Test'

  const app = new cdk.App()
  const etlStack = new EtlStack(app, `${project}EtlStack${stage}`, { env: defaultEnv, project, stage })

  const etlTemplate = Template.fromStack(etlStack)
  console.log(etlTemplate)
  Object.keys(etlTemplate.findOutputs('*')).forEach(output => {
    console.log(output)
    expect(output).toBeDefined()
  })
})