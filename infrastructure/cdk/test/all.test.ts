import * as cdk from 'aws-cdk-lib'
import * as assertions from 'aws-cdk-lib/assertions'
import { Config } from '../src/providers/config'
import { UsersStack } from '../src/providers/users'
import { NetworkStack } from '../src/providers/network'
import { EtlStack } from '../src/providers/etl'
import { LandingStack } from '../src/providers/landing'
import { NodesStack } from '../src/providers/nodes'
import { DnsStack } from '../src/providers/dns'

test('All stacks created', () => {
  const config = new Config()
  const { env } = config
  const app = new cdk.App()

  const { hostedZone, certificate } = new DnsStack(app, config.getFullStackName('dns'), { env })
  const { cluster } = new NetworkStack(app, config.getFullStackName('network'), { env })
  const etlStack = new EtlStack(app, config.getFullStackName('etl'), { env })
  const usersStack = new UsersStack(app, config.getFullStackName('users'), { env, hostedZone, cluster, certificate })
  const nodesStack = new NodesStack(app, config.getFullStackName('nodes'), { env, hostedZone })
  const landingStack = new LandingStack(app, config.getFullStackName('landing'), { env, hostedZone, certificate })

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
