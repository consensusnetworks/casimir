import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { DnsStack } from '../lib/dns/dns-stack'
import { UsersStack } from '../lib/users/users-stack'
import { WebsiteStack } from '../lib/website/website-stack'

// Todo actually test something
test('Website Created', () => {

  const defaultEnv = { account: '257202027633', region: 'us-east-2' }
  const project = 'Casimir'
  const stage = 'Test'

  const app = new cdk.App()
  const dnsStack = new DnsStack(app, `${project}DnsStack${stage}`, { env: defaultEnv, project, stage })
  const { domain, dnsRecords, hostedZone } = dnsStack
  const websiteStack = new WebsiteStack(app, `${project}WebsiteStack${stage}`, { env: defaultEnv, project, stage, domain, dnsRecords, hostedZone })
  const usersStack = new UsersStack(app, `${project}UsersStack${stage}`, { env: defaultEnv, project, stage, domain, dnsRecords, hostedZone })

  const websiteTemplate = Template.fromStack(websiteStack)
  console.log(websiteTemplate)
  Object.keys(websiteTemplate.findOutputs('*')).forEach(output => {
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
