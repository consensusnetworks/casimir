import * as cdk from 'aws-cdk-lib'
import { Config } from './providers/config'
import { UsersStack } from './providers/users'
import { NetworkStack } from './providers/network'
import { EtlStack } from './providers/etl'
import { LandingStack } from './providers/landing'
import { NodesStack } from './providers/nodes'

/** Create CDK app and stacks */
const config = new Config()
const { env, project, stage, rootDomain, subdomains, nodesIp } = config
const app = new cdk.App()
const { hostedZone, certificate, cluster } = new NetworkStack(app, config.getFullStackName('network'), { env, project, stage, rootDomain, subdomains })
if (process.env.STAGE !== 'prod') {
    /** Create development-only stacks */
    new EtlStack(app, config.getFullStackName('etl'), { env, project, stage })
    new UsersStack(app, config.getFullStackName('users'), { env, project, stage, rootDomain, subdomains, hostedZone, certificate, cluster })
} else {
    /** Create production-only stacks */
    new NodesStack(app, config.getFullStackName('nodes'), { env, project, stage, rootDomain, subdomains, hostedZone, certificate, nodesIp })
}
/** Create remaining stacks */
new LandingStack(app, config.getFullStackName('landing'), { env, project, stage, rootDomain, subdomains, hostedZone })
