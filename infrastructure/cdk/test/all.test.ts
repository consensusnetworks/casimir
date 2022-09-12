import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { DnsStack } from '../lib/dns/dns-stack'
import { EtlStack } from '../lib/etl/etl-stack'
import { UsersStack } from '../lib/users/users-stack'
import { LandingStack } from '../lib/landing/landing-stack'

test('All stacks created', () => {

  const defaultEnv = { account: '257202027633', region: 'us-east-2' }
  const project = 'Casimir'
  const stage = 'Test'

  const app = new cdk.App()
  const dnsStack = new DnsStack(app, `${project}DnsStack${stage}`, { env: defaultEnv, project, stage })
  const { domain, dnsRecords, hostedZone } = dnsStack
  const etlStack = new EtlStack(app, `${project}EtlStack${stage}`, { env: defaultEnv, project, stage })
  const landingStack = new LandingStack(app, `${project}LandingStack${stage}`, { env: defaultEnv, project, stage, domain, dnsRecords, hostedZone })
  const usersStack = new UsersStack(app, `${project}UsersStack${stage}`, { env: defaultEnv, project, stage, domain, dnsRecords, hostedZone })

  const etlTemplate = Template.fromStack(etlStack)
  console.log(etlTemplate)
  Object.keys(etlTemplate.findOutputs('*')).forEach(output => {
    console.log(output)
    expect(output).toBeDefined()
  })

  const landingTemplate = Template.fromStack(landingStack)
  console.log(landingTemplate)
  Object.keys(landingTemplate.findOutputs('*')).forEach(output => {
    console.log(output)
    expect(output).toBeDefined()
  })

  const usersTemplate = Template.fromStack(usersStack)
  console.log(usersTemplate)
  Object.keys(usersTemplate.findOutputs('*')).forEach(output => {
    console.log(output)
    expect(output).toBeDefined()
  })
})
