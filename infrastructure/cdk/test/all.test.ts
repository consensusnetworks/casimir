import * as cdk from 'aws-cdk-lib'
import * as assertions from 'aws-cdk-lib/assertions'
import { Config } from '../src/providers/config'
import { UsersStack } from '../src/providers/users'
import { DnsStack } from '../src/providers/dns'
import { EtlStack } from '../src/providers/etl'
import { LandingStack } from '../src/providers/landing'
import { NodesStack } from '../src/providers/nodes'

test('All stacks created', () => {
  const { project, stage, env, nodesIp } = new Config()
  const app = new cdk.App()
  const { domain, subdomains, hostedZone } = new DnsStack(app, `${project}DnsStack${stage}`, { env, project, stage })
  const etlStack = new EtlStack(app, `${project}EtlStack${stage}`, { env, project, stage })
  const landingStack = new LandingStack(app, `${project}LandingStack${stage}`, { env, project, stage, domain, subdomains, hostedZone })
  const authStack = new UsersStack(app, `${project}UsersStack${stage}`, { env, project, stage, domain, subdomains, hostedZone })
  const nodesStack = new NodesStack(app, `${project}NodesStack${stage}`, { env, project, stage, domain, subdomains, hostedZone, nodesIp })

  const etlTemplate = assertions.Template.fromStack(etlStack)
  Object.keys(etlTemplate.findOutputs('*')).forEach(output => {
    expect(output).toBeDefined()
  })

  const landingTemplate = assertions.Template.fromStack(landingStack)
  Object.keys(landingTemplate.findOutputs('*')).forEach(output => {
    expect(output).toBeDefined()
  })

  const authTemplate = assertions.Template.fromStack(authStack)
  Object.keys(authTemplate.findOutputs('*')).forEach(output => {
    expect(output).toBeDefined()
  })

  const nodesTemplate = assertions.Template.fromStack(nodesStack)
  Object.keys(nodesTemplate.findOutputs('*')).forEach(output => {
    expect(output).toBeDefined()
  })
})
