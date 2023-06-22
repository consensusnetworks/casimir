import * as cdk from 'aws-cdk-lib'
import { Config } from './providers/config'
import { UsersStack } from './providers/users'
import { NetworkStack } from './providers/network'
import { AnalyticsStack } from './providers/analytics'
import { LandingStack } from './providers/landing'
import { NodesStack } from './providers/nodes'
import { DnsStack } from './providers/dns'
import { WebStack } from './providers/web'

/** Create CDK app and stacks */
const config = new Config()
const { env, stage } = config
const app = new cdk.App()
const { hostedZone, certificate } = new DnsStack(app, config.getFullStackName('dns'), { env })
const { cluster, vpc } = new NetworkStack(app, config.getFullStackName('network'), { env })
if (stage !== 'prod') {
    /** Create development-only stacks */
    new AnalyticsStack(app, config.getFullStackName('analytics'), { env })
    new UsersStack(app, config.getFullStackName('users'), { env, certificate, cluster, hostedZone, vpc })
} else {
    /** Create production-only stacks */
    new NodesStack(app, config.getFullStackName('nodes'), { env, hostedZone })
}
/** Create remaining stacks */
new LandingStack(app, config.getFullStackName('landing'), { env, certificate, hostedZone })
new WebStack(app, config.getFullStackName('web'), { env, certificate, hostedZone })
