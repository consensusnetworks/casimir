import * as cdk from 'aws-cdk-lib'
import { Config } from './providers/config'
import { UsersStack } from './providers/users'
import { DnsStack } from './providers/dns'
import { EtlStack } from './providers/etl'
import { LandingStack } from './providers/landing'
import { NodesStack } from './providers/nodes'

/** Create CDK app and stacks */
const { project, stage, env, nodesIp } = new Config()
const app = new cdk.App()
const { domain, subdomains, hostedZone } = new DnsStack(app, `${project}DnsStack${stage}`, { env, project, stage })
if (process.env.STAGE !== 'prod') {
    /** Create development-only stacks */
    new EtlStack(app, `${project}EtlStack${stage}`, { env, project, stage })
    new UsersStack(app, `${project}UsersStack${stage}`, { env, project, stage, domain, subdomains, hostedZone })
} else {
    /** Create production-only stacks */
    new NodesStack(app, `${project}NodesStack${stage}`, { env, project, stage, domain, subdomains, hostedZone, nodesIp })
}
/** Create remaining stacks */
new LandingStack(app, `${project}LandingStack${stage}`, { env, project, stage, domain, subdomains, hostedZone })
