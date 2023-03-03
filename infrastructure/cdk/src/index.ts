import * as cdk from 'aws-cdk-lib'
import { Config } from './providers/config'
import { UsersStack } from './providers/users'
import { NetworkStack } from './providers/network'
import { EtlStack } from './providers/etl'
import { LandingStack } from './providers/landing'
import { NodesStack } from './providers/nodes'
import { DnsStack } from './providers/dns'

/** Create CDK app and stacks */
const config = new Config()
const { env } = config
const app = new cdk.App()
const { hostedZone, certificate } = new DnsStack(app, config.getFullStackName('dns'), { env })
const { cluster } = new NetworkStack(app, config.getFullStackName('network'), { env })
if (process.env.STAGE !== 'prod') {
    /** Create development-only stacks */
    new EtlStack(app, config.getFullStackName('etl'), { env })
    new UsersStack(app, config.getFullStackName('users'), { env, hostedZone, cluster, certificate })
} else {
    /** Create production-only stacks */
    new NodesStack(app, config.getFullStackName('nodes'), { env, hostedZone })
}
/** Create remaining stacks */
new LandingStack(app, config.getFullStackName('landing'), { env, hostedZone, certificate })
