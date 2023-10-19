import * as cdk from 'aws-cdk-lib'
import * as assertions from 'aws-cdk-lib/assertions'
import { Config } from '../src/providers/config'
import { BlogStack } from '../src/providers/blog'
import { UsersStack } from '../src/providers/users'
import { NetworkStack } from '../src/providers/network'
import { AnalyticsStack } from '../src/providers/analytics'
import { LandingStack } from '../src/providers/landing'
import { NodesStack } from '../src/providers/nodes'
import { DnsStack } from '../src/providers/dns'
import { WebStack } from '../src/providers/web'

test('All stacks created', () => {
    const config = new Config()
    const { env } = config
    const app = new cdk.App()

    const { hostedZone, certificate } = new DnsStack(app, config.getFullStackName('dns'), { env })
    const { vpc } = new NetworkStack(app, config.getFullStackName('network'), { env })

    const analyticsStack = new AnalyticsStack(app, config.getFullStackName('analytics'), { env })
    const landingStack = new LandingStack(app, config.getFullStackName('landing'), { env, certificate, hostedZone })
    const nodesStack = new NodesStack(app, config.getFullStackName('nodes'), { env, hostedZone })
    const blogStack = new BlogStack(app, config.getFullStackName('blog'), { env, certificate, hostedZone, vpc })
    const usersStack = new UsersStack(app, config.getFullStackName('users'), { env, certificate, hostedZone, vpc })
    const webStack = new WebStack(app, config.getFullStackName('web'), { env, certificate, hostedZone })
    
    const analyticsTemplate = assertions.Template.fromStack(analyticsStack)
    Object.keys(analyticsTemplate.findOutputs('*')).forEach(output => {
        expect(output).toBeDefined()
    })

    const blogTemplate = assertions.Template.fromStack(blogStack)
    Object.keys(blogTemplate.findOutputs('*')).forEach(output => {
        expect(output).toBeDefined()
    })

    const usersTemplate = assertions.Template.fromStack(usersStack)
    Object.keys(usersTemplate.findOutputs('*')).forEach(output => {
        expect(output).toBeDefined()
    })

    const webTemplate = assertions.Template.fromStack(webStack)
    Object.keys(webTemplate.findOutputs('*')).forEach(output => {
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
