import * as cdk from 'aws-cdk-lib'
import * as assertions from 'aws-cdk-lib/assertions'
import { Config } from '../src/providers/config'
import { UsersStack } from '../src/providers/users'
import { NetworkStack } from '../src/providers/network'
import { EtlStack } from '../src/providers/etl'
import { LandingStack } from '../src/providers/landing'
import { NodesStack } from '../src/providers/nodes'

test('All stacks created', () => {
  const { project, stage, env, rootDomain, subdomains, nodesIp } = new Config()
  const app = new cdk.App()
  const { hostedZone, certificate, cluster } = new NetworkStack(app, `${project}NetworkStack${stage}`, { env, project, stage, rootDomain, subdomains })
  const etlStack = new EtlStack(app, `${project}EtlStack${stage}`, { env, project, stage })
  const usersStack = new UsersStack(app, `${project}UsersStack${stage}`, { env, project, stage, rootDomain, subdomains, hostedZone, certificate, cluster })
  const nodesStack = new NodesStack(app, `${project}NodesStack${stage}`, { env, project, stage, rootDomain, subdomains, hostedZone, certificate, nodesIp })
  const landingStack =new LandingStack(app, `${project}LandingStack${stage}`, { env, project, stage, rootDomain, subdomains, hostedZone })

  const etlTemplate = assertions.Template.fromStack(etlStack)
  Object.keys(etlTemplate.findOutputs('*')).forEach(output => {
    expect(output).toBeDefined()
  })
  
  const usersTemplate = assertions.Template.fromStack(usersStack)
  Object.keys(usersTemplate.findOutputs('*')).forEach(output => {
    expect(output).toBeDefined()
  })
  
  const nodesTemplate = assertions.Template.fromStack(nodesStack)
  Object.keys(nodesTemplate.findOutputs('*')).forEach(output => {
    expect(output).toBeDefined()
  })

  const landingTemplate = assertions.Template.fromStack(landingStack)
  Object.keys(landingTemplate.findOutputs('*')).forEach(output => {
    expect(output).toBeDefined()
  })
})
