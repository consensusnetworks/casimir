import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import DnsStack from '../src/providers/dns'
import EtlStack from '../src/providers/etl'
import AuthStack from '../src/providers/auth'
import LandingStack from '../src/providers/landing'
import Config from '../src/providers/config'

test('All stacks created', () => {
  const { project, stage, env } = new Config()
  const app = new cdk.App()
  const dnsStack = new DnsStack(app, `${project}DnsStack${stage}`, { env, project, stage })
  const { domain, dnsRecords, hostedZone } = dnsStack
  const etlStack = new EtlStack(app, `${project}EtlStack${stage}`, { env, project, stage })
  const landingStack = new LandingStack(app, `${project}LandingStack${stage}`, { env, project, stage, domain, dnsRecords, hostedZone })
  const authStack = new AuthStack(app, `${project}AuthStack${stage}`, { env, project, stage, domain, dnsRecords, hostedZone })

  const etlTemplate = Template.fromStack(etlStack)
  Object.keys(etlTemplate.findOutputs('*')).forEach(output => {
    expect(output).toBeDefined()
  })

  const landingTemplate = Template.fromStack(landingStack)
  Object.keys(landingTemplate.findOutputs('*')).forEach(output => {
    expect(output).toBeDefined()
  })

  const authTemplate = Template.fromStack(authStack)
  Object.keys(authTemplate.findOutputs('*')).forEach(output => {
    expect(output).toBeDefined()
  })
})
